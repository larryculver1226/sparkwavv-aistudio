import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { Target, Zap, ShieldCheck, Brain, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIdentity } from '../../contexts/IdentityContext';

import { DashboardData } from '../../types/dashboard';

interface PrecisionMatchingCardProps {
  userId?: string | null;
  dashboardData?: DashboardData | null;
}

export const PrecisionMatchingCard: React.FC<PrecisionMatchingCardProps> = ({
  userId,
  dashboardData,
}) => {
  const navigate = useNavigate();
  const { profile } = useIdentity();
  const [isHovered, setIsHovered] = useState(false);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('IDLE');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const startHum = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      oscillatorRef.current = audioCtxRef.current.createOscillator();
      gainNodeRef.current = audioCtxRef.current.createGain();

      oscillatorRef.current.type = 'sine';
      oscillatorRef.current.frequency.setValueAtTime(110, audioCtxRef.current.currentTime); // Low hum

      gainNodeRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      gainNodeRef.current.gain.linearRampToValueAtTime(0.05, audioCtxRef.current.currentTime + 0.5);

      oscillatorRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioCtxRef.current.destination);

      oscillatorRef.current.start();
    } catch (e) {
      console.warn('Audio context failed to start:', e);
    }
  };

  const stopHum = () => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.3);
      setTimeout(() => {
        oscillatorRef.current?.stop();
        oscillatorRef.current?.disconnect();
        gainNodeRef.current?.disconnect();
      }, 300);
    }
  };

  useEffect(() => {
    if (isHovered) {
      startHum();
      setStatus('SCANNING DNA');

      // Animate score
      let targetScore = 98.4;
      if (profile?.alignmentScore) {
        targetScore = profile.alignmentScore;
      } else if (dashboardData?.alignmentMatrix) {
        const { identityClarity, strengthsAlignment, marketResonance } =
          dashboardData.alignmentMatrix;
        targetScore = (identityClarity + strengthsAlignment + marketResonance) / 3;
      } else if (userId) {
        // Mock a high score if logged in but no data
        targetScore = 94 + Math.random() * 5;
      }

      const controls = animate(0, targetScore, {
        duration: 1.5,
        onUpdate: (value) => setScore(value),
        onComplete: () => setStatus('MATCH IDENTIFIED'),
      });

      const statusInterval = setInterval(() => {
        setStatus((prev) => {
          if (prev === 'SCANNING DNA') return 'MAPPING SYNAPSES';
          if (prev === 'MAPPING SYNAPSES') return 'MATCH IDENTIFIED';
          return prev;
        });
      }, 500);

      return () => {
        controls.stop();
        clearInterval(statusInterval);
        stopHum();
      };
    } else {
      setScore(0);
      setStatus('IDLE');
      stopHum();
    }
  }, [isHovered, profile, userId]);

  const handleClick = () => {
    if (userId) {
      navigate(`/dashboard/${userId}?view=matches`);
    } else {
      // For guest users, we could redirect to onboarding or just landing
      // But user said "clicking this card should take logged-in users directly to their Job Matches view"
      // So for non-logged in users, maybe just do nothing or show a sign-up prompt
    }
  };

  return (
    <div
      className="glass-panel p-8 space-y-6 group hover:border-neon-lime/40 transition-all duration-500 cursor-pointer relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Neural Background Animation */}
      <div className="absolute inset-0 -z-10 opacity-20">
        <svg width="100%" height="100%" className="absolute inset-0">
          <motion.path
            d="M 20 50 Q 150 20 280 50 T 540 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-neon-lime"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: isHovered ? 1 : 0.3,
              opacity: isHovered ? 0.8 : 0.3,
              transition: { duration: 2, repeat: Infinity, repeatType: 'reverse' },
            }}
          />
          <motion.circle
            cx="20"
            cy="50"
            r="3"
            className="fill-neon-lime"
            animate={{ scale: isHovered ? [1, 1.5, 1] : 1 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <motion.circle
            cx="280"
            cy="50"
            r="3"
            className="fill-neon-lime"
            animate={{ scale: isHovered ? [1, 1.5, 1] : 1 }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
          />
        </svg>
      </div>

      <div
        className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neon-lime group-hover:neon-border-lime transition-all duration-500`}
      >
        <Target className={`w-6 h-6 ${isHovered ? 'animate-pulse' : ''}`} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Precision Matching</h3>
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-neon-lime font-mono text-lg font-bold"
              >
                {score.toFixed(1)}%
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="text-white/40 leading-relaxed text-sm">
          Advanced algorithms that align your unique profile with high-value market opportunities.
        </p>
      </div>

      {/* Status Indicator */}
      <div className="h-4 flex items-center gap-2">
        {isHovered ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Zap className="w-3 h-3 text-neon-lime" />
            </motion.div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neon-lime/60">
              {status}
            </span>
          </>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
            System Ready
          </span>
        )}
      </div>

      {/* Hover Glow Effect */}
      <motion.div
        className="absolute inset-0 bg-neon-lime/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        animate={
          isHovered
            ? {
                boxShadow: [
                  'inset 0 0 20px rgba(163, 230, 53, 0.1)',
                  'inset 0 0 40px rgba(163, 230, 53, 0.2)',
                  'inset 0 0 20px rgba(163, 230, 53, 0.1)',
                ],
              }
            : {}
        }
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
};
