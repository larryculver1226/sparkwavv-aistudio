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
  // 1. General Stage Metadata
  stageId: string;             // e.g., "dive-in", "discovery", "branding"
  stageTitle: string;          // User-facing name (e.g., "Ignition: Dive-In")
  description: string;         // Purpose of this phase
  
  // 2. AI Behavior & Constraints
  // Supports variables like {{user.displayName}}
  systemPromptTemplate: string; 
  
  // Required data outputs before the user can move to the next stage
  requiredArtifacts: string[];  // e.g., ["Career DNA Hypothesis"]
  
  // Feature Toggles
  allowedModalities: {
    text: boolean;
    audio: boolean;
    image: boolean;
    video: boolean;
  };
  
  // 3. Stage-Specific UI (Optional overrides)
  theme?: {
    primaryColor: string;      // Tailwind class (e.g., "neon-cyan")
    layout: 'chat' | 'split' | 'artifact';
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
