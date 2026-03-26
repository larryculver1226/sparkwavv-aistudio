import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Brain, Target, Zap, TrendingUp, Heart } from 'lucide-react';

interface SentimentMotivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    sentiment: number; // 0-100
    motivation: number; // 0-100
    topDrivers: string[];
    anxieties: string[];
    summary: string;
  };
}

export const SentimentMotivationModal: React.FC<SentimentMotivationModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-dark-surface border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-neon-magenta/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-neon-magenta/10 border border-neon-magenta/20 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-neon-magenta" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">Emotional Intelligence</h2>
                  <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Sentiment & Motivation Analysis</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Gauges */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-white/40">Current Sentiment</span>
                    <span className="text-xl font-display font-bold text-neon-cyan">{data.sentiment}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${data.sentiment}%` }}
                      className="h-full bg-neon-cyan shadow-[0_0_10px_rgba(0,243,255,0.5)]"
                    />
                  </div>
                  <p className="text-[10px] text-white/30 leading-relaxed italic">
                    Reflects the overall emotional tone of your recent interactions and narrative.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-white/40">Motivation Level</span>
                    <span className="text-xl font-display font-bold text-neon-magenta">{data.motivation}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${data.motivation}%` }}
                      className="h-full bg-neon-magenta shadow-[0_0_10px_rgba(255,0,255,0.5)]"
                    />
                  </div>
                  <p className="text-[10px] text-white/30 leading-relaxed italic">
                    Measures your drive and commitment to the current career trajectory.
                  </p>
                </div>
              </div>

              {/* Drivers & Anxieties */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-neon-lime">
                    <TrendingUp className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-widest">Top Drivers</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.topDrivers.map((driver, i) => (
                      <span key={i} className="px-3 py-1 rounded-lg bg-neon-lime/5 border border-neon-lime/20 text-neon-lime text-[10px] font-bold uppercase tracking-wider">
                        {driver}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-neon-magenta">
                    <Heart className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-widest">Potential Anxieties</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.anxieties.map((anxiety, i) => (
                      <span key={i} className="px-3 py-1 rounded-lg bg-neon-magenta/5 border border-neon-magenta/20 text-neon-magenta text-[10px] font-bold uppercase tracking-wider">
                        {anxiety}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Skylar's Summary */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-white/60">
                  <Zap className="w-4 h-4" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest">Skylar's EQ Insight</h3>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">
                  {data.summary}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-black/20 border-t border-white/5 text-center">
              <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
                Data synthesized from your Wavvault interactions
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
