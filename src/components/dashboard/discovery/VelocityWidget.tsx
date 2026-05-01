import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { ResonanceHistory } from '../../../types/dashboard';

export const VelocityWidget: React.FC<{ history: ResonanceHistory[] }> = ({ history }) => {
  const velocities = useMemo(() => {
    if (!history || history.length === 0) return [];
    
    return history.slice(0, 2).map((item) => {
      const len = item.dataPoints.length;
      let diff = 0;
      if (len >= 2) {
        const last = item.dataPoints[len - 1].score;
        const prev = item.dataPoints[len - 2].score;
        diff = ((last - prev) / prev) * 100;
      }
      return {
        industry: item.industry,
        velocity: diff.toFixed(1),
        isPositive: diff >= 0
      };
    });
  }, [history]);

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
          {velocities.length > 0 ? (
            velocities.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm text-white/80 font-bold">{item.industry}</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">
                    Global Demand
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-display font-bold ${item.isPositive ? 'text-neon-lime' : 'text-neon-magenta'}`}>
                    {item.isPositive ? '+' : ''}{item.velocity}%
                  </span>
                  <ArrowUpRight className={`w-4 h-4 ${item.isPositive ? 'text-neon-lime' : 'text-neon-magenta opacity-60 rotate-[90deg]'}`} />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-white/40 italic text-sm py-4">No velocity data tracked yet</div>
          )}
        </div>

        <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-[10px] text-white/60 leading-relaxed italic">
            "Market signals adapt dynamically. Stay tuned to your top velocity sectors aligning with your latest DNA."
          </p>
        </div>
      </div>
    </div>
  );
};
