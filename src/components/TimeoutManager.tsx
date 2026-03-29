import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { Button } from './Button';
import { useIdentity } from '../contexts/IdentityContext';

const INACTIVITY_TIMEOUT = 20 * 60 * 1000; // 20 minutes
const WARNING_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export const TimeoutManager: React.FC = () => {
  const { user, logout } = useIdentity();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WARNING_TIMEOUT / 1000);
  
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (showWarning) return; // Don't reset if warning is already showing

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      startWarningCountdown();
    }, INACTIVITY_TIMEOUT);
  }, [showWarning]);

  const startWarningCountdown = useCallback(() => {
    setTimeLeft(WARNING_TIMEOUT / 1000);
    
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    warningTimerRef.current = setTimeout(() => {
      logout();
    }, WARNING_TIMEOUT);

    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [logout]);

  const handleContinue = () => {
    setShowWarning(false);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    resetInactivityTimer();
  };

  useEffect(() => {
    if (!user) {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };

    events.forEach(event => window.addEventListener(event, handleActivity));
    resetInactivityTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [user, resetInactivityTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="max-w-md w-full glass-panel p-8 space-y-6 border-neon-cyan/30 shadow-[0_0_50px_rgba(0,243,255,0.1)]"
          >
            <div className="flex items-center gap-4 text-neon-cyan">
              <div className="w-12 h-12 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Session Timeout</h3>
                <p className="text-xs text-white/40 uppercase tracking-widest">Security Protocol Active</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-white/60 leading-relaxed">
                Your session is about to expire due to inactivity. For your security, you will be automatically logged out in:
              </p>
              
              <div className="text-4xl font-mono font-bold text-center py-4 bg-white/5 rounded-2xl border border-white/10 text-neon-cyan">
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleContinue}
                variant="neon"
                className="w-full py-4"
              >
                Continue Session
              </Button>
              <button 
                onClick={() => logout()}
                className="w-full py-3 text-sm text-white/40 hover:text-neon-magenta transition-colors font-bold uppercase tracking-widest"
              >
                Logout Now
              </button>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-neon-magenta/5 border border-neon-magenta/10">
              <ShieldAlert className="w-4 h-4 text-neon-magenta" />
              <p className="text-[10px] text-white/40 leading-tight">
                This security measure helps protect your professional DNA and Wavvault assets from unauthorized access.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
