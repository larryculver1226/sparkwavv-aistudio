import React from 'react';
import { Database, BrainCircuit, Activity, Archive, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useWavvaultData } from '../../../hooks/useWavvaultData';
import { useJourneyStage } from '../../../hooks/useJourneyStage';

interface WavvaultContentsWidgetProps {
  timelineStage: string;
}

export const WavvaultContentsWidget: React.FC<WavvaultContentsWidgetProps> = ({ timelineStage }) => {
  const { wavvaultData, artifacts, loading } = useWavvaultData();
  const { config } = useJourneyStage(timelineStage);

  if (loading) {
    return (
      <div className="glass-panel p-6 border border-white/5 animate-pulse rounded-3xl h-64 flex items-center justify-center">
        <Database className="w-8 h-8 text-white/20 animate-spin" />
      </div>
    );
  }

  // Ensure config exists and parse missing items
  const requiredArtifacts = config?.requiredArtifacts || [];
  const completedArtifactsCount = artifacts.filter(a => a.relatedStage === timelineStage).length;
  
  const pendingItems = requiredArtifacts.filter(reqActionString => {
      // Very naive check, normally we'd match exact types
      return !artifacts.some(a => a.type.toLowerCase() === reqActionString.toLowerCase());
  });

  return (
    <div className="glass-panel p-6 lg:p-8 rounded-[2.5rem] border border-white/5 bg-black/60 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Database className="w-48 h-48" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <BrainCircuit className="w-6 h-6 text-neon-cyan" />
          <h2 className="text-xl font-display font-bold text-white uppercase tracking-widest">
            Wavvault Structural Data
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Content Stats */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">Total Artifacts</p>
            <p className="text-2xl font-display font-bold text-white">{artifacts.length}</p>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">Identity Nodes</p>
            <p className="text-2xl font-display font-bold text-white">
              {wavvaultData?.identity ? "Compiled" : "Pending"}
            </p>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">Strengths Smashed</p>
            <p className="text-2xl font-display font-bold text-white">{wavvaultData?.strengths?.length || 0}</p>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">Journey Events</p>
            <p className="text-2xl font-display font-bold text-white">{wavvaultData?.journeyEvents?.length || 0}</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white/80 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-neon-magenta" /> Current Phase Gateway: {timelineStage}
          </h3>
          
          <div className="space-y-3">
            {requiredArtifacts.length === 0 ? (
              <p className="text-sm text-white/40">No required artifacts for this stage.</p>
            ) : (
              requiredArtifacts.map((req, idx) => {
                const isComplete = !pendingItems.includes(req);
                return (
                  <div key={idx} className="flex items-center gap-3 bg-black/40 px-4 py-3 rounded-xl border border-white/5">
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-neon-cyan shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-neon-magenta shrink-0" />
                    )}
                    <span className={`text-sm ${isComplete ? 'text-white/60 line-through' : 'text-white font-medium'}`}>
                      {req}
                    </span>
                    {!isComplete && (
                      <span className="ml-auto text-[10px] uppercase font-bold text-neon-magenta bg-neon-magenta/10 px-2 py-1 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
