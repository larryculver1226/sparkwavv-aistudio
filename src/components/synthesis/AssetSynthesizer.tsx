import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Layout, 
  Lock, 
  Share2, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Loader2,
  Eye,
  ChevronRight,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { fetchUserAssets, lockAsset } from '../../services/assetEngineService';
import { SynthesizedAsset } from '../../types/wavvault';
import ShareModal from '../sharing/ShareModal';

interface AssetSynthesizerProps {
  userId: string;
}

const AssetSynthesizer: React.FC<AssetSynthesizerProps> = ({ userId }) => {
  const [assets, setAssets] = useState<SynthesizedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<SynthesizedAsset | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const data = await fetchUserAssets();
      setAssets(data);
    } catch (err) {
      console.error("Failed to load assets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSynthesize = async (type: 'narrative' | 'resume') => {
    setIsSynthesizing(true);
    try {
      // In a real app, this would call a backend synthesis engine
      // For now, we'll simulate the "locking" process
      const mockContent = type === 'resume' ? {
        headline: "Strategic Product Leader",
        summary: "12+ years of experience driving innovation at the intersection of AI and human-centric design.",
        experience: [
          { company: "TechFlow", role: "VP Product", period: "2020-Present" },
          { company: "InnoVate", role: "Senior PM", period: "2016-2020" }
        ]
      } : {
        headline: "The Architect of Change",
        identity: "A visionary leader who bridges the gap between complex technology and human needs.",
        strengths: ["Strategic Foresight", "Empathetic Leadership", "Rapid Prototyping"],
        stories: [
          { title: "The Pivot", content: "How we transformed a failing legacy product into a market leader in 6 months." }
        ]
      };

      const { assetId } = await lockAsset({
        type,
        title: type === 'resume' ? 'High-Fidelity PDF Resume' : 'Interactive Career Narrative',
        content: mockContent,
        versionHash: 'v1.0-locked' // Mock version hash
      });

      await loadAssets();
      // Auto-select the new asset
      const newAsset = assets.find(a => a.id === assetId);
      if (newAsset) setSelectedAsset(newAsset);
    } catch (err) {
      console.error("Synthesis failed:", err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Asset Synthesis</h3>
          <p className="text-sm text-white/40 uppercase tracking-widest font-mono mt-1">
            Generate & Lock Professional Artifacts
          </p>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => handleSynthesize('narrative')}
            disabled={isSynthesizing}
            className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Layout className="w-4 h-4 text-blue-400" />
            Synthesize Narrative
          </button>
          <button
            onClick={() => handleSynthesize('resume')}
            disabled={isSynthesizing}
            className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-green-400" />
            Synthesize Resume
          </button>
        </div>
      </div>

      {isSynthesizing && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 glass-panel border-neon-cyan/20 flex flex-col items-center justify-center text-center space-y-6"
        >
          <div className="relative">
            <Loader2 className="w-16 h-16 text-neon-cyan animate-spin" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-white animate-pulse" />
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-bold text-white">Synthesizing Hero Asset...</h4>
            <p className="text-sm text-white/40 font-mono uppercase tracking-widest">
              Mapping DNA Nodes // Formatting Layout // Locking Artifact
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {assets.map((asset) => (
            <motion.div
              key={asset.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`glass-panel p-6 border-white/10 group relative overflow-hidden ${selectedAsset?.id === asset.id ? 'ring-2 ring-neon-cyan' : ''}`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${asset.type === 'resume' ? 'bg-green-400/10 text-green-400' : 'bg-blue-400/10 text-blue-400'}`}>
                  {asset.type === 'resume' ? <FileText className="w-6 h-6" /> : <Layout className="w-6 h-6" />}
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[8px] font-mono text-white/40 uppercase tracking-widest">
                    v1.0
                  </div>
                  {asset.isLocked && (
                    <div className="w-6 h-6 rounded-full bg-green-400/20 flex items-center justify-center" title="Locked Artifact">
                      <Lock className="w-3 h-3 text-green-400" />
                    </div>
                  )}
                </div>
              </div>

              <h4 className="text-lg font-bold text-white mb-2">{asset.title}</h4>
              <p className="text-xs text-white/40 line-clamp-2 mb-6">
                Created on {new Date(asset.createdAt).toLocaleDateString()}
              </p>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedAsset(asset)}
                  className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-3 h-3" />
                  Preview
                </button>
                <button 
                  onClick={() => {
                    setSelectedAsset(asset);
                    setShowShareModal(true);
                  }}
                  className="flex-1 py-2 rounded-lg bg-neon-cyan text-black text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform flex items-center justify-center gap-2"
                >
                  <Share2 className="w-3 h-3" />
                  Share
                </button>
              </div>

              {/* Background Glow */}
              <div className={`absolute -bottom-12 -right-12 w-24 h-24 blur-[40px] opacity-20 transition-opacity group-hover:opacity-40 ${asset.type === 'resume' ? 'bg-green-400' : 'bg-blue-400'}`} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {selectedAsset && showShareModal && (
        <ShareModal 
          asset={selectedAsset} 
          onClose={() => setShowShareModal(false)} 
        />
      )}
    </div>
  );
};

export default AssetSynthesizer;
