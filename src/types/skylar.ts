export type Modality = 'text' | 'audio' | 'image' | 'video';

export type WidgetType = 
  | 'ActionCenter' 
  | 'NeuralSynthesisEngine' 
  | 'ActivityFeed' 
  | 'SectorIntelligence' 
  | 'WavvaultHighlights' 
  | 'StrengthsProfile' 
  | 'JobMatchesPreview'
  | 'SynthesisLabEntry'
  | 'CustomMarkdown';

export interface StageWidgetConfig {
  id: string;
  type: WidgetType;
  position: 'main' | 'sidebar' | 'header';
  order: number;
  props?: Record<string, any>;
}

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
    widgets?: StageWidgetConfig[];
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
