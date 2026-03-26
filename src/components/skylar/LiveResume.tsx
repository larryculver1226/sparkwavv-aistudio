import React from 'react';
import { motion } from 'motion/react';
import { Download, Share2, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';

interface LiveResumeProps {
  data: {
    spark: { title: string; narrative: string };
    dnaPillars: { label: string; description: string; resonance: number }[];
    trajectory: { phase: string; milestone: string; impact: string }[];
    resonanceScore: number;
    skylarFeedback: string;
  };
  onDownload: () => void;
}

export const LiveResume: React.FC<LiveResumeProps> = ({ data, onDownload }) => {
  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Editorial Header */}
      <header className="p-12 border-b-2 border-[#141414] flex justify-between items-end">
        <div className="max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <span className="text-xs font-mono uppercase tracking-[0.3em] font-bold opacity-40">Professional DNA Synthesis</span>
            <div className="h-[1px] flex-1 bg-[#141414] opacity-10" />
            <span className="text-xs font-mono uppercase tracking-[0.3em] font-bold opacity-40">v1.0.0</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[12vw] leading-[0.85] font-serif italic tracking-tighter mb-12"
          >
            {data.spark.title}
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12"
          >
            <p className="text-2xl font-serif italic leading-relaxed opacity-80">
              {data.spark.narrative}
            </p>
            <div className="flex flex-col justify-end items-start gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-[#141414] flex items-center justify-center">
                  <span className="text-2xl font-mono font-bold">{data.resonanceScore}%</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Market Resonance</p>
                  <p className="text-xs font-mono font-bold">Optimal Alignment</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={onDownload}
                  className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
                <button className="px-6 py-3 border border-[#141414] text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share Live
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* DNA Pillars Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 border-b-2 border-[#141414]">
        {data.dnaPillars.map((pillar, idx) => (
          <div key={idx} className={`p-12 ${idx < 2 ? 'border-r-2 border-[#141414]' : ''} group hover:bg-[#141414] hover:text-[#E4E3E0] transition-all duration-500`}>
            <div className="flex justify-between items-start mb-12">
              <span className="text-4xl font-serif italic opacity-20 group-hover:opacity-40">0{idx + 1}</span>
              <div className="w-12 h-12 rounded-full border border-current flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-4xl font-serif italic mb-6">{pillar.label}</h3>
            <p className="text-lg leading-relaxed opacity-60 group-hover:opacity-80 mb-8">
              {pillar.description}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-[1px] bg-current opacity-20" />
              <span className="text-xs font-mono font-bold tracking-widest uppercase">{pillar.resonance}% Resonance</span>
            </div>
          </div>
        ))}
      </section>

      {/* Trajectory Section */}
      <section className="p-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-16">
            <h2 className="text-6xl font-serif italic tracking-tight">Trajectory</h2>
            <div className="h-[2px] flex-1 bg-[#141414]" />
          </div>
          
          <div className="space-y-24">
            {data.trajectory.map((t, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-12 items-start">
                <div className="md:col-span-1">
                  <span className="text-xs font-mono uppercase tracking-[0.3em] font-bold opacity-40 mb-2 block">{t.phase}</span>
                  <div className="h-1 w-12 bg-[#141414]" />
                </div>
                <div className="md:col-span-3">
                  <h4 className="text-4xl font-serif italic mb-4">{t.milestone}</h4>
                  <p className="text-xl leading-relaxed opacity-60 max-w-2xl">
                    {t.impact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skylar Feedback Footer */}
      <footer className="p-12 bg-[#141414] text-[#E4E3E0]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-8">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h4 className="text-xs font-mono uppercase tracking-[0.4em] font-bold mb-6 opacity-40">Skylar's Strategic Review</h4>
          <p className="text-3xl font-serif italic leading-relaxed mb-12">
            "{data.skylarFeedback}"
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest opacity-40">
            <ShieldCheck className="w-4 h-4" />
            Verified DNA Synthesis
          </div>
        </div>
      </footer>
    </div>
  );
};
