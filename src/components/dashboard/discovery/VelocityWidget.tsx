import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

export const VelocityWidget: React.FC = () => {
  return (
    <div className="h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-magenta/10 border border-neon-magenta/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-neon-magenta" />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-white tracking-tight uppercase">
              Market Velocity
            </h3>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
              Industry Momentum
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-white/80 font-bold">AI Strategy</span>
              <span className="text-[10px] text-white/40 uppercase tracking-widest">
                Global Demand
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-display font-bold text-neon-lime">+24%</span>
              <ArrowUpRight className="w-4 h-4 text-neon-lime" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-white/80 font-bold">FinTech Innovation</span>
              <span className="text-[10px] text-white/40 uppercase tracking-widest">
                Global Demand
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-display font-bold text-neon-cyan">+12%</span>
              <ArrowUpRight className="w-4 h-4 text-neon-cyan" />
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-[10px] text-white/60 leading-relaxed italic">
            "Market signals indicate a significant surge in AI Strategy roles matching your DNA.
            Your velocity is currently 15% above the industry average."
          </p>
        </div>
      </div>
    </div>
  );
};
