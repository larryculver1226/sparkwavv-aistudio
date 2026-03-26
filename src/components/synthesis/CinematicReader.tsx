import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, ShieldCheck, Clock, Share2 } from 'lucide-react';
import { DistilledArtifact } from '../../types/wavvault';

interface CinematicReaderProps {
  artifact: DistilledArtifact | null;
  onClose: () => void;
}

export const CinematicReader: React.FC<CinematicReaderProps> = ({ artifact, onClose }) => {
  if (!artifact) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-2xl"
      >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl border border-neon-cyan/30 bg-[#0A0A0A] shadow-[0_0_50px_rgba(0,243,255,0.1)] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-[#1A1A1A] to-[#0A0A0A] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-neon-cyan/10 flex items-center justify-center text-neon-cyan border border-neon-cyan/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-white tracking-tight italic">{artifact.title}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-mono text-neon-cyan uppercase tracking-widest bg-neon-cyan/10 px-2 py-0.5 rounded border border-neon-cyan/20">
                      {artifact.type.replace('-', ' ')}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-white/40 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(artifact.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Immersive Content Area */}
          <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-12">
              {/* Visual Element if applicable */}
              {artifact.content.imageUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                >
                  <img
                    src={artifact.content.imageUrl}
                    alt={artifact.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </motion.div>
              )}

              {/* Text Content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="prose prose-invert prose-cyan max-w-none"
              >
                {typeof artifact.content === 'string' ? (
                  <p className="text-lg leading-relaxed text-white/80 font-serif italic">
                    "{artifact.content}"
                  </p>
                ) : (
                  <div className="space-y-8">
                    {artifact.content.quote && (
                      <blockquote className="border-l-4 border-neon-cyan pl-6 py-2">
                        <p className="text-2xl font-serif italic text-white/90 leading-relaxed">
                          {artifact.content.quote}
                        </p>
                      </blockquote>
                    )}
                    
                    {artifact.content.tagline && (
                      <p className="text-sm uppercase tracking-[0.3em] text-neon-cyan font-black">
                        {artifact.content.tagline}
                      </p>
                    )}

                    {artifact.content.description && (
                      <p className="text-lg text-white/70 leading-relaxed">
                        {artifact.content.description}
                      </p>
                    )}

                    {/* Render other structured content as needed */}
                    {Object.entries(artifact.content).map(([key, value]) => {
                      if (['imageUrl', 'quote', 'tagline', 'description'].includes(key)) return null;
                      if (typeof value === 'string') {
                        return (
                          <div key={key} className="space-y-2">
                            <h4 className="text-[10px] font-black text-neon-cyan uppercase tracking-widest">{key}</h4>
                            <p className="text-white/70">{value}</p>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-white/5 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-mono text-white/20">
              <ShieldCheck className="w-4 h-4 text-neon-cyan" />
              IMMUTABLE ARTIFACT // VERIFIED BY SKYLAR
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-xs font-bold transition-all">
                <Share2 className="w-4 h-4" />
                Share Artifact
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg bg-neon-cyan text-black font-black text-xs hover:shadow-[0_0_20px_rgba(0,243,255,0.3)] transition-all uppercase tracking-widest"
              >
                Close Reader
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
