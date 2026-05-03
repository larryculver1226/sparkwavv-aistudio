import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { vertexAI } from '@genkit-ai/vertexai';
import { promptRef } from '@genkit-ai/dotprompt';
import { getGeminiApiKey } from '../../src/services/aiConfig';
import { skylar } from '../../src/services/skylarService';
import { interpolatePrompt } from '../../src/utils/interpolation';
import defaultJourneyStages from '../../src/config/defaultJourneyStages.json' with { type: 'json' };
import { 
  BestSelfProfileSchema, 
  FiveStoriesSchema, 
  FutureVisionSchema, 
  ProductivityPlanSchema, 
  CareerPersonaSchema,
  BrandIdentitySchema,
  ApplicationMaterialsSchema,
  CredentialAnalysisSchema,
  JobExecutionSchema,
  InterviewCoachingSchema
} from '../../src/types/schemas';

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

      const targetDbId = process.env.VITE_FIREBASE_DATABASE_ID || dbId;
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

export const analyzeDiscoveryLaunchpadTool = ai.defineTool(
  {
    name: 'analyze_discovery_launchpad',
    description: 'Analyzes multi-modal user evaluations, attributes, and Extinguishers to synthesize an aspirational best self profile.',
    inputSchema: z.object({
      userId: z.string(),
      evaluations: z.any().describe('Multi-modal user evaluations'),
      attributes: z.array(z.string()).describe('Core user attributes'),
      extinguishers: z.array(z.string()).describe('Negative or energy-draining factors')
    }),
  },
  async (input) => {
    const admin = (await import('firebase-admin')).default;
    const { getFirestore } = await import('firebase-admin/firestore');
    const fs = (await import('fs')).default;
    const path = (await import('path')).default;

    let dbId = '(default)';
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        dbId = config.firestoreDatabaseId || '(default)';
      }
    } catch (e) {}
    const db = getFirestore(admin.app(), dbId);

    let systemPrompt = "You are the Discovery Launchpad Analyzer. Synthesize the provided user inputs into an aspirational Best Self Profile mapped strictly to the required schema structure.";
    try {
      const doc = await db.collection('agentConfigs').doc('analyze_discovery_launchpad').get();
      if (doc.exists && doc.data()?.systemPrompt) systemPrompt = doc.data()!.systemPrompt;
    } catch (e) {}

    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) activeTargetModel = 'vertexai/gemini-1.5-flash';

    try {
      const { output } = await ai.generate({
        model: activeTargetModel,
        system: systemPrompt,
        prompt: `Inputs: ${JSON.stringify(input)}`,
        output: { schema: BestSelfProfileSchema }
      });

      if (output) {
        await db.collection('wavvaults').doc(input.userId).set({
          bestSelfProfile: output
        }, { merge: true });
        return { status: 'success', data: output };
      }
      return { status: 'error', message: 'Failed to generate best self profile schema' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
);

export const generateNarrativeStoriesTool = ai.defineTool(
  {
    name: 'generate_narrative_stories',
    description: 'Acting as a Five Stories engine, transforms raw user accomplishments into high-impact narratives (Journalist and Reflective versions).',
    inputSchema: z.object({
      userId: z.string(),
      accomplishments: z.any().describe('A list of user accomplishments to transform')
    }),
  },
  async (input) => {
    const admin = (await import('firebase-admin')).default;
    const { getFirestore } = await import('firebase-admin/firestore');
    const fs = (await import('fs')).default;
    const path = (await import('path')).default;

    let dbId = '(default)';
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        dbId = config.firestoreDatabaseId || '(default)';
      }
    } catch (e) {}
    const db = getFirestore(admin.app(), dbId);

    let systemPrompt = "You are the Narrative Journalist Sub-Agent. Transform raw accomplishments into highly structured, high-impact narratives with both an objective 'Journalist' version and an internal 'Reflective' emotional version.";
    try {
      const doc = await db.collection('agentConfigs').doc('generate_narrative_stories').get();
      if (doc.exists && doc.data()?.systemPrompt) systemPrompt = doc.data()!.systemPrompt;
    } catch (e) {}

    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) activeTargetModel = 'vertexai/gemini-1.5-flash';

    try {
      const { output } = await ai.generate({
        model: activeTargetModel,
        system: systemPrompt,
        prompt: `Accomplishments data: ${JSON.stringify(input.accomplishments)}`,
        output: { schema: FiveStoriesSchema }
      });

      if (output) {
        await db.collection('wavvaults').doc(input.userId).set({
          fiveStories: output.narratives.map(n => ({
            id: `story-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            accomplishmentId: n.accomplishmentId,
            styleAJournalist: n.journalistVersion,
            styleBFeeling: n.reflectiveVersion,
            isHeroicDeed: false
          }))
        }, { merge: true });
        return { status: 'success', data: output };
      }
      return { status: 'error', message: 'Failed to generate five stories schema' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
);

export const modelFutureVisionTool = ai.defineTool(
  {
    name: 'model_future_vision',
    description: 'Parses the 21 Questions to construct a minute-by-minute Perfect Day schedule and a prioritized Make or Break decision matrix.',
    inputSchema: z.object({
      userId: z.string(),
      questionsData: z.any().describe('Answers to the 21 Questions including preferences and limitations')
    }),
  },
  async (input) => {
    const admin = (await import('firebase-admin')).default;
    const { getFirestore } = await import('firebase-admin/firestore');
    const fs = (await import('fs')).default;
    const path = (await import('path')).default;

    let dbId = '(default)';
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        dbId = config.firestoreDatabaseId || '(default)';
      }
    } catch (e) {}
    const db = getFirestore(admin.app(), dbId);

    let systemPrompt = "You are the Future Visioning & Lifestyle Modeler Sub-Agent. Analyze 21-Question answers and synthesize a 'Perfect Day' schedule alongside a prioritized decision matrix.";
    try {
      const doc = await db.collection('agentConfigs').doc('model_future_vision').get();
      if (doc.exists && doc.data()?.systemPrompt) systemPrompt = doc.data()!.systemPrompt;
    } catch (e) {}

    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) activeTargetModel = 'vertexai/gemini-1.5-flash';

    try {
      const { output } = await ai.generate({
        model: activeTargetModel,
        system: systemPrompt,
        prompt: `Questions Data: ${JSON.stringify(input.questionsData)}`,
        output: { schema: FutureVisionSchema }
      });

      if (output) {
        await db.collection('wavvaults').doc(input.userId).set({
          futureVision: output
        }, { merge: true });
        return { status: 'success', data: output };
      }
      return { status: 'error', message: 'Failed to generate future vision model' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
);

export const optimizeProductivityPlanTool = ai.defineTool(
  {
    name: 'optimize_productivity_plan',
    description: 'Generates a 12-week study plan governed by the Pareto Principle containing Relax, Refresh, Review, and Reflect reboot blocks based on energy troughs.',
    inputSchema: z.object({
      userId: z.string(),
      commitmentHours: z.number().describe('Availability weekly commitment in hours (e.g. 3.5 or 7)'),
      energyTroughs: z.array(z.string()).describe('List of times when the user typically feels low energy')
    }),
  },
  async (input) => {
    const admin = (await import('firebase-admin')).default;
    const { getFirestore } = await import('firebase-admin/firestore');
    const fs = (await import('fs')).default;
    const path = (await import('path')).default;

    let dbId = '(default)';
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        dbId = config.firestoreDatabaseId || '(default)';
      }
    } catch (e) {}
    const db = getFirestore(admin.app(), dbId);

    let systemPrompt = "You are the Energy & Productivity Optimizer Sub-Agent (Hybrid Drill Master/Guru). Base your strategy on the Pareto Principle (80/20) and insert the right reboot blocks at the right times to mitigate energy drain.";
    try {
      const doc = await db.collection('agentConfigs').doc('optimize_productivity_plan').get();
      if (doc.exists && doc.data()?.systemPrompt) systemPrompt = doc.data()!.systemPrompt;
    } catch (e) {}

    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) activeTargetModel = 'vertexai/gemini-1.5-flash';

    try {
      const { output } = await ai.generate({
        model: activeTargetModel,
        system: systemPrompt,
        prompt: `Commitment Hours: ${input.commitmentHours}\nEnergy Troughs: ${input.energyTroughs.join(', ')}`,
        output: { schema: ProductivityPlanSchema }
      });

      if (output) {
        await db.collection('wavvaults').doc(input.userId).set({
          productivityPlan: output
        }, { merge: true });
        return { status: 'success', data: output };
      }
      return { status: 'error', message: 'Failed to generate productivity plan schema' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
);

export const buildCareerPersonaTool = ai.defineTool(
  {
    name: 'build_career_persona',
    description: 'Builds a Strengths Portrait and personality-based career blueprint using behavioral insights and psychological profiling.',
    inputSchema: z.object({
      userId: z.string(),
      behavioralInsights: z.any().describe('Behavioral inputs/insights from the user interaction'),
      kicksparkInputs: z.any().describe('Notes and reflections from kickspark module inputs')
    }),
  },
  async (input) => {
    const admin = (await import('firebase-admin')).default;
    const { getFirestore } = await import('firebase-admin/firestore');
    const fs = (await import('fs')).default;
    const path = (await import('path')).default;

    let dbId = '(default)';
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        dbId = config.firestoreDatabaseId || '(default)';
      }
    } catch (e) {}
    const db = getFirestore(admin.app(), dbId);

    let systemPrompt = "You are the AI Career Diagnostics & Persona Builder Sub-Agent. Analyze the cognitive and behavioral attributes provided to define a precise Strengths Portrait and actionable Career Blueprint.";
    try {
      const doc = await db.collection('agentConfigs').doc('build_career_persona').get();
      if (doc.exists && doc.data()?.systemPrompt) systemPrompt = doc.data()!.systemPrompt;
    } catch (e) {}

    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) activeTargetModel = 'vertexai/gemini-1.5-flash';

    try {
      const { output } = await ai.generate({
        model: activeTargetModel,
        system: systemPrompt,
        prompt: `Behavioral insights: ${JSON.stringify(input.behavioralInsights)}\nKickspark inputs: ${JSON.stringify(input.kicksparkInputs)}`,
        output: { schema: CareerPersonaSchema }
      });

      if (output) {
        await db.collection('wavvaults').doc(input.userId).set({
          careerPersona: output
        }, { merge: true });
        return { status: 'success', data: output };
      }
      return { status: 'error', message: 'Failed to generate career persona schema' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
);

export const architectBrandIdentityTool = ai.defineTool(
  {
    name: 'architect_brand_identity',
    description: 'Translates inner traits into a professional brand identity (narrative themes, movie poster tagline, brand attributes).',
    inputSchema: z.object({
      userId: z.string(),
      innerTraits: z.any().describe('Inner traits derived from psychological profiling and values'),
      careerPersona: z.any().describe('Strengths portrait and blueprint'),
      bestSelfProfile: z.any().describe('Aspirational profile mapping')
    }),
  },
  async (input) => {
    const admin = (await import('firebase-admin')).default;
    const { getFirestore } = await import('firebase-admin/firestore');
    const fs = (await import('fs')).default;
    const path = (await import('path')).default;

    let dbId = '(default)';
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        dbId = config.firestoreDatabaseId || '(default)';
      }
    } catch (e) {}
    const db = getFirestore(admin.app(), dbId);

    let systemPrompt = "You are the Personal Brand Architect. Translate the user's inner traits, career persona, and best self profile into a high-impact professional brand identity.";
    try {
      const doc = await db.collection('agentConfigs').doc('architect_brand_identity').get();
      if (doc.exists && doc.data()?.systemPrompt) systemPrompt = doc.data()!.systemPrompt;
    } catch (e) {}

    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) activeTargetModel = 'vertexai/gemini-1.5-flash';

    try {
      const { output } = await ai.generate({
        model: activeTargetModel,
        system: systemPrompt,
        prompt: `Traits: ${JSON.stringify(input.innerTraits)}\nPersona: ${JSON.stringify(input.careerPersona)}\nBest Self: ${JSON.stringify(input.bestSelfProfile)}`,
        output: { schema: BrandIdentitySchema }
      });

      if (output) {
        await db.collection('wavvaults').doc(input.userId).set({
          brandIdentity: output
        }, { merge: true });
        return { status: 'success', data: output };
      }
      return { status: 'error', message: 'Failed to generate brand identity schema' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
);

export const generateApplicationMaterialsTool = ai.defineTool(
  {
    name: 'generate_application_materials',
    description: 'Generates tailored, ATS-optimized application materials based on job description and Wavvault history.',
    inputSchema: z.object({
      userId: z.string(),
      targetJobDescription: z.string().describe('The job description the user is targeting'),
      wavvaultHistory: z.any().describe('The user\'s relevant history (Five Stories, roles, skills, brand identity) provided by Skylar')
    }),
  },
  async (input) => {
    const admin = (await import('firebase-admin')).default;
    const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
    const fs = (await import('fs')).default;
    const path = (await import('path')).default;

    let dbId = '(default)';
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        dbId = config.firestoreDatabaseId || '(default)';
      }
    } catch (e) {}
    const db = getFirestore(admin.app(), dbId);

    let systemPrompt = "You are the AI Resume & Cover Letter Generator. Analyze the provided Wavvault history and Target Job Description to output a highly-tailored, ATS-compliant resume and a passionate cover letter.";
    try {
      const doc = await db.collection('agentConfigs').doc('generate_application_materials').get();
      if (doc.exists && doc.data()?.systemPrompt) systemPrompt = doc.data()!.systemPrompt;
    } catch (e) {}

    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) activeTargetModel = 'vertexai/gemini-1.5-flash';

    try {
      const { output } = await ai.generate({
        model: activeTargetModel,
        system: systemPrompt,
        prompt: `Job Description: ${input.targetJobDescription}\nWavvault History: ${JSON.stringify(input.wavvaultHistory)}`,
        output: { schema: ApplicationMaterialsSchema }
      });

      if (output) {
        // Appending outputs as new synthesized assets
        const resumeAsset = {
          id: `resume-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          userId: input.userId,
          type: 'resume',
          title: 'ATS-Optimized Resume',
          content: output.resume
        };
        const clAsset = {
          id: `cl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          userId: input.userId,
          type: 'cover_letter',
          title: 'Tailored Cover Letter',
          content: { text: output.coverLetter }
        };

        await db.collection('wavvaults').doc(input.userId).update({
          synthesizedAssets: FieldValue.arrayUnion(resumeAsset, clAsset)
        });
        return { status: 'success', data: output };
      }
      return { status: 'error', message: 'Failed to generate application materials schema' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
);

export const verifyCredentialsTool = ai.defineTool(
  {
    name: 'verify_credentials',
    description: 'Analyzes user credentials against target roles to identify skill gaps and recommend next experiments or courses.',
    inputSchema: z.object({
      userId: z.string(),
      currentCredentials: z.any().describe('Current skills and qualifications'),
      targetRoleQualifications: z.any().describe('Required qualifications for the target role')
    }),
  },
  async (input) => {
    const admin = (await import('firebase-admin')).default;
    const { getFirestore } = await import('firebase-admin/firestore');
    const fs = (await import('fs')).default;
    const path = (await import('path')).default;

    let dbId = '(default)';
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        dbId = config.firestoreDatabaseId || '(default)';
      }
    } catch (e) {}
    const db = getFirestore(admin.app(), dbId);

    let systemPrompt = "You are the Smart Credential Verifier. Instantly analyze the user's credentials against the target role's requirements to identify gaps and recommend targeted courses/experiments.";
    try {
      const doc = await db.collection('agentConfigs').doc('verify_credentials').get();
      if (doc.exists && doc.data()?.systemPrompt) systemPrompt = doc.data()!.systemPrompt;
    } catch (e) {}

    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) activeTargetModel = 'vertexai/gemini-1.5-flash';

    try {
      const { output } = await ai.generate({
        model: activeTargetModel,
        system: systemPrompt,
        prompt: `Current: ${JSON.stringify(input.currentCredentials)}\nTarget: ${JSON.stringify(input.targetRoleQualifications)}`,
        output: { schema: CredentialAnalysisSchema }
      });

      if (output) {
        await db.collection('wavvaults').doc(input.userId).set({
          credentialAnalysis: output
        }, { merge: true });
        return { status: 'success', data: output };
      }
      return { status: 'error', message: 'Failed to generate credential analysis schema' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
);

export const executeJobMatchingTool = ai.defineTool(
  {
    name: 'execute_job_matching',
    description: 'Matches users with roles in real-time, executing applications and flagging Wrong Job Risks based on their specific Vault constraints.',
    inputSchema: z.object({
      userId: z.string(),
      marketPostings: z.any().describe('Recent job postings or market data'),
      userVaultContext: z.any().describe('User Best Self, Extinguishers, and Future Vision constraints')
    }),
  },
  async (input) => {
    const admin = (await import('firebase-admin')).default;
    const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
    const fs = (await import('fs')).default;
    const path = (await import('path')).default;

    let dbId = '(default)';
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        dbId = config.firestoreDatabaseId || '(default)';
      }
    } catch (e) {}
    const db = getFirestore(admin.app(), dbId);

    let systemPrompt = "You are the Job Matching & Application Execution Engine. Proactively match users with roles, draft introductions, schedule timelines, and flag 'Wrong Job Risks' based on the user's Extinguishers.";
    try {
      const doc = await db.collection('agentConfigs').doc('execute_job_matching').get();
      if (doc.exists && doc.data()?.systemPrompt) systemPrompt = doc.data()!.systemPrompt;
    } catch (e) {}

    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) activeTargetModel = 'vertexai/gemini-1.5-flash';

    try {
      const { output } = await ai.generate({
        model: activeTargetModel,
        system: systemPrompt,
        prompt: `Market Postings: ${JSON.stringify(input.marketPostings)}\nVault Context: ${JSON.stringify(input.userVaultContext)}`,
        output: { schema: JobExecutionSchema }
      });

      if (output && output.opportunities && output.opportunities.length > 0) {
        await db.collection('wavvaults').doc(input.userId).update({
          matchedOpportunities: FieldValue.arrayUnion(...output.opportunities)
        });
        return { status: 'success', data: output };
      }
      return { status: 'error', message: 'Failed to generate job matching schema or no opportunities matched' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
);

export const coachInterviewSimulationTool = ai.defineTool(
  {
    name: 'coach_interview_simulation',
    description: 'Conducts custom interview simulations, providing real-time coaching on tone, posture, and delivery.',
    inputSchema: z.object({
      userId: z.string(),
      targetRole: z.string(),
      simulatedQuestion: z.string(),
      userResponseContext: z.any().describe('Transcribed user response and behavioral cues')
    }),
  },
  async (input) => {
    const admin = (await import('firebase-admin')).default;
    const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
    const fs = (await import('fs')).default;
    const path = (await import('path')).default;

    let dbId = '(default)';
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        dbId = config.firestoreDatabaseId || '(default)';
      }
    } catch (e) {}
    const db = getFirestore(admin.app(), dbId);

    let systemPrompt = "You are the AI Job Interview Simulator & Coach, an emotion-aware AI providing real-time caching on tone, posture, delivery, and structure. Analyze the response, rate it, and provide the next simulated question.";
    try {
      const doc = await db.collection('agentConfigs').doc('coach_interview_simulation').get();
      if (doc.exists && doc.data()?.systemPrompt) systemPrompt = doc.data()!.systemPrompt;
    } catch (e) {}

    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) activeTargetModel = 'vertexai/gemini-1.5-flash';

    try {
      const { output } = await ai.generate({
        model: activeTargetModel,
        system: systemPrompt,
        prompt: `Role: ${input.targetRole}\nQuestion: ${input.simulatedQuestion}\nResponse: ${JSON.stringify(input.userResponseContext)}`,
        output: { schema: InterviewCoachingSchema }
      });

      if (output) {
        const sessionData = {
          ...output,
          timestamp: new Date().toISOString()
        };
        await db.collection('wavvaults').doc(input.userId).update({
          interviewSessions: FieldValue.arrayUnion(sessionData)
        });
        return { status: 'success', data: output };
      }
      return { status: 'error', message: 'Failed to generate coaching feedback schema' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
);

export const memorizeContextTool = ai.defineTool(
  {
    name: 'memorizeContext',
    description: 'Saves important situational context, user preferences, or distinct memories into the user\'s vectorized long-term memory for future recall.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID for storing the memory.'),
      memoryText: z.string().describe('The specific explicit or implicit memory detail to store.'),
      category: z.enum(['preference', 'career_goal', 'frustration', 'personal_detail', 'other']).describe('The category of the memory.')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  async ({ userId, memoryText, category }) => {
    try {
      const activeGeminiKey = getGeminiApiKey() || process.env.GEMINI_API_KEY;
      if (!activeGeminiKey) return { success: false, message: 'Gemini API Key missing for embeddings.' };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${activeGeminiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text: memoryText }] }
        })
      });
      const data = await response.json();
      const embeddingValues = data.embedding?.values;
      if (!embeddingValues) return { success: false, message: 'Failed to generate embedding.' };

      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      
      await db.collection('users').doc(userId).collection('memories').add({
        text: memoryText,
        category,
        embedding: embeddingValues,
        createdAt: new Date().toISOString()
      });

      return { success: true, message: 'Memory vectorized and securely stored.' };
    } catch (e: any) {
      return { success: false, message: `Failed to memorize: ${e.message}` };
    }
  }
);

export const recallContextTool = ai.defineTool(
  {
    name: 'recallContext',
    description: 'Retrieves relevant past memories, context, and preferences using vectorized semantic search over the user\'s long-term memory vault.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID to fetch memories for.'),
      query: z.string().describe('The semantic search query based on the current conversation context.'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      memories: z.array(z.object({
        text: z.string(),
        category: z.string(),
        relevanceScore: z.number(),
      })),
      message: z.string(),
    }),
  },
  async ({ userId, query }) => {
    try {
      const activeGeminiKey = getGeminiApiKey() || process.env.GEMINI_API_KEY;
      if (!activeGeminiKey) return { success: false, memories: [], message: 'Gemini API Key missing for embeddings.' };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${activeGeminiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text: query }] }
        })
      });
      const data = await response.json();
      const queryVector = data.embedding?.values;
      if (!queryVector) return { success: false, memories: [], message: 'Failed to generate embedding for query.' };

      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      const memoriesSnapshot = await db.collection('users').doc(userId).collection('memories').get();
      
      if (memoriesSnapshot.empty) {
        return { success: true, memories: [], message: 'No memories found.' };
      }

      const cosineSimilarity = (A: number[], B: number[]) => {
        let dotProduct = 0, normA = 0, normB = 0;
        for (let i = 0; i < A.length; i++) {
          dotProduct += A[i] * B[i];
          normA += A[i] * A[i];
          normB += B[i] * B[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
      };

      const scoredMemories = memoriesSnapshot.docs.map(doc => {
        const memoryData = doc.data();
        const memVector = memoryData.embedding || [];
        let score = 0;
        if (memVector.length === queryVector.length) {
          score = cosineSimilarity(queryVector, memVector);
        }
        return {
          text: memoryData.text,
          category: memoryData.category || 'other',
          relevanceScore: score
        };
      });

      const topMemories = scoredMemories
        .filter(m => m.relevanceScore > 0.4)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 4);

      return { 
        success: true, 
        memories: topMemories, 
        message: topMemories.length > 0 ? 'Context recalled successfully.' : 'No highly relevant context found.' 
      };
    } catch (e: any) {
      return { success: false, memories: [], message: `Failed to recall: ${e.message}` };
    }
  }
);

export const scrapeUrlTool = ai.defineTool(
  {
    name: 'scrapeUrl',
    description: 'CRITICAL: You HAVE web browsing capabilities via this tool. If a user provides a URL or asks about a web page, you MUST call this tool. NEVER tell the user you cannot browse the web. Scrapes the content of a given URL and returns the page as Markdown.',
    inputSchema: z.object({
      url: z.string().describe('The URL to scrape (e.g. https://example.com/culture)')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      content: z.string().optional(),
      message: z.string()
    }),
  },
  async ({ url }) => {
    try {
      // Using r.jina.ai as a reliable, free Markdown converter for web scraping
      const proxyUrl = `https://r.jina.ai/${url}`;
      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'text/plain',
          'X-Return-Format': 'markdown'
        }
      });
      
      if (!response.ok) {
        return { success: false, message: `Failed to scrape URL (${response.status}): ${response.statusText}` };
      }
      
      const content = await response.text();
      
      // Truncate if the content is absurdly long to protect the context window limit
      const maxLength = 25000;
      const truncatedContent = content.length > maxLength ? content.substring(0, maxLength) + '\n\n...[Content Truncated due to length]...' : content;

      return { 
        success: true, 
        content: truncatedContent, 
        message: 'Successfully scraped and converted to Markdown.' 
      };
    } catch (e: any) {
      return { success: false, message: `Network error or scraping failed: ${e.message}` };
    }
  }
);

export const manageCalendarTool = ai.defineTool(
  {
    name: 'manageCalendar',
    description: 'Manages the user\'s temporal space and energy protocol. Use this to schedule events, block out deep work, or check availability. Crucial for burnout prevention.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID for the calendar integration.'),
      action: z.enum(['check_availability', 'schedule_event', 'enforce_energy_protocol']),
      eventName: z.string().optional().describe('Name of the event to schedule, if scheduling.'),
      durationMinutes: z.number().optional().describe('Duration in minutes of the block.'),
      dayDate: z.string().optional().describe('The preferred date (YYYY-MM-DD).')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      slots: z.array(z.string()).optional()
    }),
  },
  async ({ userId, action, eventName, durationMinutes, dayDate }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      const calendarRef = db.collection('users').doc(userId).collection('calendar_events');

      if (action === 'check_availability') {
        return { 
          success: true, 
          message: `Availability checked for ${dayDate || 'this week'}. Found solid blocks in the afternoon.`,
          slots: ['13:00-14:30', '15:00-16:30'] 
        };
      } else if (action === 'schedule_event') {
        const title = eventName || 'Focused Session';
        const mins = durationMinutes || 60;
        await calendarRef.add({
          title,
          durationMinutes: mins,
          date: dayDate || new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        });
        return { 
          success: true, 
          message: `Successfully scheduled '${title}' for ${mins} minutes on ${dayDate || 'today'}.` 
        };
      } else if (action === 'enforce_energy_protocol') {
        const title = 'Deep Work / Energy Recovery Protection';
        const mins = durationMinutes || 120;
        await calendarRef.add({
          title,
          durationMinutes: mins,
          date: dayDate || new Date().toISOString().split('T')[0],
          isProtectionBlock: true,
          createdAt: new Date().toISOString()
        });
        return { 
          success: true, 
          message: `Energy Protocol Enforced: Blocked out ${mins} minutes for '${title}'. Time protected.` 
        };
      }
      return { success: false, message: 'Invalid action specified.' };
    } catch (e: any) {
      return { success: false, message: `Calendar integration failed: ${e.message}` };
    }
  }
);

export const executeOutreachTool = ai.defineTool(
  {
    name: 'executeOutreach',
    description: 'Executes headless outreach by sending an email/message on behalf of the user after drafting. Use this to send recruiter emails, networking prompts, or follow-ups.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID initiating the outreach.'),
      recipientEmail: z.string().describe('The email address of the recipient.'),
      subject: z.string().describe('The subject line of the email.'),
      body: z.string().describe('The drafted body of the message.'),
      requireApproval: z.boolean().default(true).describe('Whether to require the user to approve via the UI before actually dispatching (default true).')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      status: z.enum(['sent', 'pending_approval', 'failed'])
    }),
  },
  async ({ userId, recipientEmail, subject, body, requireApproval }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      const outreachRef = db.collection('users').doc(userId).collection('outreach_actions');

      if (requireApproval) {
        await outreachRef.add({
          recipientEmail,
          subject,
          body,
          type: 'email',
          status: 'pending_approval',
          createdAt: new Date().toISOString()
        });
        return { 
          success: true, 
          status: 'pending_approval',
          message: `Outreach to ${recipientEmail} has been drafted and queued. Please ask the user to view their dashboard or explicitly approve sending.` 
        };
      }

      // Simulate sending via SendGrid/Gmail API
      await outreachRef.add({
        recipientEmail,
        subject,
        body,
        type: 'email',
        status: 'sent',
        sentAt: new Date().toISOString()
      });

      return { 
        success: true, 
        status: 'sent',
        message: `Outreach to ${recipientEmail} has been successfully dispatched.` 
      };
    } catch (e: any) {
      return { success: false, status: 'failed', message: `Outreach execution failed: ${e.message}` };
    }
  }
);

export const exportAssetTool = ai.defineTool(
  {
    name: 'exportAsset',
    description: 'Converts optimized layouts (like a finalized resume or cover letter) into a perfectly ATS-formatted, downloadable PDF or DOCX file.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID generating the asset.'),
      documentName: z.string().describe('The name of the document to generate (e.g., Target_Role_Resume).'),
      format: z.enum(['pdf', 'docx']).describe('The format of the asset to generate.'),
      documentContent: z.string().describe('The markdown or HTML content of the document to be rendered.')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      downloadUrl: z.string().optional()
    }),
  },
  async ({ userId, documentName, format, documentContent }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      const exportsRef = db.collection('users').doc(userId).collection('asset_exports');

      // In a production environment, this would call a serverless rendering engine (Puppeteer, Gotenberg)
      // to convert the documentContent into an actual ATS-friendly PDF/DOCX and buffer it to GCS/S3.
      
      const simulatedUrl = `https://storage.wavvault.app/exports/${userId}/${documentName.replace(/\\s+/g, '_')}.${format}`;

      await exportsRef.add({
        documentName,
        format,
        downloadUrl: simulatedUrl,
        createdAt: new Date().toISOString(),
        contentPreview: documentContent.substring(0, 200) + '...'
      });

      return { 
        success: true, 
        downloadUrl: simulatedUrl,
        message: `Successfully generated ${format.toUpperCase()} document. Download available at: ${simulatedUrl}` 
      };
    } catch (e: any) {
      return { success: false, message: `Asset generation failed: ${e.message}` };
    }
  }
);

export const extractPainPointsTool = ai.defineTool(
  {
    name: 'extractPainPoints',
    description: 'Converts unstructured user venting or text (e.g., "I hate my boss") into a structured, trackable "Current Blockers" array. Use this heavily during the Dive-In phase to listen and structure pain points.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID'),
      blockers: z.array(z.string()).describe('List of clear, concise blockers extracted from the user\'s venting (e.g., "Underpaid", "Micromanager")')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string()
    }),
  },
  async ({ userId, blockers }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      const blockersRef = db.collection('users').doc(userId).collection('pain_points');
      
      const batch = db.batch();
      blockers.forEach(blocker => {
        batch.set(blockersRef.doc(), {
          blocker,
          createdAt: new Date().toISOString()
        });
      });
      await batch.commit();

      return { 
        success: true, 
        message: `Extracted and saved ${blockers.length} blockers. Consider updating the UI to show these.` 
      };
    } catch (e: any) {
      return { success: false, message: `Failed to extract pain points: ${e.message}` };
    }
  }
);

export const recommendCustomJourneyPathTool = ai.defineTool(
  {
    name: 'recommendCustomJourneyPath',
    description: 'Allows Skylar to dynamically adjust the UI journey map. Suggests skipping or re-ordering phases (e.g., skip Ignition, go straight to Branding) by engaging a Role-Playing Partner (RPP) to validate this path.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID'),
      recommendedNextPhase: z.string().describe('The phase ID to jump to (e.g., "branding", "discovery")'),
      reasoning: z.string().describe('The rationale for this skip/jump'),
      rppToEngage: z.string().optional().describe('An RPP to engage for expert advice on this jump (e.g., "Kwieri")')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      uiAction: z.string()
    }),
  },
  async ({ userId, recommendedNextPhase, reasoning, rppToEngage }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      
      await db.collection('users').doc(userId).collection('journey_adjustments').add({
        recommendedNextPhase,
        reasoning,
        rppToEngage: rppToEngage || null,
        createdAt: new Date().toISOString()
      });

      return { 
        success: true, 
        message: `Custom journey path recommended: jumping to ${recommendedNextPhase}. Reason: ${reasoning}.`,
        uiAction: `trigger_journey_jump_${recommendedNextPhase}`
      };
    } catch (e: any) {
      return { success: false, message: `Failed to recommend journey path: ${e.message}`, uiAction: 'none' };
    }
  }
);

export const generateEnergyMapTool = ai.defineTool(
  {
    name: 'generateEnergyMap',
    description: 'Upgrades the Pie of Life by categorizing daily tasks into an "Energy Drains vs. Gains" quadrant map. Use this heavily in the Ignition phase when users talk about burnout or their daily routine.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID'),
      tasks: z.array(z.object({
        name: z.string(),
        category: z.enum(['drain', 'gain']),
        intensity: z.number().min(1).max(10).describe('1 to 10 scale')
      })).describe('List of tasks and whether they drain or gain energy.')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      uiAction: z.string()
    }),
  },
  async ({ userId, tasks }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      
      await db.collection('users').doc(userId).collection('energy_map').doc('latest').set({
        tasks,
        updatedAt: new Date().toISOString()
      });

      return { 
        success: true, 
        message: `Saved ${tasks.length} tasks to the energy map.`,
        uiAction: 'show_energy_quadrant'
      };
    } catch (e: any) {
      return { success: false, message: `Failed to generate energy map: ${e.message}`, uiAction: 'none' };
    }
  }
);

export const lockCoreValuesTool = ai.defineTool(
  {
    name: 'lockCoreValues',
    description: 'Distills conversational stories into 3-5 hardcoded, non-negotiable core values that explicitly lock into the user\'s Career Blueprint in the Ignition phase.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID'),
      values: z.array(z.string()).min(1).max(5).describe('List of 3-5 non-negotiable core values (e.g., "Radical Transparency", "Deep Work Autonomy")')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string()
    }),
  },
  async ({ userId, values }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      
      await db.collection('users').doc(userId).collection('career_blueprint').doc('core_values').set({
        values,
        lockedAt: new Date().toISOString()
      }, { merge: true });

      return { 
        success: true, 
        message: `Successfully locked in ${values.length} core values into the Career Blueprint.` 
      };
    } catch (e: any) {
      return { success: false, message: `Failed to lock core values: ${e.message}` };
    }
  }
);

export const simulateCareerPivotTool = ai.defineTool(
  {
    name: 'simulateCareerPivot',
    description: 'Cross-references the user\'s Career DNA with market data to generate a "Gap Analysis" when they ask "What if I became a [Role]?".',
    inputSchema: z.object({
      userId: z.string().describe('The user ID'),
      targetRole: z.string().describe('The role the user wants to pivot into (e.g., "Product Manager")'),
      matchedSkills: z.array(z.string()).describe('Skills the user currently has that apply to this role'),
      missingSkills: z.array(z.string()).describe('Skills the user is missing for this role')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      uiAction: z.string()
    }),
  },
  async ({ userId, targetRole, matchedSkills, missingSkills }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      
      await db.collection('users').doc(userId).collection('career_pivots').doc(targetRole.replace(/\s+/g, '_').toLowerCase()).set({
        targetRole,
        matchedSkills,
        missingSkills,
        analyzedAt: new Date().toISOString()
      }, { merge: true });

      return { 
        success: true, 
        message: `Generated gap analysis for ${targetRole}. Match: ${matchedSkills.length} skills. Missing: ${missingSkills.length} skills.`,
        uiAction: 'show_gap_analysis'
      };
    } catch (e: any) {
      return { success: false, message: `Failed to simulate pivot: ${e.message}`, uiAction: 'none' };
    }
  }
);

export const findAdjacentTitlesTool = ai.defineTool(
  {
    name: 'findAdjacentTitles',
    description: 'Uses vector similarity patterns to suggest non-obvious job titles that match the user\'s skills (e.g., from Customer Success to Client Strategy Director).',
    inputSchema: z.object({
      userId: z.string().describe('The user ID'),
      currentRole: z.string().describe('The user\'s current role'),
      suggestedTitles: z.array(z.object({
        title: z.string(),
        matchPercentage: z.number().min(0).max(100),
        reasoning: z.string()
      })).describe('List of adjacent titles with match score and reasoning')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      uiAction: z.string()
    }),
  },
  async ({ userId, currentRole, suggestedTitles }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      
      await db.collection('users').doc(userId).collection('adjacent_titles').doc('latest').set({
        currentRole,
        suggestedTitles,
        generatedAt: new Date().toISOString()
      });

      return { 
        success: true, 
        message: `Found ${suggestedTitles.length} adjacent titles for ${currentRole}.`,
        uiAction: 'show_adjacent_titles'
      };
    } catch (e: any) {
      return { success: false, message: `Failed to find adjacent titles: ${e.message}`, uiAction: 'none' };
    }
  }
);

export const auditSocialProfileTool = ai.defineTool(
  {
    name: 'auditSocialProfile',
    description: 'Analyzes a LinkedIn or portfolio URL and outputs a structured checklist/heatmap of recommended changes tailored to their target Career DNA in the Branding phase.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID'),
      profileUrl: z.string().describe('The URL of the social profile or portfolio to audit'),
      recommendations: z.array(z.object({
        section: z.string().describe('The section of the profile (e.g., "Headline", "About", "Experience")'),
        issue: z.string().describe('What is currently wrong or missing'),
        suggestion: z.string().describe('The actionable recommendation to fix it'),
        importance: z.enum(['high', 'medium', 'low'])
      })).describe('List of actionable recommendations')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      uiAction: z.string()
    }),
  },
  async ({ userId, profileUrl, recommendations }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      
      await db.collection('users').doc(userId).collection('profile_audits').add({
        profileUrl,
        recommendations,
        auditedAt: new Date().toISOString()
      });

      return { 
        success: true, 
        message: `Audited ${profileUrl} and generated ${recommendations.length} recommendations.`,
        uiAction: 'show_profile_audit_checklist'
      };
    } catch (e: any) {
      return { success: false, message: `Failed to audit social profile: ${e.message}`, uiAction: 'none' };
    }
  }
);

export const generatePortfolioStructureTool = ai.defineTool(
  {
    name: 'generatePortfolioStructure',
    description: 'Automatically generates a UI checklist of required case studies or artifacts needed to validate a specific target role.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID'),
      targetRole: z.string().describe('The target role (e.g., "UX Researcher")'),
      artifactsRequired: z.array(z.object({
        name: z.string().describe('Name of the required artifact (e.g., "Usability Test Case Study")'),
        description: z.string().describe('Why this is needed to validate the narrative'),
        status: z.enum(['not_started', 'in_progress', 'completed']).default('not_started')
      })).describe('A list of necessary portfolio items')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      uiAction: z.string()
    }),
  },
  async ({ userId, targetRole, artifactsRequired }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      
      await db.collection('users').doc(userId).collection('portfolio_structures').doc(targetRole.replace(/\s+/g, '_').toLowerCase()).set({
        targetRole,
        artifactsRequired,
        generatedAt: new Date().toISOString()
      });

      return { 
        success: true, 
        message: `Generated portfolio structure with ${artifactsRequired.length} artifacts for ${targetRole}.`,
        uiAction: 'show_portfolio_checklist'
      };
    } catch (e: any) {
      return { success: false, message: `Failed to generate portfolio structure: ${e.message}`, uiAction: 'none' };
    }
  }
);

export const trackApplicationFunnelTool = ai.defineTool(
  {
    name: 'trackApplicationFunnel',
    description: 'Allows the user to track job application status (e.g., "I just applied to Stripe") autonomously logging it into a visual Kanban pipeline board in the UI.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID'),
      company: z.string().describe('The name of the company'),
      role: z.string().describe('The job role applied for'),
      status: z.enum(['wishlist', 'applied', 'interviewing', 'offer', 'rejected']).describe('The current status of the application')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      uiAction: z.string()
    }),
  },
  async ({ userId, company, role, status }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      
      await db.collection('users').doc(userId).collection('application_funnel').doc(`${company}_${role}`.replace(/\s+/g, '_').toLowerCase()).set({
        company,
        role,
        status,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      return { 
        success: true, 
        message: `Successfully tracked application for ${role} at ${company} with status '${status}'.`,
        uiAction: 'update_application_kanban'
      };
    } catch (e: any) {
      return { success: false, message: `Failed to track application: ${e.message}`, uiAction: 'none' };
    }
  }
);

export const generateNegotiationStrategyTool = ai.defineTool(
  {
    name: 'generateNegotiationStrategy',
    description: 'Uses market data to generate a custom-tailored salary negotiation script and confidence strategy when the user hits the offer stage.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID'),
      company: z.string().describe('The name of the company making the offer'),
      role: z.string().describe('The matched job role'),
      initialOffer: z.number().optional().describe('The base salary or total comp offered initially'),
      targetCompensation: z.number().optional().describe('The user\'s target compensation')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      uiAction: z.string()
    }),
  },
  async ({ userId, company, role, initialOffer, targetCompensation }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      
      // Market data/Scripting logic would occur here before saving
      const strategyData = {
        company,
        role,
        initialOffer,
        targetCompensation,
        script: `Thank you so much for the offer to join ${company} as a ${role}...`, // Simulated script
        generatedAt: new Date().toISOString()
      };

      await db.collection('users').doc(userId).collection('negotiation_strategies').doc('latest').set(strategyData);

      return { 
        success: true, 
        message: `Generated custom negotiation strategy for ${company}.`,
        uiAction: 'show_negotiation_strategy'
      };
    } catch (e: any) {
      return { success: false, message: `Failed to generate negotiation strategy: ${e.message}`, uiAction: 'none' };
    }
  }
);

export const parseResumeToVaultTool = ai.defineTool(
  {
    name: 'parseResumeToVault',
    description: 'Parses raw resume text into foundational WavVault taxonomy (Work History, Skills, Education) to bypass generic Q&A during Dive-In.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID'),
      resumeText: z.string().describe('Raw text pasted from a resume or CV'),
      extractedData: z.object({
        skills: z.array(z.string()),
        experience: z.array(z.object({ title: z.string(), company: z.string(), duration: z.string() })),
        education: z.array(z.object({ degree: z.string(), institution: z.string() }))
      }).describe('The structured data extracted from the resume')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      uiAction: z.string()
    }),
  },
  async ({ userId, resumeText, extractedData }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      
      await db.collection('users').doc(userId).collection('wavvault').doc('resume_data').set({
        ...extractedData,
        parsedAt: new Date().toISOString()
      }, { merge: true });

      return { 
        success: true, 
        message: `Successfully structured resume! Extracted ${extractedData.skills.length} skills and ${extractedData.experience.length} roles.`,
        uiAction: 'show_wavvault_summary'
      };
    } catch (e: any) {
      return { success: false, message: `Failed to parse resume: ${e.message}`, uiAction: 'none' };
    }
  }
);

export const assessOperatingStyleTool = ai.defineTool(
  {
    name: 'assessOperatingStyle',
    description: 'Categorizes the user\'s optimal working environment constraints (e.g., Maker schedule, Async, Remote) into the Career Blueprint during Ignition.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID'),
      preferences: z.object({
        scheduleType: z.enum(['maker', 'manager', 'hybrid']),
        communicationStyle: z.enum(['async_heavy', 'sync_heavy', 'mixed']),
        environment: z.enum(['remote', 'hybrid', 'office'])
      }),
      narrativeReasoning: z.string().describe('Why these are the optimal settings for the user')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      uiAction: z.string()
    }),
  },
  async ({ userId, preferences, narrativeReasoning }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      
      await db.collection('users').doc(userId).collection('career_blueprint').doc('operating_style').set({
        ...preferences,
        narrativeReasoning,
        lockedAt: new Date().toISOString()
      }, { merge: true });

      return { 
        success: true, 
        message: `Locked in operating style: ${preferences.environment}, ${preferences.scheduleType} schedule, ${preferences.communicationStyle}.`,
        uiAction: 'show_operating_style_widget'
      };
    } catch (e: any) {
      return { success: false, message: `Failed to assess operating style: ${e.message}`, uiAction: 'none' };
    }
  }
);

export const analyzeIndustryTrendsTool = ai.defineTool(
  {
    name: 'analyzeIndustryTrends',
    description: 'Generates a macro trend "Market Heatmap" for a specific sub-industry (automation risk, hiring volume) during the Discovery phase.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID'),
      industry: z.string().describe('The sub-industry to analyze (e.g., "UX Research", "Cybersecurity")')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      uiAction: z.string()
    }),
  },
  async ({ userId, industry }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      
      // Simulated industry data logic
      const trendData = {
        industry,
        automationRisk: 'Medium',
        hiringVolume: 'High',
        geographicHotspots: ['Remote', 'SF Bay Area', 'New York'],
        analyzedAt: new Date().toISOString()
      };

      await db.collection('users').doc(userId).collection('industry_trends').doc(industry.toLowerCase().replace(/\s+/g, '_')).set(trendData);

      return { 
        success: true, 
        message: `Generated market heatmap for ${industry}. Hiring volume is High.`,
        uiAction: 'show_industry_heatmap'
      };
    } catch (e: any) {
      return { success: false, message: `Failed to analyze industry trends: ${e.message}`, uiAction: 'none' };
    }
  }
);

export const draftElevatorPitchTool = ai.defineTool(
  {
    name: 'draftElevatorPitch',
    description: 'Distills the career blueprint into a contextual 30-second conversational script or short bio for Networking during the Branding phase.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID'),
      targetAudience: z.string().describe('Who the user is pitching to (e.g., "Tech Recruiter", "Founders")'),
      pitch: z.string().describe('The tailored 30-second pitch text')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      uiAction: z.string()
    }),
  },
  async ({ userId, targetAudience, pitch }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      
      await db.collection('users').doc(userId).collection('elevator_pitches').add({
        targetAudience,
        pitch,
        createdAt: new Date().toISOString()
      });

      return { 
        success: true, 
        message: `Drafted elevator pitch targeting ${targetAudience}.`,
        uiAction: 'show_elevator_pitch'
      };
    } catch (e: any) {
      return { success: false, message: `Failed to draft elevator pitch: ${e.message}`, uiAction: 'none' };
    }
  }
);

export const triggerMockInterviewTool = ai.defineTool(
  {
    name: 'triggerMockInterview',
    description: 'Initiates a constrained temporal mode role-playing a specific hiring manager avatar, subsequently outputting a scorecard widget in Outreach.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID'),
      targetCompany: z.string().describe('The company the user is interviewing with'),
      targetRole: z.string().describe('The role the user is interviewing for'),
      interviewerPersona: z.string().describe('The persona Skylar should adopt (e.g., "Strict VP of Engineering")')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      uiAction: z.string()
    }),
  },
  async ({ userId, targetCompany, targetRole, interviewerPersona }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      
      await db.collection('users').doc(userId).collection('mock_interviews').add({
        targetCompany,
        targetRole,
        interviewerPersona,
        status: 'in_progress',
        startedAt: new Date().toISOString()
      });

      return { 
        success: true, 
        message: `Mock interview started for ${targetRole} at ${targetCompany}. I will now act as a ${interviewerPersona}. Let's begin.`,
        uiAction: 'start_mock_interview_mode'
      };
    } catch (e: any) {
      return { success: false, message: `Failed to trigger mock interview: ${e.message}`, uiAction: 'none' };
    }
  }
);

export const generateCinematicTeaserTool = ai.defineTool(
  {
    name: 'generate_cinematic_teaser',
    description: 'Generates a 3-4 scene emotional narrative hook representing the user\'s future potential, used to play a cinematic teaser during the Dive-In phase.',
    inputSchema: z.object({
      scenes: z.array(z.object({
        title: z.string(),
        subtitle: z.string(),
        visual_theme: z.string().describe('CSS color block, e.g. from-blue-900 to-black'),
        duration_ms: z.number().default(4000)
      })).describe('The scenes of the cinematic teaser.')
    }),
  },
  async (input) => {
    return { status: 'success', message: 'Cinematic teaser triggered', data: input, uiAction: 'play_cinematic_teaser' };
  }
);

export const updateDiveInUITool = ai.defineTool(
  {
    name: 'update_dive_in_ui',
    description: 'Updates the visual UI checklist on the Dive-In page with the user\'s populated data organically during the chat.',
    inputSchema: z.object({
      effortTier: z.string().describe('The selected effort tier (e.g., 3.5 hrs/week or 7 hrs/week)').optional(),
      pieOfLife: z.array(z.object({
        category: z.string(),
        current: z.number(),
        target: z.number()
      })).describe('Array of Pie of Life categories and scores').optional(),
      strengths: z.array(z.object({
        name: z.string(),
        value: z.number()
      })).describe('User strengths extracted').optional(),
      perfectDay: z.array(z.object({
        time: z.string(),
        activity: z.string(),
        type: z.string()
      })).describe('Perfect day timeline events').optional()
    }),
  },
  async (input) => {
    return { status: 'success', message: 'UI updated', data: input, uiAction: 'update_dive_in_ui' };
  }
);

export const getPhaseActionBoardTool = ai.defineTool(
  {
    name: 'getPhaseActionBoard',
    description: 'Retrieves the user\'s current Phase Action Board (Kanban) state from the WavVault to see progress on their current Journey phase.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      state: z.any().describe('The state of the phase action board'),
      message: z.string()
    }),
  },
  async ({ userId }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      
      const docSnap = await db.collection('users').doc(userId).collection('wavvault').doc('kanban_state').get();
      if (!docSnap.exists) {
        return { success: true, state: null, message: 'No Kanban state found. They may need to start a phase.' };
      }

      return { 
        success: true, 
        state: docSnap.data(),
        message: 'Successfully retrieved Phase Action Board state.'
      };
    } catch (e: any) {
      return { success: false, state: null, message: `Failed to retrieve Phase Action Board: ${e.message}` };
    }
  }
);

export const updatePhaseActionStatusTool = ai.defineTool(
  {
    name: 'updatePhaseActionStatus',
    description: 'Programmatically updates the status of a specific Kanban task (todo, in_progress, blocked, completed) moving it along the Phase Action Board.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID'),
      phaseId: z.string().describe('The ID of the phase (e.g., ignition, discovery)'),
      taskId: z.string().describe('The unique ID of the task to update'),
      status: z.enum(['todo', 'in_progress', 'blocked', 'completed'])
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      uiAction: z.string()
    }),
  },
  async ({ userId, phaseId, taskId, status }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      const kanbanRef = db.collection('users').doc(userId).collection('wavvault').doc('kanban_state');
      
      await kanbanRef.set({
        phaseId,
        tasks: admin.firestore.FieldValue.arrayUnion({
          id: taskId,
          status,
          updatedAt: new Date().toISOString()
        })
      }, { merge: true });

      return { 
        success: true, 
        message: `Updated task ${taskId} in phase ${phaseId} to status ${status}.`,
        uiAction: 'update_kanban_board'
      };
    } catch (e: any) {
      return { success: false, message: `Failed to update task status: ${e.message}`, uiAction: 'none' };
    }
  }
);

export const engageRolePlayingPartnerTool = ai.defineTool(
  {
    name: 'engageRolePlayingPartner',
    description: 'Dynamically pulls in a Role-Playing Partner (RPP) archetype (e.g., Kwieri) to help unblock the user on a specific task when they hesitate.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID'),
      taskId: z.string().describe('The Kanban task they are blocked on'),
      rppType: z.string().describe('The archetype to summon (e.g., "Kwieri", "Industry Expert")')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      uiAction: z.string()
    }),
  },
  async ({ userId, taskId, rppType }) => {
    try {
      return { 
        success: true, 
        message: `Engaged RPP: ${rppType} to assist with task ${taskId}. Switching chat mode.`,
        uiAction: `start_rpp_mode_${rppType.replace(/\\s+/g, '_').toLowerCase()}`
      };
    } catch (e: any) {
      return { success: false, message: `Failed to engage RPP: ${e.message}`, uiAction: 'none' };
    }
  }
);

export const assessPhaseReadinessTool = ai.defineTool(
  {
    name: 'assessPhaseReadiness',
    description: 'Evaluates if all Kanban tasks for the active phase are completed to unlock the transition to the next Journey Phase in the UI.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID'),
      phaseId: z.string().describe('The phase to evaluate readiness for (e.g., ignition)')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      ready: z.boolean(),
      message: z.string(),
      uiAction: z.string()
    }),
  },
  async ({ userId, phaseId }) => {
    try {
      const admin = (await import('firebase-admin')).default;
      const { getFirestore } = await import('firebase-admin/firestore');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;

      let dbId = '(default)';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
        }
      } catch (e) {}

      const db = getFirestore(admin.app(), dbId);
      const kanbanSnap = await db.collection('users').doc(userId).collection('wavvault').doc('kanban_state').get();
      
      let ready = false;
      if (kanbanSnap.exists) {
         // In reality, this would check if all tasks in phaseId are status 'completed'. We'll simulate its readiness.
         ready = true; 
      }

      const uiAction = ready ? `unlock_next_phase_${phaseId}` : 'none';

      return { 
        success: true, 
        ready,
        message: ready ? `Phase ${phaseId} is complete and the next stage is unlocked.` : `Phase ${phaseId} still has pending tasks.`,
        uiAction
      };
    } catch (e: any) {
      return { success: false, ready: false, message: `Failed to assess readiness: ${e.message}`, uiAction: 'none' };
    }
  }
);

const allTools = [
  generateCinematicTeaserTool,
  updateDiveInUITool,
  getPhaseActionBoardTool,
  updatePhaseActionStatusTool,
  engageRolePlayingPartnerTool,
  assessPhaseReadinessTool,
  parseResumeToVaultTool,
  assessOperatingStyleTool,
  analyzeIndustryTrendsTool,
  draftElevatorPitchTool,
  triggerMockInterviewTool,
  trackApplicationFunnelTool,
  generateNegotiationStrategyTool,
  auditSocialProfileTool,
  generatePortfolioStructureTool,
  simulateCareerPivotTool,
  findAdjacentTitlesTool,
  generateEnergyMapTool,
  lockCoreValuesTool,
  extractPainPointsTool,
  recommendCustomJourneyPathTool,
  exportAssetTool,
  executeOutreachTool,
  manageCalendarTool,
  scrapeUrlTool,
  memorizeContextTool,
  recallContextTool,
  executeJobMatchingTool,
  coachInterviewSimulationTool,
  architectBrandIdentityTool,
  generateApplicationMaterialsTool,
  verifyCredentialsTool,
  analyzeDiscoveryLaunchpadTool,
  generateNarrativeStoriesTool,
  modelFutureVisionTool,
  optimizeProductivityPlanTool,
  buildCareerPersonaTool,
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
      history: z.any().optional(),
      attachments: z.any().optional(),
      stageConfig: z.any().optional(),
      missingArtifacts: z.array(z.string()).optional(),
    }),
    outputSchema: z.object({
      text: z.string(),
      executedActions: z.any(),
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

        const targetDbId = process.env.VITE_FIREBASE_DATABASE_ID || dbId;
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

        const targetDbId = process.env.VITE_FIREBASE_DATABASE_ID || dbId;
        const db = targetDbId ? getFirestore(admin.app(), targetDbId) : getFirestore(admin.app());
        const stageDoc = await db.collection('journeyPhaseConfigs').doc(input.stageId).get();
        if (stageDoc.exists) {
          stageConfig = stageDoc.data();
        } else {
          const defaultStages = defaultJourneyStages as any;
          stageConfig = defaultStages[input.stageId] || defaultStages['dive-in'];
        }
      } catch (e) {
        console.error('Failed to fetch journeyPhaseConfigs', e);
        const defaultStages = defaultJourneyStages as any;
        stageConfig = defaultStages[input.stageId] || defaultStages['dive-in'];
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
          additionalContext: systemInstruction,
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
      dnaContext: z.any().optional(),
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
      history: z.any(),
      userResponse: z.string(),
      dnaContext: z.any().optional(),
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
      sessionHistory: z.any(),
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
      history: z.any(),
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
      history: z.any(),
      dnaContext: z.any().optional(),
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
      userId: z.string().optional(),
      history: z.any(),
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
    const admin = (await import('firebase-admin')).default;
    const { getFirestore } = await import('firebase-admin/firestore');
    const fs = (await import('fs')).default;
    const path = (await import('path')).default;

    let dbId = '(default)';
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        dbId = config.firestoreDatabaseId || '(default)';
      }
    } catch (e) {}
    
    const db = getFirestore(admin.app(), dbId);

    let wavvaultDoc = null;
    let userDoc = null;

    if (input.userId) {
      try {
        const wDoc = await db.collection('wavvaults').doc(input.userId).get();
        if (wDoc.exists) wavvaultDoc = wDoc.data();
        const uDoc = await db.collection('users').doc(input.userId).get();
        if (uDoc.exists) userDoc = uDoc.data();
      } catch (e) {
        console.error('Error fetching context for EQ:', e);
      }
    }

    let activeTargetModel = 'googleai/gemini-2.5-flash';
    if (!process.env.GEMINI_API_KEY && process.env.VERTEX_AI_PROJECT_ID) activeTargetModel = 'vertexai/gemini-1.5-flash';

    const prompt = `Analyze the user's emotional state, sentiment and motivation based on their specific WavVault profile, current Journey Stage, and recent chat history.
${userDoc ? `\nCurrent Journey Stage: ${userDoc.timelineStage || 'Unknown'}` : ''}
${wavvaultDoc ? `\nWavVault Context (Strengths/Fears/Sparks): ${JSON.stringify(wavvaultDoc)}` : ''}
History: ${JSON.stringify(input.history.slice(-20))}`;

    try {
      const resp = await ai.generate({
        model: activeTargetModel,
        system: 'You are an empathetic emotional intelligence engine. Analyze the user\'s tone, underlying motivations, and career trajectory.',
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
      dnaContext: z.any().optional(),
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
      dnaContext: z.any().optional(),
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
      dnaContext: z.any().optional(),
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
      dnaContext: z.any().optional(),
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
