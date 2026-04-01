import React from 'react';
import { WavvaultExplorer } from '../components/synthesis/WavvaultExplorer';
import { Loader2, XCircle } from 'lucide-react';
import { useWavvaultData } from '../hooks/useWavvaultData';

export const WavvaultPage: React.FC = () => {
  const { events, artifacts, loading, error, userId } = useWavvaultData();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mx-auto" />
          <p className="text-[#D4AF37] font-mono text-xs uppercase tracking-widest animate-pulse">
            Accessing Treasury Vault...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
            <XCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white">Vault Access Denied</h2>
          <p className="text-white/40 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
          >
            Retry Authentication
          </button>
        </div>
      </div>
    );
  }

  return (
    <WavvaultExplorer 
      userId={userId} 
      events={events} 
      artifacts={artifacts} 
    />
  );
};
