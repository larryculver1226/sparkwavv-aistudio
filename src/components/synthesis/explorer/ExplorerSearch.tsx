import React from 'react';
import { Search, Filter } from 'lucide-react';

interface ExplorerSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedPhase: string | null;
  setSelectedPhase: (phase: string | null) => void;
}

export const ExplorerSearch: React.FC<ExplorerSearchProps> = ({
  searchQuery,
  setSearchQuery,
  selectedPhase,
  setSelectedPhase,
}) => {
  const phases = ['Dive-In', 'Ignition', 'Discovery', 'Branding', 'Outreach'];

  return (
    <div className="space-y-6 mb-20">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-neon-cyan transition-colors" />
          <input
            type="text"
            placeholder="Query the archive (e.g., 'Leadership Signals', 'Discovery Gate')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-3xl py-6 pl-16 pr-6 text-sm font-medium focus:outline-none focus:border-neon-cyan/50 focus:bg-white/[0.06] transition-all placeholder:text-white/20"
          />
        </div>
        <button className="flex items-center gap-3 px-8 py-6 rounded-3xl bg-white/[0.03] border border-white/10 text-[11px] font-black uppercase tracking-widest hover:bg-white/[0.06] transition-all group">
          <Filter className="w-5 h-5 text-neon-cyan group-hover:rotate-180 transition-transform duration-500" />
          Filter DNA
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setSelectedPhase(null)}
          className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
            !selectedPhase
              ? 'bg-neon-cyan text-black border-neon-cyan'
              : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
          }`}
        >
          All Phases
        </button>
        {phases.map((phase) => (
          <button
            key={phase}
            onClick={() => setSelectedPhase(phase)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
              selectedPhase === phase
                ? 'bg-neon-cyan text-black border-neon-cyan'
                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
            }`}
          >
            {phase}
          </button>
        ))}
      </div>
    </div>
  );
};
