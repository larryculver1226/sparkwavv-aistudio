import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { fetchPublicShare } from '../services/assetEngineService';
import { SynthesizedAsset } from '../types/wavvault';
import {
  Loader2,
  Share2,
  Download,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  List,
} from 'lucide-react';

const ShareView: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [searchParams] = useSearchParams();
  const accessKey = searchParams.get('key');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<{
    asset: SynthesizedAsset;
    brandingPersona: string;
    userName: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<'scrollytelling' | 'dashboard'>('scrollytelling');

  useEffect(() => {
    if (!shareId || !accessKey) {
      setError('Invalid share link');
      setLoading(false);
      return;
    }

    const loadShare = async () => {
      try {
        const data = await fetchPublicShare(shareId, accessKey);
        setShareData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load share');
      } finally {
        setLoading(false);
      }
    };

    loadShare();
  }, [shareId, accessKey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-12 h-12 text-green-400" />
        </motion.div>
        <p className="mt-4 font-mono text-sm tracking-widest uppercase opacity-50">
          Decrypting Asset...
        </p>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
          <Share2 className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-400 max-w-md">
          {error || 'This share link is no longer active or is invalid.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-8 px-6 py-2 border border-white/20 rounded-full hover:bg-white/10 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { asset, brandingPersona, userName } = shareData;
  const isRightBrain = brandingPersona.includes('Right Brain');

  // Theme configuration based on Brand Persona
  const theme = isRightBrain
    ? {
        bg: 'bg-[#050505]',
        text: 'text-white',
        accent: 'text-green-400',
        accentBg: 'bg-green-400',
        border: 'border-green-400/30',
        card: 'bg-white/5 backdrop-blur-xl border-white/10',
        font: 'font-sans',
        heading: 'font-display uppercase tracking-tighter',
      }
    : {
        bg: 'bg-[#F5F5F5]',
        text: 'text-slate-900',
        accent: 'text-blue-600',
        accentBg: 'bg-blue-600',
        border: 'border-slate-200',
        card: 'bg-white border-slate-200 shadow-sm',
        font: 'font-serif',
        heading: 'font-serif italic tracking-tight',
      };

  return (
    <div
      className={`min-h-screen ${theme.bg} ${theme.text} ${theme.font} transition-colors duration-1000`}
    >
      {/* Header / Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center backdrop-blur-md border-b ${theme.border}`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-full ${theme.accentBg} flex items-center justify-center text-white font-bold`}
          >
            {userName.charAt(0)}
          </div>
          <div>
            <h2 className={`text-sm font-bold ${theme.heading}`}>{userName}</h2>
            <p className="text-[10px] uppercase tracking-widest opacity-50">{asset.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/5 rounded-full p-1">
          <button
            onClick={() => setViewMode('scrollytelling')}
            className={`p-2 rounded-full transition-all ${viewMode === 'scrollytelling' ? 'bg-white shadow-sm text-blue-600' : 'opacity-50'}`}
            title="Linear Story"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('dashboard')}
            className={`p-2 rounded-full transition-all ${viewMode === 'dashboard' ? 'bg-white shadow-sm text-blue-600' : 'opacity-50'}`}
            title="Interactive Dashboard"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {viewMode === 'scrollytelling' ? (
            <motion.div
              key="scrolly"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-32"
            >
              {/* Hero Section */}
              <section className="min-h-[60vh] flex flex-col justify-center">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  className="text-xs uppercase tracking-[0.3em] mb-4"
                >
                  Interactive Career Narrative
                </motion.span>
                <h1 className={`text-6xl md:text-8xl mb-8 ${theme.heading}`}>
                  {asset.content.headline || 'The Professional Journey'}
                </h1>
                <p className="text-xl md:text-2xl opacity-70 max-w-2xl leading-relaxed">
                  {asset.content.summary ||
                    'A synthesized view of professional DNA, strengths, and career milestones.'}
                </p>
              </section>

              {/* Strengths Section */}
              <section className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className={`text-3xl mb-6 ${theme.heading}`}>Core Strengths</h3>
                  <div className="space-y-4">
                    {asset.content.strengths?.map((strength: string, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-4 rounded-xl border ${theme.border} flex items-center justify-between`}
                      >
                        <span className="font-medium">{strength}</span>
                        <ChevronRight className={`w-4 h-4 ${theme.accent}`} />
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div
                  className={`aspect-square rounded-full ${theme.border} border-dashed flex items-center justify-center p-12`}
                >
                  <div
                    className={`w-full h-full rounded-full ${theme.accentBg} opacity-10 animate-pulse`}
                  />
                  <div className="absolute text-center">
                    <span className="text-4xl font-bold block">88%</span>
                    <span className="text-[10px] uppercase tracking-widest opacity-50">
                      Role Alignment
                    </span>
                  </div>
                </div>
              </section>

              {/* Career Stories */}
              <section className="space-y-12">
                <h3 className={`text-3xl ${theme.heading}`}>Career Stories</h3>
                <div className="grid gap-8">
                  {asset.content.stories?.map((story: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      className={`p-8 rounded-3xl ${theme.card}`}
                    >
                      <span
                        className={`text-[10px] uppercase tracking-widest mb-4 block ${theme.accent}`}
                      >
                        Story 0{i + 1}
                      </span>
                      <h4 className="text-2xl font-bold mb-4">{story.title}</h4>
                      <p className="opacity-70 leading-relaxed text-lg">{story.content}</p>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="grid md:grid-cols-3 gap-6"
            >
              {/* Dashboard View */}
              <div className={`md:col-span-2 p-8 rounded-3xl ${theme.card}`}>
                <h3 className={`text-2xl mb-6 ${theme.heading}`}>Professional DNA</h3>
                <div className="aspect-video bg-black/5 rounded-2xl flex items-center justify-center border border-dashed border-black/10">
                  <p className="text-sm opacity-50 italic">
                    Interactive Knowledge Graph Visualization
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className={`p-6 rounded-3xl ${theme.card}`}>
                  <h4 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-50">
                    Identity
                  </h4>
                  <p className="text-lg leading-snug">{asset.content.identity}</p>
                </div>
                <div className={`p-6 rounded-3xl ${theme.card}`}>
                  <h4 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-50">
                    Quick Stats
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-xs opacity-50">Experience</span>
                      <span className="text-xl font-bold">12+ Yrs</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-xs opacity-50">Projects</span>
                      <span className="text-xl font-bold">45</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`md:col-span-3 p-8 rounded-3xl ${theme.card}`}>
                <h3 className={`text-2xl mb-6 ${theme.heading}`}>Milestones</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {asset.content.milestones?.map((m: any, i: number) => (
                    <div key={i} className={`min-w-[280px] p-6 rounded-2xl border ${theme.border}`}>
                      <span className="text-[10px] opacity-50 block mb-2">{m.date}</span>
                      <h5 className="font-bold mb-2">{m.title}</h5>
                      <p className="text-xs opacity-70">{m.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Actions */}
      <footer className={`fixed bottom-0 left-0 right-0 p-6 flex justify-center gap-4 z-50`}>
        <div
          className={`flex items-center gap-2 p-2 rounded-full backdrop-blur-xl border ${theme.border} bg-white/10`}
        >
          <button
            className={`flex items-center gap-2 px-6 py-2 rounded-full ${theme.accentBg} text-white font-bold text-sm hover:scale-105 transition-transform`}
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ShareView;
