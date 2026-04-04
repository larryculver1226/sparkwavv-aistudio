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
  type: 'spark' | 'pie-of-life' | 'perfect-day' | 'five-stories' | 'brand-pillar' | 'manifesto';
  title: string;
  journeyPhase?: 'Dive-In' | 'Ignition' | 'Discovery' | 'Branding' | 'Outreach';
  content: any;
  timestamp: string;
  sourceGateId?: string;
  metadata?: Record<string, any>;
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
}

export type AssetType = 'narrative' | 'resume' | 'portfolio';

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
