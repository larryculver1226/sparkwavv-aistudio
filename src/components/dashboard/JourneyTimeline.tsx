import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, Search as SearchIcon, Compass, Handshake, Lock, CheckCircle2 } from 'lucide-react';

export const JourneyTimeline: React.FC<{ stage: string }> = ({ stage }) => {
  const stages = [
    { id: 'Dive-In', label: 'Dive-In', icon: Sparkles, desc: 'WEEKS 1-2' },
    { id: 'Ignition', label: 'Ignition', icon: Zap, desc: 'WEEKS 3-4' },
    { id: 'Discovery', label: 'Discovery', icon: SearchIcon, desc: 'WEEKS 5-6' },
    { id: 'Branding', label: 'Branding', icon: Compass, desc: 'WEEKS 7-9' },
    { id: 'Outreach', label: 'Outreach', icon: Handshake, desc: 'WEEKS 10-12' },
  ];

  const currentIndex = stages.findIndex((s) => s.id === stage);
  const progress = currentIndex === -1 ? 0 : (currentIndex / (stages.length - 1)) * 100;

  return (
    <div className="w-full py-12">
      {/* Labels Layer */}
      <div className="flex justify-between items-end mb-12 px-12 relative">
        {stages.map((s, i) => {
          const isCurrent = i === currentIndex;
          const isCompleted = i < currentIndex;
          const isNext = i === currentIndex + 1;

          return (
            <div
              key={s.id}
              className={`flex flex-col items-center gap-2 relative z-10 w-32 ${isNext ? 'cursor-pointer group' : ''}`}
              onClick={() => isNext && (window as any).initiateGateReview?.(s.id)}
            >
              <div className="flex flex-col items-center">
                <span
                  className={`font-display font-bold italic transition-all duration-700 text-center ${
                    isCurrent
                      ? 'text-neon-cyan text-5xl mb-2 drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                      : isCompleted
                        ? 'text-white text-2xl opacity-90'
                        : 'text-white/20 text-2xl'
                  } ${isNext ? 'group-hover:text-neon-cyan/60' : ''}`}
                >
                  {s.label}
                </span>
                <span
                  className={`text-[10px] uppercase tracking-[0.2em] font-bold transition-colors duration-500 ${
                    isCurrent ? 'text-neon-cyan/60' : 'text-white/20'
                  }`}
                >
                  {s.desc}
                </span>
              </div>

              {isCurrent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 px-4 py-1.5 rounded-full bg-neon-cyan text-black font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,243,255,0.4)]"
                >
                  Active Phase
                </motion.div>
              )}

              {isNext && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 font-black uppercase tracking-widest group-hover:bg-neon-cyan group-hover:text-black group-hover:border-neon-cyan transition-all"
                >
                  Validation Gate
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      <div className="relative px-12 mt-20">
        {/* Background Track - Connecting the centers of the icons */}
        <div className="absolute top-1/2 left-[112px] right-[112px] h-1.5 bg-white/5 -translate-y-1/2 z-0">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="h-full bg-neon-cyan shadow-[0_0_15px_rgba(0,243,255,0.8)] relative"
          >
            {/* Glow effect at the tip of the progress */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-neon-cyan rounded-full blur-md" />
          </motion.div>
        </div>

        {/* Icons Layer */}
        <div className="relative flex justify-between items-center z-10">
          {stages.map((s, i) => {
            const isCurrent = i === currentIndex;
            const isCompleted = i < currentIndex;
            const isLocked = i > currentIndex;

            return (
              <div key={s.id} className="flex flex-col items-center w-32">
                <div
                  className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-700 relative ${
                    isCurrent
                      ? 'bg-black border-neon-cyan text-neon-cyan shadow-[0_0_40px_rgba(0,243,255,0.5)] scale-125 ring-8 ring-neon-cyan/5'
                      : isCompleted
                        ? 'bg-zinc-900/80 border-neon-cyan/30 text-neon-cyan/60'
                        : 'bg-zinc-900 border-white/5 text-white/10'
                  }`}
                >
                  {isLocked ? (
                    <Lock className="w-5 h-5 opacity-20" />
                  ) : (
                    <>
                      <s.icon className={`${isCurrent ? 'w-8 h-8' : 'w-6 h-6'}`} />
                      {isCompleted && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-neon-cyan rounded-full flex items-center justify-center border-2 border-black shadow-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-black font-bold" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
