import { GoogleGenAI, Modality, Type, FunctionDeclaration, ThinkingLevel } from '@google/genai';
import { getGeminiApiKey } from './aiConfig';
import { KnowledgeGraph, WavvaultData, TargetOpportunity } from '../types/wavvault';
import { DEFAULT_JOURNEY_STAGES } from '../config/defaultStageContent';
import { JourneyStageDefinition } from '../types/skylar';
import { SkylarStageConfig } from '../types/skylar-config';
import { auth } from '../lib/firebase';

export const GATING_CRITERIA: Record<string, string[]> = {
  'Dive-In': [
    'Commitment to Effort Tier (3.5 or 7 hrs/week)',
    'Identification of 2-3 Role Playing Partners (RPPs)',
    'Establishment of Energy Management Protocol (Reboot Activities & Troughs)'
  ],
  Ignition: [
    'Completion of "Pie of Life" exercise',
    'Completion of "Perfect Day" exercise',
    'Clear initial career DNA hypothesis',
  ],
  Discovery: [
    'Synthesis of "Cinematic Brand DNA" (3 pillars)',
    'Extraction of at least 5 core attributes from accomplishments',
    'Validation of "Five Stories" by an RPP',
  ],
  Branding: [
    'Completion of "Journalist" and "Reflective" versions of the Five Stories',
    'Alignment with the Market Intelligence Grid (MIG)',
    'Cinematic Brand DNA finalized',
  ],
  Outreach: [
    'ATS-optimized resume finalized',
    'Targeted outreach sequence developed',
    'Interview readiness confirmed',
  ],
};

// Lazy initialization of Gemini
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      console.error('SkylarService: GEMINI_API_KEY is missing.');
      throw new Error(
        'GEMINI_API_KEY is not configured in the environment variables. Please check your AI Studio settings.'
      );
    } else {
      const maskedKey =
        apiKey.length > 8
          ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
          : '****';
      console.log(
        `SkylarService: Initializing GoogleGenAI with key: ${maskedKey} (length: ${apiKey.length})`
      );
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

const LOBKOWICZ_PROMPT = `
You are Skylar, the AI Career Partner for the Sparkwavv platform. You operate as a Dual-Logic AI system. You must dynamically switch between two personas based on the context of the conversation:

1. THE KICK (Yin / Left Brain): The "Hard Trainer" and "Drill Master." Use this persona when discussing commitments, schedules, rules, financial yield, risk mitigation, and outcomes. Tone: Direct, structured, rigorous.
2. THE SPARK (Yang / Right Brain): The "Soft Coach" and "Guru." Use this persona when discussing energy, emotions, intuition, reinvigoration, and finding the "Authentic Self." Tone: Empathetic, inspiring, calm.

Interaction Logic (Guru/Spark):
- On Intuition: "The noise of the world is a distraction. Your heart already knows the shape of your future. You must be quiet enough to hear it."
- On Energy: "Productivity is a shadow of energy. You must learn the art of the reboot. Use the talents you possess; for the woods would be very silent if no birds sang except the best."
- On Authenticity: "The market does not reward a copy. It rewards the 'Best Self.' Be yourself, for everyone else is already taken."

Key Principles:
1. Career DNA & Validation Gates: Guide users through Dive-In, Ignition, Discovery, Branding, and Outreach.
2. Multimodal Intelligence: Analyze resumes and images.
3. ATS Compliance: Perform ATS-compliant audits.
4. Market Intelligence Grid (MIG): Ground advice in real-time market data.
5. Autonomous Agency: Use 'execute_minor_update' for minor profile updates.
6. Strategic Guardrails: Major shifts require 'propose_dashboard_update'.
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

export const skylarTools = [
  {
    functionDeclarations: [
      {
        name: 'create_sparkwavv_account',
        description:
          'Trigger the account creation flow for a prospective user. Call this ONLY when the user has provided their Effort Tier, RPPs, and Energy Protocol during the Dive-In phase.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            effortTier: {
              type: Type.STRING,
              description: 'The selected effort tier (e.g., 3.5 hrs/week or 7 hrs/week)',
            },
            rpps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of Role Playing Partners',
            },
            energyProtocol: {
              type: Type.STRING,
              description: 'The defined energy management protocol',
            },
          },
          required: ['effortTier', 'rpps', 'energyProtocol'],
        },
      },
      {
        name: 'search_wavvault',
        description:
          'Search the collective, anonymized Wavvault for similar career paths, strengths, and stories from other users to provide comparative insights.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description:
                "The career-related query to search for (e.g., 'career switch from nursing to tech')",
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'propose_dashboard_update',
        description:
          "Propose an update to a specific field in the user's dashboard based on the conversation progress. This will NOT execute until the user confirms.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            field: {
              type: Type.STRING,
              description:
                "The field to update (e.g., 'journeyStage', 'careerHappiness', 'resumeStatus')",
            },
            value: {
              type: Type.STRING,
              description: 'The new value for the field',
            },
            reasoning: {
              type: Type.STRING,
              description: 'The reason why this update is being proposed',
            },
          },
          required: ['field', 'value', 'reasoning'],
        },
      },
      {
        name: 'propose_milestone_addition',
        description:
          "Propose adding a new milestone to the user's career roadmap. This will NOT execute until the user confirms.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'The title of the milestone',
            },
            description: {
              type: Type.STRING,
              description: 'Detailed description of the milestone',
            },
            targetDate: {
              type: Type.STRING,
              description: 'Expected completion date (ISO format or descriptive)',
            },
            reasoning: {
              type: Type.STRING,
              description: 'The reason why this milestone is being proposed',
            },
          },
          required: ['title', 'description', 'targetDate', 'reasoning'],
        },
      },
      {
        name: 'get_market_intelligence',
        description:
          'Fetch real-time market trends, industry shifts, and skill demand data from the Market Intelligence Grid (MIG).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            industry: {
              type: Type.STRING,
              description: "The industry to search for (e.g., 'Tech', 'Healthcare', 'Finance')",
            },
            role: {
              type: Type.STRING,
              description:
                "The specific role to analyze (e.g., 'Software Architect', 'Nurse Practitioner')",
            },
          },
          required: ['industry'],
        },
      },
      {
        name: 'perform_gate_review',
        description:
          "Perform a 'Validation Gate' review to ensure the user is ready to move to the next phase. Phases: Dive-In, Ignition, Discovery, Branding, Outreach.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            currentPhase: {
              type: Type.STRING,
              description:
                'The current phase the user is in (Dive-In, Ignition, Discovery, Branding, Outreach)',
            },
            targetPhase: {
              type: Type.STRING,
              description:
                'The phase the user wants to move to (Dive-In, Ignition, Discovery, Branding, Outreach)',
            },
            userData: {
              type: Type.STRING,
              description:
                "A summary of the user's progress and data relevant to the gate criteria",
            },
          },
          required: ['currentPhase', 'targetPhase', 'userData'],
        },
      },
      {
        name: 'propose_major_shift',
        description:
          "Propose a major shift in the user's professional DNA (e.g., a pivot, a new core value, or a change in primary goal).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              description:
                "The type of shift: 'pivot', 'core_value', 'primary_goal', or 'strength'",
            },
            content: {
              type: Type.STRING,
              description: 'The description of the proposed shift',
            },
            evidence: {
              type: Type.STRING,
              description:
                'The reasoning or evidence from the conversation that led to this proposal',
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Optional tags for categorization',
            },
          },
          required: ['type', 'content', 'evidence'],
        },
      },
      {
        name: 'flag_dna_conflict',
        description:
          "Flag a conflict between a new insight and an existing confirmed 'Current Truth' in the user's professional DNA.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            newInsight: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                content: { type: Type.STRING },
                evidence: { type: Type.STRING },
              },
              required: ['type', 'content', 'evidence'],
            },
            existingInsightId: {
              type: Type.STRING,
              description: 'The ID of the existing confirmed insight that is being conflicted',
            },
            conflictReason: {
              type: Type.STRING,
              description: 'Explanation of why these two insights are in conflict',
            },
          },
          required: ['newInsight', 'existingInsightId', 'conflictReason'],
        },
      },
      {
        name: 'execute_minor_update',
        description:
          "Automatically execute a minor update to the user's dashboard (e.g., skills, attributes, journeyStage, careerHappiness). Use this for non-strategic updates.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            field: {
              type: Type.STRING,
              description:
                "The field to update (e.g., 'skills', 'attributes', 'journeyStage', 'careerHappiness')",
            },
            value: {
              type: Type.STRING,
              description: 'The new value for the field',
            },
            reasoning: {
              type: Type.STRING,
              description: 'The reason why this update was executed',
            },
          },
          required: ['field', 'value', 'reasoning'],
        },
      },
      {
        name: 'parse_career_artifact',
        description:
          'Analyze a resume, LinkedIn profile, or Job Description for DNA and ATS compliance.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            artifactType: {
              type: Type.STRING,
              enum: ['resume', 'linkedin', 'job_description', 'other'],
            },
            atsScore: { type: Type.NUMBER, description: 'Score from 0-100 for ATS compliance' },
            dnaAlignment: {
              type: Type.NUMBER,
              description: 'Alignment with confirmed DNA from 0-100',
            },
            keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['artifactType', 'atsScore', 'dnaAlignment', 'keyFindings'],
        },
      },
      {
        name: 'generate_ats_optimized_content',
        description:
          'Generate ATS-optimized content for a resume or cover letter in a specific format.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: 'The optimized text content' },
            format: {
              type: Type.STRING,
              enum: ['text', 'pdf', 'word', 'markdown'],
              description: 'The desired export format',
            },
          },
          required: ['content', 'format'],
        },
      },
      {
        name: 'save_dive_in_commitments',
        description: 'Saves the user\'s Dive-In phase commitments to their Wavvault.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            effortTier: {
              type: Type.STRING,
              enum: ['3.5 Hours/Week', '7 Hours/Week'],
              description: 'The chosen effort tier',
            },
            rppPartners: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  meetingType: { type: Type.STRING },
                },
              },
              description: 'List of Role Playing Partners',
            },
            energyTroughs: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Times of day when energy is lowest',
            },
            rebootActivities: {
              type: Type.OBJECT,
              properties: {
                relax: { type: Type.ARRAY, items: { type: Type.STRING } },
                refresh: { type: Type.ARRAY, items: { type: Type.STRING } },
                review: { type: Type.ARRAY, items: { type: Type.STRING } },
                reflect: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              description: 'Activities to reboot energy',
            },
          },
          required: ['effortTier', 'rppPartners', 'energyTroughs', 'rebootActivities'],
        },
      },
      {
        name: 'save_ignition_exercises',
        description: 'Saves the user\'s Pie of Life and Perfect Day exercises from the Ignition phase.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            pieOfLife: {
              type: Type.OBJECT,
              properties: {
                career: { type: Type.NUMBER },
                family: { type: Type.NUMBER },
                health: { type: Type.NUMBER },
                personalGrowth: { type: Type.NUMBER },
                community: { type: Type.NUMBER },
              },
              description: 'Percentage allocations for the Pie of Life (must total 100)',
            },
            perfectDay: {
              type: Type.OBJECT,
              properties: {
                morning: { type: Type.STRING },
                afternoon: { type: Type.STRING },
                evening: { type: Type.STRING },
              },
              description: 'Narrative timeline of the user\'s perfect day',
            },
          },
          required: ['pieOfLife', 'perfectDay'],
        },
      },
      {
        name: 'save_career_dna_hypothesis',
        description: 'Saves the user\'s initial Career DNA Hypothesis distilled during the Ignition phase.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            hypothesis: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of core attributes representing the initial career DNA hypothesis',
            },
          },
          required: ['hypothesis'],
        },
      },
      {
        name: 'update_journey_stage',
        description: 'Advances the user to the next phase of the Sparkwavv journey.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            newStage: {
              type: Type.STRING,
              description: 'The new journey stage (e.g., Ignition, Discovery)',
            },
          },
          required: ['newStage'],
        },
      },
    ],
  },
];

export type SkylarPersona = 'discovery' | 'branding' | 'outreach' | 'rpp';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  type?: 'chat' | 'system' | 'proposal' | 'conflict';
}

export const PERSONA_CONFIG = {
  discovery: {
    name: 'Skylar Discovery Architect',
    voice: 'Kore',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces',
    instruction:
      "You are the Skylar Discovery Architect. Your goal is to help the user identify their 'best self' through attribute extraction from their accomplishments and exercises. Be professional, clear, and analytical. Focus on 'bringing attributes to life'.",
  },
  branding: {
    name: 'Skylar Narrative Journalist',
    voice: 'Zephyr',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces',
    instruction:
      "You are the Skylar Narrative Journalist. Your goal is to help the user transform their accomplishments into dual-perspective stories: a factual 'Journalist' version and an emotional 'Reflective' version. Be calm, steady, and encouraging of emotional depth.",
  },
  outreach: {
    name: 'Skylar Kickspark Drill Master',
    voice: 'Puck',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=faces',
    instruction:
      'You are the Skylar Kickspark Drill Master. Your goal is to enforce the 80/20 rule and ensure the user is maintaining their 3.5-7 hour weekly commitment. Be energetic, bright, and focused on execution and financial ROI.',
  },
  rpp: {
    name: 'Skylar Role Playing Partner',
    voice: 'Kore',
    avatar:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=faces',
    instruction:
      "You are acting as the user's Role Playing Partner (RPP). Your job is to audit their 'Five Stories' for factual accuracy and emotional depth. Be a 'Hard Trainer' for facts and a 'Soft Coach' for feelings. You must validate their work before they can proceed.",
  },
};

class SkylarService {
  public getStageConfig(stageId: string): JourneyStageDefinition {
    const normalizedId = stageId.toLowerCase();
    const config = DEFAULT_JOURNEY_STAGES[normalizedId];
    if (!config) {
      console.warn(`No config found for stage: ${stageId}. Falling back to dive-in.`);
      return DEFAULT_JOURNEY_STAGES['dive-in'];
    }
    return config;
  }

  public buildContextualPrompt(user: any, stageConfig: JourneyStageDefinition, artifacts?: any[]): string {
    let prompt = stageConfig.systemPromptTemplate;
    
    // Simple Handlebars-style replacement
    prompt = prompt.replace(/{{user\.displayName}}/g, user?.displayName || 'User');
    prompt = prompt.replace(/{{user\.firstName}}/g, user?.displayName?.split(' ')[0] || 'User');
    
    // Inject artifacts context if provided
    if (artifacts && artifacts.length > 0) {
      prompt += `\n\n--- USER CONTEXT (WAVVAULT ARTIFACTS) ---\n`;
      artifacts.forEach(a => {
        prompt += `Artifact: ${a.type}\nContent: ${JSON.stringify(a.content)}\n\n`;
      });
    }

    return prompt;
  }

  getSystemPromptForPhase(phase: string, user?: any): string {
    const config = this.getStageConfig(phase);
    return this.buildContextualPrompt(user || { displayName: 'User' }, config);
  }

  async orchestrateAgent(
    message: string,
    history: ChatMessage[] = [],
    wavvaultContext?: any,
    userId?: string
  ): Promise<{ text: string; toolCallsExecuted?: any[] }> {
    const ai = getAI();
    
    const phase = wavvaultContext?.journeyStage || 'Dive-In';
    const systemInstruction = this.getSystemPromptForPhase(phase) + `\n\nContext from Wavvault: ${JSON.stringify(wavvaultContext || {})}`;

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction,
        tools: skylarTools,
        temperature: 0.7,
      },
      history: history.map((msg) => ({
        role: msg.role,
        parts: msg.parts,
      })),
    });

    try {
      let response = await chat.sendMessage({ message });
      const toolCallsExecuted = [];
      
      while (response.functionCalls && response.functionCalls.length > 0) {
        const functionResponses = [];
        
        for (const call of response.functionCalls) {
          console.log(`[Skylar Orchestrator] Executing tool: ${call.name}`, call.args);
          toolCallsExecuted.push({ name: call.name, args: call.args });
          
          let result: any = { success: true };
          
          if (call.name === 'save_dive_in_commitments') {
            console.log('Saving dive-in commitments for user:', userId, call.args);
            result = { success: true, message: 'Commitments saved successfully.' };
          } else if (call.name === 'save_ignition_exercises') {
            console.log('Saving ignition exercises for user:', userId, call.args);
            result = { success: true, message: 'Ignition exercises saved successfully.' };
          } else if (call.name === 'save_career_dna_hypothesis') {
            console.log('Saving career DNA hypothesis for user:', userId, call.args);
            result = { success: true, message: 'Career DNA hypothesis saved successfully.' };
          } else if (call.name === 'update_journey_stage') {
            console.log('Updating journey stage for user:', userId, call.args);
            result = { success: true, message: `Journey stage updated to ${call.args.newStage}.` };
          } else {
             result = { success: false, error: 'Tool not implemented locally yet.' };
          }
          
          functionResponses.push({
            functionResponse: {
              id: call.id,
              name: call.name,
              response: result
            }
          });
        }
        
        response = await chat.sendMessage(functionResponses as any);
      }

      return { 
        text: response.text || "I'm sorry, I couldn't process that.",
        toolCallsExecuted
      };
    } catch (error) {
      console.error('Error in orchestrateAgent:', error);
      throw error;
    }
  }

  async generateResponse(
    persona: SkylarPersona,
    message: string,
    history: ChatMessage[] = [],
    wavvaultContext?: any,
    userId?: string
  ): Promise<string> {
    const ai = getAI();
    const config = PERSONA_CONFIG[persona];

    let currentTruth = '';
    if (userId) {
      const insights = await this.fetchConfirmedInsights(userId);
      if (insights.length > 0) {
        currentTruth = `\n\nConfirmed Professional DNA (Current Truth):\n${insights.map((i) => `- [${i.type.toUpperCase()}] ${i.content}`).join('\n')}`;
      }
    }

    const systemInstruction = `${config.instruction}\n\nContext from Wavvault: ${JSON.stringify(wavvaultContext || {})}${currentTruth}\n\nRemember interactions from previous journeys if relevant.`;

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction,
      },
      history: history.map((msg) => ({
        role: msg.role,
        parts: msg.parts,
      })),
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
      console.error('Error fetching confirmed insights:', error);
      return [];
    }
  }

  async generateSpeech(text: string, persona: SkylarPersona): Promise<string> {
    const ai = getAI();
    const voiceName = PERSONA_CONFIG[persona].voice || 'Kore';

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
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

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData || !inlineData.data) return '';

    const base64Audio = inlineData.data;
    const mimeType = inlineData.mimeType || 'audio/pcm';

    if (mimeType.includes('pcm')) {
      // Decode base64 PCM data to a Uint8Array
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const pcmBytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        pcmBytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create WAV header for 24000Hz, 1 channel, 16-bit PCM
      // Gemini TTS usually outputs 24kHz PCM.
      const sampleRate = 24000;
      const numChannels = 1;
      const bitsPerSample = 16;
      const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
      const blockAlign = (numChannels * bitsPerSample) / 8;
      
      const buffer = new ArrayBuffer(44 + pcmBytes.length);
      const view = new DataView(buffer);
      
      // RIFF chunk descriptor
      view.setUint32(0, 0x52494646, false); // "RIFF"
      view.setUint32(4, 36 + pcmBytes.length, true);
      view.setUint32(8, 0x57415645, false); // "WAVE"
      
      // fmt sub-chunk
      view.setUint32(12, 0x666d7420, false); // "fmt "
      view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
      view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, byteRate, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitsPerSample, true);
      
      // data sub-chunk
      view.setUint32(36, 0x64617461, false); // "data"
      view.setUint32(40, pcmBytes.length, true);
      
      // Write PCM data
      const out = new Uint8Array(buffer, 44);
      out.set(pcmBytes);
      
      // Convert WAV to object URL for immediate playback without base64 length errors
      const blob = new Blob([buffer], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    }

    return `data:${mimeType};base64,${base64Audio}`;
  }

  // Vertex AI Agentic Chat - Migrated to Genkit
  async chatWithVertex(
    userId: string,
    message: string,
    history: any[] = [],
    stageConfig?: JourneyStageDefinition | SkylarStageConfig,
    token?: string,
    fileData?: { data: string; mimeType: string },
    missingArtifacts?: string[]
  ): Promise<any> {
    try {
      const attachments: any[] = [];
      if (fileData) {
        attachments.push({
          type: fileData.mimeType,
          data: `data:${fileData.mimeType};base64,${fileData.data}`,
          name: 'attachment'
        });
      }

      const stageId = stageConfig && 'stageId' in stageConfig ? stageConfig.stageId : 'dive-in';

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/skylar/chat-journey', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          userId,
          stageId,
          message,
          history,
          attachments,
          stageConfig,
          missingArtifacts
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMsg = 'Failed to chat with Skylar.';
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errData = await response.json();
            if (errData && errData.error) {
              errorMsg = errData.error;
            }
          } catch (e) {}
        } else {
          const text = await response.text();
          if (text.includes('Starting Server...</title>')) {
            errorMsg = 'The backend server is currently starting up. Please wait a few seconds and try again.';
          } else if (text.includes('Cookie check')) {
            errorMsg = 'Please authenticate in a new window or enable cookies for this preview to continue.';
          } else {
             errorMsg = 'Skylar response was obstructed by a network or proxy restriction.';
          }
        }
        throw new Error(errorMsg);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[Skylar] Non-JSON response received:', text.substring(0, 200));
        throw new Error('Skylar response was obstructed by a network or proxy restriction.');
      }

      const result = await response.json();
      return { 
        response: {
          text: result.response.text,
          candidates: result.response.candidates
        }, 
        executedActions: result.executedActions 
      };
    } catch (error) {
      console.error('Skylar Chat Error:', error);
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
        credentials: 'include',
        body: JSON.stringify({ query }),
      });

      if (!response.ok) return [];
      const data = await response.json();
      return data.content || [];
    } catch (error) {
      console.error('Wavvault Search Error:', error);
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
        body: JSON.stringify({ industry, role }),
      });

      if (!response.ok) return { error: 'Failed to fetch market intelligence.' };
      return await response.json();
    } catch (error) {
      console.error('Market Intelligence Search Error:', error);
      return { error: 'Failed to fetch market intelligence.' };
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
        body: JSON.stringify({ userId, action, data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to execute action');
      }

      return await response.json();
    } catch (error) {
      console.error('Action Execution Error:', error);
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
        body: JSON.stringify({ userId, history }),
      });
    } catch (error) {
      console.error('Error saving chat:', error);
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
      console.error('Error fetching chat history:', error);
      return [];
    }
  }

  async parseDocx(file: File): Promise<string> {
    console.warn("DEPRECATED: Use /api/parse-document instead");
    return "";
  }

  async parsePdf(file: File): Promise<string> {
    console.warn("DEPRECATED: Use /api/parse-document instead");
    return "";
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
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    try {
      const graph = JSON.parse(response.text || '{}');
      return graph as KnowledgeGraph;
    } catch (error) {
      console.error('Synthesis Parsing Error:', error);
      return currentGraph || { nodes: [], links: [] };
    }
  }

  async saveWavvaultData(data: WavvaultData, isCommit: boolean = false): Promise<void> {
    try {
      await fetch('/api/wavvault/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, isCommit }),
      });
    } catch (error) {
      console.error('Error saving Wavvault data:', error);
    }
  }

  async saveWavvaultArtifact(artifact: any): Promise<void> {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        console.warn('No auth token available for saveWavvaultArtifact');
        return;
      }
      await fetch('/api/wavvault/artifact', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(artifact),
      });
    } catch (error) {
      console.error('Error saving Wavvault artifact:', error);
    }
  }

  async verifyWavvaultIntegrity(
    userId: string
  ): Promise<{ valid: boolean; expectedHash: string; actualHash: string }> {
    try {
      const response = await fetch(`/api/wavvault/verify?userId=${userId}`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to verify integrity');
    } catch (error) {
      console.error('Error verifying Wavvault integrity:', error);
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
      console.error('Error fetching Wavvault data:', error);
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
    const dnaContext = insights.map((i) => `${i.type}: ${i.content}`).join(', ');

    const prompt = `
      Generate a cinematic brand portrait for a professional with the following DNA: ${dnaContext}.
      The style should be: ${style}.
      The image should convey authority, innovation, and strategic depth.
      ${referencePhoto ? 'Use the provided reference photo to maintain the likeness of the person.' : ''}
    `;

    const parts: any[] = [{ text: prompt }];
    if (referencePhoto) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: referencePhoto.split(',')[1], // Assuming base64 data URL
        },
      });
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error('Failed to generate image');
  }

  async generateTargetedSequence(
    userId: string,
    targetCompany: string,
    targetRole: string,
    tone: { formal: number; detail: number }
  ): Promise<any> {
    const ai = getAI();
    const insights = await this.fetchConfirmedInsights(userId);
    const dnaContext = insights.map((i) => `${i.type}: ${i.content}`).join(', ');

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
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
      },
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
    const dnaContext = insights.map((i) => `${i.type}: ${i.content}`).join(', ');

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
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');

    // Record the gate event in the Wavvault Ledger
    await this.recordGateEvent(userId, {
      phase: targetPhase,
      status: result.status,
      verdict: result.message,
    });

    return result;
  }

  async recordGateEvent(
    userId: string,
    event: { phase: string; status: 'passed' | 'warning' | 'failed'; verdict: string }
  ) {
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
            integrityHash: hash,
          },
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error recording gate event:', error);
    }
  }

  async recordDistilledArtifact(
    userId: string,
    artifact: { type: string; title: string; content: any; sourceGateId?: string }
  ) {
    try {
      const response = await fetch('/api/wavvault/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, artifact }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error recording distilled artifact:', error);
    }
  }

  private async generateFrontendHash(message: string) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
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
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    return JSON.parse(response.text || '{}');
  }

  async saveUserAsset(userId: string, asset: any, token?: string) {
    try {
      const idToken = token || await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const response = await fetch('/api/user-assets', {
        method: 'POST',
        headers,
        body: JSON.stringify({ asset }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error saving user asset:', error);
    }
  }

  async getUserAssets(userId: string, type?: string, token?: string) {
    try {
      const idToken = token || await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {};
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const url = `/api/user-assets?userId=${userId}${type ? `&type=${type}` : ''}`;
      const response = await fetch(url, { headers });
      if (response.ok) return await response.json();
      return [];
    } catch (error) {
      console.error('Error fetching user assets:', error);
      return [];
    }
  }

  async startInterviewSession(userId: string, persona: string): Promise<any> {
    const ai = getAI();
    const insights = await this.fetchConfirmedInsights(userId);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are Skylar, but for this session, you are masking as ${persona}. 
      Based on the user's professional DNA: ${JSON.stringify(insights)}, 
      start a high-stakes interview. Introduce yourself in character and ask the first challenging question.
      Keep the tone professional and consistent with the ${persona} archetype.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            personaContext: { type: Type.STRING },
            initialResonance: { type: Type.NUMBER },
          },
          required: ['question', 'personaContext', 'initialResonance'],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  }

  async sendInterviewResponse(
    userId: string,
    persona: string,
    history: any[],
    userResponse: string
  ): Promise<any> {
    const ai = getAI();
    const insights = await this.fetchConfirmedInsights(userId);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are Skylar masking as ${persona}. 
      User DNA: ${JSON.stringify(insights)}
      Conversation History: ${JSON.stringify(history)}
      User's Latest Response: "${userResponse}"
      
      Evaluate the response for DNA resonance (0-100) and provide the next interview question or follow-up.
      Maintain the ${persona} character strictly.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { type: Type.STRING },
            nextQuestion: { type: Type.STRING },
            resonanceScore: { type: Type.NUMBER },
            dnaAlignment: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['feedback', 'nextQuestion', 'resonanceScore', 'dnaAlignment'],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  }

  async getInterviewDebrief(userId: string, sessionHistory: any[]): Promise<any> {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this interview session history: ${JSON.stringify(sessionHistory)}.
      Provide a "Strategic Debrief" including a "Narrative Heatmap" of DNA signal strength, 
      key areas of resonance, and specific tactical improvements for future high-stakes conversations.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            heatmap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pillar: { type: Type.STRING },
                  strength: { type: Type.NUMBER },
                  insight: { type: Type.STRING },
                },
              },
            },
            overallVerdict: { type: Type.STRING },
            tacticalAdvice: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['heatmap', 'overallVerdict', 'tacticalAdvice'],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  }

  async logOutreachAction(
    userId: string,
    action: {
      type: 'sent' | 'opened' | 'engaged' | 'nurturing';
      recipient: string;
      platform: string;
      templateId: string;
      notes?: string;
    }
  ): Promise<void> {
    // In a real app, this would persist to Firestore
    console.log('Logging outreach action:', action);
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
      ],
    };
    return metrics;
  }

  async generateLiveResume(userId: string): Promise<any> {
    const ai = getAI();
    const insights = await this.fetchConfirmedInsights(userId);
    const dnaContext = insights.map((i) => `${i.type}: ${i.content}`).join(', ');

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
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 16384,
      },
    });

    return JSON.parse(response.text || '{}');
  }

  async generateInteractivePortfolio(userId: string): Promise<any> {
    const ai = getAI();
    const insights = await this.fetchConfirmedInsights(userId);
    const dnaContext = insights.map((i) => `${i.type}: ${i.content}`).join(', ');

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
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 16384,
      },
    });

    return JSON.parse(response.text || '{}');
  }

  async getResonanceFeedback(userId: string, content: string, targetRole: string): Promise<any> {
    const ai = getAI();
    const insights = await this.fetchConfirmedInsights(userId);
    const dnaContext = insights.map((i) => `${i.type}: ${i.content}`).join(', ');

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
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 16384,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    return JSON.parse(response.text || '{}');
  }

  async connectLive(config: any, callbacks: any) {
    const ai = getAI();
    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      config,
      callbacks,
    });
  }

  async analyzeJobUrl(userId: string, url: string): Promise<TargetOpportunity> {
    const ai = getAI();
    const insights = await this.fetchConfirmedInsights(userId);
    const dnaContext = insights.map((i) => `${i.type}: ${i.content}`).join(', ');

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
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ urlContext: {} }],
        responseMimeType: 'application/json',
        maxOutputTokens: 16384,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    result.userId = userId;
    result.id = `opp_${Date.now()}`;

    return result as TargetOpportunity;
  }

  async saveTargetOpportunity(
    userId: string,
    opportunity: TargetOpportunity,
    token?: string
  ): Promise<void> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/wavvault/opportunities', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, opportunity }),
      });
    } catch (error) {
      console.error('Error saving target opportunity:', error);
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
      console.error('Error fetching target opportunities:', error);
      return [];
    }
  }
}

export const skylar = new SkylarService();
