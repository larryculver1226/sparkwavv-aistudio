import React from 'react';
import { motion } from 'motion/react';
import { Target, ArrowUpRight, Zap } from 'lucide-react';
import { MarketSignal } from '../../../types/dashboard';

export const ResonanceWidget: React.FC<{ signals: MarketSignal[] }> = ({ signals }) => {
  return (
    <div className="h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-white tracking-tight uppercase">Primary Resonance</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Top DNA Matches</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-neon-cyan/20 border border-neon-cyan/30 text-[10px] font-bold text-neon-cyan uppercase tracking-widest">
          {signals.length} Signals
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
        {signals.map((signal, idx) => (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-neon-cyan/30 transition-all cursor-pointer relative overflow-hidden"
          >
            {/* Resonance Score Badge */}
            <div className="absolute top-0 right-0 p-4">
              <div className="text-2xl font-display font-bold text-neon-cyan neon-text-cyan">
                {signal.resonanceScore}%
              </div>
              <p className="text-[8px] text-neon-cyan/60 uppercase tracking-tighter text-right font-bold">Resonance</p>
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-display font-bold text-white group-hover:text-neon-cyan transition-colors">{signal.title}</h4>
              <p className="text-sm text-white/40 font-medium">{signal.company} • {signal.location}</p>
            </div>

            <div className="flex items-center gap-6 mb-4">
              <div className="flex flex-col">
                <span className="text-[8px] text-white/20 uppercase font-bold tracking-widest mb-1">Values</span>
                <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${signal.dnaAlignment.values}%` }}
                    className="h-full bg-neon-magenta" 
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-white/20 uppercase font-bold tracking-widest mb-1">Capabilities</span>
                <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${signal.dnaAlignment.capabilities}%` }}
                    className="h-full bg-neon-cyan" 
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-white/20 uppercase font-bold tracking-widest mb-1">Trajectory</span>
                <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${signal.dnaAlignment.trajectory}%` }}
                    className="h-full bg-neon-lime" 
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {signal.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] text-white/40 uppercase tracking-tighter">
                    #{tag}
                  </span>
                ))}
              </div>
              <button className="p-2 rounded-lg bg-white/5 text-white/40 group-hover:bg-neon-cyan group-hover:text-black transition-all">
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
