import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Sparkles } from 'lucide-react';
import { NarrativeStage } from '../../../hooks/useWavvaultExplorer';

interface IntroSequenceProps {
  stage: NarrativeStage;
}

export const IntroSequence: React.FC<IntroSequenceProps> = ({ stage }) => {
  if (stage === 'complete') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 text-center overflow-hidden"
      >
        {/* Background Particles for Intro */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                opacity: 0,
              }}
              animate={{
                y: [null, Math.random() * -200],
                opacity: [0, 0.3, 0],
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
              className="absolute w-1 h-1 bg-neon-cyan rounded-full blur-[1px]"
            />
          ))}
        </div>

        <div className="relative w-80 h-80 mb-16">
          <AnimatePresence mode="wait">
            {stage === 'sequencing' && (
              <motion.div
                key="seq"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-full h-full border border-neon-cyan/20 rounded-full animate-spin-slow" />
                <div className="absolute inset-4 border border-neon-cyan/10 rounded-full animate-spin-slow-reverse" />
                <Database className="w-20 h-20 text-neon-cyan animate-pulse" />
                <div className="absolute -bottom-16 font-mono text-[10px] text-neon-cyan tracking-[0.4em] uppercase font-black">
                  Sequencing Professional Signals...
                </div>
              </motion.div>
            )}
            {stage === 'mapping' && (
              <motion.div
                key="map"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="grid grid-cols-4 gap-4">
                  {[...Array(16)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: [0, 1, 0.5], scale: [0, 1.2, 1] }}
                      transition={{ delay: i * 0.05 }}
                      className="w-4 h-4 bg-neon-cyan/40 rounded-sm shadow-[0_0_10px_rgba(0,243,255,0.3)]"
                    />
                  ))}
                </div>
                <div className="absolute -bottom-16 font-mono text-[10px] text-neon-cyan tracking-[0.4em] uppercase font-black">
                  Mapping Career DNA Nodes...
                </div>
              </motion.div>
            )}
            {stage === 'spark' && (
              <motion.div
                key="spark"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-48 h-48 bg-neon-cyan rounded-full blur-[80px]"
                />
                <Sparkles className="w-32 h-32 text-white drop-shadow-[0_0_30px_rgba(0,243,255,1)]" />
                <div className="absolute -bottom-16 font-mono text-[10px] text-white tracking-[0.4em] uppercase font-black">
                  Spark Core Identified
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          className="max-w-xl space-y-8 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="space-y-2">
            <h2 className="text-4xl font-display font-bold italic text-white tracking-tighter">
              {stage === 'sequencing' && 'Accessing the Treasury'}
              {stage === 'mapping' && 'Synthesizing Inferences'}
              {stage === 'spark' && 'Your Professional Essence'}
            </h2>
            <div className="h-px w-24 bg-neon-cyan mx-auto opacity-50" />
          </div>

          {/* Skylar Dialogue Box */}
          <div className="relative p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-neon-cyan text-black text-[10px] font-black uppercase tracking-widest rounded-full">
              Skylar Transmission
            </div>
            <p className="text-lg text-white/70 leading-relaxed font-serif italic">
              {stage === 'sequencing' &&
                "I'm decrypting your professional history into a sovereign, immutable ledger. Every achievement is a signal."}
              {stage === 'mapping' &&
                "I'm identifying the latent connections between your past achievements and your future potential. The pattern is emerging."}
              {stage === 'spark' &&
                "The core of your professional identity has been distilled. This is the 'Spark' that will ignite your next chapter. Welcome home."}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
