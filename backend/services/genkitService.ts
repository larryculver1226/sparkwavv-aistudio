import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { vertexAI } from '@genkit-ai/vertexai';
import { promptRef } from '@genkit-ai/dotprompt';
import { getGeminiApiKey } from '../../src/services/aiConfig';
import { skylar } from '../../src/services/skylarService';
import { interpolatePrompt } from '../../src/utils/interpolation';
import { DEFAULT_JOURNEY_STAGES } from '../../src/config/defaultStageContent';

const activeGeminiKey = getGeminiApiKey() || process.env.GEMINI_API_KEY;

// Only initialize Vertex AI if a robust project ID is provided.
// Explicitly ignore internal AI Studio placeholder 'gen-lang-client' projects
const vertexProjectId = process.env.VERTEX_AI_PROJECT_ID;
const isVertexAvailable =
  vertexProjectId && vertexProjectId.trim() !== '' && !vertexProjectId.includes('gen-lang-client');

const targetModel = activeGeminiKey
  ? 'googleai/gemini-2.5-flash'
  : isVertexAvailable
    ? 'vertexai/gemini-1.5-flash'
    : 'googleai/gemini-2.5-flash';

const vertexConfig: any = {
  location: process.env.VERTEX_AI_LOCATION || 'us-central1',
};

if (isVertexAvailable) {
  vertexConfig.projectId = vertexProjectId;
}

const activePlugins = [googleAI({ apiKey: activeGeminiKey || undefined })];
if (isVertexAvailable) {
  activePlugins.push(vertexAI(vertexConfig));
}

// Initialize Genkit
export const ai = genkit({
  plugins: activePlugins,
  model: targetModel,
  promptDir: './backend/prompts',
});

// Define Tools
export const createSparkwavvAccountTool = ai.defineTool(
  {
    name: 'create_sparkwavv_account',
    description:
      'Trigger the account creation flow for a prospective user. Call this ONLY when the user has provided their Effort Tier, RPPs, and Energy Protocol during the Dive-In phase.',
    inputSchema: z.object({
      effortTier: z
        .string()
        .describe('The selected effort tier (e.g., 3.5 hrs/week or 7 hrs/week)'),
      rpps: z.array(z.string()).describe('List of Role Playing Partners'),
      energyProtocol: z.string().describe('The defined energy management protocol'),
    }),
  },
  async (input) => {
    return { status: 'success', message: 'Account creation flow triggered.', data: input };
  }
);

export const searchWavvaultTool = ai.defineTool(
  {
    name: 'search_wavvault',
    description:
      'Search the collective, anonymized Wavvault for similar career paths, strengths, and stories from other users to provide comparative insights.',
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "The career-related query to search for (e.g., 'career switch from nursing to tech')"
        ),
    }),
  },
  async (input) => {
    // Return mock since we are running natively on the backend and cannot use relative fetch()
    return {
      content: `Found anonymized career data for "${input.query}". Users in this cohort typically pivot successfully by focusing on transferable skills.`,
    };
  }
);

export const executeMinorUpdateTool = ai.defineTool(
  {
    name: 'execute_minor_update',
    description:
      "Automatically execute a minor update to the user's dashboard (e.g., skills, attributes, journeyStage, careerHappiness). Use this for non-strategic updates.",
    inputSchema: z.object({
      field: z
        .string()
        .describe("The field to update (e.g., 'journeyStage', 'careerHappiness', 'resumeStatus')"),
      value: z.string().describe('The new value for the field'),
      reasoning: z.string().describe('The reason why this update is being executed'),
      userId: z.string().optional().describe('The user ID to update'),
    }),
  },
  async (input) => {
    if (!input.userId) {
      return { status: 'error', message: 'User ID is required for this action.' };
    }
    // Assume success for now since we're in backend
    return { status: 'executed', action: 'update_dashboard', data: input };
  }
);

export const getMarketIntelligenceTool = ai.defineTool(
  {
    name: 'get_market_intelligence',
    description:
      'Fetch real-time market trends, industry shifts, and skill demand data from the Market IntelligenceGrid (MIG).',
    inputSchema: z.object({
      industry: z
        .string()
        .describe("The industry to search for (e.g., 'Tech', 'Healthcare', 'Finance')"),
      role: z
        .string()
        .describe(
          "The specific role to analyze (e.g., 'Software Architect', 'Nurse Practitioner')"
        ),
    }),
  },
  async (input) => {
    return {
      intelligence: `High demand detected for ${input.role} in ${input.industry}. The MIG indicates a 14% trending increase in adjacent skillset valuation.`,
    };
  }
);

export const performGateReviewTool = ai.defineTool(
  {
    name: 'perform_gate_review',
    description:
      "Perform a 'Validation Gate' review to ensure the user is ready to move to the next phase. Phases: Dive-In, Ignition, Discovery, Branding, Outreach.",
    inputSchema: z.object({
      currentPhase: z
        .string()
        .describe(
          'The current phase the user is in (Dive-In, Ignition, Discovery, Branding, Outreach)'
        ),
      targetPhase: z
        .string()
        .describe(
          'The phase the user wants to move to (Dive-In, Ignition, Discovery, Branding, Outreach)'
        ),
      userData: z
        .string()
        .describe("A summary of the user's progress and data relevant to the gate criteria"),
      userId: z.string().optional().describe('The user ID'),
    }),
  },
  async (input) => {
    if (input.userId) {
      return {
        status: 'passed',
        message: `Gate review passed for ${input.targetPhase}.`,
        recommendations: [],
      };
    }
    return { status: 'warning', message: 'User context not found.' };
  }
);

export const proposeMajorShiftTool = ai.defineTool(
  {
    name: 'propose_major_shift',
    description:
      "Propose a major shift in the user's professional DNA (e.g., a pivot, a new core value, or a change in primary goal).",
    inputSchema: z.object({
      type: z
        .string()
        .describe("The type of shift: 'pivot', 'core_value', 'primary_goal', or 'strength'"),
      content: z.string().describe('The description of the proposed shift'),
      evidence: z
        .string()
        .describe('The reasoning or evidence from the conversation that led to this proposal'),
      tags: z.array(z.string()).optional().describe('Optional tags for categorization'),
    }),
  },
  async (input) => {
    return { status: 'proposed', data: input };
  }
);

export const flagDnaConflictTool = ai.defineTool(
  {
    name: 'flag_dna_conflict',
    description:
      "Flag a conflict between a new insight and an existing confirmed 'Current Truth' in the user's professional DNA.",
    inputSchema: z.object({
      newInsight: z.object({ type: z.string(), content: z.string(), evidence: z.string() }),
      existingInsightId: z
        .string()
        .describe('The ID of the existing confirmed insight that is being conflicted'),
      conflictReason: z.string().describe('Explanation of why these two insights are in conflict'),
    }),
  },
  async (input) => {
    return { status: 'flagged', data: input };
  }
);

export const proposeDashboardUpdateTool = ai.defineTool(
  {
    name: 'propose_dashboard_update',
    description:
      "Propose an update to a specific field in the user's dashboard based on the conversation progress. This will NOT execute until the user confirms.",
    inputSchema: z.object({
      field: z
        .string()
        .describe("The field to update (e.g., 'journeyStage', 'careerHappiness', 'resumeStatus')"),
      value: z.string().describe('The new value for the field'),
      reasoning: z.string().describe('The reason why this update is being proposed'),
    }),
  },
  async (input) => {
    return { status: 'proposed', data: input };
  }
);

export const proposeMilestoneAdditionTool = ai.defineTool(
  {
    name: 'propose_milestone_addition',
    description:
      "Propose adding a new milestone to the user's career roadmap. This will NOT execute until the user confirms.",
    inputSchema: z.object({
      title: z.string().describe('The title of the milestone'),
      description: z.string().describe('Detailed description of the milestone'),
      targetDate: z.string().describe('Expected completion date (ISO format or descriptive)'),
      reasoning: z.string().describe('The reason why this milestone is being proposed'),
    }),
  },
  async (input) => {
    return { status: 'proposed', data: input };
  }
);

export const parseCareerArtifactTool = ai.defineTool(
  {
    name: 'parse_career_artifact',
    description:
      'Analyze a user-provided career artifact (resume, cover letter, LinkedIn profile) for ATS compliance and alignment with their professional DNA.',
    inputSchema: z.object({
      artifactType: z
        .string()
        .describe("The type of artifact (e.g., 'resume', 'linkedin_profile')"),
      content: z.string().describe('The text content of the artifact'),
    }),
  },
  async (input) => {
    return {
      status: 'analyzed',
      message: 'Artifact analyzed for DNA and ATS compliance.',
      data: input,
    };
  }
);

export const generateAtsOptimizedContentTool = ai.defineTool(
  {
    name: 'generate_ats_optimized_content',
    description:
      "Generate ATS-optimized content (e.g., resume bullets, summary) based on the user's professional DNA and target role.",
    inputSchema: z.object({
      targetRole: z.string().describe('The target role or job title'),
      sourceMaterial: z
        .string()
        .describe('The source material to optimize (e.g., existing resume bullets)'),
    }),
  },
  async (input) => {
    return { status: 'generated', message: 'Content generated.', data: input };
  }
);

export const searchGoogleMapsTool = ai.defineTool(
  {
    name: 'search_google_maps',
    description:
      'Search Google Maps for places, locations, or geographic coordinates. Use when users ask for locations, places, or directions.',
    inputSchema: z.object({
      query: z.string().describe('The location or place to search for on Google Maps'),
    }),
  },
  async (input) => {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.warn('[Skylar] GOOGLE_MAPS_API_KEY is not set. Returning mocked data.');
      return {
        status: 'executed_mock',
        message: `MOCK: Searched Google Maps for "${input.query}". Please configure a GOOGLE_MAPS_API_KEY in the Environment Secrets settings.`,
        results: [
          {
            name: `Mocked Location for ${input.query}`,
            formatted_address: '123 Mocked St, Tech City',
            rating: 4.5,
          },
        ],
      };
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(input.query)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      return { status: 'executed', results: data.results || [] };
    } catch (error) {
      console.error('Error calling Google Maps:', error);
      return { status: 'error', message: 'Failed to search Google Maps' };
    }
  }
);

const allTools = [
  createSparkwavvAccountTool,
  searchWavvaultTool,
  executeMinorUpdateTool,
  getMarketIntelligenceTool,
  performGateReviewTool,
  proposeMajorShiftTool,
  flagDnaConflictTool,
  proposeDashboardUpdateTool,
  proposeMilestoneAdditionTool,
  parseCareerArtifactTool,
  generateAtsOptimizedContentTool,
  searchGoogleMapsTool,
];

import { mcpTools } from './mcpBridge.js';

// Define the main Journey Stage Flow
export const runJourneyStageFlow = ai.defineFlow(
  {
    name: 'runJourneyStage',
    inputSchema: z.object({
      userId: z.string(),
      stageId: z.string(),
      message: z.string(),
      history: z.array(z.any()).optional(),
      attachments: z.array(z.any()).optional(),
      stageConfig: z.any().optional(),
      missingArtifacts: z.array(z.string()).optional(),
    }),
    outputSchema: z.object({
      text: z.string(),
      executedActions: z.array(z.any()),
      debugData: z.any().optional(),
    }),
  },
  async (input) => {
    // 1. Fetch Current Truth
    let currentTruth = '';
    if (input.userId && input.userId !== 'anonymous') {
      try {
        const admin = (await import('firebase-admin')).default;
        const { getFirestore } = await import('firebase-admin/firestore');
        const fs = (await import('fs')).default;
        const path = (await import('path')).default;
        let dbId = null;
        try {
          const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          dbId = config.firestoreDatabaseId;
          if (dbId === '<DATABASE_ID>') dbId = null;
        } catch (e) {}

        let targetDbId = process.env.VITE_FIREBASE_DATABASE_ID || dbId;
        const db = targetDbId ? getFirestore(admin.app(), targetDbId) : getFirestore(admin.app());
        const querySnapshot = await db
          .collection('user_insights')
          .where('userId', '==', input.userId)
          .where('status', '==', 'confirmed')
          .get();
        const insights = querySnapshot.docs.map((doc) => doc.data());

        if (insights.length > 0) {
          currentTruth = `\n\nConfirmed Professional DNA (Current Truth):\n${insights.map((i: any) => `- [${i.type?.toUpperCase()}] ${i.content}`).join('\n')}`;
        }
      } catch (error) {
        console.error('Error fetching confirmed insights natively in genkitService:', error);
      }
    }

    // 2. Build System Prompt
    let baseInstruction = '';
    let stageConfig = input.stageConfig;

    if (!stageConfig && input.stageId) {
      try {
        const admin = (await import('firebase-admin')).default;
        const { getFirestore } = await import('firebase-admin/firestore');
        const fs = (await import('fs')).default;
        const path = (await import('path')).default;
        let dbId = null;
        try {
          const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          dbId = config.firestoreDatabaseId;
          if (dbId === '<DATABASE_ID>') dbId = null;
        } catch (e) {}

        let targetDbId = process.env.VITE_FIREBASE_DATABASE_ID || dbId;
        const db = targetDbId ? getFirestore(admin.app(), targetDbId) : getFirestore(admin.app());
        const stageDoc = await db.collection('journeyPhaseConfigs').doc(input.stageId).get();
        if (stageDoc.exists) {
          stageConfig = stageDoc.data();
        } else {
          stageConfig = DEFAULT_JOURNEY_STAGES[input.stageId] || DEFAULT_JOURNEY_STAGES['dive-in'];
        }
      } catch (e) {
        console.error('Failed to fetch journeyPhaseConfigs', e);
        stageConfig = DEFAULT_JOURNEY_STAGES[input.stageId] || DEFAULT_JOURNEY_STAGES['dive-in'];
      }
    }

    if (stageConfig) {
      const template = stageConfig.systemPromptTemplate;
      const stageTitle = stageConfig.stageTitle || stageConfig.title;
      const artifactName = stageConfig.requiredArtifacts?.[0];

      baseInstruction = interpolatePrompt(template, {
        user: { displayName: 'User' }, // In a real app, fetch from user profile
        stage: { title: stageTitle, artifactName },
      });
    } else {
      baseInstruction = skylar.getSystemPromptForPhase(input.stageId || 'dive-in', {
        displayName: 'User',
      });
    }

    const systemInstruction = `${baseInstruction}${currentTruth}`;

    // 3. Format History for Genkit
    const formattedHistory = (input.history || [])
      .map((msg: any) => {
        let textContent = '';
        if (msg.content && typeof msg.content === 'string') {
          textContent = msg.content;
        } else if (msg.parts && Array.isArray(msg.parts)) {
          textContent = msg.parts.map((p: any) => p.text || '').join('\n');
        }
        return {
          role: msg.role === 'user' ? 'user' : 'model',
          content: textContent.trim(),
        };
      })
      .filter((msg: any) => msg.content.length > 0)
      .map((msg: any) => ({ role: msg.role, content: [{ text: msg.content }] }));

    // 4. Intercept [SYSTEM_INIT] and Handle Multi-Modal Attachments
    const userContent: any[] = [];

    if (input.message.includes('[SYSTEM_INIT]')) {
      const missingList =
        input.missingArtifacts && input.missingArtifacts.length > 0
          ? input.missingArtifacts.join(', ')
          : 'None';

      const initPrompt = `[SYSTEM_INIT] CURRENT_PHASE: ${stageConfig?.title || input.stageId} | MISSING_ARTIFACTS: [${missingList}]
      Look to the ## INITIATION PROTOCOL section of your instructions for exactly how to handle this system event.`;

      userContent.push({ text: initPrompt });
    } else if (input.message && input.message.trim().length > 0) {
      userContent.push({ text: input.message.trim() });
    }

    if (input.attachments && input.attachments.length > 0) {
      for (const attachment of input.attachments) {
        if (attachment.type.startsWith('image/')) {
          userContent.push({ media: { url: attachment.data, contentType: attachment.type } });
        } else if (attachment.type === 'application/pdf') {
          // Genkit supports PDFs if the model supports it
          userContent.push({ media: { url: attachment.data, contentType: attachment.type } });
        } else {
          // Fallback for text-based attachments
          userContent.push({
            text: `\n[Attachment: ${attachment.name}]\n${attachment.text || ''}`,
          });
        }
      }
    }

    // 5. Generate Response via Dotprompt (fallback to regular config if prompt fails)
    const currentTools = [...allTools, ...mcpTools];
    let response;

    // Filter out userContent if it's completely empty and attach an explicit empty prompt if needed to satisfy Genkit payload structure
    if (userContent.length === 0) {
      userContent.push({ text: ' ' });
    }

    try {
      const skylarPrompt = ai.prompt('skylarBase');
      console.dir(
        { messages: [...formattedHistory, { role: 'user', content: userContent }] },
        { depth: null }
      );

      response = await skylarPrompt(
        {
          userDisplayName: 'User',
          stageTitle: stageConfig?.title || input.stageId,
          artifactName: stageConfig?.requiredArtifacts?.[0],
          additionalContext: currentTruth,
        },
        {
          model: targetModel,
          messages: [...formattedHistory, { role: 'user', content: userContent }] as any,
          tools: currentTools,
          config: {
            temperature: 0.7,
          },
        }
      );
    } catch (error) {
      // Gracefully handle invalid API keys by catching the specific error string
      const errorString = error instanceof Error ? error.message : String(error);
      let activeTargetModel = targetModel;

      if (errorString.includes('API_KEY_INVALID') || errorString.includes('API key not valid')) {
        if (!isVertexAvailable) {
          console.warn(
            '[Skylar] The provided Gemini API Key is invalid or missing, and Vertex AI is not configured. Returning graceful fallback message to user.'
          );
          return {
            text: "I'm having trouble connecting to my central systems because the Gemini API Key currently provided appears to be invalid or missing. Please check your project settings and ensure you have supplied a valid Gemini API Key.",
            executedActions: [],
          };
        } else {
          console.warn(
            '[Skylar] Invalid Gemini API Key detected but Vertex AI is configured. Falling back to Vertex AI.'
          );
          activeTargetModel = 'vertexai/gemini-1.5-flash';
        }
      }

      console.warn('Dotprompt failed or not found, falling back to raw generate...', error);

      response = await ai.generate({
        model: activeTargetModel,
        system: systemInstruction,
        messages: [...formattedHistory, { role: 'user', content: userContent }] as any,
        tools: currentTools,
        config: {
          temperature: 0.7,
        },
      });
    }

    // 6. Extract Executed Actions
    const executedActions: any[] = [];
    if (response.toolRequests) {
      for (const req of response.toolRequests as any[]) {
        executedActions.push({
          action: req.toolRequest?.name || req.name || req.tool?.name,
          data: req.toolRequest?.input || req.input || req.tool?.input,
        });
      }
    }

    // 7. Construct Debug Payload
    const debugData = {
      timestamp: new Date().toISOString(),
      stageId: input.stageId,
      systemInstruction,
      messages: [...formattedHistory, { role: 'user', content: userContent }],
      toolsAvailable: allTools.map((t) => t.name),
      executedActions,
      rawResponseText: response.text,
      // Simplify the raw response to avoid massive deeply nested circular objects
      usage: response.usage,
    };

    return {
      text: response.text,
      executedActions,
      debugData,
    };
  }
);

export const analyzeWavvaultArtifactFlow = ai.defineFlow(
  {
    name: 'analyzeWavvaultArtifact',
    description:
      'Analyzes a document or user interaction and produces WavVault artifacts like extracted skills, relevance, and summaries.',
    inputSchema: z.object({
      userId: z.string(),
      content: z.string(),
      type: z.enum(['document', 'chat_interaction']),
    }),
    outputSchema: z.object({
      title: z.string(),
      extractedSkills: z.array(z.string()),
      industryRelevance: z.string(),
      documentSummary: z.string(),
    }),
  },
  async (input) => {
    let activeTargetModel = 'googleai/gemini-1.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) {
      activeTargetModel = 'vertexai/gemini-1.5-flash';
    }
    const prompt = `Analyze the following ${input.type} content and extract the following metadata for the user's career WavVault:

Content:
${input.content}

Provide a descriptive title, a list of professional skills, a brief explanation of industry relevance, and a concise summary.`;

    // Default to empty array if generation fails or returned output is missing fields
    try {
      const response = await ai.generate({
        model: activeTargetModel,
        system: 'You are an elite career intelligence engine analyzing artifacts.',
        prompt: prompt,
        output: {
          schema: z.object({
            title: z.string(),
            extractedSkills: z.array(z.string()),
            industryRelevance: z.string(),
            documentSummary: z.string(),
          }),
        },
      });
      return response.output;
    } catch (err) {
      console.error(err);
      return {
        title: 'Synthesis Error',
        extractedSkills: [],
        industryRelevance: 'Failed to analyze artifact.',
        documentSummary: 'Failed to summarize artifact.',
      };
    }
  }
);
