import { BestSelfProfile, FiveStories, FutureVision, ProductivityPlan, CareerPersona, BrandIdentity, CredentialAnalysis, JobOpportunity, InterviewCoachingSession } from './schemas';

export type NodeType = 'skill' | 'goal' | 'value' | 'spark';

export interface KnowledgeNode {
  id: string;
  label: string;
  type: NodeType;
  strength: number; // 0-1
  description?: string;
  metadata?: Record<string, any>;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  weight: number; // 0-1
  type: 'connection' | 'dependency' | 'influence';
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  links: KnowledgeEdge[];
}

export interface ProcessingLogEntry {
  timestamp: string;
  message: string;
  status: 'info' | 'success' | 'warning' | 'error';
  step: string;
}

export interface ValidationGateEvent {
  id: string;
  phase: string;
  timestamp: string;
  status: 'passed' | 'warning' | 'failed';
  verdict: string;
  integrityHash: string;
  previousEventId?: string;
}

export interface DistilledArtifact {
  id: string;
  type:
    | 'spark'
    | 'pie-of-life'
    | 'perfect-day'
    | 'five-stories'
    | 'brand-pillar'
    | 'manifesto'
    | 'live_resume'
    | 'interactive_portfolio'
    | 'outreach_sequence'
    | 'portrait'
    | 'likeness'
    | 'intel'
    | 'document';
  title: string;
  journeyPhase?: 'Dive-In' | 'Ignition' | 'Discovery' | 'Branding' | 'Outreach' | string;
  status?: 'draft' | 'review' | 'approved';
  content: any; // Can be chat summary, document metadata, etc
  timestamp: string;
  sourceGateId?: string;
  metadata?: {
    extractedSkills?: string[];
    industryRelevance?: string;
    documentSummary?: string;
    verified?: boolean;
    [key: string]: any;
  };
}

export type EffortTier = '3.5 Hours/Week' | '7 Hours/Week';

export interface EnergyManagement {
  rebootActivities: {
    relax: string[];
    refresh: string[];
    review: string[];
    reflect: string[];
  };
  energyTroughs: string[];
}

export interface RPP {
  name: string;
  meetingType: string;
  location?: string;
  validationTimestamp?: string;
}

export interface TwentyOneQuestions {
  organizationType?: string;
  industrySector?: string;
  roleLevel?: string;
  budgetControl?: string;
  reportingStructureUp?: string;
  reportingStructureDown?: string;
  bossTitleLocation?: string;
  workplaceEnvironment?: string;
  commuteTime?: string;
  commuteMode?: string;
  attire?: string;
  lunchHabit?: string;
  [key: string]: any;
}

export interface StoryEntity {
  id: string;
  accomplishmentId: string;
  styleAJournalist: string;
  styleBFeeling: string;
  isHeroicDeed: boolean;
}

export interface WavvaultData {
  userId: string;
  identity?: string;
  strengths?: string[];
  careerStories?: string[];
  graph: KnowledgeGraph;
  logs: ProcessingLogEntry[];
  journeyEvents: ValidationGateEvent[];
  artifacts: DistilledArtifact[];
  lastSynthesis: string;
  isDiscoveryUnlocked: boolean;
  contentHash?: string;
  previousHash?: string;

  // Draft V9 Schema Additions
  effortTier?: EffortTier;
  energyManagement?: EnergyManagement;
  rppPartners?: RPP[];
  twentyOneQuestions?: TwentyOneQuestions;
  perfectDay?: string;
  prioritizationRankings?: Record<string, number>;
  pieOfLife?: { current: any; target: any };
  extinguishers?: string[];
  accomplishmentLedger?: any[]; // Top 20
  fiveStories?: StoryEntity[];
  attributeAssignments?: Record<string, string>;
  bestSelfProfile?: BestSelfProfile;
  futureVision?: FutureVision;
  productivityPlan?: ProductivityPlan;
  careerPersona?: CareerPersona;
  brandIdentity?: BrandIdentity;
  credentialAnalysis?: CredentialAnalysis;
  matchedOpportunities?: JobOpportunity[];
  interviewSessions?: InterviewCoachingSession[];
}

export type AssetType = 'narrative' | 'resume' | 'portfolio' | 'cover_letter';

export interface SynthesizedAsset {
  id: string;
  userId: string;
  type: AssetType;
  title: string;
  content: any; // Structured data for the asset
  isLocked: boolean;
  createdAt: string;
  versionHash: string;
}

export interface AssetShare {
  id: string;
  userId: string;
  assetId: string;
  accessKey: string;
  expiresAt: string | null;
  viewCount: number;
  maxViews: number | null;
  brandingPersona: string;
  createdAt: string;
}

export interface TargetOpportunity {
  id: string;
  userId: string;
  company: string;
  role: string;
  url: string;
  summary: string;
  marketIntelligence: {
    demand: 'high' | 'medium' | 'low';
    salaryRange?: string;
    keySkills: string[];
    trends: string[];
  };
  dnaResonance: {
    score: number;
    matchingAttributes: string[];
    gapAnalysis: string;
  };
  outreachStrategy: {
    primaryAngle: string;
    suggestedContacts: string[];
    nextSteps: string[];
  };
  status: 'identified' | 'analyzed' | 'outreach_sent' | 'interviewing' | 'closed';
  createdAt: string;
  updatedAt: string;
}
