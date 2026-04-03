import React from 'react';
import { motion } from 'motion/react';
import { 
  Database, 
  FileText, 
  ArrowRight, 
  Clock,
  Lock,
  ExternalLink
} from 'lucide-react';
import { DistilledArtifact } from '../../types/wavvault';
import { useNavigate } from 'react-router-dom';

interface WavvaultHighlightsProps {
  artifacts: DistilledArtifact[];
  isLocked?: boolean;
  stage: string;
}

export const WavvaultHighlights: React.FC<WavvaultHighlightsProps> = ({ 
  artifacts, 
  isLocked,
  stage
}) => {
  const navigate = useNavigate();
  const recentArtifacts = artifacts.slice(0, 3);

  return (
    <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40 space-y-6 relative overflow-hidden">
      {isLocked && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6">
          <Lock className="w-8 h-8 text-white/20 mb-4" />
          <h4 className="text-sm font-bold text-white/60">Vault Access Restricted</h4>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Unlocks at {stage} Phase</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/80">
          <Database className="w-5 h-5 text-neon-cyan" />
          <h3 className="font-display font-bold text-sm tracking-tight uppercase">Wavvault Highlights</h3>
        </div>
        {!isLocked && (
          <button 
            onClick={() => navigate('/vault')}
            className="text-[10px] font-bold text-neon-cyan uppercase tracking-widest hover:underline flex items-center gap-1"
          >
            Open Vault <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {recentArtifacts.length > 0 ? (
          recentArtifacts.map((artifact, i) => (
            <motion.div
              key={artifact.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white truncate group-hover:text-neon-cyan transition-colors">
                  {artifact.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-white/20" />
                  <span className="text-[10px] text-white/40">{new Date(artifact.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-8 text-center">
            <p className="text-xs text-white/20 italic">No artifacts synthesized yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
