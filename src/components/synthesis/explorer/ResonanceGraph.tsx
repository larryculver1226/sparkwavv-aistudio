import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { DistilledArtifact } from '../../../types/wavvault';

interface ResonanceGraphProps {
  artifacts: DistilledArtifact[];
  activeId?: string;
}

const ResonanceConstellation: React.FC<ResonanceGraphProps> = ({ artifacts, activeId }) => {
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

export const ResonanceGraph: React.FC<ResonanceGraphProps> = ({ artifacts, activeId }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="relative h-[700px] rounded-[3rem] border border-white/5 bg-black/40 backdrop-blur-3xl overflow-hidden"
    >
      <ResonanceConstellation artifacts={artifacts} activeId={activeId} />
      
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
  );
};
