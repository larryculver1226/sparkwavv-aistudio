import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Shield, ArrowRight, ExternalLink } from 'lucide-react';
import { TENANTS } from '../constants';

interface PartnerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tenantId: string) => void;
}

export const PartnerSelectionModal: React.FC<PartnerSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const partners = TENANTS.filter((t) => t.id !== 'sparkwavv');

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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold text-white">Find an RPP Partner</h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Connect with a certified Role-Playing Partner organization.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {partners.map((partner) => (
                  <button
                    key={partner.id}
                    onClick={() => onSelect(partner.id)}
                    className="group relative flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-neon-cyan/30 transition-all text-left"
                  >
                    <div className="w-16 h-16 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 overflow-hidden">
                      {partner.logoUrl ? (
                        <img
                          src={partner.logoUrl}
                          alt={partner.name}
                          className="w-full h-full object-contain p-2"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Shield className="w-8 h-8 text-zinc-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white group-hover:text-neon-cyan transition-colors">
                        {partner.name}
                      </h3>
                      <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
                        Certified Sparkwavv Partner providing expert RPP coaching and DNA synthesis
                        support.
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-neon-cyan group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>

              <div className="p-6 bg-neon-cyan/5 border border-neon-cyan/20 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-neon-cyan/10 rounded-lg">
                    <Shield className="w-5 h-5 text-neon-cyan" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Partner Permissions</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      By connecting with a partner, you grant them{' '}
                      <span className="text-white font-medium">Read-Only</span> access to your
                      journey. You can optionally authorize them to propose DNA shifts and
                      milestones later.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-black/40 border-t border-white/5 flex justify-end gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
