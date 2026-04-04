import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface PortfolioPage {
  id: string;
  title: string;
  content: string;
  visualCues: string[];
  signals?: { label: string; evidence: string; resonance: number }[];
  narrative?: string;
}

interface InteractivePortfolioProps {
  data: {
    pages: PortfolioPage[];
    skylarFeedback: string;
  };
  onClose: () => void;
}

export const InteractivePortfolio: React.FC<InteractivePortfolioProps> = ({ data, onClose }) => {
  const [activePageIndex, setActivePageIndex] = useState(0);
  const activePage = data.pages[activePageIndex];

  const nextPage = () => {
    if (activePageIndex < data.pages.length - 1) {
      setActivePageIndex(activePageIndex + 1);
    }
  };

  const prevPage = () => {
    if (activePageIndex > 0) {
      setActivePageIndex(activePageIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#E4E3E0] text-[#141414] font-sans overflow-hidden">
      {/* Navigation Header */}
      <nav className="absolute top-0 left-0 right-0 p-12 flex justify-between items-center z-10">
        <div className="flex items-center gap-6">
          <span className="text-xs font-mono uppercase tracking-[0.4em] font-bold opacity-40">
            Interactive Portfolio
          </span>
          <div className="h-[1px] w-12 bg-[#141414] opacity-20" />
          <span className="text-xs font-mono uppercase tracking-[0.4em] font-bold opacity-40">
            {activePageIndex + 1} / {data.pages.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="px-6 py-3 border border-[#141414] text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
        >
          Exit Studio
        </button>
      </nav>

      {/* Main Content Area */}
      <div className="h-full flex flex-col justify-center items-center p-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-24 items-center"
          >
            {/* Visual Side */}
            <div className="relative aspect-[3/4] bg-white border-2 border-[#141414] overflow-hidden shadow-2xl">
              <div className="absolute inset-0 p-12 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono uppercase tracking-widest font-bold opacity-40">
                    Visual DNA Signal
                  </span>
                  <Sparkles className="w-6 h-6 opacity-20" />
                </div>
                <div className="space-y-4">
                  {activePage.visualCues.map((cue, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                      className="text-4xl font-serif italic tracking-tight leading-none"
                    >
                      {cue}
                    </motion.div>
                  ))}
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute bottom-0 right-0 w-32 h-32 border-t-2 border-l-2 border-[#141414] opacity-10" />
            </div>

            {/* Content Side */}
            <div className="space-y-12">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-8xl font-serif italic tracking-tighter leading-[0.85]"
              >
                {activePage.title}
              </motion.h2>

              <div className="space-y-8">
                {activePage.id === 'dna' && activePage.signals ? (
                  <div className="space-y-6">
                    {activePage.signals.map((signal, idx) => (
                      <div
                        key={idx}
                        className="p-6 border border-[#141414] bg-white/50 hover:bg-white transition-all group"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-lg font-serif italic">{signal.label}</h4>
                          <span className="text-xs font-mono font-bold">{signal.resonance}%</span>
                        </div>
                        <p className="text-xs opacity-60 leading-relaxed">{signal.evidence}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-2xl font-serif italic leading-relaxed opacity-80">
                    {activePage.content || activePage.narrative}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-8 pt-12">
                <button
                  onClick={prevPage}
                  disabled={activePageIndex === 0}
                  className="p-4 border border-[#141414] rounded-full disabled:opacity-10 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex-1 h-[1px] bg-[#141414] opacity-20" />
                <button
                  onClick={nextPage}
                  disabled={activePageIndex === data.pages.length - 1}
                  className="p-4 border border-[#141414] rounded-full disabled:opacity-10 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Skylar Real-time Feedback Overlay */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="absolute bottom-12 left-12 right-12 p-8 bg-[#141414] text-[#E4E3E0] flex items-center justify-between border-t-4 border-neon-cyan"
      >
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-neon-cyan" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40 mb-1">
              Skylar's Real-time Resonance
            </p>
            <p className="text-xl font-serif italic opacity-80">"{data.skylarFeedback}"</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">
              Alignment Score
            </p>
            <p className="text-2xl font-mono font-bold text-neon-cyan">94%</p>
          </div>
          <div className="w-[1px] h-12 bg-white/10" />
          <ShieldCheck className="w-8 h-8 opacity-40" />
        </div>
      </motion.div>
    </div>
  );
};
