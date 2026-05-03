import React from 'react';
import { CheckCircle2, Circle, ChevronRight, Lock } from 'lucide-react';
import { Milestone } from '../../types/dashboard';

interface MilestoneRoadmapProps {
  milestones: Milestone[];
  currentWeek: number;
  onToggleMilestone: (id: string) => void;
  validationGateMode: 'soft-warning' | 'hard-block';
  rppValidated: boolean;
}

export const MilestoneRoadmap: React.FC<MilestoneRoadmapProps> = ({
  milestones,
  currentWeek,
  onToggleMilestone,
  validationGateMode,
  rppValidated,
}) => {
  const completedCount = milestones.length > 0 ? milestones.filter((m) => m.completed).length : 0;
  const progress = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  // Logic for the Validation Gate (Week 4)
  const isLocked = (milestone: Milestone) => {
    if (validationGateMode === 'hard-block' && milestone.week > 4 && !rppValidated) {
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">
            Kickspark 12-Week Roadmap
          </h3>
          <p className="text-xs text-white/20 mt-1">
            Systemic transition through five critical phases
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-display font-bold text-neon-cyan">
            {Math.round(progress)}%
          </span>
          <p className="text-[10px] text-white/40 uppercase font-bold">Complete</p>
        </div>
      </div>

      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-neon-cyan transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => {
          const week = i + 1;
          const weekMilestones = milestones.filter((m) => m.week === week);
          const isCurrentWeek = week === currentWeek;
          const isPastWeek = week < currentWeek;

          return (
            <div
              key={i}
              className={`p-4 rounded-2xl border transition-all ${
                isCurrentWeek
                  ? 'bg-neon-cyan/10 border-neon-cyan/30 ring-1 ring-neon-cyan/20'
                  : isPastWeek
                    ? 'bg-white/[0.02] border-white/10'
                    : 'bg-white/[0.01] border-white/5 opacity-40'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-[10px] uppercase font-bold ${isCurrentWeek ? 'text-neon-cyan' : 'text-white/40'}`}
                >
                  Week {week}
                </span>
                {isCurrentWeek && (
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                )}
              </div>

              <div className="space-y-2">
                {weekMilestones.map((m) => {
                  const locked = isLocked(m);
                  return (
                    <button
                      key={m.id}
                      disabled={locked}
                      onClick={() => onToggleMilestone(m.id)}
                      className={`w-full flex items-center gap-2 text-left group transition-all ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {locked ? (
                        <Lock className="w-3 h-3 text-neon-magenta/50" />
                      ) : m.completed ? (
                        <CheckCircle2 className="w-3 h-3 text-neon-cyan" />
                      ) : (
                        <Circle className="w-3 h-3 text-white/20 group-hover:text-white/40" />
                      )}
                      <span
                        className={`text-[11px] font-medium truncate ${
                          locked
                            ? 'text-white/10'
                            : m.completed
                              ? 'text-white/80'
                              : 'text-white/40 group-hover:text-white/60'
                        }`}
                      >
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {validationGateMode === 'soft-warning' && !rppValidated && completedCount >= 4 && (
        <div className="p-4 rounded-2xl bg-neon-magenta/5 border border-neon-magenta/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-neon-magenta/10 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-neon-magenta" />
          </div>
          <div>
            <p className="text-xs font-bold text-neon-magenta">Skylar's Warning: Validation Gate</p>
            <p className="text-[10px] text-white/40 leading-relaxed">
              "You've completed the Discovery phase, but your 'Five Stories' haven't been validated
              by an RPP. While you can proceed, I strongly recommend getting objective validation to
              prevent solitary-confinement bias."
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
