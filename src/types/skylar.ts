export type Modality = 'text' | 'audio' | 'image' | 'video';

export interface JourneyStageDefinition {
  stageId: string;
  title: string;
  description: string;
  systemPromptTemplate: string;
  requiredArtifacts: string[];
  allowedModalities: Modality[];
  uiConfig: {
    theme: 'dark' | 'light' | 'neon';
    layout: 'chat-first' | 'artifact-first' | 'split' | 'sidebar';
    primaryColor?: string;
  };
}

export interface SkylarArtifact {
  id: string;
  type: 'text' | 'markdown' | 'chart' | 'video' | 'action-plan' | 'media';
  content: any;
  metadata: {
    source: string;
    createdAt: string;
    confidenceScore?: number;
  };
  modality: Modality;
  relatedStage: string;
}
