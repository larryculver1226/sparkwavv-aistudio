import React from 'react';
import { motion } from 'motion/react';
import { Users, MessageSquare, Globe, Share2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CommunityPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-neon-cyan selection:text-black">
      <header className="h-24 border-b border-white/5 px-6 md:px-12 flex items-center justify-between bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group"
          >
            <ArrowLeft className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-display font-bold tracking-tight italic">
              Sparkwavv{' '}
              <span className="text-neon-cyan text-sm not-italic ml-2 uppercase tracking-widest">
                Community
              </span>
            </h1>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">
              Connect & Collaborate with Global Talent
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-panel p-10 rounded-[2.5rem] border border-white/5 bg-black/40">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-display font-bold tracking-tight flex items-center gap-3">
                  <Globe className="w-6 h-6 text-neon-cyan" />
                  Global Feed
                </h2>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-[10px] font-bold text-neon-cyan uppercase tracking-widest">
                    Trending
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-neon-cyan/20 border border-neon-cyan/40" />
                      <div>
                        <h4 className="text-sm font-bold">Strategic Designer #{i}</h4>
                        <p className="text-[10px] text-white/40 font-medium">
                          2 hours ago • Product Strategy
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-white/60 mb-4">
                      Just completed a major synthesis milestone! The alignment with my core
                      professional DNA is incredible. Looking for partners in the Fintech space for
                      collaboration.
                    </p>
                    <div className="flex items-center gap-6">
                      <button className="flex items-center gap-2 text-[10px] font-bold text-white/40 hover:text-neon-cyan transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        12 Comments
                      </button>
                      <button className="flex items-center gap-2 text-[10px] font-bold text-white/40 hover:text-neon-magenta transition-colors">
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mb-6">
                Active Partners
              </h3>
              <div className="space-y-4">
                {[1, 2, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-lg bg-neon-magenta/20 border border-neon-magenta/40" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-neon-lime rounded-full border-2 border-black" />
                      </div>
                      <span className="text-xs font-bold text-white/80">Partner Alpha-{i}</span>
                    </div>
                    <button className="text-[10px] font-bold text-neon-cyan uppercase tracking-widest hover:underline">
                      Message
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mb-6">
                Community Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-xl font-display font-bold text-neon-cyan italic">1.2k</div>
                  <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest">
                    Members
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-xl font-display font-bold text-neon-magenta italic">450</div>
                  <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest">
                    Collaborations
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
