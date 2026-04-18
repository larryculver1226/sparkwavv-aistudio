import React from 'react';
import { useJourneyStage } from '../../hooks/useJourneyStage';
import { SkylarInteractionPanel } from '../skylar/SkylarInteractionPanel';
import { Loader2, AlertCircle } from 'lucide-react';
import { useIdentity } from '../../contexts/IdentityContext';

interface SkylarStageWrapperProps {
  stageId: string;
  children?: React.ReactNode;
  onActionTriggered?: (action: string, payload: any) => void;
  initialContext?: string;
  layout?: 'split' | 'sidebar' | 'overlay' | 'chat-first' | 'artifact-first';
  missingArtifacts?: string[];
}

/**
 * A wrapper component that integrates Skylar's configuration and interaction panel
 * into any journey stage. It handles fetching the "no-code" configuration.
 */
export const SkylarStageWrapper: React.FC<SkylarStageWrapperProps> = ({
  stageId,
  children,
  onActionTriggered,
  initialContext,
  layout = 'split',
  missingArtifacts = []
}) => {
  const { config, isLoading, error } = useJourneyStage(stageId);
  const { user } = useIdentity();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 w-full">
        <Loader2 className="w-8 h-8 text-neon-cyan animate-spin mb-4" />
        <p className="text-white/40 text-xs uppercase tracking-widest">Loading Skylar Configuration...</p>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="p-8 rounded-3xl border border-neon-magenta/20 bg-neon-magenta/5 text-center">
        <AlertCircle className="w-12 h-12 text-neon-magenta mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Configuration Error</h3>
        <p className="text-white/60 text-sm mb-4">
          We couldn't load the configuration for the "{stageId}" stage.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  // Split Layout: Content on left, Skylar on right (Standard for Dive-In)
  if (layout === 'split') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-display font-bold tracking-tight text-white">
              {config.title}
            </h1>
            <p className="text-white/60 text-sm leading-relaxed">
              {config.description}
            </p>
          </div>
          {children}
        </div>
        <div className="lg:col-span-2 h-full min-h-[500px]">
          <SkylarInteractionPanel 
            stageId={stageId}
            user={user}
            onActionTriggered={onActionTriggered}
            initialContext={initialContext}
            missingArtifacts={missingArtifacts}
          />
        </div>
      </div>
    );
  }

  // Sidebar Layout: Content takes most space, Skylar is a sidebar
  if (layout === 'sidebar') {
    return (
      <div className="flex flex-col lg:flex-row gap-8 h-full">
        <div className="flex-1 min-w-0">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-white mb-2">{config.title}</h1>
            <p className="text-white/60 text-sm">{config.description}</p>
          </div>
          {children}
        </div>
        <div className="w-full lg:w-96 h-[600px] lg:h-auto shrink-0">
          <SkylarInteractionPanel 
            stageId={stageId}
            user={user}
            onActionTriggered={onActionTriggered}
            initialContext={initialContext}
            missingArtifacts={missingArtifacts}
          />
        </div>
      </div>
    );
  }

  // Default fallback (Overlay or simple stack)
  return (
    <div className="space-y-8">
      <div className="glass-panel p-8 border-white/10">
        <h1 className="text-3xl font-display font-bold text-white mb-2">{config.title}</h1>
        <p className="text-white/60 text-sm">{config.description}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>{children}</div>
        <div className="h-[600px]">
          <SkylarInteractionPanel 
            stageId={stageId}
            user={user}
            onActionTriggered={onActionTriggered}
            initialContext={initialContext}
            missingArtifacts={missingArtifacts}
          />
        </div>
      </div>
    </div>
  );
};
