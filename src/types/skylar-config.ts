/**
 * src/types/skylar-config.ts
 * Blueprints for the SPARKWavv Dynamic Configuration System
 */

export interface SkylarGlobalConfig {
  id: "skylar_global";
  version: string;             // e.g., "1.0.0"
  lastUpdated: string;         // ISO Timestamp
  
  // UI & Branding
  avatar: {
    url: string;               // Path to the Skylar image
    scale: number;             // Multiplier (e.g., 1.25)
  };
  homeBenefits: string[];      // The scrolling ticker text items
}

export interface SkylarStageConfig {
  stageId: string;
  stageTitle: string;
  description: string;
  systemPromptTemplate: string;
  requiredArtifacts: string[];
  allowedModalities: {
    text: boolean;
    audio: boolean;
    image: boolean;
    video: boolean;
  };
  uiConfig: {
    theme: 'dark' | 'light' | 'neon';
    layout: 'chat-first' | 'artifact-first' | 'split' | 'sidebar';
    primaryColor?: string;
  };
}

/**
 * Helper to ensure the AI service always has a fallback
 */
export const DEFAULT_MODALITIES = {
  text: true,
  audio: false,
  image: false,
  video: false
};
