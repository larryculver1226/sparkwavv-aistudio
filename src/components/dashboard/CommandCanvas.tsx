import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Activity, Zap, Info, Maximize2, Minimize2, RefreshCcw } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { useLocation } from 'react-router-dom';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'user' | 'value' | 'role' | 'nudge';
  weight?: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  type: string;
  value: number;
}

export const CommandCanvas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<{ nodes: Node[]; links: Link[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const location = useLocation();

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/graph/user/${user.uid}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const result = await response.json();
      
      // Ensure nodes have d3 simulation properties
      const nodes = result.nodes.map((n: any) => ({ ...n }));
      const links = result.links.map((l: any) => ({ ...l }));
      
      setData({ nodes, links });
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location.pathname]);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = isFullScreen ? window.innerHeight * 0.8 : 400;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id((d: any) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(60));

    const g = svg.append('g');

    // Zoom setup
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(data.links)
      .enter()
      .append('line')
      .attr('stroke', '#00f2ff')
      .attr('stroke-opacity', 0.2)
      .attr('stroke-width', (d) => Math.sqrt(d.value || 1));

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(data.nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer')
      .on('click', (event, d) => setSelectedNode(d))
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Node circles (Neon style)
    node.append('circle')
      .attr('r', (d) => d.type === 'user' ? 15 : 10)
      .attr('fill', (d) => {
        switch (d.type) {
          case 'user': return '#fff';
          case 'value': return '#00f2ff';
          case 'role': return '#ff00ff';
          case 'nudge': return '#facc15';
          default: return '#333';
        }
      })
      .attr('filter', 'url(#neon-glow)');

    // Node text
    node.append('text')
      .text((d) => d.label)
      .attr('x', 18)
      .attr('y', 4)
      .attr('fill', '#fff')
      .attr('font-size', '12px')
      .attr('font-family', 'monospace')
      .attr('pointer-events', 'none');

    // Glow filter
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'neon-glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [data, isFullScreen]);

  return (
    <div 
      ref={containerRef}
      className={`relative bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden transition-all duration-500 ${
        isFullScreen ? 'fixed inset-4 z-50 shadow-2xl shadow-cyan-500/20' : 'h-[450px]'
      }`}
    >
      {/* Header Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Network className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Command Canvas</h3>
            <div className="flex items-center gap-1">
              <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-[10px] text-cyan-400 font-mono tracking-tighter uppercase italic">Relational Intelligence Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Refresh Data"
          >
            <RefreshCcw className={`w-5 h-5 text-neutral-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isFullScreen ? <Minimize2 className="w-5 h-5 text-neutral-400" /> : <Maximize2 className="w-5 h-5 text-neutral-400" />}
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      {loading && data.nodes.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm z-20">
          <div className="text-center">
            <Activity className="w-8 h-8 text-cyan-500 animate-pulse mx-auto mb-2" />
            <p className="text-xs text-neutral-400 font-mono uppercase tracking-widest">Mapping Neural Connections...</p>
          </div>
        </div>
      ) : data.nodes.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
           <Zap className="w-12 h-12 text-neutral-700 mb-4" />
           <p className="text-neutral-400 max-w-xs text-sm">No relational data found. Complete the Ignition phase to see your knowledge graph.</p>
        </div>
      ) : null}

      <svg 
        ref={svgRef} 
        className="w-full h-full"
        style={{ background: 'radial-gradient(circle at center, #171717 0%, #0a0a0a 100%)' }}
      />

      {/* Selected Node Details (Overlay) */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-4 right-4 w-72 bg-neutral-900/90 backdrop-blur-xl border border-white/20 rounded-xl p-4 z-30"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${
                  selectedNode.type === 'user' ? 'bg-white' : 
                  selectedNode.type === 'value' ? 'bg-cyan-400' : 'bg-magenta-400'
                }`} />
                <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest">{selectedNode.type}</span>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-neutral-500 hover:text-white"
              >
                ×
              </button>
            </div>
            <h4 className="text-lg font-bold text-white mb-2">{selectedNode.label}</h4>
            {selectedNode.type === 'value' && (
              <div className="space-y-4">
                <p className="text-xs text-neutral-400 leading-relaxed">
                  This core value is a key driver in your career architecture. Skylar uses this to filter opportunities.
                </p>
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                   <div className="flex items-start gap-2">
                     <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                     <p className="text-[10px] text-cyan-300 italic">
                       Skylar Note: Users who prioritize "{selectedNode.label}" often excel in roles requiring high {selectedNode.label === 'Autonomy' ? 'strategic independence' : 'collaborative synergy'}.
                     </p>
                   </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instruction Overlay */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4">
        <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
           <div className="flex -space-x-1">
             <div className="w-3 h-3 rounded-full bg-white border border-neutral-900" />
             <div className="w-3 h-3 rounded-full bg-cyan-400 border border-neutral-900" />
             <div className="w-3 h-3 rounded-full bg-yellow-400 border border-neutral-900" />
           </div>
           <span>Drag to explore • Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
};
