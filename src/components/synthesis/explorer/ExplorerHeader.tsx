import React from 'react';
import { ArrowLeft, Database, ShieldCheck, Layers, GitBranch, Download } from 'lucide-react';

interface ExplorerHeaderProps {
  viewMode: 'linear' | 'branching';
  setViewMode: (mode: 'linear' | 'branching') => void;
}

export const ExplorerHeader: React.FC<ExplorerHeaderProps> = ({ viewMode, setViewMode }) => {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050505]/60 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => window.history.back()}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.05)] group hover:border-neon-cyan/50 transition-all">
            <Database className="w-6 h-6 text-neon-cyan group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-white italic">Wavvault <span className="text-neon-cyan">Treasury</span></h1>
            <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">
              <ShieldCheck className="w-3 h-3 text-neon-cyan" />
              Sovereign Professional DNA // v2.4.0
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* View Switcher */}
          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setViewMode('linear')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === 'linear' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              Linear Feed
            </button>
            <button
              onClick={() => setViewMode('branching')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === 'branching' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'
              }`}
            >
              <GitBranch className="w-4 h-4" />
              Resonance Graph
            </button>
          </div>

          <button className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-neon-cyan text-black text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,243,255,0.4)] active:scale-95">
            <Download className="w-4 h-4" />
            Export Dossier
          </button>
        </div>
      </div>
    </header>
  );
};
