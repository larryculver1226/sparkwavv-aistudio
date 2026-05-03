import React from 'react';
import { motion } from 'motion/react';
import { Target, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { WavvaultData } from '../../types/wavvault';

interface ActionCenterProps {
  currentStage: string;
  onActionClick: (actionId: string) => void;
  wavvaultData?: WavvaultData | null;
}

export const ActionCenter: React.FC<ActionCenterProps> = ({ currentStage, onActionClick, wavvaultData }) => {
  // Check completion status based on WavvaultData
  const hasStrengths = wavvaultData?.strengths && wavvaultData.strengths.length > 0;
  const hasIdentity = !!wavvaultData?.identity;
  const hasResume = wavvaultData?.artifacts?.some(a => a.type === 'live_resume' || a.type === 'brand-pillar');
  const hasPortfolio = wavvaultData?.artifacts?.some(a => a.type === 'interactive_portfolio' || a.type === 'spark');
  const hasOutreach = wavvaultData?.artifacts?.some(a => a.type === 'manifesto' || a.type === 'outreach_sequence');

  // Define phase-specific actions and gaps
  const phaseData: Record<string, { title: string; actions: any[]; gaps: any[] }> = {
    'Ignition': {
      title: 'Ignition Actions',
      actions: [
        { id: 'strengths', label: 'Complete Strengths Assessment', status: hasStrengths ? 'completed' : 'pending' },
        { id: 'identity', label: 'Finalize Identity Clarity', status: hasIdentity ? 'completed' : 'pending' },
      ],
      gaps: [
        !hasStrengths ? { id: 'gap2', label: 'Strengths Alignment is low. Review your Gallup results.' } : null,
      ].filter(Boolean),
    },
    'Discovery': {
      title: 'Discovery Actions',
      actions: [
        { id: 'sector', label: 'Explore Sector Intelligence', status: 'pending' },
        { id: 'matches', label: 'Review Initial Job Matches', status: 'pending' },
      ],
      gaps: [
        { id: 'gap3', label: 'Market Resonance needs improvement. Refine your target roles.' },
      ],
    },
    'Branding': {
      title: 'Branding Actions',
      actions: [
        { id: 'resume', label: 'Synthesize Resume in Lab', status: hasResume ? 'completed' : 'pending' },
        { id: 'portfolio', label: 'Update Wavvault Artifacts', status: hasPortfolio ? 'completed' : 'pending' },
      ],
      gaps: [
        !hasResume ? { id: 'gap4', label: 'Narrative strength is weak. Generate a new Synthesis Narrative.' } : null,
      ].filter(Boolean),
    },
    'Outreach': {
      title: 'Outreach Actions',
      actions: [
        { id: 'forge', label: 'Create Outreach Sequence', status: hasOutreach ? 'completed' : 'pending' },
        { id: 'network', label: 'Engage 3 Target Connections', status: 'pending' },
      ],
      gaps: [
        !hasOutreach ? { id: 'gap5', label: 'No active applications tracked. Use the Outreach Forge.' } : null,
      ].filter(Boolean),
    },
  };

  const data = phaseData[currentStage] || phaseData['Ignition'];

  return (
    <div className="glass-panel p-8 rounded-[2rem] border border-neon-cyan/20 bg-black/60 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
        <Target className="w-32 h-32 text-neon-cyan" />
      </div>
      
      <div className="relative z-10">
        <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-3">
          <Target className="w-6 h-6 text-neon-cyan" />
          Action Center: {data.title}
        </h3>

        <div className="space-y-8">
          {/* Required Actions */}
          <div>
            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
              Required to Unlock Next Gate
            </h4>
            <div className="space-y-3">
              {data.actions.map((action, i) => (
                <button
                  key={action.id || `action-${i}`}
                  onClick={() => onActionClick(action.id)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    {action.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-neon-cyan" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-white/20 group-hover:border-neon-cyan transition-colors" />
                    )}
                    <span className={`text-sm font-medium ${action.status === 'completed' ? 'text-white/40 line-through' : 'text-white/80'}`}>
                      {action.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-neon-cyan transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Identified Gaps */}
          {data.gaps.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-neon-magenta/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Identified Gaps
              </h4>
              <div className="space-y-3">
                {data.gaps.map((gap) => (
                  <div key={gap.id} className="p-4 rounded-xl bg-neon-magenta/5 border border-neon-magenta/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-neon-magenta shrink-0 mt-0.5" />
                    <p className="text-sm text-white/70 leading-relaxed">{gap.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
