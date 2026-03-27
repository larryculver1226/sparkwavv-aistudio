import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  GitBranch, 
  ShieldCheck, 
  Lock, 
  Search, 
  Download, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Sparkles,
  Database,
  ArrowLeft,
  ArrowRight,
  Filter,
  MoreVertical,
  Activity,
  Cpu,
  Globe,
  Layers,
  Zap,
  Target,
  Brain,
  FileText
} from 'lucide-react';
import { ValidationGateEvent, DistilledArtifact } from '../../types/wavvault';
import { CinematicReader } from './CinematicReader';

interface WavvaultExplorerProps {
  userId: string;
  events: ValidationGateEvent[];
  artifacts: DistilledArtifact[];
}

type NarrativeStage = 'idle' | 'sequencing' | 'mapping' | 'spark' | 'complete';

const ResonanceConstellation: React.FC<{ artifacts: DistilledArtifact[]; activeId?: string }> = ({ artifacts, activeId }) => {
  // Generate random float offsets for each node
  const nodeOffsets = useMemo(() => artifacts.map(() => ({
    x: (Math.random() - 0.5) * 40,
    y: (Math.random() - 0.5) * 40,
    duration: 3 + Math.random() * 4
  })), [artifacts]);

  // Calculate active node position for panning
  const activeNodePos = useMemo(() => {
    if (!activeId) return { x: 400, y: 300 };
    const idx = artifacts.findIndex(a => a.id === activeId);
    if (idx === -1) return { x: 400, y: 300 };
    const angle = (idx / artifacts.length) * Math.PI * 2;
    const r = 220;
    return {
      x: 400 + Math.cos(angle) * r,
      y: 300 + Math.sin(angle) * r
    };
  }, [activeId, artifacts]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Background Nebula */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neon-cyan/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-neon-magenta/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.svg 
        className="w-full h-full relative z-10" 
        viewBox="0 0 800 600"
        animate={{
          viewBox: activeId 
            ? `${activeNodePos.x - 200} ${activeNodePos.y - 150} 400 300` 
            : `0 0 800 600`
        }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      >
        <defs>
          <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connections */}
        {artifacts.map((a, i) => {
          if (i === 0) return null;
          const angle1 = (i / artifacts.length) * Math.PI * 2;
          const angle2 = ((i - 1) / artifacts.length) * Math.PI * 2;
          const r = 220;
          const x1 = 400 + Math.cos(angle1) * r;
          const y1 = 300 + Math.sin(angle1) * r;
          const x2 = 400 + Math.cos(angle2) * r;
          const y2 = 300 + Math.sin(angle2) * r;

          return (
            <motion.line
              key={`line-${i}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(0, 243, 255, 0.15)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 3, delay: i * 0.1 }}
            />
          );
        })}

        {/* Nodes */}
        {artifacts.map((a, i) => {
          const angle = (i / artifacts.length) * Math.PI * 2;
          const r = 220;
          const baseX = 400 + Math.cos(angle) * r;
          const baseY = 300 + Math.sin(angle) * r;
          const isActive = a.id === activeId;
          const offset = nodeOffsets[i];

          return (
            <motion.g
              key={a.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: isActive ? 1.6 : 1, 
                opacity: 1,
                x: isActive ? 0 : offset.x,
                y: isActive ? 0 : offset.y
              }}
              transition={{ 
                scale: { type: 'spring', stiffness: 100 },
                x: { duration: offset.duration, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
                y: { duration: offset.duration * 1.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
              }}
            >
              <circle
                cx={baseX} cy={baseY} r={isActive ? 14 : 10}
                fill={isActive ? "#00f3ff" : "rgba(255,255,255,0.05)"}
                stroke={isActive ? "#00f3ff" : "rgba(255,255,255,0.2)"}
                strokeWidth="2"
                filter={isActive ? "url(#glow)" : ""}
                className="cursor-pointer"
              />
              {isActive && (
                <motion.circle
                  cx={baseX} cy={baseY} r={25}
                  fill="none"
                  stroke="#00f3ff"
                  strokeWidth="1"
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
              )}
            </motion.g>
          );
        })}

        {/* Central Core */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.5, duration: 2, type: 'spring' }}
        >
          <circle cx="400" cy="300" r="45" fill="url(#nodeGradient)" className="text-neon-cyan" filter="url(#glow)" />
          <motion.circle
            cx="400" cy="300" r="60"
            fill="none"
            stroke="#00f3ff"
            strokeWidth="0.5"
            strokeDasharray="15 10"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
          <motion.circle
            cx="400" cy="300" r="75"
            fill="none"
            stroke="#00f3ff"
            strokeWidth="0.2"
            strokeDasharray="5 15"
            animate={{ rotate: -360 }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          />
        </motion.g>
      </motion.svg>
    </div>
  );
};

export const WavvaultExplorer: React.FC<WavvaultExplorerProps> = ({ userId, events, artifacts }) => {
  const [viewMode, setViewMode] = useState<'linear' | 'branching'>('linear');
  const [selectedArtifact, setSelectedArtifact] = useState<DistilledArtifact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [narrativeStage, setNarrativeStage] = useState<NarrativeStage>('idle');
  const [activeArtifactId, setActiveArtifactId] = useState<string | undefined>();

  useEffect(() => {
    // Start intro sequence
    const sequence = async () => {
      setNarrativeStage('sequencing');
      await new Promise(r => setTimeout(r, 2000));
      setNarrativeStage('mapping');
      await new Promise(r => setTimeout(r, 2500));
      setNarrativeStage('spark');
      await new Promise(r => setTimeout(r, 3000));
      setNarrativeStage('complete');
    };
    sequence();
  }, []);

  // Filter artifacts and events based on search
  const filteredArtifacts = useMemo(() => artifacts.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.type.toLowerCase().includes(searchQuery.toLowerCase())
  ), [artifacts, searchQuery]);

  const filteredEvents = useMemo(() => events.filter(e => 
    e.phase.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.verdict.toLowerCase().includes(searchQuery.toLowerCase())
  ), [events, searchQuery]);

  // Combine and sort for linear view
  const timelineItems = useMemo(() => [
    ...filteredArtifacts.map(a => ({ type: 'artifact' as const, data: a, timestamp: new Date(a.timestamp) })),
    ...filteredEvents.map(e => ({ type: 'event' as const, data: e, timestamp: new Date(e.timestamp) }))
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()), [filteredArtifacts, filteredEvents]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-neon-cyan/30 relative overflow-hidden">
      {/* Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-neon-cyan/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-neon-magenta/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Intro Sequence Overlay */}
      <AnimatePresence>
        {narrativeStage !== 'complete' && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 text-center overflow-hidden"
          >
            {/* Background Particles for Intro */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * window.innerWidth, 
                    y: Math.random() * window.innerHeight,
                    opacity: 0 
                  }}
                  animate={{ 
                    y: [null, Math.random() * -200],
                    opacity: [0, 0.3, 0]
                  }}
                  transition={{ 
                    duration: 5 + Math.random() * 5, 
                    repeat: Infinity,
                    delay: Math.random() * 5
                  }}
                  className="absolute w-1 h-1 bg-neon-cyan rounded-full blur-[1px]"
                />
              ))}
            </div>

            <div className="relative w-80 h-80 mb-16">
              <AnimatePresence mode="wait">
                {narrativeStage === 'sequencing' && (
                  <motion.div
                    key="seq"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.2, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-full h-full border border-neon-cyan/20 rounded-full animate-spin-slow" />
                    <div className="absolute inset-4 border border-neon-cyan/10 rounded-full animate-spin-slow-reverse" />
                    <Database className="w-20 h-20 text-neon-cyan animate-pulse" />
                    <div className="absolute -bottom-16 font-mono text-[10px] text-neon-cyan tracking-[0.4em] uppercase font-black">
                      Sequencing Professional Signals...
                    </div>
                  </motion.div>
                )}
                {narrativeStage === 'mapping' && (
                  <motion.div
                    key="map"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.2, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="grid grid-cols-4 gap-4">
                      {[...Array(16)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: [0, 1, 0.5], scale: [0, 1.2, 1] }}
                          transition={{ delay: i * 0.05 }}
                          className="w-4 h-4 bg-neon-cyan/40 rounded-sm shadow-[0_0_10px_rgba(0,243,255,0.3)]"
                        />
                      ))}
                    </div>
                    <div className="absolute -bottom-16 font-mono text-[10px] text-neon-cyan tracking-[0.4em] uppercase font-black">
                      Mapping Career DNA Nodes...
                    </div>
                  </motion.div>
                )}
                {narrativeStage === 'spark' && (
                  <motion.div
                    key="spark"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-48 h-48 bg-neon-cyan rounded-full blur-[80px]" 
                    />
                    <Sparkles className="w-32 h-32 text-white drop-shadow-[0_0_30px_rgba(0,243,255,1)]" />
                    <div className="absolute -bottom-16 font-mono text-[10px] text-white tracking-[0.4em] uppercase font-black">
                      Spark Core Identified
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div 
              className="max-w-xl space-y-8 relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="space-y-2">
                <h2 className="text-4xl font-display font-bold italic text-white tracking-tighter">
                  {narrativeStage === 'sequencing' && "Accessing the Treasury"}
                  {narrativeStage === 'mapping' && "Synthesizing Inferences"}
                  {narrativeStage === 'spark' && "Your Professional Essence"}
                </h2>
                <div className="h-px w-24 bg-neon-cyan mx-auto opacity-50" />
              </div>

              {/* Skylar Dialogue Box */}
              <div className="relative p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-neon-cyan text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                  Skylar Transmission
                </div>
                <p className="text-lg text-white/70 leading-relaxed font-serif italic">
                  {narrativeStage === 'sequencing' && "I'm decrypting your professional history into a sovereign, immutable ledger. Every achievement is a signal."}
                  {narrativeStage === 'mapping' && "I'm identifying the latent connections between your past achievements and your future potential. The pattern is emerging."}
                  {narrativeStage === 'spark' && "The core of your professional identity has been distilled. This is the 'Spark' that will ignite your next chapter. Welcome home."}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Treasury Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050505]/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => window.history.back()}
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.05)] group hover:border-neon-cyan/50 transition-all">
              <Database className="w-6 h-6 text-neon-cyan group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight text-white italic">Wavvault <span className="text-neon-cyan">Treasury</span></h1>
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">
                <ShieldCheck className="w-3 h-3 text-neon-cyan" />
                Sovereign Professional DNA // v2.4.0
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {/* View Switcher */}
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
              <button
                onClick={() => setViewMode('linear')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'linear' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                Linear Feed
              </button>
              <button
                onClick={() => setViewMode('branching')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'branching' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'
                }`}
              >
                <GitBranch className="w-4 h-4" />
                Resonance Graph
              </button>
            </div>

            <button className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-neon-cyan text-black text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,243,255,0.4)] active:scale-95">
              <Download className="w-4 h-4" />
              Export Dossier
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-6 mb-20">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-neon-cyan transition-colors" />
            <input
              type="text"
              placeholder="Query the archive (e.g., 'Leadership Signals', 'Discovery Gate')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-3xl py-6 pl-16 pr-6 text-sm font-medium focus:outline-none focus:border-neon-cyan/50 focus:bg-white/[0.06] transition-all placeholder:text-white/20"
            />
          </div>
          <button className="flex items-center gap-3 px-8 py-6 rounded-3xl bg-white/[0.03] border border-white/10 text-[11px] font-black uppercase tracking-widest hover:bg-white/[0.06] transition-all group">
            <Filter className="w-5 h-5 text-neon-cyan group-hover:rotate-180 transition-transform duration-500" />
            Filter DNA
          </button>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'linear' ? (
            <motion.div
              key="linear"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {timelineItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className="relative pl-20 group"
                  onMouseEnter={() => item.type === 'artifact' && setActiveArtifactId(item.data.id)}
                >
                  {/* Timeline Line */}
                  {idx !== timelineItems.length - 1 && (
                    <div className="absolute left-[23px] top-12 bottom-[-48px] w-px bg-gradient-to-b from-white/20 via-white/5 to-transparent" />
                  )}

                  {/* Timeline Node */}
                  <div className={`absolute left-0 top-0 w-12 h-12 rounded-2xl border flex items-center justify-center bg-[#050505] z-10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 ${
                    item.type === 'event' 
                      ? item.data.status === 'passed' ? 'border-green-500/30 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
                        : item.data.status === 'warning' ? 'border-yellow-500/30 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.1)]'
                        : 'border-red-500/30 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                      : 'border-neon-cyan/30 text-neon-cyan shadow-[0_0_20px_rgba(0,243,255,0.1)]'
                  }`}>
                    {item.type === 'event' ? (
                      item.data.status === 'passed' ? <CheckCircle2 className="w-6 h-6" /> :
                      item.data.status === 'warning' ? <AlertTriangle className="w-6 h-6" /> :
                      <XCircle className="w-6 h-6" />
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
                    onClick={() => item.type === 'artifact' && setSelectedArtifact(item.data as DistilledArtifact)}
                  >
                    {/* Hover Glow */}
                    <div className="absolute -inset-4 bg-neon-cyan/5 opacity-0 group-hover/card:opacity-100 transition-opacity blur-3xl pointer-events-none" />

                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <span className={`text-[9px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full border ${
                          item.type === 'event' ? 'bg-white/5 border-white/10 text-white/40' : 'bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan'
                        }`}>
                          {item.type === 'event' ? 'Validation Gate' : (item.data as DistilledArtifact).type.replace('-', ' ')}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-white/20 font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          {item.timestamp.toLocaleDateString()} // {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <MoreVertical className="w-5 h-5 text-white/10 hover:text-white transition-colors" />
                    </div>

                    <div className="grid md:grid-cols-[1fr_280px] gap-12 relative z-10">
                      <div className="space-y-4">
                        <h3 className="text-2xl font-display font-bold text-white tracking-tight italic">
                          {item.type === 'event' ? `Gate Review: ${item.data.phase}` : (item.data as DistilledArtifact).title}
                        </h3>
                        
                        <div className="space-y-2">
                          <div className="text-[10px] font-black uppercase tracking-widest text-white/20">Raw Signal</div>
                          <p className="text-base text-white/60 leading-relaxed line-clamp-3 font-medium">
                            {item.type === 'event' ? item.data.verdict : (typeof (item.data as DistilledArtifact).content === 'string' ? (item.data as DistilledArtifact).content : (item.data as DistilledArtifact).content.description || (item.data as DistilledArtifact).content.quote)}
                          </p>
                        </div>
                      </div>

                      {/* Skylar's Inference Layer */}
                      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-neon-cyan">
                            <Brain className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Skylar's Inference</span>
                          </div>
                          <p className="text-xs text-white/50 leading-relaxed italic font-serif">
                            {item.type === 'artifact' 
                              ? (item.data as DistilledArtifact).metadata?.inference || "Analyzing latent potential within this signal..."
                              : "Gate integrity verified. Causal link established."}
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
          ) : (
            <motion.div
              key="branching"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative h-[700px] rounded-[3rem] border border-white/5 bg-black/40 backdrop-blur-3xl overflow-hidden"
            >
              <ResonanceConstellation artifacts={artifacts} activeId={activeArtifactId} />
              
              {/* Overlay UI for Graph */}
              <div className="absolute top-12 left-12 max-w-xs space-y-6 pointer-events-none">
                <div className="space-y-2">
                  <h3 className="text-3xl font-display font-bold italic text-white">Resonance <span className="text-neon-cyan">Graph</span></h3>
                  <p className="text-sm text-white/30 leading-relaxed">
                    Visualizing the semantic architecture of your professional DNA. Every node is a signal; every link is a potential.
                  </p>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-neon-cyan">
                    <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                    Live Synthesis Active
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/20">
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                    {artifacts.length} DNA Markers Identified
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="absolute bottom-12 right-12 flex gap-8 p-6 rounded-2xl bg-black/60 border border-white/5 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-neon-cyan shadow-[0_0_10px_rgba(0,243,255,0.5)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Core Spark</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Artifact Node</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Cinematic Reader Modal */}
      <CinematicReader 
        artifact={selectedArtifact} 
        onClose={() => setSelectedArtifact(null)} 
      />

      {/* Security Footer */}
      <footer className="py-20 border-t border-white/5 bg-black relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white/20" />
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-black tracking-[0.3em] uppercase text-white/40">
                End-to-End Encrypted // Sovereign Control
              </div>
              <div className="text-[9px] font-mono text-white/20">
                AES-256-GCM // Zero-Knowledge Architecture // Ledger ID: {userId.slice(0, 8)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-12 text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">
            <a href="#" className="hover:text-neon-cyan transition-colors">Privacy Protocol</a>
            <a href="#" className="hover:text-neon-cyan transition-colors">Data Portability</a>
            <a href="#" className="hover:text-neon-cyan transition-colors">Ledger Verification</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
