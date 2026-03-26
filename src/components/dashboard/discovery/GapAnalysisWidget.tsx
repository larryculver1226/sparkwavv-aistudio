import React from 'react';
import { motion } from 'motion/react';
import { Brain, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DNAGap } from '../../../types/dashboard';

export const GapAnalysisWidget: React.FC<{ gaps: DNAGap[] }> = ({ gaps }) => {
  return (
    <div className="h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-white tracking-tight uppercase">DNA Gap Analysis</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Bridge Skills</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
        {gaps.map((gap, idx) => (
          <motion.div
            key={gap.skill}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-neon-cyan/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white group-hover:text-neon-cyan transition-colors">{gap.skill}</h4>
              <div className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest border ${
                gap.importance === 'critical' ? 'bg-neon-magenta/10 border-neon-magenta/30 text-neon-magenta' :
                gap.importance === 'high' ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan' :
                'bg-white/10 border-white/20 text-white/40'
              }`}>
                {gap.importance}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${gap.currentLevel}%` }}
                  className="h-full bg-neon-cyan" 
                />
              </div>
              <div className="text-[10px] font-mono text-white/40">
                {gap.currentLevel}% / {gap.targetLevel}%
              </div>
            </div>

            {gap.learningPath && (
              <div className="space-y-2">
                <p className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Recommended Learning Path</p>
                {gap.learningPath.map((path, pIdx) => (
                  <div key={pIdx} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white/80 font-bold">{path.title}</span>
                      <span className="text-[8px] text-white/40 uppercase tracking-tighter">{path.provider}</span>
                    </div>
                    <CheckCircle2 className="w-3 h-3 text-white/20" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
