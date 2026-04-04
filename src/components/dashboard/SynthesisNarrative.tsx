import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  SkipForward,
  Zap,
  Brain,
  Database,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { UserInsight } from '../../types/dashboard';
import { EvolutionVisualizer } from '../EvolutionVisualizer';
import { audioService } from '../../services/audioService';

interface SynthesisNarrativeProps {
  insights: UserInsight[];
  onComplete: () => void;
}

export const SynthesisNarrative: React.FC<SynthesisNarrativeProps> = ({ insights, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [narrativeText, setNarrativeText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const currentInsight = insights[currentIndex];

  useEffect(() => {
    // Start ambient hum
    audioService.startAmbientHum();
    return () => audioService.stopAmbientHum();
  }, []);

  useEffect(() => {
    if (!currentInsight || isPaused) return;

    // Play chime for new insight
    audioService.playChime();

    // Generate narrative text (simulated Skylar voice)
    const text = `I've synthesized a new signal from your Wavvault. This ${currentInsight.type.replace('_', ' ')} marker suggests: ${currentInsight.content}. It correlates with your existing DNA filaments.`;

    setNarrativeText('');
    setIsTyping(true);

    let i = 0;
    const interval = setInterval(() => {
      setNarrativeText((prev) => prev + text[i]);
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setIsTyping(false);

        // Auto-advance after a delay if not paused
        if (!isPaused) {
          setTimeout(() => {
            if (currentIndex < insights.length - 1) {
              setCurrentIndex((prev) => prev + 1);
            } else {
              // Final flare before completing
              audioService.playFusionFlare();
              setTimeout(onComplete, 2000);
            }
          }, 4000);
        }
      }
    }, 30);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, insights, onComplete]);

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      audioService.stopAmbientHum();
    } else {
      audioService.startAmbientHum();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-12 overflow-hidden"
    >
      {/* Cinematic Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,243,255,0.1),transparent_70%)]" />
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-emerald-500/5 blur-[150px] animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-cyan-500/5 blur-[150px] animate-pulse delay-1000" />
      </div>

      {/* Header Controls */}
      <div className="absolute top-12 left-12 right-12 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
            <Brain className="w-6 h-6 text-neon-cyan animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-white tracking-tight uppercase">
              Skylar Synthesis
            </h3>
            <p className="text-[10px] text-neon-cyan font-bold uppercase tracking-[0.3em]">
              Ignition Phase Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={togglePause}
            className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all"
          >
            {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
          </button>
          <button
            onClick={onComplete}
            className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content: Visualizer */}
      <div className="w-full max-w-6xl aspect-video relative z-10 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-black/40">
        <EvolutionVisualizer insights={insights} />

        {/* Narrative Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
          <div className="max-w-3xl">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-neon-cyan/20 border border-neon-cyan/30 text-[10px] font-bold text-neon-cyan uppercase tracking-widest">
                  {currentInsight?.type.replace('_', ' ')}
                </div>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <p className="text-2xl font-display font-medium text-white/90 leading-relaxed min-h-[6rem]">
                {narrativeText}
                {isTyping && (
                  <span className="inline-block w-1 h-6 bg-neon-cyan ml-1 animate-pulse" />
                )}
              </p>

              <div className="flex items-center gap-8 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Signal Source: {currentInsight?.evidence || 'Synthesized DNA'}
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-neon-cyan" />
                  Correlation: High
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
        {insights.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 transition-all duration-500 rounded-full ${idx === currentIndex ? 'w-12 bg-neon-cyan' : 'w-4 bg-white/10'}`}
          />
        ))}
      </div>

      {/* Ambient Visuals */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[conic-gradient(from_0deg,transparent,rgba(0,243,255,0.05),transparent)] animate-[spin_20s_linear_infinite]" />
      </div>
    </motion.div>
  );
};
