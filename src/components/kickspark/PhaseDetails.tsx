import React from 'react';
import { Milestone } from '../../types/dashboard';
import { CheckCircle2, Circle, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface PhaseDetailsProps {
  stage: string;
  milestones: Milestone[];
  onToggleMilestone: (id: string) => void;
  onViewRoadmap: () => void;
  onCompletePhase?: (nextStage: string) => void;
}

export const PhaseDetails: React.FC<PhaseDetailsProps> = ({ stage, milestones, onToggleMilestone, onViewRoadmap, onCompletePhase }) => {
  // Map stage to week ranges
  const getWeekRange = (s: string) => {
    switch (s) {
      case 'Dive-In': return [1, 2];
      case 'Ignition': return [3, 4];
      case 'Discovery': return [5, 6];
      case 'Branding': return [7, 9];
      case 'Outreach': return [10, 12];
      default: return [1, 12];
    }
  };

  const getNextStage = (s: string) => {
    const stages = ['Dive-In', 'Ignition', 'Discovery', 'Branding', 'Outreach'];
    const idx = stages.indexOf(s);
    if (idx !== -1 && idx < stages.length - 1) {
      return stages[idx + 1];
    }
    return null;
  };

  const [start, end] = getWeekRange(stage);
  const phaseMilestones = milestones.filter(m => m.week >= start && m.week <= end);
  const isPhaseComplete = phaseMilestones.length > 0 && phaseMilestones.every(m => m.completed);
  const nextStage = getNextStage(stage);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-black/40"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xs font-bold text-neon-cyan uppercase tracking-[0.3em] mb-2">Current Phase Details</h3>
          <h2 className="text-2xl font-display font-bold text-white">{stage} Phase</h2>
        </div>
        <div className="flex items-center gap-3">
          {isPhaseComplete && nextStage && onCompletePhase && (
            <button 
              onClick={() => onCompletePhase(nextStage)}
              className="px-4 py-2 rounded-xl bg-neon-lime text-black text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform"
            >
              Complete Phase
            </button>
          )}
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest">
            Weeks {start}-{end}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {phaseMilestones.length > 0 ? (
          phaseMilestones.map((m) => (
            <div 
              key={m.id}
              className={`p-5 rounded-2xl border transition-all ${
                m.completed 
                  ? 'bg-neon-cyan/5 border-neon-cyan/20' 
                  : 'bg-white/[0.02] border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Week {m.week}</span>
                <button 
                  onClick={() => onToggleMilestone(m.id)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    m.completed ? 'bg-neon-cyan text-black' : 'bg-white/5 text-white/20 hover:text-white/40'
                  }`}
                >
                  {m.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                </button>
              </div>
              <p className={`text-sm font-medium leading-relaxed ${m.completed ? 'text-white/80' : 'text-white/40'}`}>
                {m.label}
              </p>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center">
            <p className="text-white/20 italic text-sm">No specific milestones identified for this phase yet.</p>
          </div>
        )}
      </div>

      <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-neon-cyan/10 flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-neon-cyan" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Next Step</p>
            <p className="text-sm font-bold text-white">Complete all {stage} milestones to unlock the next phase.</p>
          </div>
        </div>
        <button 
          onClick={onViewRoadmap}
          className="px-6 py-3 rounded-xl bg-neon-cyan text-black text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform"
        >
          View Full Roadmap
        </button>
      </div>
    </motion.div>
  );
};
