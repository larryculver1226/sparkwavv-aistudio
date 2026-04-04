import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, LogIn } from 'lucide-react';
import { useIdentity } from '../contexts/IdentityContext';

export default function DiveInPage() {
  const { loginWithPopup } = useIdentity();

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center space-y-12 relative z-10"
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center backdrop-blur-xl">
              <Sparkles className="w-10 h-10 text-blue-400" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight">
            Dive <span className="text-blue-400 italic">In</span>
          </h1>
          <p className="text-white/40 uppercase tracking-[0.3em] text-sm font-medium">
            The Journey Begins Here
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 md:p-12 backdrop-blur-2xl space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Ready to ignite your brand?</h2>
            <p className="text-white/60 leading-relaxed max-w-md mx-auto">
              You are currently in the <span className="text-white font-bold">Dive-In</span> phase.
              Authenticate your identity to unlock your personal dashboard and start your
              acceleration.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={() => loginWithPopup()}
              className="group relative px-8 py-5 bg-white text-black rounded-2xl font-bold text-lg hover:scale-[1.02] transition-all flex items-center gap-3 mx-auto overflow-hidden"
            >
              <div className="absolute inset-0 bg-blue-400 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10 flex items-center gap-3 group-hover:text-white transition-colors">
                <LogIn className="w-5 h-5" />
                Authenticate Identity
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-wrap justify-center gap-8 opacity-40 grayscale">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
              Ignition
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
              Discovery
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
              Branding
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
              Outreach
            </div>
          </div>
        </div>

        <p className="text-white/20 text-xs uppercase tracking-widest">
          Powered by SPARKWavv Acceleration Engine
        </p>
      </motion.div>
    </div>
  );
}
