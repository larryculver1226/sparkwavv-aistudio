import React from 'react';
import { Camera, ChevronRight } from 'lucide-react';

interface SynthesisLabEntryWidgetProps {
  onNavigate: (view: string) => void;
}

export const SynthesisLabEntryWidget: React.FC<SynthesisLabEntryWidgetProps> = ({ onNavigate }) => {
  return (
    <button
      onClick={() => onNavigate('synthesis')}
      className="w-full glass-panel p-10 rounded-[2.5rem] border border-neon-cyan/20 bg-neon-cyan/5 hover:bg-neon-cyan/10 transition-all group relative overflow-hidden flex items-center justify-between"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center gap-8 relative z-10">
        <div className="w-20 h-20 rounded-3xl bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Camera className="w-10 h-10 text-neon-cyan" />
        </div>
        <div className="text-left">
          <h3 className="text-3xl font-display font-bold text-white mb-2">
            High-Fidelity Synthesis Lab
          </h3>
          <p className="text-sm text-white/60 max-w-xl">
            Generate cinematic brand portraits and professional outreach sequences
            grounded in your unique DNA.
          </p>
        </div>
      </div>
      <div className="relative z-10 flex items-center gap-3 text-neon-cyan font-bold uppercase tracking-widest text-xs">
        Enter Lab
        <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
      </div>
    </button>
  );
};
