import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  History,
  ChevronRight,
  ChevronLeft,
  Clock,
  Tag,
  AlertCircle,
  CheckCircle2,
  Zap,
  Target,
  Compass,
  Award,
  Settings2,
  Brain,
  Database,
  X,
} from 'lucide-react';
import * as d3 from 'd3';
import { UserInsight } from '../types/dashboard';

interface EvolutionVisualizerProps {
  insights: UserInsight[];
  onInsightClick?: (insight: UserInsight) => void;
}

type ViewMode = 'history' | 'neural';

export const EvolutionVisualizer: React.FC<EvolutionVisualizerProps> = ({
  insights,
  onInsightClick,
}) => {
  const [view, setView] = useState<ViewMode>('neural');
  const [selectedNode, setSelectedNode] = useState<UserInsight | null>(null);
  const [hoveredNode, setHoveredNode] = useState<UserInsight | null>(null);
  const [showLogicChain, setShowLogicChain] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (view !== 'neural' || !svgRef.current || insights.length === 0) return;

    const width = 800;
    const height = 500;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');

    // Add a central "Spark Core" glow
    svg
      .append('defs')
      .append('radialGradient')
      .attr('id', 'spark-glow')
      .selectAll('stop')
      .data([
        { offset: '0%', color: '#00f3ff', opacity: 0.3 },
        { offset: '100%', color: '#00f3ff', opacity: 0 },
      ])
      .enter()
      .append('stop')
      .attr('offset', (d) => d.offset)
      .attr('stop-color', (d) => d.color)
      .attr('stop-opacity', (d) => d.opacity);

    svg
      .append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', 150)
      .attr('fill', 'url(#spark-glow)')
      .attr('class', 'animate-pulse');

    const nodes = insights.map((d) => ({ ...d, id: d.id || Math.random().toString() }));
    const links: any[] = [];

    // Create links based on tags or shared context
    nodes.forEach((node, i) => {
      nodes.slice(i + 1).forEach((other) => {
        const commonTags = node.tags?.filter((t) => other.tags?.includes(t));
        if (commonTags && commonTags.length > 0) {
          links.push({ source: node.id, target: other.id, value: commonTags.length });
        }
      });
    });

    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    const link = svg
      .append('g')
      .attr('stroke', '#00f3ff')
      .attr('stroke-opacity', 0.2)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d) => Math.sqrt(d.value) * 2);

    const node = svg
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'cursor-pointer')
      .on('mouseenter', (event, d) => setHoveredNode(d))
      .on('mouseleave', () => setHoveredNode(null))
      .on('click', (event, d) => {
        setSelectedNode(d);
        setShowLogicChain(true);
      });

    // Node Background
    node
      .append('circle')
      .attr('r', 25)
      .attr('fill', (d) => (d.status === 'confirmed' ? '#00f3ff20' : '#ffffff05'))
      .attr('stroke', (d) => (d.status === 'confirmed' ? '#00f3ff' : '#ffffff20'))
      .attr('stroke-width', 1.5);

    // Node Icon/Text Placeholder
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#fff')
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .text((d) => d.type.split('_')[0].toUpperCase());

    // Filaments (Animated lines flowing to center for Ignition phase)
    const filaments = svg
      .append('g')
      .attr('class', 'filaments')
      .selectAll('path')
      .data(nodes.filter((n) => n.status === 'confirmed'))
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', '#00f3ff')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.3);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);

      filaments.attr('d', (d: any) => {
        const dx = width / 2 - d.x;
        const dy = height / 2 - d.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        return `M${d.x},${d.y}A${dr},${dr} 0 0,1 ${width / 2},${height / 2}`;
      });
    });

    return () => {
      simulation.stop();
    };
  }, [view, insights]);

  return (
    <div className="w-full h-full flex flex-col bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden relative">
      {/* Background Nebula */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full animate-pulse delay-1000" />
      </div>

      <div className="p-8 border-b border-white/5 flex items-center justify-between relative z-10">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <Zap className="w-6 h-6 text-neon-cyan" />
            Synthesis Core
          </h2>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold mt-1">
            Real-time Evolution DNA
          </p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setView('history')}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'history' ? 'bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,243,255,0.4)]' : 'text-white/40 hover:text-white'}`}
          >
            History
          </button>
          <button
            onClick={() => setView('neural')}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'neural' ? 'bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,243,255,0.4)]' : 'text-white/40 hover:text-white'}`}
          >
            Neural
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {view === 'history' ? (
          <div className="h-full overflow-y-auto p-8 space-y-4 custom-scrollbar">
            {insights.map((insight, idx) => (
              <motion.div
                key={insight.id || idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-neon-cyan/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${insight.status === 'confirmed' ? 'bg-neon-cyan shadow-[0_0_8px_rgba(0,243,255,0.8)]' : 'bg-white/20'}`}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                      {insight.type.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-white/20">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed mb-4">{insight.content}</p>
                <div className="flex flex-wrap gap-2">
                  {insight.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] text-white/40 uppercase tracking-tighter"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full relative">
            <svg ref={svgRef} className="w-full h-full" />

            {/* Ancestry Trace Overlay */}
            <AnimatePresence>
              {hoveredNode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-8 left-8 p-6 glass-panel rounded-2xl border border-neon-cyan/20 bg-black/60 max-w-xs pointer-events-none"
                >
                  <p className="text-[10px] text-neon-cyan uppercase tracking-widest font-bold mb-2">
                    Ancestry Trace
                  </p>
                  <p className="text-sm text-white/80 leading-relaxed">{hoveredNode.content}</p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-white/40 font-mono">
                    <Database className="w-3 h-3" />
                    Source: {hoveredNode.evidence || 'Synthesized Signal'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Logic Chain Modal (Deep-Link) */}
      <AnimatePresence>
        {showLogicChain && selectedNode && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogicChain(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-2xl bg-zinc-900 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3 text-neon-cyan">
                    <Brain className="w-6 h-6" />
                    <h3 className="text-2xl font-display font-bold tracking-tight uppercase">
                      Trace to Source
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowLogicChain(false)}
                    className="p-2 rounded-full bg-white/5 text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="p-6 rounded-2xl bg-neon-cyan/5 border border-neon-cyan/20">
                    <p className="text-[10px] text-neon-cyan uppercase tracking-widest font-bold mb-3">
                      Synthesized Marker
                    </p>
                    <p className="text-lg text-white font-medium">{selectedNode.content}</p>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <div className="w-px h-12 bg-gradient-to-b from-neon-cyan to-transparent" />
                    <div className="p-4 rounded-full bg-white/5 border border-white/10">
                      <Zap className="w-5 h-5 text-white/40" />
                    </div>
                    <div className="w-px h-12 bg-gradient-to-t from-neon-magenta to-transparent" />
                  </div>

                  <div className="p-6 rounded-2xl bg-neon-magenta/5 border border-neon-magenta/20">
                    <p className="text-[10px] text-neon-magenta uppercase tracking-widest font-bold mb-3">
                      Raw Signal Ancestry
                    </p>
                    <p className="text-sm text-white/60 leading-relaxed italic">
                      "
                      {selectedNode.evidence ||
                        'This insight was synthesized from multiple overlapping signals in your Wavvault, specifically correlating your stated goals with historical achievements.'}
                      "
                    </p>
                  </div>
                </div>

                <div className="mt-12 flex justify-end">
                  <button
                    onClick={() => setShowLogicChain(false)}
                    className="px-8 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-neon-cyan transition-all"
                  >
                    Close Trace
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
