import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Share2, 
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
  Settings2
} from 'lucide-react';
import * as d3 from 'd3';
import { UserInsight } from '../types/dashboard';

interface EvolutionVisualizerProps {
  insights: UserInsight[];
  onInsightClick?: (insight: UserInsight) => void;
}

type ViewMode = 'history' | 'neural';
type ConnectionType = 'chronological' | 'thematic';

export const EvolutionVisualizer: React.FC<EvolutionVisualizerProps> = ({ 
  insights, 
  onInsightClick 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('history');
  const [connectionType, setConnectionType] = useState<ConnectionType>('chronological');
  const [selectedInsight, setSelectedInsight] = useState<UserInsight | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Filter and sort insights
  const sortedInsights = [...insights].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  useEffect(() => {
    if (viewMode === 'neural' && svgRef.current) {
      renderNeuralMap();
    }
  }, [viewMode, insights, connectionType]);

  const renderNeuralMap = () => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const nodes = insights.map(d => ({ ...d }));
    const links: any[] = [];

    if (connectionType === 'chronological') {
      // Connect insights in time order
      const sorted = [...nodes].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      for (let i = 0; i < sorted.length - 1; i++) {
        links.push({ source: sorted[i].id, target: sorted[i+1].id });
      }
    } else {
      // Connect insights by type or tags
      nodes.forEach((node, i) => {
        nodes.forEach((other, j) => {
          if (i < j) {
            if (node.type === other.type) {
              links.push({ source: node.id, target: other.id, weight: 0.5 });
            }
            // Check for common tags
            const commonTags = node.tags?.filter(t => other.tags?.includes(t));
            if (commonTags && commonTags.length > 0) {
              links.push({ source: node.id, target: other.id, weight: 0.8 });
            }
          }
        });
      });
    }

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", d => Math.sqrt((d as any).weight || 1));

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 8)
      .attr("fill", d => {
        switch (d.type) {
          case 'pivot': return '#f59e0b';
          case 'core_value': return '#10b981';
          case 'primary_goal': return '#8b5cf6';
          case 'strength': return '#3b82f6';
          default: return '#94a3b8';
        }
      })
      .attr("opacity", d => d.status === 'superseded' ? 0.4 : 1)
      .call(d3.drag<SVGCircleElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("title").text(d => d.content);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
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
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'pivot': return <Compass className="w-4 h-4 text-amber-500" />;
      case 'core_value': return <Zap className="w-4 h-4 text-emerald-500" />;
      case 'primary_goal': return <Target className="w-4 h-4 text-violet-500" />;
      case 'strength': return <Award className="w-4 h-4 text-blue-500" />;
      default: return <Tag className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full" id="evolution-visualizer">
      {/* Header */}
      <div className="p-4 border-bottom border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800">Professional Evolution</h3>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setViewMode('history')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              viewMode === 'history' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            History Log
          </button>
          <button
            onClick={() => setViewMode('neural')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              viewMode === 'neural' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Neural Map
          </button>
        </div>
      </div>

      {/* Controls for Neural Map */}
      {viewMode === 'neural' && (
        <div className="px-4 py-2 border-bottom border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">Connections:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConnectionType('chronological')}
              className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded border ${
                connectionType === 'chronological'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Chronological
            </button>
            <button
              onClick={() => setConnectionType('thematic')}
              className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded border ${
                connectionType === 'thematic'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Thematic
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {viewMode === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full overflow-y-auto p-4 space-y-4"
            >
              {sortedInsights.map((insight, index) => (
                <div 
                  key={insight.id}
                  className={`relative pl-8 pb-4 group cursor-pointer ${
                    index === sortedInsights.length - 1 ? '' : 'border-l border-slate-200'
                  }`}
                  onClick={() => setSelectedInsight(insight)}
                >
                  {/* Timeline Dot */}
                  <div className={`absolute left-[-5px] top-0 w-[10px] h-[10px] rounded-full border-2 border-white shadow-sm ${
                    insight.status === 'confirmed' ? 'bg-indigo-600' : 
                    insight.status === 'pending' ? 'bg-amber-400' : 'bg-slate-300'
                  }`} />
                  
                  <div className={`p-3 rounded-xl border transition-all ${
                    selectedInsight?.id === insight.id 
                      ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getIcon(insight.type)}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {insight.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        {new Date(insight.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <p className={`text-sm ${insight.status === 'superseded' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {insight.content}
                    </p>

                    {insight.status === 'pending' && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full w-fit">
                        <AlertCircle className="w-3 h-3" />
                        Pending Confirmation
                      </div>
                    )}
                    
                    {insight.status === 'confirmed' && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        Current Truth
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="neural"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="h-full w-full bg-slate-50"
            >
              <svg ref={svgRef} className="w-full h-full" />
              
              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-slate-200 text-[10px] space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#f59e0b]" /> <span>Pivot</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#10b981]" /> <span>Core Value</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#8b5cf6]" /> <span>Primary Goal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#3b82f6]" /> <span>Strength</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail Panel (Slide up) */}
      <AnimatePresence>
        {selectedInsight && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute inset-x-0 bottom-0 bg-white border-t border-slate-200 shadow-2xl p-4 z-10"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getIcon(selectedInsight.type)}
                <h4 className="font-bold text-slate-800 uppercase tracking-tight">Insight Detail</h4>
              </div>
              <button 
                onClick={() => setSelectedInsight(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <ChevronLeft className="w-5 h-5 rotate-[-90deg]" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Content</span>
                <p className="text-sm text-slate-700 font-medium">{selectedInsight.content}</p>
              </div>
              
              {selectedInsight.evidence && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Evidence</span>
                  <p className="text-xs text-slate-500 italic leading-relaxed">
                    "{selectedInsight.evidence}"
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex gap-2">
                  {selectedInsight.tags?.map(tag => (
                    <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400">
                  ID: {selectedInsight.id.substring(0, 8)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
