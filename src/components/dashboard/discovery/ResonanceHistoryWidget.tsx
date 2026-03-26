import React from 'react';
import { motion } from 'motion/react';
import { Compass, TrendingUp } from 'lucide-react';
import { ResonanceHistory } from '../../../types/dashboard';

export const ResonanceHistoryWidget: React.FC<{ history: ResonanceHistory[] }> = ({ history }) => {
  return (
    <div className="h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
            <Compass className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-white tracking-tight uppercase">Resonance History</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">DNA Evolution Over Time</p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {history.map((item, idx) => (
          <motion.div
            key={item.industry}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between"
          >
            <div className="mb-6">
              <h4 className="text-sm font-bold text-white mb-1">{item.industry}</h4>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Industry Focus</p>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div className="flex-1 flex items-end gap-1 h-12">
                {item.dataPoints.map((dp, sIdx) => (
                  <div key={sIdx} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${dp.score}%` }}
                      className={`w-full rounded-t-sm ${sIdx === item.dataPoints.length - 1 ? 'bg-neon-cyan' : 'bg-white/10'}`} 
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-display font-bold text-white">{Math.round(item.dataPoints[item.dataPoints.length - 1].score)}%</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-neon-lime" />
                  <span className="text-[10px] font-bold text-neon-lime">+8%</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
