import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SkylarConfigState } from '../types/config-context';
import { configService } from '../services/configService';
import { useIdentity } from './IdentityContext';

const SkylarConfigContext = createContext<SkylarConfigState | undefined>(undefined);

export function SkylarConfigProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useIdentity();
  const [state, setState] = useState<Omit<SkylarConfigState, 'refreshConfig' | 'isLoading'>>({
    global: null,
    currentStage: null,
    error: null,
  });
  const [isGlobalLoading, setIsGlobalLoading] = useState(true);
  const [isStageLoading, setIsStageLoading] = useState(true);

  const isLoading = isGlobalLoading || isStageLoading;

  const fetchStageConfig = useCallback(async (stageId: string) => {
    setIsStageLoading(true);
    try {
      const stageConfig = await configService.getJourneyStage(stageId);
      setState(prev => ({ ...prev, currentStage: stageConfig }));
    } catch (error: any) {
      console.error('Failed to fetch journey stage config:', error);
      setState(prev => ({ ...prev, error: error.message }));
    } finally {
      setIsStageLoading(false);
    }
  }, []);

  const refreshConfig = useCallback(async () => {
    setIsGlobalLoading(true);
    setIsStageLoading(true);
    setState(prev => ({ ...prev, error: null }));
    try {
      // Force refresh global config
      const globalConfig = await configService.getSkylarGlobalConfig(true);
      
      // Get current stage from profile or default to 'dive-in'
      const stageId = profile?.journeyStage || 'dive-in';
      const stageConfig = await configService.getJourneyStage(stageId, true);

      setState({
        global: globalConfig,
        currentStage: stageConfig,
        error: null,
      });
    } catch (error: any) {
      console.error('Failed to refresh Skylar config:', error);
      setState(prev => ({ ...prev, error: error.message }));
    } finally {
      setIsGlobalLoading(false);
      setIsStageLoading(false);
    }
  }, [profile?.journeyStage]);

  useEffect(() => {
    // Subscribe to global config changes
    const unsubscribe = configService.subscribeToSkylarGlobalConfig((globalConfig) => {
      setState(prev => ({ ...prev, global: globalConfig }));
      setIsGlobalLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch stage config when profile changes
    const stageId = profile?.journeyStage || 'dive-in';
    fetchStageConfig(stageId);
  }, [profile?.journeyStage, fetchStageConfig]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white">
        <div className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-white/40 uppercase tracking-widest text-xs">
          Loading Configuration...
        </p>
      </div>
    );
  }

  return (
    <SkylarConfigContext.Provider value={{ ...state, isLoading, refreshConfig }}>
      {children}
    </SkylarConfigContext.Provider>
  );
}

export function useSkylarConfig() {
  const context = useContext(SkylarConfigContext);
  if (context === undefined) {
    throw new Error('useSkylarConfig must be used within a SkylarConfigProvider');
  }
  return context;
}
