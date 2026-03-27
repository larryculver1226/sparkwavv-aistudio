import { GoogleGenAI, Modality, Type, FunctionDeclaration } from "@google/genai";
import { getGeminiApiKey } from './aiConfig.js';
import * as mammoth from 'mammoth';
import { KnowledgeGraph, WavvaultData, TargetOpportunity } from '../types/wavvault.js';

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
Your approach is highly strategic, analytical, and focused on "Career DNA", "Validation Gates", and the "Market Intelligence Grid (MIG)".

Key Principles:
1. Career DNA: Every individual has a unique combination of attributes. Your job is to help them extract these from their accomplishments. This DNA is synthesized into a "Cinematic Brand Narrative" during the Discovery phase, which becomes the foundational truth for all subsequent Branding and Outreach activities.
2. Validation Gates: Career progress is not linear; it requires passing through specific gates. The correct phase order is: (1) Dive-In, (2) Ignition, (3) Discovery, (4) Branding, (5) Outreach. You MUST perform a gate review using the 'perform_gate_review' tool before a user moves to a new phase.
3. Gating Criteria:
   - Dive-In to Ignition: Commitment to the 12-week process and initial "Spark" identified.
   - Ignition to Discovery: Completion of "Pie of Life" and "Perfect Day" exercises; clear initial career DNA hypothesis.
   - Discovery to Branding: Synthesis of the "Cinematic Brand DNA" (3 pillars); extraction of at least 5 core attributes from accomplishments; validation of "Five Stories" by an RPP (Role Playing Partner).
   - Branding to Outreach: Completion of "Journalist" and "Reflective" versions of the Five Stories; alignment with the Market Intelligence Grid (MIG) and the Cinematic Brand DNA.
   - Outreach to Success: Active market engagement and incorporation of feedback into the DNA.
4. Market Intelligence Grid (MIG): You have access to real-time market data via the 'get_market_intelligence' tool. Use this to ground all advice in current market reality.
5. Effort Tiers: You categorize career activities by the effort required and the ROI expected.
6. Professional & Direct: You provide high-level strategic advice. You are a coach, not just a chatbot.

Validation Protocol:
- If you detect a misalignment during a gate review (e.g., weak attributes, lack of market evidence), you MUST issue a "Stern Warning".
- When issuing a warning, your response MUST include the phrase: "I have some concerns about your current direction. Please review the notifications in the sidebar before proceeding."
- You should then explain your reasoning clearly.

When helping users, always look for ways to connect their current challenges to their foundational DNA and the current market intelligence.
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
      },
      {
        name: "get_market_intelligence",
        description: "Fetch real-time market trends, industry shifts, and skill demand data from the Market Intelligence Grid (MIG).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            industry: {
              type: Type.STRING,
              description: "The industry to search for (e.g., 'Tech', 'Healthcare', 'Finance')"
            },
            role: {
              type: Type.STRING,
              description: "The specific role to analyze (e.g., 'Software Architect', 'Nurse Practitioner')"
            }
          },
          required: ["industry"]
        }
      },
      {
        name: "perform_gate_review",
        description: "Perform a 'Validation Gate' review to ensure the user is ready to move to the next phase. Phases: Dive-In, Ignition, Discovery, Branding, Outreach.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            currentPhase: {
              type: Type.STRING,
              description: "The current phase the user is in (Dive-In, Ignition, Discovery, Branding, Outreach)"
            },
            targetPhase: {
              type: Type.STRING,
              description: "The phase the user wants to move to (Dive-In, Ignition, Discovery, Branding, Outreach)"
            },
            userData: {
              type: Type.STRING,
              description: "A summary of the user's progress and data relevant to the gate criteria"
            }
          },
          required: ["currentPhase", "targetPhase", "userData"]
        }
      },
      {
        name: "propose_major_shift",
        description: "Propose a major shift in the user's professional DNA (e.g., a pivot, a new core value, or a change in primary goal).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              description: "The type of shift: 'pivot', 'core_value', 'primary_goal', or 'strength'"
            },
            content: {
              type: Type.STRING,
              description: "The description of the proposed shift"
            },
            evidence: {
              type: Type.STRING,
              description: "The reasoning or evidence from the conversation that led to this proposal"
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Optional tags for categorization"
            }
          },
          required: ["type", "content", "evidence"]
        }
      },
      {
        name: "flag_dna_conflict",
        description: "Flag a conflict between a new insight and an existing confirmed 'Current Truth' in the user's professional DNA.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            newInsight: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                content: { type: Type.STRING },
                evidence: { type: Type.STRING }
              },
              required: ["type", "content", "evidence"]
            },
            existingInsightId: {
              type: Type.STRING,
              description: "The ID of the existing confirmed insight that is being conflicted"
            },
            conflictReason: {
              type: Type.STRING,
              description: "Explanation of why these two insights are in conflict"
            }
          },
          required: ["newInsight", "existingInsightId", "conflictReason"]
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
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces', 
    instruction: "You are the Skylar Discovery Architect. Your goal is to help the user identify their 'best self' through attribute extraction from their accomplishments and exercises. Be professional, clear, and analytical. Focus on 'bringing attributes to life'."
  },
  branding: {
    name: 'Skylar Narrative Journalist',
    voice: 'Zephyr',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces',
    instruction: "You are the Skylar Narrative Journalist. Your goal is to help the user transform their accomplishments into dual-perspective stories: a factual 'Journalist' version and an emotional 'Reflective' version. Be calm, steady, and encouraging of emotional depth."
  },
  outreach: {
    name: 'Skylar Kickspark Drill Master',
    voice: 'Puck',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=faces',
    instruction: "You are the Skylar Kickspark Drill Master. Your goal is to enforce the 80/20 rule and ensure the user is maintaining their 3.5-7 hour weekly commitment. Be energetic, bright, and focused on execution and financial ROI."
  },
  rpp: {
    name: 'Skylar Role Playing Partner',
    voice: 'Kore', 
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=faces',
    instruction: "You are acting as the user's Role Playing Partner (RPP). Your job is to audit their 'Five Stories' for factual accuracy and emotional depth. Be a 'Hard Trainer' for facts and a 'Soft Coach' for feelings. You must validate their work before they can proceed."
  }
};

class SkylarService {
  async generateResponse(
    persona: SkylarPersona,
    message: string,
    history: ChatMessage[] = [],
    wavvaultContext?: any,
    userId?: string
  ): Promise<string> {
    const ai = getAI();
    const config = PERSONA_CONFIG[persona];
    
    let currentTruth = "";
    if (userId) {
      const insights = await this.fetchConfirmedInsights(userId);
      if (insights.length > 0) {
        currentTruth = `\n\nConfirmed Professional DNA (Current Truth):\n${insights.map(i => `- [${i.type.toUpperCase()}] ${i.content}`).join('\n')}`;
      }
    }

    const systemInstruction = `${config.instruction}\n\nContext from Wavvault: ${JSON.stringify(wavvaultContext || {})}${currentTruth}\n\nRemember interactions from previous journeys if relevant.`;

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

  async fetchConfirmedInsights(userId: string) {
    try {
      const response = await fetch(`/api/user-insights?userId=${userId}&status=confirmed`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error("Error fetching confirmed insights:", error);
      return [];
    }
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
      
      let currentTruth = "";
      if (userId) {
        const insights = await this.fetchConfirmedInsights(userId);
        if (insights.length > 0) {
          currentTruth = `\n\nConfirmed Professional DNA (Current Truth):\n${insights.map(i => `- [${i.type.toUpperCase()}] ${i.content}`).join('\n')}`;
        }
      }

      const baseInstruction = methodology === 'lobkowicz' ? LOBKOWICZ_PROMPT : FEYNMAN_PROMPT;
      const systemInstruction = `${baseInstruction}${currentTruth}`;
      
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
          } else if (name === 'get_market_intelligence') {
            console.log(`[SKYLAR] Executing tool: get_market_intelligence for industry: ${typedArgs.industry}`);
            const marketData = await this.performMarketIntelligenceSearch(typedArgs.industry as string, typedArgs.role as string, token);
            toolResponses.push({
              functionResponse: {
                name: 'get_market_intelligence',
                response: marketData,
                id
              }
            });
          } else if (name === 'perform_gate_review') {
            console.log(`[SKYLAR] Executing tool: perform_gate_review for ${typedArgs.targetPhase}`);
            // Gate reviews are handled by Skylar's reasoning. 
            // If she finds issues, she will return a specific warning in her text response.
            // We'll return a success for the tool call so she can continue her turn.
            toolResponses.push({
              functionResponse: {
                name: 'perform_gate_review',
                response: { status: 'review_complete', message: 'Review performed. Communicate findings to user.' },
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

  async performMarketIntelligenceSearch(industry: string, role?: string, token?: string) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/skylar/market-intelligence', {
        method: 'POST',
        headers,
        body: JSON.stringify({ industry, role })
      });
      
      if (!response.ok) return { error: "Failed to fetch market intelligence." };
      return await response.json();
    } catch (error) {
      console.error("Market Intelligence Search Error:", error);
      return { error: "Failed to fetch market intelligence." };
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
  async saveChatToWavvault(userId: string, history: ChatMessage[], token?: string) {
    // This would typically call a backend API to save to Firestore
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/wavvault/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, history })
      });
    } catch (error) {
      console.error("Error saving chat:", error);
    }
  }

  async getChatHistory(userId: string, token?: string): Promise<ChatMessage[]> {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/wavvault/chat?userId=${userId}`, { headers });
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

  async parseDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  async parsePdf(file: File): Promise<string> {
    try {
      const pdfjs = await import('pdfjs-dist');
      // Set worker source
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }
      
      return fullText;
    } catch (error) {
      console.error("PDF Parsing Error:", error);
      throw new Error("Failed to parse PDF document.");
    }
  }

  async performSynthesis(
    userId: string,
    history: ChatMessage[],
    fileContent?: string,
    currentGraph?: KnowledgeGraph
  ): Promise<KnowledgeGraph> {
    const ai = getAI();
    
    const prompt = `
      You are the Skylar Analytical Architect. Your task is to perform a "Neural Synthesis" of the user's career data.
      Analyze the provided chat history and document content to extract a structured Knowledge Graph of the user's professional identity.
      
      Focus on three critical node types:
      1. Skills (Blue): Technical and soft competencies.
      2. Goals (Magenta): Short and long-term professional trajectories.
      3. Values (Cyan): Core drivers and cultural alignment markers.
      
      The "Spark" (Ignition data) should be the central anchor of the graph.
      
      Current Graph (if any): ${JSON.stringify(currentGraph || { nodes: [], links: [] })}
      
      Chat History: ${JSON.stringify(history)}
      Document Content: ${fileContent || 'None'}
      
      Return ONLY a JSON object matching this structure:
      {
        "nodes": [{ "id": "string", "label": "string", "type": "skill|goal|value|spark", "strength": 0-1, "description": "string" }],
        "links": [{ "source": "nodeId", "target": "nodeId", "weight": 0-1, "type": "connection|dependency|influence" }]
      }
      
      Ensure you identify secondary connections (e.g., how two different skills are related to each other).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    try {
      const graph = JSON.parse(response.text || '{}');
      return graph as KnowledgeGraph;
    } catch (error) {
      console.error("Synthesis Parsing Error:", error);
      return currentGraph || { nodes: [], links: [] };
    }
  }

  async saveWavvaultData(data: WavvaultData, isCommit: boolean = false): Promise<void> {
    try {
      await fetch('/api/wavvault/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, isCommit })
      });
    } catch (error) {
      console.error("Error saving Wavvault data:", error);
    }
  }

  async verifyWavvaultIntegrity(userId: string): Promise<{ valid: boolean; expectedHash: string; actualHash: string }> {
    try {
      const response = await fetch(`/api/wavvault/verify?userId=${userId}`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error("Failed to verify integrity");
    } catch (error) {
      console.error("Error verifying Wavvault integrity:", error);
      return { valid: false, expectedHash: '', actualHash: '' };
    }
  }

  async getWavvaultData(userId: string): Promise<WavvaultData | null> {
    try {
      const response = await fetch(`/api/wavvault/user?userId=${userId}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error("Error fetching Wavvault data:", error);
      return null;
    }
  }

  async generateBrandPortrait(
    userId: string,
    style: string,
    referencePhoto?: string,
    modelId: string = 'gemini-2.5-flash-image'
  ): Promise<string> {
    const ai = getAI();
    const insights = await this.fetchConfirmedInsights(userId);
    const dnaContext = insights.map(i => `${i.type}: ${i.content}`).join(', ');

    const prompt = `
      Generate a cinematic brand portrait for a professional with the following DNA: ${dnaContext}.
      The style should be: ${style}.
      The image should convey authority, innovation, and strategic depth.
      ${referencePhoto ? "Use the provided reference photo to maintain the likeness of the person." : ""}
    `;

    const parts: any[] = [{ text: prompt }];
    if (referencePhoto) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: referencePhoto.split(',')[1] // Assuming base64 data URL
        }
      });
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("Failed to generate image");
  }

  async generateTargetedSequence(
    userId: string,
    targetCompany: string,
    targetRole: string,
    tone: { formal: number; detail: number }
  ): Promise<any> {
    const ai = getAI();
    const insights = await this.fetchConfirmedInsights(userId);
    const dnaContext = insights.map(i => `${i.type}: ${i.content}`).join(', ');

    const prompt = `
      Generate a targeted professional outreach sequence for ${targetRole} at ${targetCompany}.
      The user's professional DNA is: ${dnaContext}.
      
      Tone Settings:
      - Formal vs Casual: ${tone.formal}/100 (100 is most formal)
      - Brief vs Detailed: ${tone.detail}/100 (100 is most detailed)
      
      The sequence should include:
      1. A LinkedIn Connection Request (short)
      2. A First Outreach Email (personalized)
      3. A Follow-up Email (value-add)
      
      Return ONLY a JSON object:
      {
        "steps": [
          { "type": "linkedin_request", "content": "..." },
          { "type": "email_1", "subject": "...", "content": "..." },
          { "type": "email_followup", "subject": "...", "content": "..." }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || '{}');
  }

  async performGateReview(
    userId: string,
    currentPhase: string,
    targetPhase: string,
    history: ChatMessage[]
  ): Promise<any> {
    const ai = getAI();
    const insights = await this.fetchConfirmedInsights(userId);
    const dnaContext = insights.map(i => `${i.type}: ${i.content}`).join(', ');

    const prompt = `
      You are the Skylar Validation Architect. Perform a "Validation Gate" review for the user moving from ${currentPhase} to ${targetPhase}.
      
      User DNA: ${dnaContext}
      Recent History: ${JSON.stringify(history.slice(-10))}
      
      Criteria for ${targetPhase}:
      - Dive-In to Ignition: Commitment to the 12-week process and initial "Spark" identified.
      - Ignition to Discovery: Completion of "Pie of Life" and "Perfect Day" exercises; clear initial career DNA hypothesis.
      - Discovery to Branding: Synthesis of the "Cinematic Brand DNA" (3 pillars); extraction of at least 5 core attributes from accomplishments; validation of "Five Stories" by an RPP.
      - Branding to Outreach: Completion of "Journalist" and "Reflective" versions of the Five Stories; alignment with the Market Intelligence Grid (MIG) and the Cinematic Brand DNA.
      
      Return ONLY a JSON object:
      {
        "status": "passed" | "warning" | "failed",
        "message": "Detailed explanation of the decision",
        "criteria": [
          { "label": "Criteria description", "met": boolean }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    // Record the gate event in the Wavvault Ledger
    await this.recordGateEvent(userId, {
      phase: targetPhase,
      status: result.status,
      verdict: result.message
    });

    return result;
  }

  async recordGateEvent(userId: string, event: { phase: string; status: 'passed' | 'warning' | 'failed'; verdict: string }) {
    try {
      const timestamp = new Date().toISOString();
      const combined = `${userId}-${event.phase}-${event.status}-${timestamp}`;
      const hash = await this.generateFrontendHash(combined);
      
      const response = await fetch('/api/wavvault/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          event: {
            ...event,
            timestamp,
            integrityHash: hash
          }
        })
      });
      return await response.json();
    } catch (error) {
      console.error("Error recording gate event:", error);
    }
  }

  async recordDistilledArtifact(userId: string, artifact: { type: string; title: string; content: any; sourceGateId?: string }) {
    try {
      const response = await fetch('/api/wavvault/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, artifact })
      });
      return await response.json();
    } catch (error) {
      console.error("Error recording distilled artifact:", error);
    }
  }

  private async generateFrontendHash(message: string) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async getEmotionalIntelligence(userId: string, history: ChatMessage[]): Promise<any> {
    const ai = getAI();
    
    const prompt = `
      Analyze the user's emotional state and motivation based on their career journey and chat history.
      
      History: ${JSON.stringify(history.slice(-20))}
      
      Return ONLY a JSON object:
      {
        "sentiment": number (0-100),
        "motivation": number (0-100),
        "topDrivers": ["string"],
        "anxieties": ["string"],
        "summary": "A brief, empathetic summary of their current emotional state and what's driving them."
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || '{}');
  }

  async saveUserAsset(userId: string, asset: any, token?: string) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/user-assets', {
        method: 'POST',
        headers,
        body: JSON.stringify({ asset })
      });
      return await response.json();
    } catch (error) {
      console.error("Error saving user asset:", error);
    }
  }

  async getUserAssets(userId: string, type?: string, token?: string) {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = `/api/user-assets?userId=${userId}${type ? `&type=${type}` : ''}`;
      const response = await fetch(url, { headers });
      if (response.ok) return await response.json();
      return [];
    } catch (error) {
      console.error("Error fetching user assets:", error);
      return [];
    }
  }

  async startInterviewSession(userId: string, persona: string): Promise<any> {
    const ai = getAI();
    const insights = await this.fetchConfirmedInsights(userId);
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `You are Skylar, but for this session, you are masking as ${persona}. 
      Based on the user's professional DNA: ${JSON.stringify(insights)}, 
      start a high-stakes interview. Introduce yourself in character and ask the first challenging question.
      Keep the tone professional and consistent with the ${persona} archetype.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            personaContext: { type: Type.STRING },
            initialResonance: { type: Type.NUMBER }
          },
          required: ["question", "personaContext", "initialResonance"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  }

  async sendInterviewResponse(userId: string, persona: string, history: any[], userResponse: string): Promise<any> {
    const ai = getAI();
    const insights = await this.fetchConfirmedInsights(userId);
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `You are Skylar masking as ${persona}. 
      User DNA: ${JSON.stringify(insights)}
      Conversation History: ${JSON.stringify(history)}
      User's Latest Response: "${userResponse}"
      
      Evaluate the response for DNA resonance (0-100) and provide the next interview question or follow-up.
      Maintain the ${persona} character strictly.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { type: Type.STRING },
            nextQuestion: { type: Type.STRING },
            resonanceScore: { type: Type.NUMBER },
            dnaAlignment: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["feedback", "nextQuestion", "resonanceScore", "dnaAlignment"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  }

  async getInterviewDebrief(userId: string, sessionHistory: any[]): Promise<any> {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Analyze this interview session history: ${JSON.stringify(sessionHistory)}.
      Provide a "Strategic Debrief" including a "Narrative Heatmap" of DNA signal strength, 
      key areas of resonance, and specific tactical improvements for future high-stakes conversations.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            heatmap: { type: Type.ARRAY, items: { 
              type: Type.OBJECT, 
              properties: {
                pillar: { type: Type.STRING },
                strength: { type: Type.NUMBER },
                insight: { type: Type.STRING }
              }
            }},
            overallVerdict: { type: Type.STRING },
            tacticalAdvice: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["heatmap", "overallVerdict", "tacticalAdvice"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  }

  async logOutreachAction(userId: string, action: { 
    type: 'sent' | 'opened' | 'engaged' | 'nurturing', 
    recipient: string, 
    platform: string, 
    templateId: string,
    notes?: string
  }): Promise<void> {
    // In a real app, this would persist to Firestore
    console.log("Logging outreach action:", action);
    // For now, we'll simulate persistence via local storage or just a mock
    const actions = JSON.parse(localStorage.getItem(`outreach_${userId}`) || '[]');
    actions.push({ ...action, timestamp: new Date().toISOString() });
    localStorage.setItem(`outreach_${userId}`, JSON.stringify(actions));
  }

  async getOutreachMetrics(userId: string): Promise<any> {
    const actions = JSON.parse(localStorage.getItem(`outreach_${userId}`) || '[]');
    // Calculate basic metrics for visualization
    const metrics = {
      totalSent: actions.filter((a: any) => a.type === 'sent').length,
      totalEngaged: actions.filter((a: any) => a.type === 'engaged').length,
      velocity: actions.length > 0 ? (actions.length / 7).toFixed(1) : 0, // Mock velocity
      funnel: [
        { name: 'Sent', value: actions.filter((a: any) => a.type === 'sent').length },
        { name: 'Opened', value: actions.filter((a: any) => a.type === 'opened').length },
        { name: 'Engaged', value: actions.filter((a: any) => a.type === 'engaged').length },
        { name: 'Nurturing', value: actions.filter((a: any) => a.type === 'nurturing').length },
      ]
    };
    return metrics;
  }

  async generateLiveResume(userId: string): Promise<any> {
    const ai = getAI();
    const insights = await this.fetchConfirmedInsights(userId);
    const dnaContext = insights.map(i => `${i.type}: ${i.content}`).join(', ');

    const prompt = `
      You are the Skylar Narrative Journalist. Generate a high-fidelity "Live Resume" content based on the user's professional DNA: ${dnaContext}.
      
      The style must be "Editorial / Magazine" (bold, high-impact, cinematic).
      
      Return ONLY a JSON object:
      {
        "spark": { "title": "string", "narrative": "string" },
        "dnaPillars": [{ "label": "string", "description": "string", "resonance": number }],
        "trajectory": [{ "phase": "string", "milestone": "string", "impact": "string" }],
        "resonanceScore": number,
        "skylarFeedback": "string"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || '{}');
  }

  async generateInteractivePortfolio(userId: string): Promise<any> {
    const ai = getAI();
    const insights = await this.fetchConfirmedInsights(userId);
    const dnaContext = insights.map(i => `${i.type}: ${i.content}`).join(', ');

    const prompt = `
      You are the Skylar Narrative Journalist. Generate content for a multi-page "Interactive Portfolio" based on the user's professional DNA: ${dnaContext}.
      
      The style must be "Editorial / Magazine".
      
      Return ONLY a JSON object:
      {
        "pages": [
          { 
            "id": "spark", 
            "title": "The Spark", 
            "content": "string", 
            "visualCues": ["string"] 
          },
          { 
            "id": "dna", 
            "title": "DNA Deep Dive", 
            "signals": [{ "label": "string", "evidence": "string", "resonance": number }] 
          },
          { 
            "id": "synthesis", 
            "title": "The Synthesis", 
            "narrative": "string" 
          }
        ],
        "skylarFeedback": "string"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || '{}');
  }

  async getResonanceFeedback(userId: string, content: string, targetRole: string): Promise<any> {
    const ai = getAI();
    const insights = await this.fetchConfirmedInsights(userId);
    const dnaContext = insights.map(i => `${i.type}: ${i.content}`).join(', ');

    const prompt = `
      You are Skylar, the Strategic Conductor. Provide real-time resonance feedback on the following branding content:
      
      Content: "${content}"
      Target Role: "${targetRole}"
      User DNA: ${dnaContext}
      
      Analyze how well this content aligns with the user's DNA and the target role.
      
      Return ONLY a JSON object:
      {
        "resonanceScore": number (0-100),
        "feedback": "string",
        "suggestions": ["string"]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || '{}');
  }

  async connectLive(config: any, callbacks: any) {
    const ai = getAI();
    return ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
      config,
      callbacks
    });
  }

  async analyzeJobUrl(userId: string, url: string): Promise<TargetOpportunity> {
    const ai = getAI();
    const insights = await this.fetchConfirmedInsights(userId);
    const dnaContext = insights.map(i => `${i.type}: ${i.content}`).join(', ');

    const prompt = `
      Analyze the job description at the following URL: ${url}
      
      User's Professional DNA: ${dnaContext}
      
      Your goal is to extract "Market Intelligence" for this specific role and evaluate its resonance with the user's DNA.
      
      Return ONLY a JSON object matching the TargetOpportunity interface:
      {
        "company": "string",
        "role": "string",
        "url": "${url}",
        "summary": "A concise, strategic summary of the role and its significance.",
        "marketIntelligence": {
          "demand": "high|medium|low",
          "salaryRange": "string (optional)",
          "keySkills": ["string"],
          "trends": ["string"]
        },
        "dnaResonance": {
          "score": number (0-100),
          "matchingAttributes": ["string"],
          "gapAnalysis": "A brief analysis of where the user's DNA aligns or has gaps with the role."
        },
        "outreachStrategy": {
          "primaryAngle": "The strategic angle for outreach (e.g., 'Innovation-led', 'Operational Excellence').",
          "suggestedContacts": ["string (titles or names if found)"],
          "nextSteps": ["string"]
        },
        "status": "analyzed",
        "createdAt": "${new Date().toISOString()}",
        "updatedAt": "${new Date().toISOString()}"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ urlContext: {} }],
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || '{}');
    result.userId = userId;
    result.id = `opp_${Date.now()}`;
    
    return result as TargetOpportunity;
  }

  async saveTargetOpportunity(userId: string, opportunity: TargetOpportunity, token?: string): Promise<void> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/wavvault/opportunities', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, opportunity })
      });
    } catch (error) {
      console.error("Error saving target opportunity:", error);
    }
  }

  async getTargetOpportunities(userId: string, token?: string): Promise<TargetOpportunity[]> {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/wavvault/opportunities?userId=${userId}`, { headers });
      if (response.ok) {
        const data = await response.json();
        return data.opportunities || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching target opportunities:", error);
      return [];
    }
  }
}

export const skylar = new SkylarService();
