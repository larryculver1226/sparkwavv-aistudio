import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';

const WARNING_TIME = 20 * 60 * 1000; // 20 minutes
const LOGOUT_TIME = 5 * 60 * 1000; // 5 minutes

export const InactivityTimeout: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(LOGOUT_TIME / 1000);
  const navigate = useNavigate();
  
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(async () => {
    if (auth) {
      await signOut(auth);
      navigate('/');
    }
  }, [navigate]);

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setShowWarning(false);
    setTimeLeft(LOGOUT_TIME / 1000);

    // Set warning timer
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      
      // Start logout countdown
      let seconds = LOGOUT_TIME / 1000;
      countdownIntervalRef.current = setInterval(() => {
        seconds -= 1;
        setTimeLeft(seconds);
        if (seconds <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          handleLogout();
        }
      }, 1000);

      // Set logout timer
      logoutTimerRef.current = setTimeout(handleLogout, LOGOUT_TIME);
    }, WARNING_TIME);
  }, [handleLogout]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      if (!showWarning) {
        resetTimers();
      }
    };

    events.forEach(event => window.addEventListener(event, handleActivity));
    resetTimers();

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [resetTimers, showWarning]);

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
            className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-neon-magenta/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-neon-magenta/10 border border-neon-magenta/20 flex items-center justify-center mb-6">
                <Clock className="w-10 h-10 text-neon-magenta animate-pulse" />
              </div>
              
              <h2 className="text-3xl font-display font-bold text-white mb-2">Inactivity Warning</h2>
              <p className="text-white/60 mb-8">
                You've been inactive for a while. For your security, you will be logged out in:
              </p>
              
              <div className="text-6xl font-mono font-bold text-neon-magenta mb-10 tracking-tighter">
                {formatTime(timeLeft)}
              </div>
              
              <div className="flex flex-col w-full gap-4">
                <button
                  onClick={resetTimers}
                  className="w-full py-4 rounded-2xl bg-neon-cyan text-black font-black uppercase tracking-widest hover:bg-neon-cyan/90 transition-all shadow-[0_0_20px_rgba(0,243,255,0.3)]"
                >
                  Continue Session
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout Now
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
