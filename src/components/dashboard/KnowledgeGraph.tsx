import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { KnowledgeGraph as GraphData, NodeType } from '../../types/wavvault';

interface KnowledgeGraphProps {
  data: GraphData;
  width?: number;
  height?: number;
  isFullScreen?: boolean;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  data,
  width = 600,
  height = 400,
  isFullScreen = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const simulation = d3
      .forceSimulation(data.nodes as any)
      .force(
        'link',
        d3
          .forceLink(data.links as any)
          .id((d: any) => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const g = svg.append('g');

    // Add technical grid background
    const grid = g.append('g').attr('class', 'grid');
    const gridSize = 50;
    for (let x = -width * 2; x < width * 3; x += gridSize) {
      grid
        .append('line')
        .attr('x1', x)
        .attr('y1', -height * 2)
        .attr('x2', x)
        .attr('y2', height * 3)
        .attr('stroke', 'rgba(255,255,255,0.03)')
        .attr('stroke-width', 1);
    }
    for (let y = -height * 2; y < height * 3; y += gridSize) {
      grid
        .append('line')
        .attr('x1', -width * 2)
        .attr('y1', y)
        .attr('x2', width * 3)
        .attr('y2', y)
        .attr('stroke', 'rgba(255,255,255,0.03)')
        .attr('stroke-width', 1);
    }

    // Add zoom behavior
    if (isFullScreen) {
      const zoom = d3.zoom().on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
      svg.call(zoom as any);
    }

    const link = g
      .append('g')
      .selectAll('line')
      .data(data.links)
      .enter()
      .append('line')
      .attr('stroke', (d: any) => (d.type === 'dependency' ? '#ff00ff' : '#333'))
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', (d) => Math.sqrt(d.weight * 3))
      .attr('stroke-dasharray', (d: any) => (d.type === 'influence' ? '5,5' : 'none'));

    const node = g
      .append('g')
      .selectAll('g')
      .data(data.nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended) as any)
      .on('mouseover', function (event, d: any) {
        d3.select(this)
          .select('circle')
          .attr('r', d.type === 'spark' ? 15 : 11);
        d3.select(this).select('text').attr('font-size', '12px').attr('fill', '#00f2ff');

        // Highlight connected links
        link
          .attr('stroke-opacity', (l: any) =>
            l.source.id === d.id || l.target.id === d.id ? 1 : 0.1
          )
          .attr('stroke', (l: any) =>
            l.source.id === d.id || l.target.id === d.id ? '#00f2ff' : '#333'
          );
      })
      .on('mouseout', function (event, d: any) {
        d3.select(this)
          .select('circle')
          .attr('r', d.type === 'spark' ? 12 : 8);
        d3.select(this).select('text').attr('font-size', '10px').attr('fill', '#fff');
        link
          .attr('stroke-opacity', 0.4)
          .attr('stroke', (d: any) => (d.type === 'dependency' ? '#ff00ff' : '#333'));
      });

    const colors = {
      skill: '#00f2ff', // Neon Blue
      goal: '#ff00ff', // Neon Magenta
      value: '#00ffcc', // Neon Cyan
      spark: '#fff', // White
    };

    node
      .append('circle')
      .attr('r', (d) => (d.type === 'spark' ? 12 : 8))
      .attr('fill', (d) => colors[d.type as NodeType] || '#fff')
      .attr('filter', 'url(#glow)');

    node
      .append('text')
      .text((d) => d.label)
      .attr('x', 12)
      .attr('y', 4)
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('pointer-events', 'none');

    // Add glow filter
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
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

    return () => {
      simulation.stop();
    };
  }, [data, width, height, isFullScreen]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="bg-black/20 rounded-xl overflow-hidden"
      style={{ cursor: isFullScreen ? 'grab' : 'default' }}
    />
  );
};
