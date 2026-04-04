import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldCheck,
  Calendar,
  Eye,
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  Loader2,
  Lock,
  Share2,
  ChevronRight,
  ShieldAlert,
  Clock,
  Zap,
  FileText,
  Layout,
} from 'lucide-react';
import { createShare } from '../../services/assetEngineService';
import { SynthesizedAsset } from '../../types/wavvault';

interface ShareModalProps {
  asset: SynthesizedAsset;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ asset, onClose }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [expiryDays, setExpiryDays] = useState(7);
  const [maxViews, setMaxViews] = useState(10);
  const [requireAccessKey, setRequireAccessKey] = useState(true);

  const handleCreateShare = async () => {
    setIsCreating(true);
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      const { shareId, accessKey } = await createShare({
        assetId: asset.id,
        expiresAt: expiryDate.toISOString(),
        maxViews,
        brandingPersona: 'Right Brain (Spark/Yang)', // Default for now
      });

      const fullLink = `${window.location.origin}/share/${shareId}?key=${accessKey}`;
      setShareLink(fullLink);
    } catch (err) {
      console.error('Failed to create share:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg glass-panel border-white/10 overflow-hidden"
      >
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-neon-cyan/10 flex items-center justify-center text-neon-cyan">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Secure Asset Sharing
                </h3>
                <p className="text-xs text-white/40 uppercase tracking-widest font-mono mt-1">
                  [STATUS: ENCRYPTED_CHANNEL]
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors opacity-50 hover:opacity-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {!shareLink ? (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${asset.type === 'resume' ? 'bg-green-400/10 text-green-400' : 'bg-blue-400/10 text-blue-400'}`}
                >
                  {asset.type === 'resume' ? (
                    <FileText className="w-5 h-5" />
                  ) : (
                    <Layout className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{asset.title}</h4>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">
                    v1.0 // LOCKED_ARTIFACT
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Access Expiry
                  </label>
                  <select
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-neon-cyan outline-none transition-colors"
                  >
                    <option value={1}>24 Hours</option>
                    <option value={7}>7 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={0}>Never</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <Eye className="w-3 h-3" />
                    View Limit
                  </label>
                  <select
                    value={maxViews}
                    onChange={(e) => setMaxViews(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-neon-cyan outline-none transition-colors"
                  >
                    <option value={5}>5 Views</option>
                    <option value={10}>10 Views</option>
                    <option value={50}>50 Views</option>
                    <option value={0}>Unlimited</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neon-cyan/5 border border-neon-cyan/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-neon-cyan" />
                    <span className="text-sm font-bold text-white">Access Key Required</span>
                  </div>
                  <div
                    onClick={() => setRequireAccessKey(!requireAccessKey)}
                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${requireAccessKey ? 'bg-neon-cyan' : 'bg-white/10'}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${requireAccessKey ? 'translate-x-6' : 'translate-x-0'}`}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-white/40 leading-relaxed italic">
                  "Enabling an access key ensures that only recipients with the unique token can
                  decrypt and view your professional DNA."
                </p>
              </div>

              <button
                onClick={handleCreateShare}
                disabled={isCreating}
                className="w-full py-4 bg-neon-cyan text-black rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCreating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Zap className="w-5 h-5" />
                )}
                Generate Secure Share Link
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-green-400/20 flex items-center justify-center mx-auto relative">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
                <div className="absolute inset-0 border-2 border-green-400/20 rounded-full animate-ping" />
              </div>

              <div className="space-y-2">
                <h4 className="text-2xl font-bold text-white">Share Link Generated</h4>
                <p className="text-sm text-white/40 max-w-xs mx-auto">
                  Your secure, branded cinematic view is ready for recruitment outreach.
                </p>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative flex items-center gap-2 p-2 bg-black/60 border border-white/10 rounded-2xl">
                  <div className="flex-1 px-4 py-2 text-xs text-white/60 font-mono truncate">
                    {shareLink}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className={`p-3 rounded-xl transition-all ${copied ? 'bg-green-400 text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                  >
                    {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-4 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                    Expires In
                  </p>
                  <p className="text-sm font-bold text-white">{expiryDays} Days</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                    View Limit
                  </p>
                  <p className="text-sm font-bold text-white">{maxViews} Views</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/5 transition-colors"
              >
                Done
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ShareModal;
