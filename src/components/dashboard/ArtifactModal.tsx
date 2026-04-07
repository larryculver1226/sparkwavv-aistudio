import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Calendar, Tag } from 'lucide-react';
import { DistilledArtifact } from '../../types/wavvault';

interface ArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: DistilledArtifact | null;
}

export const ArtifactModal: React.FC<ArtifactModalProps> = ({ isOpen, onClose, artifact }) => {
  if (!artifact) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 p-6 md:p-8"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{artifact.title}</h2>
                <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {artifact.type.replace('-', ' ')}
                  </span>
                  {artifact.journeyPhase && (
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 uppercase tracking-wider text-[10px] font-bold">
                      {artifact.journeyPhase}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {artifact.content && (
                <div className="glass-panel p-6 rounded-xl border border-white/5 bg-black/40">
                  {typeof artifact.content === 'string' ? (
                    <p className="text-white/80 whitespace-pre-wrap text-sm leading-relaxed">
                      {artifact.content}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(artifact.content).map(([key, value]) => (
                        <div key={key}>
                          <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          <p className="text-white/80 text-sm leading-relaxed">
                            {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {artifact.metadata && Object.keys(artifact.metadata).length > 0 && (
                <div className="glass-panel p-6 rounded-xl border border-white/5 bg-black/40">
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">
                    Metadata
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(artifact.metadata).map(([key, value]) => (
                      <div key={key}>
                        <span className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">
                          {key}
                        </span>
                        <span className="text-sm text-white/80">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
