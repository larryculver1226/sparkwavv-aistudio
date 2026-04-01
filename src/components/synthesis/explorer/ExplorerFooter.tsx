import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';

interface ExplorerFooterProps {
  userId: string;
}

export const ExplorerFooter: React.FC<ExplorerFooterProps> = ({ userId }) => {
  return (
    <footer className="py-20 border-t border-white/5 bg-black relative z-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-white/20" />
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-black tracking-[0.3em] uppercase text-white/40">
              End-to-End Encrypted // Sovereign Control
            </div>
            <div className="text-[9px] font-mono text-white/20">
              AES-256-GCM // Zero-Knowledge Architecture // Ledger ID: {userId.slice(0, 8)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-12 text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">
          <a href="#" className="hover:text-neon-cyan transition-colors">Privacy Protocol</a>
          <a href="#" className="hover:text-neon-cyan transition-colors">Data Portability</a>
          <a href="#" className="hover:text-neon-cyan transition-colors">Ledger Verification</a>
        </div>
      </div>
    </footer>
  );
};
