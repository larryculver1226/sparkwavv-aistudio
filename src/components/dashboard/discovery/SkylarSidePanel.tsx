import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  ChevronRight,
  MessageSquare,
  Zap,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Target,
} from 'lucide-react';
import { StrategicDirective } from '../../../types/dashboard';
import { marketSignalService } from '../../../services/marketSignalService';

export const SkylarSidePanel: React.FC<{ userId: string }> = ({ userId }) => {
  const [directives, setDirectives] = useState<StrategicDirective[]>([]);
  const [activeDirective, setActiveDirective] = useState<StrategicDirective | null>(null);

  useEffect(() => {
    const loadDirectives = async () => {
      const d = await marketSignalService.getStrategicDirectives(userId);
      setDirectives(d);
      if (d.length > 0) setActiveDirective(d[0]);
    };
    loadDirectives();
  }, [userId]);

  return (
    <div className="w-80 h-full bg-black/40 backdrop-blur-3xl border-l border-white/10 flex flex-col">
      {/* Skylar Header */}
      <div className="p-8 border-b border-white/10">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-[60px] h-[60px] rounded-full bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center overflow-hidden">
              <Brain className="w-6 h-6 text-neon-cyan" />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-neon-cyan/20 rounded-full"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-neon-lime border-2 border-black flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-white tracking-tight">Skylar</h3>
            <p className="text-[10px] text-neon-cyan uppercase tracking-[0.2em] font-bold">
              Strategic Conductor
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20">
          <p className="text-[11px] text-white/80 leading-relaxed italic">
            "I've analyzed your current trajectory against real-time market signals. Your velocity
            is optimal, but I recommend a strategic pivot to maximize resonance."
          </p>
        </div>
      </div>

      {/* Directives List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
        <h4 className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold mb-4 px-2">
          Strategic Directives
        </h4>

        {directives.map((directive) => (
          <motion.button
            key={directive.id}
            onClick={() => setActiveDirective(directive)}
            className={`w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden group ${
              activeDirective?.id === directive.id
                ? 'bg-neon-cyan/10 border-neon-cyan/40 shadow-[0_0_20px_rgba(0,255,255,0.1)]'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
                  directive.priority === 'immediate'
                    ? 'bg-neon-magenta/20 text-neon-magenta'
                    : directive.priority === 'high'
                      ? 'bg-neon-cyan/20 text-neon-cyan'
                      : 'bg-white/10 text-white/60'
                }`}
              >
                {directive.priority}
              </div>
              <span className="text-[8px] text-white/20 font-mono uppercase">{directive.type}</span>
            </div>
            <h5 className="text-xs font-bold text-white mb-1 group-hover:text-neon-cyan transition-colors">
              {directive.title}
            </h5>
            <p className="text-[10px] text-white/40 line-clamp-2">{directive.content}</p>
          </motion.button>
        ))}
      </div>

      {/* Active Directive Detail (Simplified for sidepanel) */}
      <AnimatePresence mode="wait">
        {activeDirective && (
          <motion.div
            key={activeDirective.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-white/5 border-t border-white/10"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-neon-lime" />
              <span className="text-[10px] text-neon-lime uppercase tracking-widest font-bold">
                Recommended Action
              </span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed mb-4">{activeDirective.action}</p>
            <button className="w-full py-3 rounded-xl bg-neon-cyan text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white transition-colors">
              Initiate Pivot
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
