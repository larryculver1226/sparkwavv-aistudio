import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { audioService } from '../../services/audioService';

interface CinematicScene {
  title: string;
  subtitle: string;
  visual_theme: string;
  duration_ms?: number;
}

interface CinematicTeaserOverlayProps {
  scenes: CinematicScene[];
  onComplete: () => void;
}

export const CinematicTeaserOverlay: React.FC<CinematicTeaserOverlayProps> = ({ scenes, onComplete }) => {
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);

  useEffect(() => {
    if (scenes.length === 0) {
      onComplete();
      return;
    }

    // Play sound on component mount & scene change
    if (currentSceneIdx === 0) {
        audioService.playFusionFlare();
    } else {
        audioService.playChime();
    }

    const currentScene = scenes[currentSceneIdx];
    const duration = currentScene.duration_ms || 4000;

    const timer = setTimeout(() => {
      if (currentSceneIdx < scenes.length - 1) {
        setCurrentSceneIdx(prev => prev + 1);
      } else {
        onComplete();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [currentSceneIdx, scenes, onComplete]);

  if (scenes.length === 0) return null;

  const scene = scenes[currentSceneIdx];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSceneIdx}
          className={`absolute inset-0 bg-gradient-to-br ${scene.visual_theme} opacity-30`}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.3, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
        />
      </AnimatePresence>

      {/* Abstract Grid/Particles for Cinematic Feel */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
      
      <div className="relative z-10 w-full max-w-4xl px-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentSceneIdx}`}
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="space-y-6"
          >
            <Sparkles className="w-12 h-12 text-neon-cyan mx-auto mb-8 animate-pulse" />
            <h2 className="text-5xl md:text-7xl font-display font-bold text-white tracking-tight leading-tight">
              {scene.title}
            </h2>
            <p className="text-xl md:text-3xl font-serif text-white/70 italic max-w-2xl mx-auto">
              {scene.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        onClick={onComplete}
        className="absolute bottom-8 right-8 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-20 text-sm tracking-widest uppercase font-bold"
      >
        Skip Teaser <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
