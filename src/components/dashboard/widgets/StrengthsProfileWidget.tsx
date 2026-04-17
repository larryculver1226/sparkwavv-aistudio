import React from 'react';
import { Award } from 'lucide-react';

interface StrengthsProfileWidgetProps {
  profile: any;
  onNavigate: (view: string) => void;
}

export const StrengthsProfileWidget: React.FC<StrengthsProfileWidgetProps> = ({ profile, onNavigate }) => {
  return (
    <div className="glass-panel p-10 rounded-[2.5rem] border border-white/5 bg-black/40">
      <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
        <Award className="w-4 h-4 text-neon-cyan" />
        My Strengths Profile (Gallup)
      </h3>
      <div className="space-y-8">
        {(profile?.brandDNAAttributes?.length
          ? profile.brandDNAAttributes
          : ['Strategic', 'Analytical', 'Creative', 'Collaborative']
        ).map((attr: string, i: number) => {
          const value = 85 - i * 8;
          return (
            <div key={i} className="space-y-3">
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                <span className="text-white/60">{attr}</span>
                <span className="text-neon-cyan neon-text-cyan">{value}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  style={{ width: `${value}%` }}
                  className="h-full bg-gradient-to-r from-neon-cyan/60 to-neon-cyan shadow-[0_0_10px_rgba(0,243,255,0.3)]"
                />
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={() => onNavigate('strengths')}
        className="w-full mt-12 py-4 rounded-2xl border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-neon-cyan/10 hover:border-neon-cyan/30 transition-all"
      >
        Details Profile
      </button>
    </div>
  );
};
