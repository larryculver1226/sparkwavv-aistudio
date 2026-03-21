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

export interface WavvaultData {
  userId: string;
  graph: KnowledgeGraph;
  logs: ProcessingLogEntry[];
  lastSynthesis: string;
  isDiscoveryUnlocked: boolean;
}
