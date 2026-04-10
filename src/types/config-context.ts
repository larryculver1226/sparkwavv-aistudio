import { SkylarGlobalConfig, SkylarStageConfig } from './skylar-config';

export interface SkylarConfigState {
  global: SkylarGlobalConfig | null;
  currentStage: SkylarStageConfig | null;
  isLoading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>; // Manual trigger for Admin updates
}
