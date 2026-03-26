import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Volume2, VolumeX, X, Zap, Clock, RefreshCw, Heart, Brain, Coffee } from 'lucide-react';
import { skylar, SkylarPersona } from '../../services/skylarService';
import { useIdentity } from '../../contexts/IdentityContext';

interface EveningSparkProps {
  energyTrough?: { start: string; end: string };
  onClose: () => void;
}

export const EveningSpark: React.FC<EveningSparkProps> = ({ energyTrough, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('evening_spark_dismissed') === 'true';
    }
    return false;
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoplayFailed, setAutoplayFailed] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'relax' | 'refresh' | 'review' | 'reflect'>('relax');
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user } = useIdentity();

  useEffect(() => {
    if (!energyTrough || isDismissed) return;

    const checkTime = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (currentTime >= energyTrough.start && currentTime <= energyTrough.end && !isActive) {
        setIsActive(true);
        startSession();
      }
    };

    const interval = setInterval(checkTime, 60000); // Check every minute
    checkTime(); // Initial check

    return () => clearInterval(interval);
  }, [energyTrough, isActive, isDismissed]);

  const startSession = async () => {
    const text = "Hello! It's your scheduled Energy Trough. I'm Skylar, your Soft Coach. Instead of pushing through, let's take a moment to reboot. We'll start with a quick relaxation exercise.";
    try {
      const audioUrl = await skylar.generateSpeech(text, 'branding'); // Zephyr voice
      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(err => {
          console.warn("Audio play failed (user interaction required):", err);
          setIsSpeaking(false);
          setAutoplayFailed(true);
        });
        setIsSpeaking(true);
      }
    } catch (error) {
      console.error("Error starting evening spark:", error);
    }
  };

  const handlePhaseChange = async (phase: typeof currentPhase) => {
    setCurrentPhase(phase);
    setAutoplayFailed(false);
    const texts = {
      relax: "Close your eyes and focus on your breath. Let the tension in your shoulders melt away.",
      refresh: "Take a quick walk or stretch. Move your body to reinvigorate your mind.",
      review: "Let's look at your progress today. You've made significant strides in your Discovery phase.",
      reflect: "Think about your 'Heroic Deed'. What does it truly say about your legacy?"
    };

    try {
      const audioUrl = await skylar.generateSpeech(texts[phase], 'branding');
      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(err => {
          console.warn("Audio play failed (user interaction required):", err);
          setIsSpeaking(false);
        });
        setIsSpeaking(true);
      }
    } catch (error) {
      console.error("Error changing phase:", error);
    }
  };

  if (!isActive || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Meditation Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/10 to-transparent opacity-30" />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-neon-cyan/20 blur-[120px]"
          />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
        </div>

        <button 
          onClick={() => { 
            setIsActive(false); 
            setIsDismissed(true);
            sessionStorage.setItem('evening_spark_dismissed', 'true');
            onClose(); 
          }}
          className="absolute top-8 right-8 z-10 p-4 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative z-10 text-center space-y-12 max-w-2xl px-8">
          <div className="space-y-4">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 rounded-full border-2 border-dashed border-neon-cyan/30 flex items-center justify-center mx-auto"
            >
              <Sparkles className="w-10 h-10 text-neon-cyan" />
            </motion.div>
            <h2 className="text-4xl font-display font-bold text-white tracking-tight">Evening Spark Session</h2>
            <p className="text-neon-cyan/60 font-bold uppercase tracking-[0.2em] text-xs">Energy Trough Reboot Active</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { id: 'relax', icon: Heart, label: 'Relax' },
              { id: 'refresh', icon: RefreshCw, label: 'Refresh' },
              { id: 'review', icon: Brain, label: 'Review' },
              { id: 'reflect', icon: Coffee, label: 'Reflect' }
            ].map(phase => (
              <button
                key={phase.id}
                onClick={() => handlePhaseChange(phase.id as any)}
                className={`p-6 rounded-3xl border transition-all flex flex-col items-center gap-3 ${
                  currentPhase === phase.id 
                    ? 'bg-neon-cyan border-neon-cyan text-black shadow-2xl shadow-neon-cyan/20' 
                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                }`}
              >
                <phase.icon className="w-6 h-6" />
                <span className="text-[10px] uppercase font-bold tracking-widest">{phase.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-12">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ height: isSpeaking ? [10, 30, 10] : 10 }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1 bg-neon-cyan/60 rounded-full"
                  />
                ))}
              </div>
              <span className="text-xs text-white/40 font-medium italic">
                {isSpeaking ? "Skylar is speaking..." : "Listening for your presence..."}
              </span>
            </div>
            <button 
              onClick={() => {
                if (isSpeaking) {
                  audioRef.current?.pause();
                  setIsSpeaking(false);
                } else {
                  handlePhaseChange(currentPhase);
                }
              }}
              className="p-6 rounded-full bg-white/5 text-white/60 hover:text-neon-cyan hover:bg-white/10 transition-all"
            >
              {isSpeaking ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
            </button>
            {autoplayFailed && !isSpeaking && (
              <div className="mt-4">
                <button 
                  onClick={() => { setAutoplayFailed(false); handlePhaseChange(currentPhase); }}
                  className="px-6 py-2 bg-neon-cyan text-black font-bold rounded-xl text-xs uppercase tracking-widest animate-bounce"
                >
                  Tap to Start Audio
                </button>
              </div>
            )}
          </div>
        </div>

        <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} hidden />
      </motion.div>
    </AnimatePresence>
  );
};
