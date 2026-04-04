import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, X } from 'lucide-react';

interface SkylarCommitSuggestionProps {
  show: boolean;
  reason: string;
  onCommit: () => void;
  onDismiss: () => void;
}

const SkylarCommitSuggestion: React.FC<SkylarCommitSuggestionProps> = ({
  show,
  reason,
  onCommit,
  onDismiss,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-8 right-8 z-[100] max-w-md"
        >
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl overflow-hidden relative group">
            {/* Animated Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-400/20 blur-[60px] group-hover:bg-green-400/30 transition-colors duration-500" />

            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors opacity-50 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-400/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-green-400" />
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-bold text-white tracking-tight">Skylar Insight</h4>
                <p className="text-sm text-white/70 leading-relaxed">{reason}</p>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    onClick={onCommit}
                    className="px-6 py-2 bg-green-400 text-black font-bold rounded-full text-sm hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    Commit Version 2.0
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onDismiss}
                    className="text-xs text-white/40 hover:text-white/60 transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SkylarCommitSuggestion;
