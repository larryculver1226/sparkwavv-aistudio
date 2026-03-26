import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Zap, 
  Brain, 
  MessageSquare, 
  Sparkles,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface SectorIntelligenceProps {
  sector: 'Healthcare' | 'Legal' | 'Cybersecurity' | 'Finance' | 'General';
  userId: string;
}

export const SectorIntelligence: React.FC<SectorIntelligenceProps> = ({ sector, userId }) => {
  const [query, setQuery] = useState('');
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async () => {
    if (!query) return;
    setIsLoading(true);
    setError(null);
    try {
      // For now, we only have the healthcare endpoint implemented (MedLM)
      // In a full implementation, we'd have endpoints for each sector
      const endpoint = sector === 'Healthcare' ? '/api/skylar/healthcare' : '/api/skylar/coaching';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query, userId })
      });
      const data = await response.json();
      if (data.success) {
        setInsight(data.insight || data.advice);
      } else {
        setError(data.error || 'Failed to get specialized insight.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSectorIcon = () => {
    switch (sector) {
      case 'Healthcare': return <Activity className="w-6 h-6 text-green-500" />;
      case 'Legal': return <Brain className="w-6 h-6 text-blue-500" />;
      default: return <Zap className="w-6 h-6 text-neon-cyan" />;
    }
  };

  const getModelName = () => {
    switch (sector) {
      case 'Healthcare': return 'MedLM (Vertex AI)';
      case 'Legal': return 'SecLM (Vertex AI)';
      default: return 'Gemini 1.5 Pro';
    }
  };

  return (
    <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02] relative overflow-hidden group">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-white/5 border border-white/10`}>
              {getSectorIcon()}
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-white">{sector} Intelligence</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Powered by {getModelName()}</p>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-neon-cyan animate-pulse" />
        </div>

        <div className="space-y-4">
          {!insight ? (
            <div className="space-y-4">
              <p className="text-sm text-white/60 leading-relaxed">
                As a professional in the <span className="text-white font-bold">{sector}</span> sector, you have access to specialized Vertex AI models for deep industry insights.
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Ask a ${sector.toLowerCase()} career question...`}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-cyan/50 transition-all"
                />
                <button
                  onClick={handleAsk}
                  disabled={isLoading || !query}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-neon-cyan text-black rounded-lg hover:bg-white transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{insight}</ReactMarkdown>
              </div>
              <button
                onClick={() => {
                  setInsight(null);
                  setQuery('');
                }}
                className="text-xs text-neon-cyan uppercase tracking-widest font-bold hover:underline flex items-center gap-2"
              >
                <MessageSquare className="w-3 h-3" />
                Ask another question
              </button>
            </motion.div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-neon-magenta text-xs mt-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Background Decoration */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-neon-cyan/5 rounded-full blur-3xl group-hover:bg-neon-cyan/10 transition-all" />
    </div>
  );
};
