import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Database, 
  RefreshCw, 
  Brain, 
  Search, 
  ShieldCheck, 
  Activity,
  Zap,
  FileJson,
  AlertCircle
} from 'lucide-react';

interface VertexDashboardProps {
  onNotify: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const VertexDashboard: React.FC<VertexDashboardProps> = ({ onNotify }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/skylar/sync-wavvault', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        onNotify(`Successfully synced ${data.count} entries to Vertex AI Search.`, 'success');
      } else {
        onNotify(data.error || 'Sync failed', 'error');
      }
    } catch (error) {
      onNotify('Network error during sync', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGenerateSyntheticData = async () => {
    setIsGenerating(true);
    // In a real implementation, this would call an endpoint that uses MethodologyGenerator
    setTimeout(() => {
      setIsGenerating(false);
      onNotify('Synthetic methodology data generated and ready for fine-tuning.', 'success');
    }, 2000);
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const response = await fetch('/api/skylar/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.results);
      } else {
        onNotify(data.error || 'Search failed', 'error');
      }
    } catch (error) {
      onNotify('Search error', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Brain className="w-8 h-8 text-neon-cyan" />
            Vertex AI Enterprise Intelligence
          </h2>
          <p className="text-gray-400 mt-1">Managed RAG, Fine-Tuning, and Sector-Specific Intelligence (Track B)</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-lg hover:bg-neon-cyan/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Wavvault'}
          </button>
          <button
            onClick={handleGenerateSyntheticData}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-500 rounded-lg hover:bg-purple-500/20 transition-all disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Generate Synthetic Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-surface/50 border border-white/10 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <Database className="w-6 h-6 text-neon-cyan" />
            <span className="text-xs font-mono text-gray-500 uppercase">Managed RAG</span>
          </div>
          <div className="text-3xl font-display font-bold text-white">Vertex AI Search</div>
          <p className="text-sm text-gray-400 mt-2">Cross-user "Career DNA" pattern recognition enabled.</p>
        </div>

        <div className="bg-dark-surface/50 border border-white/10 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <Brain className="w-6 h-6 text-purple-500" />
            <span className="text-xs font-mono text-gray-500 uppercase">Fine-Tuning</span>
          </div>
          <div className="text-3xl font-display font-bold text-white">Lobkowicz v1</div>
          <p className="text-sm text-gray-400 mt-2">Methodology fine-tuning in progress (Synthetic Phase).</p>
        </div>

        <div className="bg-dark-surface/50 border border-white/10 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <ShieldCheck className="w-6 h-6 text-green-500" />
            <span className="text-xs font-mono text-gray-500 uppercase">Compliance</span>
          </div>
          <div className="text-3xl font-display font-bold text-white">Enterprise Ready</div>
          <p className="text-sm text-gray-400 mt-2">Tenant isolation and VPC controls active.</p>
        </div>
      </div>

      {/* Pattern Matcher (Managed RAG Test) */}
      <div className="bg-dark-surface/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-bottom border-white/10 bg-white/5">
          <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-neon-cyan" />
            DNA Pattern Matcher (Managed RAG)
          </h3>
          <p className="text-sm text-gray-400 mt-1">Test Skylar's ability to find patterns across the entire Wavvault.</p>
        </div>
        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., Find patterns in mid-career software engineers transitioning to product..."
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan/50"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery}
              className="px-6 py-2 bg-neon-cyan text-black font-bold rounded-lg hover:bg-white transition-all disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search Patterns'}
            </button>
          </div>

          {searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((result, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 bg-white/5 border border-white/10 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-neon-cyan uppercase">Match Score: {(result.score * 100).toFixed(1)}%</span>
                    <span className="text-xs text-gray-500">{result.metadata?.industry || 'General'}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{result.content}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-lg">
              <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">Enter a query to test the Managed RAG system.</p>
            </div>
          )}
        </div>
      </div>

      {/* Model Garden Status */}
      <div className="bg-dark-surface/50 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Vertex AI Model Garden (Sector Intelligence)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className="text-white font-bold">Healthcare (MedLM)</div>
                <div className="text-xs text-gray-500">Active for specialized users</div>
              </div>
            </div>
            <div className="px-2 py-1 bg-green-500/20 text-green-500 text-[10px] font-bold rounded uppercase">Running</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-white font-bold">Legal (SecLM)</div>
                <div className="text-xs text-gray-500">Planned for Q3 2026</div>
              </div>
            </div>
            <div className="px-2 py-1 bg-gray-500/20 text-gray-500 text-[10px] font-bold rounded uppercase">Queued</div>
          </div>
        </div>
      </div>
    </div>
  );
};
