import { useState, useEffect } from 'react';
import { agentOpsService } from '../services/agentOpsService';
import { JourneyStageDefinition } from '../types/skylar';

/**
 * Hook to fetch and manage the configuration for a specific journey stage.
 * This enables "no-code" updates by pulling the latest config from Firestore.
 */
export function useJourneyStage(stageId: string) {
  const [config, setConfig] = useState<JourneyStageDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        const stageConfig = await agentOpsService.getConfig(stageId);
        if (isMounted) {
          setConfig(stageConfig);
          setError(null);
        }
      } catch (err) {
        console.error(`Error fetching config for stage ${stageId}:`, err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch stage config'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchConfig();

    return () => {
      isMounted = false;
    };
  }, [stageId]);

  return { config, isLoading, error };
}
