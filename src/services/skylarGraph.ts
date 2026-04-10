import { StateGraph, END, START, MemorySaver } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { getGeminiApiKey } from './aiConfig';
import { JourneyStageDefinition } from '../types/skylar';
import { SkylarStageConfig } from '../types/skylar-config';
import { skylar } from './skylarService';
import { interpolatePrompt } from '../utils/interpolation';

// Define the state for the graph
export interface SkylarGraphState {
  messages: BaseMessage[];
  stageConfig?: JourneyStageDefinition | SkylarStageConfig;
  userId: string;
  executedActions: any[];
  token?: string;
}

// Define the tools using Zod
const createSparkwavvAccountTool = tool(
  async ({ effortTier, rpps, energyProtocol }) => {
    return JSON.stringify({ status: 'success', message: 'Account creation flow triggered.' });
  },
  {
    name: 'create_sparkwavv_account',
    description: 'Trigger the account creation flow for a prospective user. Call this ONLY when the user has provided their Effort Tier, RPPs, and Energy Protocol during the Dive-In phase.',
    schema: z.object({
      effortTier: z.string().describe('The selected effort tier (e.g., 3.5 hrs/week or 7 hrs/week)'),
      rpps: z.array(z.string()).describe('List of Role Playing Partners'),
      energyProtocol: z.string().describe('The defined energy management protocol'),
    }),
  }
);

const searchWavvaultTool = tool(
  async ({ query }, config) => {
    const state = config?.configurable?.state as SkylarGraphState;
    const results = await skylar.performAnonymizedSearch(query, state?.token);
    return JSON.stringify({ content: results });
  },
  {
    name: 'search_wavvault',
    description: 'Search the collective, anonymized Wavvault for similar career paths, strengths, and stories from other users to provide comparative insights.',
    schema: z.object({
      query: z.string().describe("The career-related query to search for (e.g., 'career switch from nursing to tech')"),
    }),
  }
);

const executeMinorUpdateTool = tool(
  async ({ field, value, reasoning }, config) => {
    const state = config?.configurable?.state as SkylarGraphState;
    const result = await skylar.executeAction(state.userId, 'update_dashboard', { field, value, reasoning }, state?.token);
    return JSON.stringify(result);
  },
  {
    name: 'execute_minor_update',
    description: "Automatically execute a minor update to the user's dashboard (e.g., skills, attributes, journeyStage, careerHappiness). Use this for non-strategic updates.",
    schema: z.object({
      field: z.string().describe("The field to update (e.g., 'journeyStage', 'careerHappiness', 'resumeStatus')"),
      value: z.string().describe('The new value for the field'),
      reasoning: z.string().describe('The reason why this update is being executed'),
    }),
  }
);

const getMarketIntelligenceTool = tool(
  async ({ industry, role }, config) => {
    const state = config?.configurable?.state as SkylarGraphState;
    const results = await skylar.performMarketIntelligenceSearch(industry, role, state?.token);
    return JSON.stringify(results);
  },
  {
    name: 'get_market_intelligence',
    description: 'Fetch real-time market trends, industry shifts, and skill demand data from the Market Intelligence Grid (MIG).',
    schema: z.object({
      industry: z.string().describe("The industry to search for (e.g., 'Tech', 'Healthcare', 'Finance')"),
      role: z.string().describe("The specific role to analyze (e.g., 'Software Architect', 'Nurse Practitioner')"),
    }),
  }
);

const performGateReviewTool = tool(
  async ({ currentPhase, targetPhase, userData }, config) => {
    const state = config?.configurable?.state as SkylarGraphState;
    if (state?.userId) {
      const results = await skylar.performGateReview(state.userId, currentPhase, targetPhase, []);
      return JSON.stringify(results);
    }
    return JSON.stringify({ status: 'warning', message: 'User context not found.' });
  },
  {
    name: 'perform_gate_review',
    description: "Perform a 'Validation Gate' review to ensure the user is ready to move to the next phase. Phases: Dive-In, Ignition, Discovery, Branding, Outreach.",
    schema: z.object({
      currentPhase: z.string().describe('The current phase the user is in (Dive-In, Ignition, Discovery, Branding, Outreach)'),
      targetPhase: z.string().describe('The phase the user wants to move to (Dive-In, Ignition, Discovery, Branding, Outreach)'),
      userData: z.string().describe("A summary of the user's progress and data relevant to the gate criteria"),
    }),
  }
);

// Tools that just return proposals to the UI
const proposeMajorShiftTool = tool(
  async (args) => JSON.stringify({ status: 'proposed', data: args }),
  {
    name: 'propose_major_shift',
    description: "Propose a major shift in the user's professional DNA (e.g., a pivot, a new core value, or a change in primary goal).",
    schema: z.object({
      type: z.string().describe("The type of shift: 'pivot', 'core_value', 'primary_goal', or 'strength'"),
      content: z.string().describe('The description of the proposed shift'),
      evidence: z.string().describe('The reasoning or evidence from the conversation that led to this proposal'),
      tags: z.array(z.string()).optional().describe('Optional tags for categorization'),
    }),
  }
);

const flagDnaConflictTool = tool(
  async (args) => JSON.stringify({ status: 'flagged', data: args }),
  {
    name: 'flag_dna_conflict',
    description: "Flag a conflict between a new insight and an existing confirmed 'Current Truth' in the user's professional DNA.",
    schema: z.object({
      newInsight: z.object({ type: z.string(), content: z.string(), evidence: z.string() }),
      existingInsightId: z.string().describe('The ID of the existing confirmed insight that is being conflicted'),
      conflictReason: z.string().describe('Explanation of why these two insights are in conflict'),
    }),
  }
);

const proposeDashboardUpdateTool = tool(
  async (args) => JSON.stringify({ status: 'proposed', data: args }),
  {
    name: 'propose_dashboard_update',
    description: "Propose an update to a specific field in the user's dashboard based on the conversation progress. This will NOT execute until the user confirms.",
    schema: z.object({
      field: z.string().describe("The field to update (e.g., 'journeyStage', 'careerHappiness', 'resumeStatus')"),
      value: z.string().describe('The new value for the field'),
      reasoning: z.string().describe('The reason why this update is being proposed'),
    }),
  }
);

const proposeMilestoneAdditionTool = tool(
  async (args) => JSON.stringify({ status: 'proposed', data: args }),
  {
    name: 'propose_milestone_addition',
    description: "Propose adding a new milestone to the user's career roadmap. This will NOT execute until the user confirms.",
    schema: z.object({
      title: z.string().describe('The title of the milestone'),
      description: z.string().describe('Detailed description of the milestone'),
      targetDate: z.string().describe('Expected completion date (ISO format or descriptive)'),
      reasoning: z.string().describe('The reason why this milestone is being proposed'),
    }),
  }
);

const parseCareerArtifactTool = tool(
  async () => JSON.stringify({ status: 'analyzed', message: 'Artifact analyzed for DNA and ATS compliance.' }),
  {
    name: 'parse_career_artifact',
    description: "Analyze a user-provided career artifact (resume, cover letter, LinkedIn profile) for ATS compliance and alignment with their professional DNA.",
    schema: z.object({
      artifactType: z.string().describe("The type of artifact (e.g., 'resume', 'linkedin_profile')"),
      content: z.string().describe('The text content of the artifact'),
    }),
  }
);

const generateAtsOptimizedContentTool = tool(
  async () => JSON.stringify({ status: 'generated', message: 'Content generated.' }),
  {
    name: 'generate_ats_optimized_content',
    description: "Generate ATS-optimized content (e.g., resume bullets, summary) based on the user's professional DNA and target role.",
    schema: z.object({
      targetRole: z.string().describe('The target role or job title'),
      sourceMaterial: z.string().describe('The source material to optimize (e.g., existing resume bullets)'),
    }),
  }
);

const skylarTools = [
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
  generateAtsOptimizedContentTool
];

// Define the graph nodes
async function agentNode(state: SkylarGraphState) {
  const apiKey = getGeminiApiKey();
  const llm = new ChatGoogleGenerativeAI({
    model: 'gemini-3.1-pro-preview',
    apiKey,
    temperature: 0.7,
  }).bindTools(skylarTools);

  let currentTruth = '';
  if (state.userId && state.userId !== 'anonymous') {
    const insights = await skylar.fetchConfirmedInsights(state.userId);
    if (insights.length > 0) {
      currentTruth = `\n\nConfirmed Professional DNA (Current Truth):\n${insights.map((i: any) => `- [${i.type.toUpperCase()}] ${i.content}`).join('\n')}`;
    }
  }

  let baseInstruction = '';
  if (state.stageConfig) {
    const template = state.stageConfig.systemPromptTemplate;
      
    const stageTitle = 'stageTitle' in state.stageConfig 
      ? (state.stageConfig as SkylarStageConfig).stageTitle 
      : (state.stageConfig as JourneyStageDefinition).title;
      
    const artifactName = state.stageConfig.requiredArtifacts?.[0];

    baseInstruction = interpolatePrompt(template, {
      user: { displayName: 'User' }, // In a real app, fetch from user profile
      stage: { title: stageTitle, artifactName }
    });
  } else {
    baseInstruction = skylar.getSystemPromptForPhase('dive-in', { displayName: 'User' });
  }
    
  const systemInstruction = `${baseInstruction}${currentTruth}`;

  const messages = [new SystemMessage(systemInstruction), ...state.messages];
  
  const response = await llm.invoke(messages);
  
  return { messages: [response] };
}

async function toolNode(state: SkylarGraphState) {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  const toolCalls = lastMessage.tool_calls || [];
  
  const toolMessages = [];
  const executedActions = [...state.executedActions];

  for (const toolCall of toolCalls) {
    const tool = skylarTools.find(t => t.name === toolCall.name);
    if (tool) {
      console.log(`[SkylarGraph] Executing tool: ${toolCall.name}`);
      
      // Track action for UI
      executedActions.push({ action: toolCall.name, data: toolCall.args });
      
      try {
        const result = await (tool as any).invoke(toolCall.args, { configurable: { state } });
        toolMessages.push({
          role: 'tool',
          name: toolCall.name,
          content: result,
          tool_call_id: toolCall.id,
        });
      } catch (error: any) {
        console.error(`[SkylarGraph] Tool execution error for ${toolCall.name}:`, error);
        toolMessages.push({
          role: 'tool',
          name: toolCall.name,
          content: JSON.stringify({ error: error.message }),
          tool_call_id: toolCall.id,
        });
      }
    }
  }

  return { messages: toolMessages, executedActions };
}

function shouldContinue(state: SkylarGraphState) {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return 'tools';
  }
  return END;
}

// Build the graph
const workflow = new StateGraph<SkylarGraphState>({
  channels: {
    messages: {
      value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      default: () => [],
    },
    stageConfig: {
      value: (x, y) => y ?? x,
      default: () => undefined,
    },
    userId: {
      value: (x, y) => y ?? x,
      default: () => 'anonymous',
    },
    executedActions: {
      value: (x: any[], y: any[]) => x.concat(y),
      default: () => [],
    },
    token: {
      value: (x, y) => y ?? x,
      default: () => undefined,
    }
  }
})
  .addNode('agent', agentNode)
  .addNode('tools', toolNode)
  .addEdge(START, 'agent')
  .addConditionalEdges('agent', shouldContinue)
  .addEdge('tools', 'agent');

export const skylarGraph = workflow.compile();
