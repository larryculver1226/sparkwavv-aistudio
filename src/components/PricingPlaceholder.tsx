import React from 'react';
import { motion } from 'motion/react';
import { Construction, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from './Button';

interface PricingPlaceholderProps {
  onBack: () => void;
}

export const PricingPlaceholder: React.FC<PricingPlaceholderProps> = ({ onBack }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto px-6 py-24 text-center space-y-12"
    >
      <header className="space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-xs font-bold uppercase tracking-widest">
          <Construction className="w-4 h-4" />
          Coming Soon
        </div>
        <h2 className="text-6xl md:text-7xl font-display font-bold tracking-tighter">
          Pricing <span className="text-neon-cyan italic">Under Construction</span>
        </h2>
        <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
          We are meticulously engineering our investment tiers to ensure absolute market dominance for our users. The SPARKWavv pricing engine will be live shortly.
        </p>
      </header>

      <div className="glass-panel p-12 border-neon-cyan/20 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="relative z-10 space-y-8">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto group-hover:border-neon-cyan/30 transition-all duration-500">
            <Sparkles className="w-10 h-10 text-neon-cyan animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Something Big is Arriving</h3>
            <p className="text-white/40">Our team is finalizing the Founder's Lifetime Pass and strategic subscription models.</p>
          </div>
          
          <div className="flex flex-col items-center gap-4 pt-4">
            <div className="h-1.5 w-64 bg-white/5 rounded-full overflow-hidden relative">
              <motion.div 
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-neon-cyan to-transparent shadow-[0_0_15px_#00f3ff]"
              />
            </div>
            <span className="text-[10px] font-mono text-neon-cyan uppercase tracking-widest">Architecting Value... 85%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-8">
        <Button 
          onClick={onBack} 
          variant="neon"
          className="px-12 py-6 text-lg"
        >
          Back to Home
        </Button>
        <p className="text-sm text-white/40 italic">
          Want to be notified when we launch? <span className="text-neon-cyan cursor-pointer hover:underline">Join the waitlist</span>
        </p>
      </div>
    </motion.div>
  );
};
