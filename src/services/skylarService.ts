import { GoogleGenAI, Modality, Type, FunctionDeclaration } from "@google/genai";
import { getGeminiApiKey } from './aiConfig';

// Lazy initialization of Gemini
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      console.error("SkylarService: GEMINI_API_KEY is missing.");
      throw new Error("GEMINI_API_KEY is not configured in the environment variables. Please check your AI Studio settings.");
    } else {
      const maskedKey = apiKey.length > 8 ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : "****";
      console.log(`SkylarService: Initializing GoogleGenAI with key: ${maskedKey} (length: ${apiKey.length})`);
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

const LOBKOWICZ_PROMPT = `
You are Skylar, the AI Career Partner, operating under the Philip Lobkowicz strategic coaching methodology.
Your approach is highly strategic, analytical, and focused on "Career DNA" and "Validation Gates".

Key Principles:
1. Career DNA: Every individual has a unique combination of attributes. Your job is to help them extract these from their accomplishments.
2. Validation Gates: Career progress is not linear; it requires passing through specific gates (Discovery, Branding, Outreach).
3. Effort Tiers: You categorize career activities by the effort required and the ROI expected.
4. Professional & Direct: You provide high-level strategic advice. You are a coach, not just a chatbot.

When helping users, always look for ways to connect their current challenges to their foundational DNA.
`;

const FEYNMAN_PROMPT = `
You are Skylar, the AI Career Partner, operating under the Richard Feynman "Scientific Clarity" methodology.
Your goal is to strip away jargon and complexity to ensure the user truly understands their career path with absolute clarity.

Key Principles:
1. Extreme Simplicity: If you can't explain a career concept to a 12-year-old, you don't understand it well enough.
2. First Principles Thinking: Break down career challenges into their most basic, fundamental truths.
3. Analogies: Use scientific or everyday analogies to explain complex market dynamics or personal branding.
4. Honest Inquiry: Encourage the user to ask "Why?" until they reach the core of their motivation.

Your tone is curious, brilliant, and unpretentious. You value truth over corporate buzzwords.
`;

const tools = [
  {
    functionDeclarations: [
      {
        name: "search_wavvault",
        description: "Search the collective, anonymized Wavvault for similar career paths, strengths, and stories from other users to provide comparative insights.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: "The career-related query to search for (e.g., 'career switch from nursing to tech')"
            }
          },
          required: ["query"]
        }
      },
      {
        name: "propose_dashboard_update",
        description: "Propose an update to a specific field in the user's dashboard based on the conversation progress. This will NOT execute until the user confirms.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            field: {
              type: Type.STRING,
              description: "The field to update (e.g., 'journeyStage', 'careerHappiness', 'resumeStatus')"
            },
            value: {
              type: Type.STRING,
              description: "The new value for the field"
            },
            reasoning: {
              type: Type.STRING,
              description: "The reason why this update is being proposed"
            }
          },
          required: ["field", "value", "reasoning"]
        }
      },
      {
        name: "propose_milestone_addition",
        description: "Propose adding a new milestone to the user's career roadmap. This will NOT execute until the user confirms.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "The title of the milestone"
            },
            description: {
              type: Type.STRING,
              description: "Detailed description of the milestone"
            },
            targetDate: {
              type: Type.STRING,
              description: "Expected completion date (ISO format or descriptive)"
            },
            reasoning: {
              type: Type.STRING,
              description: "The reason why this milestone is being proposed"
            }
          },
          required: ["title", "description", "targetDate", "reasoning"]
        }
      }
    ]
  }
];

export type SkylarPersona = 'discovery' | 'branding' | 'outreach' | 'rpp';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const PERSONA_CONFIG = {
  discovery: {
    name: 'Skylar Discovery Architect',
    voice: 'Kore',
    instruction: "You are the Skylar Discovery Architect. Your goal is to help the user identify their 'best self' through attribute extraction from their accomplishments and exercises. Be professional, clear, and analytical. Focus on 'bringing attributes to life'."
  },
  branding: {
    name: 'Skylar Narrative Journalist',
    voice: 'Zephyr',
    instruction: "You are the Skylar Narrative Journalist. Your goal is to help the user transform their accomplishments into dual-perspective stories: a factual 'Journalist' version and an emotional 'Reflective' version. Be calm, steady, and encouraging of emotional depth."
  },
  outreach: {
    name: 'Skylar Kickspark Drill Master',
    voice: 'Puck',
    instruction: "You are the Skylar Kickspark Drill Master. Your goal is to enforce the 80/20 rule and ensure the user is maintaining their 3.5-7 hour weekly commitment. Be energetic, bright, and focused on execution and financial ROI."
  },
  rpp: {
    name: 'Skylar Role Playing Partner',
    voice: 'Kore', // Default, but can adapt
    instruction: "You are acting as the user's Role Playing Partner (RPP). Your job is to audit their 'Five Stories' for factual accuracy and emotional depth. Be a 'Hard Trainer' for facts and a 'Soft Coach' for feelings. You must validate their work before they can proceed."
  }
};

class SkylarService {
  async generateResponse(
    persona: SkylarPersona,
    message: string,
    history: ChatMessage[] = [],
    wavvaultContext?: any
  ): Promise<string> {
    const ai = getAI();
    const config = PERSONA_CONFIG[persona];
    const systemInstruction = `${config.instruction}\n\nContext from Wavvault: ${JSON.stringify(wavvaultContext || {})}\n\nRemember interactions from previous journeys if relevant.`;

    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction,
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: msg.parts
      }))
    });

    const response = await chat.sendMessage({ message });
    return response.text || "I'm sorry, I couldn't process that.";
  }

  async generateSpeech(text: string, persona: SkylarPersona): Promise<string> {
    const ai = getAI();
    const voiceName = PERSONA_CONFIG[persona].voice;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio ? `data:audio/mp3;base64,${base64Audio}` : '';
  }

  // Vertex AI Agentic Chat - Migrated to Gemini Frontend
  async chatWithVertex(
    userId: string,
    message: string,
    history: any[] = [],
    methodology: 'lobkowicz' | 'feynman' = 'lobkowicz',
    token?: string
  ): Promise<any> {
    try {
      const ai = getAI();
      const systemInstruction = methodology === 'lobkowicz' ? LOBKOWICZ_PROMPT : FEYNMAN_PROMPT;
      
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction,
          tools: tools as any,
        },
        history: history.map(h => ({
          role: h.role,
          parts: h.parts
        }))
      });

      let response = await chat.sendMessage({ message });
      let calls = response.functionCalls;

      // Agentic Loop: Handle tool calls (except proposals which go to the user)
      while (calls && calls.length > 0) {
        const toolResponses: any[] = [];

        for (const call of calls) {
          const { name, args, id } = call;
          const typedArgs = args as any;

          if (name === 'search_wavvault') {
            console.log(`[SKYLAR] Executing tool: search_wavvault with query: ${typedArgs.query}`);
            const searchResults = await this.performAnonymizedSearch(typedArgs.query as string, token);
            toolResponses.push({
              functionResponse: {
                name: 'search_wavvault',
                response: { content: searchResults },
                id
              }
            });
          } else if (name.startsWith('propose_')) {
            // Proposals are NOT executed automatically. 
            // We return them to the frontend to trigger the UI Widget.
            return response;
          }
        }

        if (toolResponses.length > 0) {
          response = await chat.sendMessage({ message: toolResponses });
          calls = response.functionCalls;
        } else {
          break;
        }
      }
      
      return response;
    } catch (error) {
      console.error("Skylar Chat Error:", error);
      throw error;
    }
  }

  async performAnonymizedSearch(query: string, token?: string) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/skylar/search-wavvault', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) return [];
      const data = await response.json();
      return data.content || [];
    } catch (error) {
      console.error("Wavvault Search Error:", error);
      return [];
    }
  }

  async executeAction(userId: string, action: string, data: any, token?: string): Promise<any> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = '/api/skylar/execute-action';

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, action, data })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to execute action');
      }
      
      return await response.json();
    } catch (error) {
      console.error("Action Execution Error:", error);
      throw error;
    }
  }

  // Helper to save chat to Wavvault (would be called from component)
  async saveChatToWavvault(userId: string, history: ChatMessage[]) {
    // This would typically call a backend API to save to Firestore
    try {
      await fetch('/api/wavvault/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, history })
      });
    } catch (error) {
      console.error("Error saving chat:", error);
    }
  }

  async getChatHistory(userId: string): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`/api/wavvault/chat?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        return data.history || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching chat history:", error);
      return [];
    }
  }
}

export const skylar = new SkylarService();
