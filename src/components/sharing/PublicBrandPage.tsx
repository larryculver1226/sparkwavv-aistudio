import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Shield, 
  ExternalLink, 
  Cpu, 
  Zap, 
  Target,
  Globe,
  Mail,
  Linkedin,
  ArrowUpRight
} from 'lucide-react';

interface Pillar {
  quote: string;
  tagline: string;
  imageUrl: string;
}

interface BrandData {
  displayName: string;
  pillars: Pillar[];
  strengths: string[];
  skillsCloud: string[];
  secretId: string;
}

export const PublicBrandPage: React.FC = () => {
  const { secretId } = useParams<{ secretId: string }>();
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrandData = async () => {
      try {
        const response = await fetch(`/api/brand/public/${secretId}`);
        if (!response.ok) throw new Error("Brand narrative not found");
        const data = await response.json();
        setBrandData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (secretId) {
      fetchBrandData();
    }
  }, [secretId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-t-2 border-blue-500 rounded-full"
        />
      </div>
    );
  }

  if (error || !brandData) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <Shield className="w-16 h-16 text-red-500/50 mb-6" />
        <h1 className="text-2xl font-light text-white uppercase tracking-widest mb-4">Access Restricted</h1>
        <p className="text-white/40 max-w-md">This brand narrative is private or the link has expired. Please contact the owner for access.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Hero Section */}
      <header className="relative h-screen flex flex-col items-center justify-center overflow-hidden px-8">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-black" />
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-600/10 rounded-full blur-[150px]" 
          />
        </div>

        <div className="relative z-10 text-center space-y-8 max-w-4xl">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="h-[1px] w-12 bg-blue-500/50" />
            <span className="text-blue-400 font-mono text-xs uppercase tracking-[0.4em]">Cinematic Brand Narrative</span>
            <div className="h-[1px] w-12 bg-blue-500/50" />
          </motion.div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-6xl lg:text-8xl font-light tracking-tighter"
          >
            {brandData.displayName}
          </motion.h1>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4 pt-8"
          >
            <div className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Synthesized by Skylar AI</span>
            </div>
            <div className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Verified DNA</span>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        >
          <span className="text-white/20 text-[10px] uppercase tracking-[0.5em]">Scroll to Explore</span>
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-[1px] h-12 bg-gradient-to-b from-blue-500 to-transparent" 
          />
        </motion.div>
      </header>

      {/* Brand Pillars */}
      <section className="max-w-7xl mx-auto px-8 py-32 space-y-64">
        {brandData.pillars.map((pillar, idx) => (
          <div key={idx} className={`flex flex-col lg:flex-row items-center gap-24 ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
            <motion.div 
              initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 relative aspect-square rounded-3xl overflow-hidden border border-white/10 group"
            >
              <img 
                src={pillar.imageUrl} 
                alt={pillar.tagline}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-12 left-12">
                <p className="text-blue-400 font-mono text-xs uppercase tracking-[0.3em] mb-2">Pillar {idx + 1}</p>
                <h3 className="text-3xl font-light">{pillar.tagline}</h3>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: idx % 2 === 0 ? 50 : -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 space-y-8"
            >
              <blockquote className="text-4xl lg:text-5xl font-serif italic leading-tight text-white/90">
                "{pillar.quote}"
              </blockquote>
              <div className="h-[1px] w-24 bg-blue-500/50" />
            </motion.div>
          </div>
        ))}
      </section>

      {/* Core Strengths & Skills Cloud */}
      <section className="bg-zinc-950 py-32 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-24">
          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-sm font-mono text-blue-400 uppercase tracking-[0.4em]">Strategic Foundation</h2>
              <h3 className="text-4xl font-light">Core Strengths</h3>
            </div>
            <div className="grid gap-6">
              {brandData.strengths.map((strength, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    {idx === 0 ? <Zap className="w-6 h-6" /> : idx === 1 ? <Target className="w-6 h-6" /> : <Cpu className="w-6 h-6" />}
                  </div>
                  <span className="text-xl font-light">{strength}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-sm font-mono text-blue-400 uppercase tracking-[0.4em]">Technical Ecosystem</h2>
              <h3 className="text-4xl font-light">Skills Cloud</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {brandData.skillsCloud.map((skill, idx) => (
                <motion.span 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-sm hover:border-blue-500/50 hover:text-blue-400 transition-all cursor-default"
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer / CTA */}
      <footer className="py-32 px-8 text-center space-y-16">
        <div className="max-w-2xl mx-auto space-y-8">
          <h2 className="text-4xl font-light leading-tight">Interested in collaborating with {brandData.displayName.split(' ')[0]}?</h2>
          <p className="text-white/40">This cinematic brand narrative was synthesized by Skylar AI to represent the authentic professional DNA of {brandData.displayName}.</p>
          
          <div className="flex flex-wrap justify-center gap-6 pt-8">
            <button className="px-8 py-4 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-all flex items-center gap-2 group shadow-lg shadow-blue-500/20">
              <span>Connect via SPARKWavv</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
            <div className="flex gap-4">
              <button className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <Linkedin className="w-5 h-5" />
              </button>
              <button className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <Mail className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-32 flex flex-col items-center gap-6 opacity-20">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-[0.3em]">SPARKWavv Ecosystem</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest">© 2026 SPARKWavv AI • All Rights Reserved</p>
        </div>
      </footer>
    </div>
  );
};
