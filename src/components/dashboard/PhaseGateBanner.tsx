import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import { agentOpsService } from '../../services/agentOpsService';
import { JourneyStageDefinition } from '../../types/skylar';
import { WavvaultData } from '../../types/wavvault';

interface PhaseGateBannerProps {
  currentStageId: string;
  wavvaultData: WavvaultData | null;
  onHelpRequested: (artifactName: string) => void;
}

export const PhaseGateBanner: React.FC<PhaseGateBannerProps> = ({ 
  currentStageId, 
  wavvaultData, 
  onHelpRequested 
}) => {
  const [stageConfig, setStageConfig] = useState<JourneyStageDefinition | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const config = await agentOpsService.getConfig(currentStageId);
      setStageConfig(config);
    };
    fetchConfig();
  }, [currentStageId]);

  if (!stageConfig || !stageConfig.requiredArtifacts) return null;

  const requiredArtifacts = stageConfig.requiredArtifacts;
  const userArtifacts = wavvaultData?.artifacts || [];

  const checkArtifactCompletion = (artifactName: string) => {
    // Basic heuristics to match artifact completion in WavVault
    return userArtifacts.some(a => a.type.toLowerCase().includes(artifactName.toLowerCase()) || a.title?.toLowerCase().includes(artifactName.toLowerCase()));
  };

  const gateRemaining = requiredArtifacts.filter(a => !checkArtifactCompletion(a));
  const isGatePassed = gateRemaining.length === 0;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-neon-cyan/20 bg-black/60 relative overflow-hidden mb-8">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
        <Target className="w-32 h-32 text-neon-cyan" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
            {isGatePassed ? (
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            ) : (
              <Lock className="w-6 h-6 text-yellow-400" />
            )}
            {stageConfig.title} Stage Gate
          </h3>
          {!isGatePassed && (
            <span className="text-xs font-bold px-3 py-1 bg-yellow-400/10 text-yellow-400 rounded-full border border-yellow-400/20">
              {gateRemaining.length} Artifacts Remaining
            </span>
          )}
        </div>

        <p className="text-sm text-white/60 mb-6">
          To unlock the next phase of your journey, the following artifacts must be validated in your Wavvault.
        </p>

        <div className="space-y-3">
          {requiredArtifacts.map((artifactName, idx) => {
            const isCompleted = checkArtifactCompletion(artifactName);
            return (
              <div 
                key={idx}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-neon-cyan" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-white/20" />
                  )}
                  <span className={`text-sm font-medium ${isCompleted ? 'text-white/40 line-through' : 'text-white/90'}`}>
                    {artifactName}
                  </span>
                </div>
                {!isCompleted && (
                  <button 
                    onClick={() => onHelpRequested(artifactName)}
                    className="text-xs bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 px-4 py-2 rounded-lg border border-cyan-500/30 transition-all font-bold flex items-center gap-2"
                  >
                    Start Working <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
