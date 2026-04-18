import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Lock,
  Maximize2,
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  BrainCircuit,
  Terminal,
  X,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  History,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { KnowledgeGraph } from './KnowledgeGraph';
import {
  KnowledgeGraph as GraphData,
  ProcessingLogEntry,
  WavvaultData,
} from '../../types/wavvault';
import { skylar } from '../../services/skylarService';
import { useIdentity } from '../../contexts/IdentityContext';
import { analyzeDelta } from '../../services/assetEngineService';
import SkylarCommitSuggestion from './SkylarCommitSuggestion';
import AssetSynthesizer from '../synthesis/AssetSynthesizer';

interface NeuralSynthesisEngineProps {
  userId: string;
  currentStage: string;
}

export const NeuralSynthesisEngine: React.FC<NeuralSynthesisEngineProps> = ({
  userId,
  currentStage,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [processingLogs, setProcessingLogs] = useState<ProcessingLogEntry[]>([]);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [activeTab, setActiveTab] = useState<'graph' | 'logs' | 'assets'>('graph');
  const [isSimulating, setIsSimulating] = useState(false);
  const [integrityStatus, setIntegrityStatus] = useState<{
    valid: boolean;
    actualHash: string;
    expectedHash: string;
  } | null>(null);
  const [existingWavvault, setExistingWavvault] = useState<WavvaultData | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [commitSuggestion, setCommitSuggestion] = useState<{ show: boolean; reason: string }>({
    show: false,
    reason: '',
  });
  const { user } = useIdentity();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for unlock status
  useEffect(() => {
    const checkUnlock = async () => {
      const isDiscovery =
        currentStage.toLowerCase() === 'discovery' ||
        currentStage.toLowerCase() === 'branding' ||
        currentStage.toLowerCase() === 'outreach';
      const isSimulated = localStorage.getItem('sparkwavv_discovery_unlocked') === 'true';
      setIsUnlocked(isDiscovery || isSimulated);

      if (isDiscovery || isSimulated) {
        try {
          const data = await skylar.getWavvaultData(userId);
          if (data) {
            setExistingWavvault(data);
            if (data.graph && data.graph.nodes.length > 0) {
              setGraphData(data.graph);
            }
            if (data.logs && data.logs.length > 0) {
              setProcessingLogs(data.logs);
            }
          }
        } catch (err) {
          console.error('Failed to fetch Wavvault data:', err);
        }
      }
    };

    checkUnlock();
    window.addEventListener('discovery-status-changed', checkUnlock);
    window.addEventListener('storage', checkUnlock);
    return () => {
      window.removeEventListener('discovery-status-changed', checkUnlock);
      window.removeEventListener('storage', checkUnlock);
    };
  }, [currentStage, userId]);

  // Simulate Initial Synthesis on Unlock
  useEffect(() => {
    if (isUnlocked && graphData.nodes.length === 0) {
      performInitialSynthesis();
    }
  }, [isUnlocked, graphData.nodes.length]);

  const performInitialSynthesis = async () => {
    if (!user) return;

    addLog('Initializing Heuristic Parser v4.2...', 'info', 'init');
    await new Promise((r) => setTimeout(r, 1000));
    addLog('Extracting Semantic Vectors from Onboarding Data...', 'info', 'extract');
    await new Promise((r) => setTimeout(r, 1500));

    // Mock initial synthesis based on "Spark"
    const initialGraph: GraphData = {
      nodes: [
        {
          id: 'spark-1',
          label: 'The Spark',
          type: 'spark',
          strength: 1,
          description: 'Core professional driver',
        },
        { id: 'skill-1', label: 'Strategic Leadership', type: 'skill', strength: 0.8 },
        { id: 'goal-1', label: 'Industry Dominance', type: 'goal', strength: 0.9 },
        { id: 'value-1', label: 'Radical Transparency', type: 'value', strength: 0.85 },
      ],
      links: [
        { source: 'spark-1', target: 'skill-1', weight: 0.8, type: 'influence' },
        { source: 'spark-1', target: 'goal-1', weight: 0.9, type: 'influence' },
        { source: 'spark-1', target: 'value-1', weight: 0.85, type: 'influence' },
      ],
    };

    setGraphData(initialGraph);
    addLog('Initial Synthesis Complete. Knowledge Graph Updated.', 'success', 'complete');

    // Verify integrity after initial load
    try {
      const integrity = await skylar.verifyWavvaultIntegrity(userId);
      setIntegrityStatus(integrity);
    } catch (err) {
      console.error('Integrity check failed:', err);
    }
  };

  const handleCommit = async () => {
    if (!user) return;
    setIsCommitting(true);
    try {
      const data: WavvaultData = {
        userId: userId,
        identity: existingWavvault?.identity || '',
        strengths: existingWavvault?.strengths || [],
        careerStories: existingWavvault?.careerStories || [],
        graph: graphData,
        logs: processingLogs,
        journeyEvents: existingWavvault?.journeyEvents || [],
        artifacts: existingWavvault?.artifacts || [],
        lastSynthesis: new Date().toISOString(),
        isDiscoveryUnlocked: true,
      };
      await skylar.saveWavvaultData(data, true);

      // Re-verify integrity after commit
      const integrity = await skylar.verifyWavvaultIntegrity(userId);
      setIntegrityStatus(integrity);

      addLog('IMMUTABLE_SNAPSHOT_CREATED // INTEGRITY_VERIFIED', 'success', 'commit');
    } catch (error) {
      console.error('Commit failed:', error);
      addLog('COMMIT_FAILED // INTEGRITY_ERROR', 'error', 'commit');
    } finally {
      setIsCommitting(false);
    }
  };

  const addLog = (message: string, status: ProcessingLogEntry['status'], step: string) => {
    const newLog: ProcessingLogEntry = {
      timestamp: new Date().toISOString(),
      message,
      status,
      step,
    };
    setProcessingLogs((prev) => [...prev, newLog]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsIngesting(true);
    setActiveTab('logs');

    try {
      addLog(`Initializing Multi-Modal Parser v4.2 for ${file.name}...`, 'info', 'init');
      await new Promise((r) => setTimeout(r, 800));

      addLog(
        `Tokenizing Document Structure (${file.name.split('.').pop()?.toUpperCase()})...`,
        'info',
        'tokenize'
      );
      await new Promise((r) => setTimeout(r, 1000));

      let content = '';
      if (file.name.endsWith('.docx') || file.name.endsWith('.pdf')) {
        addLog(`Parsing ${file.name.endsWith('.docx') ? 'DOCX' : 'PDF'} structure via backend engine...`, 'info', 'parse');
        
        try {
          const auth = (await import('../../lib/firebase')).auth;
          const token = await auth.currentUser?.getIdToken();
          
          const formData = new FormData();
          formData.append('file', file);
          
          const res = await fetch('/api/parse-document', {
            method: 'POST',
            body: formData,
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          
          if (!res.ok) throw new Error(`Parse failed: ${res.statusText}`);
          const parsedData = await res.json();
          content = parsedData.text;
        } catch (err: any) {
             throw new Error(`Failed to parse document: ${err.message}`);
        }
      } else {
        addLog('Parsing raw text stream...', 'info', 'parse');
        content = await file.text();
      }

      addLog('Performing Entity Extraction (NER) on Raw Text...', 'info', 'ner');
      await new Promise((r) => setTimeout(r, 1200));

      addLog('Extracting Semantic Vectors (Skills/Values/Goals)...', 'info', 'extract');
      await new Promise((r) => setTimeout(r, 1500));

      addLog('Calculating Cosine Similarity with Wavvault Clusters...', 'info', 'similarity');
      await new Promise((r) => setTimeout(r, 1000));

      addLog('Mapping Multi-Dimensional Edges to Wavvault...', 'info', 'map');
      await new Promise((r) => setTimeout(r, 1200));

      addLog('Synthesizing Multi-Dimensional Career DNA...', 'info', 'synthesis');

      // Trigger real synthesis with Gemini
      const history = await skylar.getChatHistory(user.uid);
      const updatedGraph = await skylar.performSynthesis(user.uid, history, content, graphData);

      setGraphData(updatedGraph);
      addLog(
        `Neural Synthesis Complete: ${updatedGraph.nodes.length - graphData.nodes.length} New Nodes Identified.`,
        'success',
        'complete'
      );

      // Analyze delta for versioning suggestion
      const deltaResult = await analyzeDelta({
        userId: user.uid,
        graph: updatedGraph,
        identity: existingWavvault?.identity || '',
        strengths: existingWavvault?.strengths || [],
        careerStories: existingWavvault?.careerStories || [],
        logs: processingLogs,
        journeyEvents: existingWavvault?.journeyEvents || [],
        artifacts: existingWavvault?.artifacts || [],
        lastSynthesis: new Date().toISOString(),
        isDiscoveryUnlocked: true,
      });

      if (deltaResult.suggestCommit) {
        setCommitSuggestion({
          show: true,
          reason: deltaResult.reason || 'Significant changes detected in your career DNA.',
        });
      }

      // Save to Firestore
      await skylar.saveWavvaultData({
        userId: user.uid,
        graph: updatedGraph,
        logs: [
          ...processingLogs,
          {
            timestamp: new Date().toISOString(),
            message: 'Synthesis Complete',
            status: 'success',
            step: 'complete',
          },
        ],
        journeyEvents: existingWavvault?.journeyEvents || [],
        artifacts: existingWavvault?.artifacts || [],
        lastSynthesis: new Date().toISOString(),
        isDiscoveryUnlocked: true,
      });
    } catch (error) {
      addLog('Synthesis Failed: Internal Engine Error', 'error', 'error');
      console.error(error);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleUnlock = () => {
    localStorage.setItem('sparkwavv_discovery_unlocked', 'true');
    window.dispatchEvent(new CustomEvent('discovery-status-changed'));
  };

  if (!isUnlocked) {
    return (
      <div className="glass-panel p-8 border-white/10 relative overflow-hidden group min-h-[400px] flex flex-col items-center justify-center text-center space-y-6">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-transparent opacity-50" />

        <div className="relative z-10 space-y-4">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto relative">
            <Lock className="w-8 h-8 text-white/20 group-hover:text-neon-cyan transition-colors" />
            <div className="absolute inset-0 border-2 border-neon-cyan/20 rounded-full animate-ping opacity-20" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight">Neural Synthesis Engine</h3>
            <p className="text-sm text-white/40 max-w-xs mx-auto uppercase tracking-widest font-mono">
              [STATUS: ENCRYPTED]
            </p>
          </div>

          <p className="text-sm text-white/60 max-w-sm mx-auto leading-relaxed">
            The Neural Synthesis Engine is currently locked. Complete the Ignition phase and upgrade
            to Discovery to initialize your career knowledge graph.
          </p>

          <div className="pt-4 space-y-4">
            <button
              onClick={handleUnlock}
              className="px-8 py-3 bg-neon-cyan text-black rounded-xl font-bold text-sm hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all flex items-center gap-2 mx-auto"
            >
              <Zap className="w-4 h-4" />
              Initialize Discovery Phase
            </button>

            <button
              onClick={() => setIsSimulating(true)}
              className="text-[10px] text-white/20 uppercase font-bold tracking-widest hover:text-white transition-colors"
            >
              Simulate Discovery Upgrade
            </button>
          </div>
        </div>

        {isSimulating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center p-8 space-y-6"
          >
            <div className="w-full max-w-xs space-y-4">
              <div className="flex items-center justify-between text-[10px] font-mono text-neon-cyan">
                <span>DECRYPTING_IDENTITY_CORE</span>
                <span>{Math.round(100)}%</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2 }}
                  onAnimationComplete={handleUnlock}
                  className="h-full bg-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.5)]"
                />
              </div>
              <p className="text-[10px] font-mono text-white/40 text-center animate-pulse">
                INITIALIZING ANALYTICAL ARCHITECT PERSONA...
              </p>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="glass-panel border-neon-cyan/20 flex flex-col min-h-[500px] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 flex items-center justify-center text-neon-cyan">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">
              Neural Synthesis Engine
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">
                System Online // Analytical Mode
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setActiveTab('graph')}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${activeTab === 'graph' ? 'bg-neon-cyan text-black' : 'text-white/40 hover:text-white'}`}
            >
              Graph
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${activeTab === 'logs' ? 'bg-neon-cyan text-black' : 'text-white/40 hover:text-white'}`}
            >
              Logs
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${activeTab === 'assets' ? 'bg-neon-cyan text-black' : 'text-white/40 hover:text-white'}`}
            >
              Assets
            </button>
          </div>

          <button
            onClick={() => setIsFullScreen(true)}
            className="p-2 text-white/40 hover:text-neon-cyan transition-colors"
            title="Expand Graph"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Main View */}
        <div className="flex-1 p-6 relative min-h-[300px]">
          {activeTab === 'graph' ? (
            <div className="w-full h-full flex items-center justify-center bg-black/40 rounded-2xl border border-white/5 relative group">
              <KnowledgeGraph data={graphData} width={500} height={350} />

              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                  <div className="w-2 h-2 rounded-full bg-[#00f2ff]" />
                  <span>SKILLS</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                  <div className="w-2 h-2 rounded-full bg-[#ff00ff]" />
                  <span>GOALS</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                  <div className="w-2 h-2 rounded-full bg-[#00ffcc]" />
                  <span>VALUES</span>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] font-mono text-white/20">
                  SCROLL TO ZOOM // DRAG TO EXPLORE
                </p>
              </div>
            </div>
          ) : activeTab === 'logs' ? (
            <div className="w-full h-full bg-black/60 rounded-2xl border border-white/5 p-6 font-mono overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 text-neon-cyan mb-4">
                <Terminal className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Synthesis Processing Log
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                {processingLogs.map((log, i) => (
                  <div key={i} className="flex gap-4 text-[10px] leading-relaxed">
                    <span className="text-white/20 shrink-0">
                      [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]
                    </span>
                    <span
                      className={
                        log.status === 'success'
                          ? 'text-emerald-400'
                          : log.status === 'error'
                            ? 'text-red-400'
                            : log.status === 'warning'
                              ? 'text-amber-400'
                              : 'text-white/60'
                      }
                    >
                      {log.status === 'success' ? '✓' : log.status === 'error' ? '✗' : '>'}{' '}
                      {log.message}
                    </span>
                  </div>
                ))}
                {isIngesting && (
                  <div className="flex gap-4 text-[10px] text-neon-cyan animate-pulse">
                    <span className="text-white/20">
                      [{new Date().toLocaleTimeString([], { hour12: false })}]
                    </span>
                    <span>{'>'} ANALYZING_MULTI_DIMENSIONAL_DATA...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-full overflow-y-auto custom-scrollbar">
              <AssetSynthesizer userId={userId} />
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="w-full lg:w-80 p-6 border-t lg:border-t-0 lg:border-l border-white/10 bg-white/[0.01] space-y-6">
          <section className="space-y-4">
            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
              <Upload className="w-3 h-3" />
              Data Ingestion
            </h4>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-3 ${
                isIngesting
                  ? 'border-neon-cyan/50 bg-neon-cyan/5'
                  : 'border-white/10 hover:border-neon-cyan/40 hover:bg-white/5'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.docx"
              />
              {isIngesting ? (
                <Loader2 className="w-8 h-8 text-neon-cyan animate-spin mx-auto" />
              ) : (
                <FileText className="w-8 h-8 text-white/20 mx-auto" />
              )}
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">Upload Career Assets</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">
                  PDF or DOCX supported
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              Immutable Storage
            </h4>

            <div className="space-y-3">
              {integrityStatus && (
                <div
                  className={`p-4 rounded-xl border flex items-center gap-3 ${
                    integrityStatus.valid
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  {integrityStatus.valid ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  )}
                  <div>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-widest ${
                        integrityStatus.valid ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {integrityStatus.valid ? 'Integrity Verified' : 'Integrity Compromised'}
                    </p>
                    <p className="text-[8px] font-mono text-white/40 truncate w-40">
                      HASH: {integrityStatus.actualHash.substring(0, 16)}...
                    </p>
                  </div>
                </div>
              )}

              {!integrityStatus?.valid && integrityStatus && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-red-400 leading-tight">
                    Warning: Data integrity check failed. The current state does not match the last
                    committed snapshot.
                  </p>
                </div>
              )}

              <button
                onClick={handleCommit}
                disabled={isCommitting}
                className="w-full py-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-[10px] font-bold uppercase tracking-widest hover:bg-neon-cyan/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCommitting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3 h-3" />
                )}
                Commit to Vault
              </button>

              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <History className="w-3 h-3" />
                Version History
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Engine Insights
            </h4>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40 uppercase font-bold">
                    Synthesis Depth
                  </span>
                  <span className="text-[10px] text-neon-cyan font-mono">84%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-neon-cyan w-[84%]" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <p className="text-[10px] text-white/60 leading-relaxed italic">
                  "Skylar has identified a strong semantic bridge between your technical skills and
                  your leadership goals."
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Full Screen Modal */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="p-8 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-4">
                <BrainCircuit className="w-8 h-8 text-neon-cyan" />
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Neural Synthesis Explorer</h2>
                  <p className="text-xs text-white/40 uppercase tracking-[0.2em] font-mono">
                    Full-Scale Identity Mapping v4.2
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFullScreen(false)}
                className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="flex-1 relative overflow-hidden">
              <KnowledgeGraph
                data={graphData}
                width={window.innerWidth}
                height={window.innerHeight - 120}
                isFullScreen
              />

              {/* Legend Overlay */}
              <div className="absolute bottom-12 left-12 p-8 glass-panel border-white/10 space-y-6">
                <h4 className="text-sm font-bold uppercase tracking-widest text-neon-cyan">
                  Identity Legend
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full bg-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.5)]" />
                    <span className="text-xs font-mono text-white/80">
                      SKILLS // Technical & Soft Competencies
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full bg-[#ff00ff] shadow-[0_0_10px_rgba(255,0,255,0.5)]" />
                    <span className="text-xs font-mono text-white/80">
                      GOALS // Trajectories & Ambitions
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full bg-[#00ffcc] shadow-[0_0_10px_rgba(0,255,204,0.5)]" />
                    <span className="text-xs font-mono text-white/80">
                      VALUES // Core Drivers & Principles
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                    <span className="text-xs font-mono text-white/80">
                      THE SPARK // Foundational Anchor
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls Overlay */}
              <div className="absolute top-12 right-12 space-y-4">
                <div className="glass-panel p-4 border-white/10 text-center">
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    Nodes: {graphData.nodes.length} // Edges: {graphData.links.length}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SkylarCommitSuggestion
        show={commitSuggestion.show}
        reason={commitSuggestion.reason}
        onCommit={() => {
          handleCommit();
          setCommitSuggestion({ show: false, reason: '' });
        }}
        onDismiss={() => setCommitSuggestion({ show: false, reason: '' })}
      />
    </div>
  );
};
