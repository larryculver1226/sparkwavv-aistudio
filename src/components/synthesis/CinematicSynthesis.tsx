import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  RefreshCw, 
  Check, 
  Share2, 
  Lock,
  MessageSquare,
  Volume2,
  VolumeX,
  ArrowRight
} from 'lucide-react';
import { useIdentity } from '../../contexts/IdentityContext';
import { generateCinematicManifesto, generateBrandImage } from '../../services/geminiService';

interface Pillar {
  quote: string;
  tagline: string;
  visualPrompt: string;
  imageUrl?: string;
  refinementCount: number;
}

interface CinematicSynthesisProps {
  dashboardData: any;
  onComplete: (secretId: string) => void;
}

export const CinematicSynthesis: React.FC<CinematicSynthesisProps> = ({ dashboardData, onComplete }) => {
  const { user } = useIdentity();
  const [step, setStep] = useState<'analyzing' | 'revealing' | 'refining' | 'finalizing'>('analyzing');
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [currentPillarIdx, setCurrentPillarIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [refiningPillarIdx, setRefiningPillarIdx] = useState<number | null>(null);
  const [refinementFeedback, setRefinementFeedback] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (step === 'analyzing') {
      startSynthesis();
    }
  }, []);

  const startSynthesis = async () => {
    setIsGenerating(true);
    try {
      // 1. Generate Manifesto
      const manifesto = await generateCinematicManifesto(dashboardData as any);
      if (!manifesto || !manifesto.pillars) throw new Error("Failed to generate manifesto");

      // 2. Generate initial images for all 3 pillars
      const pillarsWithImages = await Promise.all(manifesto.pillars.map(async (p: any) => {
        const imageUrl = await generateBrandImage(p.visualPrompt);
        return { ...p, imageUrl, refinementCount: 0 };
      }));

      setPillars(pillarsWithImages);
      setStep('revealing');
      
      // Play Skylar Narration (Mock for now, would be real TTS)
      playSkylarNarration("Synthesis moment initiated. I've analyzed your Wavvault and distilled your professional DNA into three cinematic pillars.");
    } catch (error) {
      console.error("Synthesis failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const playSkylarNarration = (text: string) => {
    if (isMuted) return;
    // In a real implementation, this would call a TTS service
    console.log("Skylar Narration:", text);
  };

  const handleRefine = async () => {
    if (refiningPillarIdx === null || !refinementFeedback.trim()) return;
    
    const pillar = pillars[refiningPillarIdx];
    if (pillar.refinementCount >= 3) return;

    setIsRefining(true);
    try {
      // Call Gemini to update the pillar based on feedback
      // For simplicity, we'll just update the prompt and regenerate
      const updatedPillar = { ...pillar };
      updatedPillar.visualPrompt += ` (Refinement: ${refinementFeedback})`;
      updatedPillar.refinementCount += 1;
      
      const newImageUrl = await generateBrandImage(updatedPillar.visualPrompt);
      updatedPillar.imageUrl = newImageUrl || pillar.imageUrl;

      const newPillars = [...pillars];
      newPillars[refiningPillarIdx] = updatedPillar;
      setPillars(newPillars);
      setRefiningPillarIdx(null);
      setRefinementFeedback('');
    } catch (error) {
      console.error("Refinement failed:", error);
    } finally {
      setIsRefining(false);
    }
  };

  const finalizeBrand = async () => {
    setStep('finalizing');
    try {
      const response = await fetch('/api/brand/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({
          pillars,
          strengths: dashboardData?.strengths?.map((s: any) => s.name) || [],
          skillsCloud: [] // This would be generated in a real flow
        })
      });

      const result = await response.json();
      if (result.success) {
        onComplete(result.secretId);
      }
    } catch (error) {
      console.error("Finalization failed:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-black" />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px]" 
        />
      </div>

      <AnimatePresence mode="wait">
        {step === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center z-10"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 border-t-2 border-blue-500 rounded-full mx-auto mb-8"
            />
            <h2 className="text-3xl font-light text-white tracking-widest uppercase mb-4">
              Synthesizing Brand DNA
            </h2>
            <p className="text-blue-400/60 font-mono text-sm">
              Analyzing Wavvault artifacts...
            </p>
          </motion.div>
        )}

        {step === 'revealing' && (
          <motion.div
            key="revealing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-6xl px-8 z-10"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Visual Side */}
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/20">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentPillarIdx}
                    src={pillars[currentPillarIdx]?.imageUrl}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 1 }}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    key={`tagline-${currentPillarIdx}`}
                    className="text-blue-400 font-mono text-xs uppercase tracking-[0.3em] mb-2"
                  >
                    Pillar {currentPillarIdx + 1}: {pillars[currentPillarIdx]?.tagline}
                  </motion.p>
                </div>
              </div>

              {/* Text Side */}
              <div className="space-y-8">
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  key={`quote-${currentPillarIdx}`}
                  className="space-y-6"
                >
                  <blockquote className="text-4xl lg:text-5xl font-serif italic text-white leading-tight">
                    "{pillars[currentPillarIdx]?.quote}"
                  </blockquote>
                  
                  <div className="flex items-center gap-4 pt-8">
                    <button
                      onClick={() => setRefiningPillarIdx(currentPillarIdx)}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group"
                    >
                      <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                      <span>Refine with Skylar</span>
                      <span className="text-xs text-white/40 ml-2">
                        {3 - pillars[currentPillarIdx].refinementCount} left
                      </span>
                    </button>

                    {currentPillarIdx < 2 ? (
                      <button
                        onClick={() => setCurrentPillarIdx(prev => prev + 1)}
                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-all"
                      >
                        <span>Next Pillar</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={finalizeBrand}
                        className="flex items-center gap-2 px-8 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/40"
                      >
                        <span>Finalize Brand DNA</span>
                        <Sparkles className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>

                {/* Progress Dots */}
                <div className="flex gap-2">
                  {[0, 1, 2].map(i => (
                    <div 
                      key={i}
                      className={`h-1 transition-all duration-500 rounded-full ${i === currentPillarIdx ? 'w-12 bg-blue-500' : 'w-4 bg-white/20'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'finalizing' && (
          <motion.div
            key="finalizing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center z-10"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/50"
            >
              <Check className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-4xl font-light text-white tracking-widest uppercase mb-4">
              Brand DNA Locked
            </h2>
            <p className="text-white/60 max-w-md mx-auto">
              Your cinematic narrative is now the foundational DNA for your branding and outreach flows.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refinement Modal */}
      <AnimatePresence>
        {refiningPillarIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white">Refine with Skylar</h3>
                  <p className="text-xs text-white/40">Pillar {refiningPillarIdx + 1} • {3 - pillars[refiningPillarIdx].refinementCount} refinements remaining</p>
                </div>
              </div>

              <p className="text-white/70 text-sm mb-6 italic">
                "Skylar, this pillar feels a bit too corporate. Can we make it feel more like a creative catalyst?"
              </p>

              <textarea
                value={refinementFeedback}
                onChange={(e) => setRefinementFeedback(e.target.value)}
                placeholder="Tell Skylar how to adjust this pillar..."
                className="w-full h-32 bg-black/50 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all mb-6 resize-none"
              />

              <div className="flex gap-4">
                <button
                  onClick={() => setRefiningPillarIdx(null)}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefine}
                  disabled={isRefining || !refinementFeedback.trim()}
                  className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isRefining ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Update Pillar</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-8 right-8 flex items-center gap-4 z-20">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};
