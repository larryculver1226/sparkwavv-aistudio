import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface GateReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onOverride?: () => void;
  isAdmin?: boolean;
  data: {
    currentPhase: string;
    targetPhase: string;
    status: 'approved' | 'warning' | 'denied' | 'reviewing';
    message: string;
    criteria: { label: string; met: boolean }[];
  };
}

export const GateReviewModal: React.FC<GateReviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onOverride,
  isAdmin = false,
  data,
}) => {
  const isApproved = data.status === 'approved';
  const isWarning = data.status === 'warning';
  const isDenied = data.status === 'denied';
  const isReviewing = data.status === 'reviewing';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-dark-surface border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div
              className={`p-8 border-b border-white/5 flex items-center justify-between ${
                isApproved ? 'bg-neon-lime/5' : isDenied ? 'bg-neon-magenta/5' : 'bg-neon-cyan/5'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                    isApproved
                      ? 'bg-neon-lime/10 border-neon-lime/20 text-neon-lime'
                      : isDenied
                        ? 'bg-neon-magenta/10 border-neon-magenta/20 text-neon-magenta'
                        : 'bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan'
                  }`}
                >
                  {isApproved ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : isDenied ? (
                    <ShieldAlert className="w-6 h-6" />
                  ) : (
                    <ShieldAlert className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">Validation Gate</h2>
                  <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
                    {data.currentPhase} <ArrowRight className="inline w-3 h-3 mx-1" />{' '}
                    {data.targetPhase}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Status Message */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {isApproved ? (
                    <CheckCircle2 className="w-5 h-5 text-neon-lime" />
                  ) : (
                    <AlertTriangle
                      className={`w-5 h-5 ${isDenied ? 'text-neon-magenta' : 'text-neon-cyan'}`}
                    />
                  )}
                  <h3
                    className={`text-lg font-bold ${
                      isApproved
                        ? 'text-neon-lime'
                        : isDenied
                          ? 'text-neon-magenta'
                          : 'text-neon-cyan'
                    }`}
                  >
                    {isApproved ? 'Gate Cleared' : isDenied ? 'Gate Locked' : 'Stern Warning'}
                  </h3>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">{data.message}</p>
              </div>

              {/* Criteria List */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Gating Criteria
                </h4>
                <div className="grid gap-3">
                  {data.criteria.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <span className="text-sm text-white/80">{c.label}</span>
                      {c.met ? (
                        <CheckCircle2 className="w-5 h-5 text-neon-lime" />
                      ) : (
                        <X className="w-5 h-5 text-white/10" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-4">
                {isApproved ? (
                  <button
                    onClick={onConfirm}
                    className="w-full py-4 rounded-2xl bg-neon-lime text-black font-black uppercase tracking-widest shadow-[0_0_20px_rgba(204,255,0,0.4)] hover:scale-[1.02] transition-transform"
                  >
                    Proceed to {data.targetPhase}
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 py-4 rounded-2xl bg-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/20 transition-colors"
                    >
                      Return to {data.currentPhase}
                    </button>
                    {isAdmin && onOverride && (
                      <button
                        onClick={onOverride}
                        className="px-8 py-4 rounded-2xl border border-neon-magenta/40 text-neon-magenta font-bold uppercase tracking-widest hover:bg-neon-magenta/10 transition-colors"
                      >
                        Override
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-black/20 border-t border-white/5 text-center">
              <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
                Skylar Validation Protocol v2.5
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
