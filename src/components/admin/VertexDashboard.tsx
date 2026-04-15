import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database,
  RefreshCw,
  Brain,
  Search,
  ShieldCheck,
  Activity,
  Zap,
  FileJson,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  CloudUpload,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { auth } from '../../lib/firebase';

interface VertexDashboardProps {
  onNotify: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const VertexDashboard: React.FC<VertexDashboardProps> = ({ onNotify }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [syntheticData, setSyntheticData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [gcsUri, setGcsUri] = useState<string | null>(null);
  const [tuningJob, setTuningJob] = useState<any | null>(null);
  const [isTuning, setIsTuning] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapStatus, setBootstrapStatus] = useState<any | null>(null);
  const [testingStatus, setTestingStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({
    healthcare: 'idle',
    finance: 'idle',
    tech: 'idle',
    lobkowicz: 'idle',
  });

  const fetchSyntheticData = async () => {
    setIsLoadingData(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/vertex/synthetic-data', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (data.success) {
        setSyntheticData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch synthetic data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchSyntheticData();
  }, []);

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
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/vertex/generate-synthetic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          scenarios: [
            'Mid-career professional feeling stuck in a plateau',
            'Senior leader transitioning from corporate to entrepreneurship',
            "Early-career talent looking to identify their 'Spark'",
            'Executive facing a major organizational change',
            'Individual contributor wanting to move into management',
          ],
        }),
      });
      const data = await response.json();
      if (data.success) {
        onNotify(`Successfully generated ${data.count} synthetic dialogues.`, 'success');
        fetchSyntheticData();
      } else {
        onNotify(data.error || 'Generation failed', 'error');
      }
    } catch (error) {
      onNotify('Network error during generation', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const response = await fetch('/api/skylar/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
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

  const handleUploadToGCS = async () => {
    setIsUploading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/vertex/upload-to-gcs', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (data.success) {
        setGcsUri(data.gcsUri);
        onNotify(`Successfully uploaded to GCS: ${data.gcsUri}`, 'success');
      } else {
        onNotify(data.error || 'Upload failed', 'error');
      }
    } catch (error) {
      onNotify('Network error during upload', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartTuning = async () => {
    if (!gcsUri) return;

    setIsTuning(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/vertex/start-tuning', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gcsUri, modelName: 'gemini-1.5-flash-002' }),
      });
      const data = await response.json();
      if (data.success) {
        setTuningJob(data.job);
        onNotify(`Tuning job started: ${data.job.id}`, 'success');
      } else {
        onNotify(data.error || 'Failed to start tuning job', 'error');
      }
    } catch (error) {
      onNotify('Network error during tuning job start', 'error');
    } finally {
      setIsTuning(false);
    }
  };

  const handleBootstrapVector = async () => {
    if (!auth.currentUser) return;
    setIsBootstrapping(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch('/api/skylar/bootstrap-vector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userId: auth.currentUser.uid }),
      });
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.error) {
          onNotify(data.error, 'error');
        } else {
          setBootstrapStatus(data);
          onNotify('Vector Search bootstrapping initiated.', 'info');
        }
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        onNotify(`Server error (${response.status}). Please check logs.`, 'error');
      }
    } catch (error: any) {
      onNotify(error.message || 'Failed to initiate bootstrapping', 'error');
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleTestConnection = async (type: 'healthcare' | 'finance' | 'tech' | 'lobkowicz') => {
    setTestingStatus((prev) => ({ ...prev, [type]: 'testing' }));
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/skylar/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ type }),
      });
      const data = await response.json();
      if (data.success) {
        setTestingStatus((prev) => ({ ...prev, [type]: 'success' }));
        onNotify(data.message, 'success');
      } else {
        setTestingStatus((prev) => ({ ...prev, [type]: 'error' }));
        onNotify(data.message, 'error');
      }
    } catch (error) {
      setTestingStatus((prev) => ({ ...prev, [type]: 'error' }));
      onNotify(`Network error testing ${type} connection`, 'error');
    }
  };

  // Poll for tuning job status if one is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (tuningJob && tuningJob.id && tuningJob.state !== 'SUCCEEDED' && tuningJob.state !== 'FAILED') {
      interval = setInterval(async () => {
        try {
          const idToken = await auth.currentUser?.getIdToken();
          const response = await fetch(`/api/skylar/tuning/status/${encodeURIComponent(tuningJob.id)}`, {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          const data = await response.json();
          setTuningJob(data);
        } catch (error) {
          console.error('Error polling tuning job status:', error);
        }
      }, 30000); // Poll every 30 seconds
    }
    return () => clearInterval(interval);
  }, [tuningJob]);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Brain className="w-8 h-8 text-neon-cyan" />
            Vertex AI Enterprise Intelligence
          </h2>
          <p className="text-gray-400 mt-1">
            Managed RAG, Fine-Tuning, and Sector-Specific Intelligence (Track B)
          </p>
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
          <p className="text-sm text-gray-400 mt-2">
            Cross-user "Career DNA" pattern recognition enabled.
          </p>
        </div>

          <div className="bg-dark-surface/50 border border-white/10 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <Brain className="w-6 h-6 text-purple-500" />
              <span className="text-xs font-mono text-gray-500 uppercase">Fine-Tuning</span>
            </div>
            <div className="text-3xl font-display font-bold text-white">Lobkowicz v1</div>
            <div className="mt-2 space-y-2">
              <p className="text-sm text-gray-400">
                Methodology fine-tuning in progress (Synthetic Phase).
              </p>
              <button
                onClick={() => handleTestConnection('lobkowicz')}
                disabled={testingStatus.lobkowicz === 'testing'}
                className="w-full py-1.5 text-xs bg-purple-500/10 border border-purple-500/30 text-purple-500 rounded hover:bg-purple-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Zap className={`w-3 h-3 ${testingStatus.lobkowicz === 'testing' ? 'animate-pulse' : ''}`} />
                {testingStatus.lobkowicz === 'testing' ? 'Testing...' : 'Test Methodology Model'}
              </button>
            </div>
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
          <p className="text-sm text-gray-400 mt-1">
            Test Skylar's ability to find patterns across the entire Wavvault.
          </p>
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
                    <span className="text-xs font-mono text-neon-cyan uppercase">
                      Match Score: {(result.score * 100).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">
                      {result.metadata?.industry || 'General'}
                    </span>
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

      {/* Vector Search Bootstrapping Section */}
      <div className="bg-dark-surface/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-bottom border-white/10 bg-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-neon-cyan" />
              Vector Search Infrastructure (Wavvault v2)
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Bootstrap and monitor Vertex AI Vector Search indices.
            </p>
          </div>
          <button
            onClick={handleBootstrapVector}
            disabled={
              isBootstrapping || (bootstrapStatus && bootstrapStatus.status === 'INITIALIZING')
            }
            className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-lg hover:bg-neon-cyan/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isBootstrapping ? 'animate-spin' : ''}`} />
            {isBootstrapping
              ? 'Initiating...'
              : bootstrapStatus?.status === 'INITIALIZING'
                ? 'Initializing Index...'
                : 'Bootstrap Vector Index'}
          </button>
        </div>

        {bootstrapStatus && (
          <div className="p-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${bootstrapStatus.status === 'INITIALIZING' ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}
                />
                <span className="text-sm font-bold text-white">
                  Status: {bootstrapStatus.status}
                </span>
              </div>
              <span className="text-xs font-mono text-gray-500">
                Index ID: {bootstrapStatus.id}
              </span>
            </div>

            <div className="w-full bg-white/5 rounded-full h-2 mb-2">
              <div
                className="bg-neon-cyan h-2 rounded-full transition-all duration-500"
                style={{ width: `${bootstrapStatus.progress || 10}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-gray-500 mb-4">
              <span>Progress: {bootstrapStatus.progress || 10}%</span>
              <span>Est. Completion: {bootstrapStatus.estimatedCompletion}</span>
            </div>

            {bootstrapStatus.indexOperation && (
              <div className="mt-4 p-3 bg-black/40 border border-white/5 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-gray-500 uppercase">Index Operation</span>
                  <span className="text-neon-cyan truncate max-w-[200px]">{bootstrapStatus.indexOperation}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-gray-500 uppercase">Endpoint Operation</span>
                  <span className="text-neon-cyan truncate max-w-[200px]">{bootstrapStatus.endpointOperation}</span>
                </div>
                <p className="text-[10px] text-gray-400 italic mt-2">
                  {bootstrapStatus.message}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Model Garden Status */}
      <div className="bg-dark-surface/50 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Vertex AI Model Garden (Sector Intelligence)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <div className="text-white font-bold">Healthcare (MedLM)</div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
              </div>
              <div className="px-2 py-1 bg-green-500/20 text-green-500 text-[10px] font-bold rounded uppercase">
                Running
              </div>
            </div>
            <button
              onClick={() => handleTestConnection('healthcare')}
              disabled={testingStatus.healthcare === 'testing'}
              className="w-full py-1.5 text-xs bg-white/5 border border-white/10 text-gray-300 rounded hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <Zap className={`w-3 h-3 ${testingStatus.healthcare === 'testing' ? 'animate-pulse' : ''}`} />
              {testingStatus.healthcare === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          <div className="flex flex-col p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-white font-bold">Finance (Vertex)</div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
              </div>
              <div className="px-2 py-1 bg-blue-500/20 text-blue-500 text-[10px] font-bold rounded uppercase">
                Running
              </div>
            </div>
            <button
              onClick={() => handleTestConnection('finance')}
              disabled={testingStatus.finance === 'testing'}
              className="w-full py-1.5 text-xs bg-white/5 border border-white/10 text-gray-300 rounded hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <Zap className={`w-3 h-3 ${testingStatus.finance === 'testing' ? 'animate-pulse' : ''}`} />
              {testingStatus.finance === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          <div className="flex flex-col p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-white font-bold">Tech (Vertex)</div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
              </div>
              <div className="px-2 py-1 bg-purple-500/20 text-purple-500 text-[10px] font-bold rounded uppercase">
                Running
              </div>
            </div>
            <button
              onClick={() => handleTestConnection('tech')}
              disabled={testingStatus.tech === 'testing'}
              className="w-full py-1.5 text-xs bg-white/5 border border-white/10 text-gray-300 rounded hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <Zap className={`w-3 h-3 ${testingStatus.tech === 'testing' ? 'animate-pulse' : ''}`} />
              {testingStatus.tech === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </div>
      </div>

      {/* Synthetic Data Review Section */}
      <div className="bg-dark-surface/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-bottom border-white/10 bg-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <FileJson className="w-5 h-5 text-purple-500" />
              Synthetic Training Data Review (Phase 2)
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Review generated dialogues for Philip Lobkowicz fine-tuning.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {syntheticData.length > 0 && (
              <>
                <button
                  onClick={handleUploadToGCS}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-500 text-xs rounded-lg hover:bg-purple-500/30 transition-all disabled:opacity-50"
                >
                  <CloudUpload className={`w-3.5 h-3.5 ${isUploading ? 'animate-pulse' : ''}`} />
                  {isUploading ? 'Uploading...' : 'Upload to GCS'}
                </button>
                {gcsUri && (
                  <button
                    onClick={handleStartTuning}
                    disabled={isTuning || (tuningJob && tuningJob.state !== 'FAILED' && tuningJob.state !== 'CANCELLED')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-500 text-xs rounded-lg hover:bg-blue-500/30 transition-all disabled:opacity-50"
                  >
                    <Settings className={`w-3.5 h-3.5 ${isTuning ? 'animate-spin' : ''}`} />
                    {isTuning ? 'Starting...' : tuningJob ? `Job: ${tuningJob.state}` : 'Start Fine-Tuning'}
                  </button>
                )}
                <button
                  onClick={() => {
                    const blob = new Blob(
                      [syntheticData.map((d) => JSON.stringify(d)).join('\n')],
                      { type: 'application/x-jsonlines' }
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'synthetic-training-data.jsonl';
                    a.click();
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-white text-xs rounded-lg hover:bg-white/10 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download JSONL
                </button>
              </>
            )}
          </div>
        </div>
        <div className="p-6">
          {gcsUri && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-green-500 text-sm font-bold">Staged for Fine-Tuning</div>
                  <div className="text-xs text-gray-400 font-mono">{gcsUri}</div>
                </div>
              </div>
              <a
                href={`https://console.cloud.google.com/storage/browser/${gcsUri.replace('gs://', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neon-cyan hover:underline flex items-center gap-1"
              >
                View in Console
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
          {isLoadingData ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : syntheticData.length > 0 ? (
            <div className="space-y-3">
              {syntheticData.map((entry, idx) => (
                <div key={idx} className="border border-white/5 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedEntry(expandedEntry === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-purple-500">#{idx + 1}</span>
                      <span className="text-sm text-gray-300 truncate max-w-md">
                        {entry.contents?.[0]?.parts?.[0]?.text || 'No content'}
                      </span>
                    </div>
                    {expandedEntry === idx ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedEntry === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-black/40"
                      >
                        <div className="p-4 space-y-4">
                          <div className="space-y-1">
                            <p className="text-[10px] font-mono text-gray-500 uppercase">
                              Client Input
                            </p>
                            <p className="text-sm text-gray-300 bg-white/5 p-3 rounded-lg border border-white/5">
                              {entry.contents?.[0]?.parts?.[0]?.text || 'No input'}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-mono text-purple-500 uppercase">
                              Philip Lobkowicz Response
                            </p>
                            <p className="text-sm text-white bg-purple-500/10 p-3 rounded-lg border border-purple-500/20 italic">
                              {entry.contents?.[1]?.parts?.[0]?.text || 'No response'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-lg">
              <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">
                No synthetic data generated yet. Click "Generate Synthetic Data" above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
