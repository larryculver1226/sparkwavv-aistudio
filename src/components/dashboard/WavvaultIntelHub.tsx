import React, { useState, useEffect } from 'react';
import { useWavvaultData } from '../../hooks/useWavvaultData';
import { Search, Hash, BrainCircuit, Activity, Database, CheckCircle2 } from 'lucide-react';
import { DistilledArtifact } from '../../types/wavvault';

interface WavvaultIntelHubProps {
  userId: string;
}

export const WavvaultIntelHub: React.FC<WavvaultIntelHubProps> = ({ userId }) => {
  const { artifacts, wavvaultData } = useWavvaultData();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArtifacts = artifacts.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q) ||
      JSON.stringify(a.metadata || {})
        .toLowerCase()
        .includes(q) ||
      String(a.content).toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Intelligence Hub</h3>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono mt-1">
            Secure Personal Data Store
          </p>
        </div>
        <div className="relative w-64">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search intel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm font-mono focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all text-white placeholder-white/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
          {filteredArtifacts.map((artifact) => (
            <div
              key={artifact.id}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-neon-cyan/50 transition-colors group cursor-pointer flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-2">
                <h4
                  className="font-bold text-sm text-neon-cyan group-hover:text-white transition-colors truncate pr-4"
                  title={artifact.title}
                >
                  {artifact.title}
                </h4>
                {artifact.metadata?.verified && (
                  <div title="Verified Intel">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  </div>
                )}
              </div>

              <p className="text-xs text-white/60 line-clamp-3 mb-4 flex-1">
                {artifact.metadata?.documentSummary ||
                  artifact.content?.toString().substring(0, 150) ||
                  'No summary available.'}
              </p>

              {artifact.metadata?.extractedSkills &&
                artifact.metadata.extractedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {artifact.metadata.extractedSkills
                      .slice(0, 3)
                      .map((skill: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan text-[9px] font-mono whitespace-nowrap border border-neon-cyan/20"
                        >
                          {skill}
                        </span>
                      ))}
                    {artifact.metadata.extractedSkills.length > 3 && (
                      <span className="px-2 py-0.5 rounded bg-white/10 text-white/40 text-[9px] font-mono border border-white/10">
                        +{artifact.metadata.extractedSkills.length - 3}
                      </span>
                    )}
                  </div>
                )}

              <div className="flex items-center justify-between mt-auto border-t border-white/5 pt-3">
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {artifact.type}
                </span>
                <span className="text-[9px] font-mono text-white/20">
                  {new Date(artifact.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
          {filteredArtifacts.length === 0 && (
            <div className="col-span-1 md:col-span-2 py-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <Search className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/40 text-sm font-mono uppercase tracking-widest">
                NO INTELLIGENCE MATCHES FOUND
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
