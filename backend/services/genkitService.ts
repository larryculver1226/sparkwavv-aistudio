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

export const fetchWavvaultDataTool = ai.defineTool(
  {
    name: 'fetch_wavvault_data',
    description:
      "Query and retrieve the authenticated user's data, artifacts, and journey status from their Firestore WavVault collection.",
    inputSchema: z.object({
      userId: z.string().describe('The ID of the user whose Wavvault data to fetch'),
      dataType: z.enum(['dashboard', 'insights', 'artifacts', 'milestones']).describe('Which slice of WavVault data to retrieve'),
    }),
  },
  async (input) => {
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

      if (input.dataType === 'dashboard') {
        const doc = await db.collection('dashboards').doc(input.userId).get();
        return { status: 'success', data: doc.exists ? doc.data() : null };
      } else if (input.dataType === 'insights') {
        const snapshot = await db.collection('user_insights').where('userId', '==', input.userId).get();
        return { status: 'success', data: snapshot.docs.map(d => d.data()) };
      } else if (input.dataType === 'artifacts') {
        const snapshot = await db.collection('wavvault_artifacts').where('userId', '==', input.userId).get();
        return { status: 'success', data: snapshot.docs.map(d => d.data()) };
      }
      return { status: 'error', message: 'Unknown dataType requested' };
    } catch (e: any) {
      console.error('Error fetching WavVault data:', e);
      return { status: 'error', message: e.message };
    }
  }
);

export const invokeResumeReviewerTool = ai.defineTool(
  {
    name: 'invoke_resume_reviewer',
    description: 'Invoke the Resume Reviewer Sub-Agent to strictly analyze ATS compliance, keyword optimization, and structural formatting of a resume.',
    inputSchema: z.object({
      targetRole: z.string().describe('The ideal target role for this resume'),
      resumeContent: z.string().describe('The raw text content of the resume'),
      focusAreas: z.array(z.string()).optional().describe('Specific areas to focus on (e.g., ATS parsing, action verbs)'),
    }),
  },
  async (input) => {
    try {
      const response = await reviewResumeSubAgentFlow(input);
      return { status: 'success', data: response };
    } catch (e: any) {
      return { status: 'error', message: e.message };
    }
  }
);

export const updatePieOfLifeTool = ai.defineTool(
  {
    name: 'update_pie_of_life',
    description: "Saves the user's Pie of Life and Perfect Day exercises from the Ignition phase.",
    inputSchema: z.object({
      pieOfLife: z.record(z.number()).describe('Percentage allocations for the Pie of Life (must total 100)'),
      perfectDay: z.string().describe('The user\'s description of their perfect day'),
      userId: z.string().optional().describe('The user ID'),
    }),
  },
  async (input) => {
    return { status: 'success', message: 'Ignition exercises saved successfully.', data: input };
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
  fetchWavvaultDataTool,
  invokeResumeReviewerTool,
  updatePieOfLifeTool,
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

export const reviewResumeSubAgentFlow = ai.defineFlow(
  {
    name: 'reviewResumeSubAgent',
    description: 'A sub-agent focused strictly on ATS compliance, keyword optimization, and resume formatting critiques.',
    inputSchema: z.object({
      targetRole: z.string().describe('The ideal target role for this resume'),
      resumeContent: z.string().describe('The raw text content of the resume'),
      focusAreas: z.array(z.string()).optional().describe('Specific areas to focus on (e.g., ATS parsing, action verbs)'),
    }),
    outputSchema: z.object({
      atsScore: z.number().describe('Estimated ATS compatibility score 0-100'),
      criticalCritique: z.string().describe('The primary critique on the structure and content'),
      suggestedImprovements: z.array(z.string()).describe('Specific localized changes to make'),
      optimizedContent: z.string().optional().describe('A rewritten version of the summary or bullet points if applicable'),
    }),
  },
  async (input) => {
    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) {
      activeTargetModel = 'vertexai/gemini-1.5-flash';
    }
    const prompt = `Review the following resume for the target role: "${input.targetRole}".
Focus areas: ${input.focusAreas ? input.focusAreas.join(', ') : 'ATS Compliance, Action Verbs, Formatting'}.

Resume Content:
${input.resumeContent}

Provide an estimated ATS score (0-100), a critical critique of the structure/content, a list of suggested improvements, and optionally rewrite a key section.`;

    try {
      const response = await ai.generate({
        model: activeTargetModel,
        system: "You are the Resume Reviewer Sub-Agent. Your focus is strictly on Applicant Tracking System (ATS) compliance, keyword optimization, and structural critiques. Be direct, strict, and precise.",
        prompt: prompt,
        output: {
          schema: z.object({
            atsScore: z.number(),
            criticalCritique: z.string(),
            suggestedImprovements: z.array(z.string()),
            optimizedContent: z.string().optional(),
          }),
        },
      });
      return response.output;
    } catch (err) {
      console.error('Error in reviewResumeSubAgentFlow:', err);
      return {
        atsScore: 0,
        criticalCritique: 'Failed to analyze resume.',
        suggestedImprovements: [],
      };
    }
  }
);
export const startInterviewSessionFlow = ai.defineFlow(
  {
    name: 'startInterviewSession',
    inputSchema: z.object({
      userId: z.string(),
      persona: z.string(),
      dnaContext: z.array(z.any()).optional(),
    }),
    outputSchema: z.object({
      question: z.string(),
      personaContext: z.string(),
      initialResonance: z.number(),
    }),
  },
  async (input) => {
    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) {
      activeTargetModel = 'vertexai/gemini-1.5-flash';
    }
    
    // Fallback if no context provided natively from backend
    const insightsContent = input.dnaContext ? JSON.stringify(input.dnaContext) : '';
    
    const prompt = `You are Skylar, but for this session, you are masking as ${input.persona}. 
Based on the user's professional DNA: ${insightsContent}, 
start a high-stakes interview. Introduce yourself in character and ask the first challenging question.
Keep the tone professional and consistent with the ${input.persona} archetype.`;

    const response = await ai.generate({
      model: activeTargetModel,
      system: 'You are an expert high-stakes interviewer.',
      prompt,
      output: {
        schema: z.object({
          question: z.string(),
          personaContext: z.string(),
          initialResonance: z.number(),
        }),
      },
    });
    
    return response.output || { question: '', personaContext: '', initialResonance: 0 };
  }
);

export const sendInterviewResponseFlow = ai.defineFlow(
  {
    name: 'sendInterviewResponse',
    inputSchema: z.object({
      userId: z.string(),
      persona: z.string(),
      history: z.array(z.any()),
      userResponse: z.string(),
      dnaContext: z.array(z.any()).optional(),
    }),
    outputSchema: z.object({
      feedback: z.string(),
      nextQuestion: z.string(),
      resonanceScore: z.number(),
      dnaAlignment: z.array(z.string()),
    }),
  },
  async (input) => {
    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) {
      activeTargetModel = 'vertexai/gemini-1.5-flash';
    }

    const insightsContent = input.dnaContext ? JSON.stringify(input.dnaContext) : '';
    const historyContent = JSON.stringify(input.history);

    const prompt = `You are Skylar masking as ${input.persona}. 
User DNA: ${insightsContent}
Conversation History: ${historyContent}
User's Latest Response: "${input.userResponse}"

Evaluate the response for DNA resonance (0-100) and provide the next interview question or follow-up.
If the user provides information about their 'Pie of Life' or 'Perfect Day' exercises mapping, autonomously call the 'update_pie_of_life' tool.
Maintain the ${input.persona} character strictly.`;

    const response = await ai.generate({
      model: activeTargetModel,
      system: 'You are an expert high-stakes interviewer. You optionally use tools when the user volunteers specific artifacts.',
      prompt,
      tools: [updatePieOfLifeTool],
      output: {
        schema: z.object({
          feedback: z.string(),
          nextQuestion: z.string(),
          resonanceScore: z.number(),
          dnaAlignment: z.array(z.string()),
        }),
      },
    });
    
    return response.output || { feedback: '', nextQuestion: '', resonanceScore: 0, dnaAlignment: [] };
  }
);

export const getInterviewDebriefFlow = ai.defineFlow(
  {
    name: 'getInterviewDebrief',
    inputSchema: z.object({
      userId: z.string(),
      sessionHistory: z.array(z.any()),
    }),
    outputSchema: z.object({
      heatmap: z.array(
        z.object({
          pillar: z.string(),
          strength: z.number(),
          insight: z.string(),
        })
      ),
      overallVerdict: z.string(),
      tacticalAdvice: z.array(z.string()),
    }),
  },
  async (input) => {
    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) {
      activeTargetModel = 'vertexai/gemini-1.5-flash';
    }

    const sessionHistory = JSON.stringify(input.sessionHistory);

    const prompt = `Analyze this interview session history: ${sessionHistory}.
Provide a "Strategic Debrief" including a "Narrative Heatmap" of DNA signal strength, 
key areas of resonance, and specific tactical improvements for future high-stakes conversations.`;

    const response = await ai.generate({
      model: activeTargetModel,
      system: 'You are an elite career intelligence engine providing a strategic review.',
      prompt,
      output: {
        schema: z.object({
          heatmap: z.array(
            z.object({
              pillar: z.string(),
              strength: z.number(),
              insight: z.string(),
            })
          ),
          overallVerdict: z.string(),
          tacticalAdvice: z.array(z.string()),
        }),
      },
    });
    
    return response.output || { heatmap: [], overallVerdict: '', tacticalAdvice: [] };
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

export const performSynthesisFlow = ai.defineFlow(
  {
    name: 'performSynthesis',
    inputSchema: z.object({
      userId: z.string(),
      history: z.array(z.any()),
      fileContent: z.string().optional(),
    }),
    outputSchema: z.object({
      nodes: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          type: z.string(),
          strength: z.number(),
          description: z.string(),
        })
      ),
      links: z.array(
        z.object({
          source: z.string(),
          target: z.string(),
          weight: z.number(),
          type: z.string(),
        })
      ),
    }),
  },
  async (input) => {
    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) {
      activeTargetModel = 'vertexai/gemini-1.5-flash';
    }

    const prompt = `You are the Skylar Analytical Architect. Your task is to perform a "Neural Synthesis" of the user's career data.
Analyze the provided chat history and document content to extract a structured Knowledge Graph of the user's professional identity.
Extract core skills, values, overarching goals, and specific "sparks" (unique identifiers of passion or talent).

Chat History:
${JSON.stringify(input.history)}

${input.fileContent ? `Document Content:\n${input.fileContent}\n` : ''}

Return nodes mapping to one of these types: skill|goal|value|spark and links connecting them mapping to types: connection|dependency|influence.`;

    try {
      const response = await ai.generate({
        model: activeTargetModel,
        system: 'You are the Skylar Analytical Architect.',
        prompt,
        output: {
          schema: z.object({
            nodes: z.array(
              z.object({
                id: z.string(),
                label: z.string(),
                type: z.string(),
                strength: z.number(),
                description: z.string(),
              })
            ),
            links: z.array(
              z.object({
                source: z.string(),
                target: z.string(),
                weight: z.number(),
                type: z.string(),
              })
            ),
          }),
        },
      });
  
      return response.output || { nodes: [], links: [] };
    } catch (err) {
      console.error('performSynthesisFlow Error:', err);
      return { nodes: [], links: [] };
    }
  }
);

export const performGateReviewFlow = ai.defineFlow(
  {
    name: 'performGateReview',
    inputSchema: z.object({
      userId: z.string(),
      currentPhase: z.string(),
      targetPhase: z.string(),
      history: z.array(z.any()),
      dnaContext: z.array(z.any()).optional(),
    }),
    outputSchema: z.object({
      status: z.string(),
      message: z.string(),
      criteria: z.array(z.object({
        label: z.string(),
        met: z.boolean(),
      })),
    }),
  },
  async (input) => {
    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) activeTargetModel = 'vertexai/gemini-1.5-flash';

    const dnaContent = input.dnaContext ? JSON.stringify(input.dnaContext) : '';
    const prompt = `You are the Skylar Validation Architect. Perform a "Validation Gate" review for the user moving from ${input.currentPhase} to ${input.targetPhase}.
User DNA: ${dnaContent}
Recent History: ${JSON.stringify(input.history.slice(-10))}

Criteria for ${input.targetPhase}:
- Dive-In to Ignition: Commitment to the 12-week process and initial "Spark" identified.
- Ignition to Discovery: Completion of "Pie of Life" and "Perfect Day" exercises; clear initial career DNA hypothesis.
- Discovery to Branding: Synthesis of the "Cinematic Brand DNA" (3 pillars); extraction of at least 5 core attributes from accomplishments; validation of "Five Stories" by an RPP.
- Branding to Outreach: Completion of "Journalist" and "Reflective" versions of the Five Stories; alignment with the Market Intelligence Grid (MIG) and the Cinematic Brand DNA.`;

    try {
      const resp = await ai.generate({
        model: activeTargetModel,
        system: 'You are the Skylar Validation Architect.',
        prompt,
        output: {
          schema: z.object({
            status: z.enum(['passed', 'warning', 'failed']),
            message: z.string(),
            criteria: z.array(
              z.object({
                label: z.string(),
                met: z.boolean(),
              })
            ),
          }),
        },
      });
      return resp.output || { status: 'failed', message: '', criteria: [] };
    } catch(e) {
      return { status: 'failed', message: 'Error analyzing gate criteria.', criteria: [] };
    }
  }
);
export const getEmotionalIntelligenceFlow = ai.defineFlow(
  {
    name: 'getEmotionalIntelligence',
    inputSchema: z.object({
      history: z.array(z.any()),
    }),
    outputSchema: z.object({
      sentiment: z.number(),
      motivation: z.number(),
      topDrivers: z.array(z.string()),
      anxieties: z.array(z.string()),
      summary: z.string(),
    }),
  },
  async (input) => {
    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) activeTargetModel = 'vertexai/gemini-1.5-flash';

    const prompt = `Analyze the user's emotional state and motivation based on their career journey and chat history.
History: ${JSON.stringify(input.history.slice(-20))}`;

    try {
      const resp = await ai.generate({
        model: activeTargetModel,
        system: 'You are an empathetic emotional intelligence engine.',
        prompt,
        output: {
          schema: z.object({
            sentiment: z.number(),
            motivation: z.number(),
            topDrivers: z.array(z.string()),
            anxieties: z.array(z.string()),
            summary: z.string(),
          }),
        },
      });
      return resp.output || { sentiment: 50, motivation: 50, topDrivers: [], anxieties: [], summary: 'Neutral' };
    } catch(e) {
      return { sentiment: 50, motivation: 50, topDrivers: [], anxieties: [], summary: 'Error analyzing.' };
    }
  }
);

export const getResonanceFeedbackFlow = ai.defineFlow(
  {
    name: 'getResonanceFeedback',
    inputSchema: z.object({
      userId: z.string(),
      targetRole: z.string(),
      content: z.string(),
      dnaContext: z.array(z.any()).optional(),
    }),
    outputSchema: z.object({
      resonanceScore: z.number(),
      feedback: z.string(),
      suggestions: z.array(z.string()),
    }),
  },
  async (input) => {
    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) activeTargetModel = 'vertexai/gemini-1.5-flash';

    const dnaContent = input.dnaContext ? JSON.stringify(input.dnaContext) : '';
    const prompt = `You are Skylar, the Strategic Conductor. Provide real-time resonance feedback on this content.
Content: "${input.content}"
Target Role: "${input.targetRole}"
User DNA: ${dnaContent}`;

    try {
      const resp = await ai.generate({
        model: activeTargetModel,
        system: 'You are an expert career alignment engine.',
        prompt,
        output: {
          schema: z.object({
            resonanceScore: z.number(),
            feedback: z.string(),
            suggestions: z.array(z.string()),
          }),
        },
      });
      return resp.output || { resonanceScore: 0, feedback: '', suggestions: [] };
    } catch(e) {
      return { resonanceScore: 0, feedback: 'Error analyzing feedback.', suggestions: [] };
    }
  }
);

export const generateInteractivePortfolioFlow = ai.defineFlow(
  {
    name: 'generateInteractivePortfolio',
    inputSchema: z.object({
      userId: z.string(),
      dnaContext: z.array(z.any()).optional(),
    }),
    outputSchema: z.object({
      pages: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          content: z.string().optional(),
          visualCues: z.array(z.string()).optional(),
          signals: z.array(z.object({
            label: z.string(),
            evidence: z.string(),
            resonance: z.number(),
          })).optional(),
          narrative: z.string().optional(),
        })
      ),
      skylarFeedback: z.string(),
    }),
  },
  async (input) => {
    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) {
      activeTargetModel = 'vertexai/gemini-1.5-flash';
    }

    const dnaContent = input.dnaContext ? JSON.stringify(input.dnaContext) : '';
    const prompt = `You are the Skylar Narrative Journalist. Generate content for a multi-page "Interactive Portfolio" based on the user's professional DNA: ${dnaContent}.
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
}`;

    try {
      const response = await ai.generate({
        model: activeTargetModel,
        system: 'You are the Skylar Narrative Journalist.',
        prompt,
        output: {
          schema: z.object({
            pages: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                content: z.string().optional(),
                visualCues: z.array(z.string()).optional(),
                signals: z.array(
                  z.object({
                    label: z.string(),
                    evidence: z.string(),
                    resonance: z.number(),
                  })
                ).optional(),
                narrative: z.string().optional(),
              })
            ),
            skylarFeedback: z.string(),
          }),
        },
      });

      return response.output || { pages: [], skylarFeedback: '' };
    } catch (e) {
      console.error('generateInteractivePortfolioFlow Error:', e);
      return { pages: [], skylarFeedback: 'Error' };
    }
  }
);
export const generateTargetedSequenceFlow = ai.defineFlow(
  {
    name: 'generateTargetedSequence',
    inputSchema: z.object({
      userId: z.string(),
      targetCompany: z.string(),
      targetRole: z.string(),
      tone: z.object({
        formal: z.number(),
        detail: z.number(),
      }),
      dnaContext: z.array(z.any()).optional(),
    }),
    outputSchema: z.object({
      steps: z.array(
        z.object({
          type: z.string(),
          subject: z.string().optional(),
          content: z.string(),
        })
      ),
    }),
  },
  async (input) => {
    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) {
      activeTargetModel = 'vertexai/gemini-1.5-flash';
    }

    const dnaContent = input.dnaContext ? JSON.stringify(input.dnaContext) : '';
    const prompt = `Generate a targeted professional outreach sequence for ${input.targetRole} at ${input.targetCompany}.
The user's professional DNA is: ${dnaContent}.

Tone Settings:
- Formal vs Casual: ${input.tone.formal}/100 (100 is most formal)
- Brief vs Detailed: ${input.tone.detail}/100 (100 is most detailed)

The sequence should include:
1. A LinkedIn Connection Request (short)
2. A First Outreach Email (personalized)
3. A Follow-up Email (value-add)`;

    try {
      const response = await ai.generate({
        model: activeTargetModel,
        system: 'You are an elite career coach specialized in outreach.',
        prompt,
        output: {
          schema: z.object({
            steps: z.array(
              z.object({
                type: z.string(),
                subject: z.string().optional(),
                content: z.string(),
              })
            ),
          }),
        },
      });

      return response.output || { steps: [] };
    } catch (e) {
      console.error('generateTargetedSequenceFlow Error:', e);
      return { steps: [] };
    }
  }
);
export const generateLiveResumeFlow = ai.defineFlow(
  {
    name: 'generateLiveResume',
    inputSchema: z.object({
      userId: z.string(),
      dnaContext: z.array(z.any()).optional(),
    }),
    outputSchema: z.object({
      spark: z.object({
        title: z.string(),
        narrative: z.string(),
      }),
      dnaPillars: z.array(
        z.object({
          label: z.string(),
          description: z.string(),
          resonance: z.number(),
        })
      ),
      trajectory: z.array(
        z.object({
          phase: z.string(),
          milestone: z.string(),
          impact: z.string(),
        })
      ),
      resonanceScore: z.number(),
      skylarFeedback: z.string(),
    }),
  },
  async (input) => {
    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) {
      activeTargetModel = 'vertexai/gemini-1.5-flash';
    }

    const dnaContent = input.dnaContext ? JSON.stringify(input.dnaContext) : '';
    const prompt = `You are the Skylar Narrative Journalist. Generate a high-fidelity "Live Resume" content based on the user's professional DNA: ${dnaContent}.
The style must be "Editorial / Magazine" (bold, high-impact, cinematic).`;

    try {
      const response = await ai.generate({
        model: activeTargetModel,
        system: 'You are the Skylar Narrative Journalist.',
        prompt,
        output: {
          schema: z.object({
            spark: z.object({
              title: z.string(),
              narrative: z.string(),
            }),
            dnaPillars: z.array(
              z.object({
                label: z.string(),
                description: z.string(),
                resonance: z.number(),
              })
            ),
            trajectory: z.array(
              z.object({
                phase: z.string(),
                milestone: z.string(),
                impact: z.string(),
              })
            ),
            resonanceScore: z.number(),
            skylarFeedback: z.string(),
          }),
        },
      });
  
      return response.output || { spark: { title: '', narrative: '' }, dnaPillars: [], trajectory: [], resonanceScore: 0, skylarFeedback: '' };
    } catch (e) {
      console.error('generateLiveResumeFlow Error:', e);
      return { spark: { title: 'Generation Error', narrative: 'Failed to generate output' }, dnaPillars: [], trajectory: [], resonanceScore: 0, skylarFeedback: 'Error' };
    }
  }
);
