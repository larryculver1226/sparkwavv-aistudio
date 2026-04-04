import React from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Brain,
  ArrowRight,
} from 'lucide-react';
import { ValidationGateEvent, DistilledArtifact } from '../../../types/wavvault';

interface TimelineFeedProps {
  items: Array<{
    type: 'artifact' | 'event';
    data: any;
    timestamp: Date;
  }>;
  onSelectArtifact: (artifact: DistilledArtifact) => void;
  onHoverArtifact: (id: string | undefined) => void;
}

export const TimelineFeed: React.FC<TimelineFeedProps> = ({
  items,
  onSelectArtifact,
  onHoverArtifact,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          className="relative pl-20 group"
          onMouseEnter={() => item.type === 'artifact' && onHoverArtifact(item.data.id)}
          onMouseLeave={() => onHoverArtifact(undefined)}
        >
          {/* Timeline Line */}
          {idx !== items.length - 1 && (
            <div className="absolute left-[23px] top-12 bottom-[-48px] w-px bg-gradient-to-b from-white/20 via-white/5 to-transparent" />
          )}

          {/* Timeline Node */}
          <div
            className={`absolute left-0 top-0 w-12 h-12 rounded-2xl border flex items-center justify-center bg-[#050505] z-10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 ${
              item.type === 'event'
                ? item.data.status === 'passed'
                  ? 'border-green-500/30 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
                  : item.data.status === 'warning'
                    ? 'border-yellow-500/30 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.1)]'
                    : 'border-red-500/30 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                : 'border-neon-cyan/30 text-neon-cyan shadow-[0_0_20px_rgba(0,243,255,0.1)]'
            }`}
          >
            {item.type === 'event' ? (
              item.data.status === 'passed' ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : item.data.status === 'warning' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
          </div>

          {/* Content Card - Dual Layer */}
          <motion.div
            whileHover={{ x: 12 }}
            className={`p-8 rounded-[2rem] border backdrop-blur-xl transition-all cursor-pointer relative overflow-hidden group/card ${
              item.type === 'event'
                ? 'bg-white/[0.02] border-white/5 hover:border-white/10'
                : 'bg-gradient-to-br from-white/[0.04] to-transparent border-white/10 hover:border-neon-cyan/30 shadow-2xl'
            }`}
            onClick={() =>
              item.type === 'artifact' && onSelectArtifact(item.data as DistilledArtifact)
            }
          >
            {/* Hover Glow */}
            <div className="absolute -inset-4 bg-neon-cyan/5 opacity-0 group-hover/card:opacity-100 transition-opacity blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <span
                  className={`text-[9px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full border ${
                    item.type === 'event'
                      ? 'bg-white/5 border-white/10 text-white/40'
                      : 'bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan'
                  }`}
                >
                  {item.type === 'event'
                    ? 'Validation Gate'
                    : (item.data as DistilledArtifact).type.replace('-', ' ')}
                </span>
                <div className="flex items-center gap-2 text-[10px] text-white/20 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {item.timestamp.toLocaleDateString()}
                </div>
              </div>
              <MoreVertical className="w-5 h-5 text-white/10 hover:text-white transition-colors" />
            </div>

            <div className="grid md:grid-cols-[1fr_280px] gap-12 relative z-10">
              <div className="space-y-4">
                <h3 className="text-2xl font-display font-bold text-white tracking-tight italic">
                  {item.type === 'event'
                    ? `Gate Review: ${item.data.phase}`
                    : (item.data as DistilledArtifact).title}
                </h3>

                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/20">
                    Raw Signal
                  </div>
                  <p className="text-base text-white/60 leading-relaxed line-clamp-3 font-medium">
                    {item.type === 'event'
                      ? item.data.verdict
                      : typeof (item.data as DistilledArtifact).content === 'string'
                        ? (item.data as DistilledArtifact).content
                        : (item.data as DistilledArtifact).content.description ||
                          (item.data as DistilledArtifact).content.quote}
                  </p>
                </div>
              </div>

              {/* Skylar's Inference Layer */}
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-neon-cyan">
                    <Brain className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Skylar's Inference
                    </span>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed italic font-serif">
                    {item.type === 'artifact'
                      ? (item.data as DistilledArtifact).metadata?.inference ||
                        'Analyzing latent potential within this signal...'
                      : 'Gate integrity verified. Causal link established.'}
                  </p>
                </div>

                {item.type === 'artifact' && (
                  <div className="flex items-center gap-2 text-[10px] font-black text-neon-cyan uppercase tracking-[0.2em] group/btn pt-4 border-t border-white/5">
                    Open Artifact
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      ))}
    </motion.div>
  );
};
