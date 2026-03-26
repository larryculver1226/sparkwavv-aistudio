import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Brain, Target, Activity, Sliders, 
  ChevronRight, Sparkles, RefreshCw, Zap,
  MessageSquare, LayoutDashboard, Terminal,
  Link as LinkIcon, Globe, BarChart3, CheckCircle2
} from 'lucide-react';
import { InterviewSimulator } from './InterviewSimulator';
import { OutreachTracker } from './OutreachTracker';
import { skylar } from '../../services/skylarService';
import { TargetOpportunity } from '../../types/wavvault';

interface OutreachForgeProps {
  userId: string;
}

export const OutreachForge: React.FC<OutreachForgeProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<'sequence' | 'simulator' | 'tracker'>('sequence');
  const [targetCompany, setTargetCompany] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [tone, setTone] = useState({ formal: 50, detail: 50 });
  const [loading, setLoading] = useState(false);
  const [generatedSequence, setGeneratedSequence] = useState<any | null>(null);
  
  // URL Analysis State
  const [jobUrl, setJobUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<TargetOpportunity | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const analyzeUrl = async () => {
    if (!jobUrl) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setSaveStatus('idle');
    try {
      const result = await skylar.analyzeJobUrl(userId, jobUrl);
      setAnalysisResult(result);
      // Auto-fill company and role if found
      if (result.company) setTargetCompany(result.company);
      if (result.role) setTargetRole(result.role);
    } catch (error) {
      console.error("Failed to analyze URL:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveToWavvault = async () => {
    if (!analysisResult) return;
    setSaveStatus('saving');
    try {
      await skylar.saveTargetOpportunity(userId, analysisResult);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error("Failed to save opportunity:", error);
      setSaveStatus('idle');
    }
  };

  const generateSequence = async () => {
    setLoading(true);
    try {
      const result = await skylar.generateTargetedSequence(userId, targetCompany, targetRole, tone);
      setGeneratedSequence(result);
    } catch (error) {
      console.error("Failed to generate sequence:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black text-white">
      {/* Sub-navigation */}
      <div className="px-12 py-8 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-12">
          <div>
            <h2 className="text-2xl font-display font-bold tracking-tight">Outreach Forge</h2>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">Strategic Outreach Suite</p>
          </div>
          
          <div className="flex items-center gap-4">
            {[
              { id: 'sequence', label: 'Sequence Forge', icon: Send },
              { id: 'simulator', label: 'Interview Simulator', icon: Brain },
              { id: 'tracker', label: 'Engagement Command', icon: Activity }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-3 ${
                  activeTab === tab.id 
                    ? 'bg-neon-cyan text-black' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'sequence' && (
            <motion.div 
              key="sequence"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full p-12 overflow-y-auto custom-scrollbar"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-7xl mx-auto">
                {/* Controls */}
                <div className="space-y-12">
                  <section>
                    <div className="flex items-center gap-4 mb-8">
                      <span className="text-5xl font-display font-bold text-white/10">01</span>
                      <h3 className="text-2xl font-display font-bold text-white tracking-tight">Market Intelligence</h3>
                    </div>
                    <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40 space-y-6">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2 block">Analyze Job Description URL</label>
                      <div className="flex gap-4">
                        <div className="relative flex-1">
                          <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                          <input 
                            type="url"
                            value={jobUrl}
                            onChange={(e) => setJobUrl(e.target.value)}
                            placeholder="Paste LinkedIn, Indeed, or Company job link..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-16 pr-6 text-white focus:border-neon-cyan transition-all font-medium"
                          />
                        </div>
                        <button
                          onClick={analyzeUrl}
                          disabled={isAnalyzing || !jobUrl}
                          className="px-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-neon-cyan transition-all disabled:opacity-50"
                        >
                          {isAnalyzing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                        </button>
                      </div>

                      {analysisResult && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="pt-6 border-t border-white/5 space-y-6"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                                analysisResult.dnaResonance.score > 80 ? 'bg-neon-cyan/10 text-neon-cyan' :
                                analysisResult.dnaResonance.score > 60 ? 'bg-yellow-400/10 text-yellow-400' :
                                'bg-red-400/10 text-red-400'
                              }`}>
                                {analysisResult.dnaResonance.score}
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-white/40">DNA Resonance Score</p>
                                <p className="text-sm font-medium text-white/80">Market Intelligence extracted</p>
                              </div>
                            </div>
                            <button 
                              onClick={saveToWavvault}
                              disabled={saveStatus !== 'idle'}
                              className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                                saveStatus === 'saved' ? 'bg-green-500/20 text-green-500' : 'bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20'
                              }`}
                            >
                              {saveStatus === 'saving' ? <RefreshCw className="w-4 h-4 animate-spin" /> : 
                               saveStatus === 'saved' ? <CheckCircle2 className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                              {saveStatus === 'saved' ? 'Saved to Wavvault' : 'Save to Wavvault'}
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                              <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Demand</p>
                              <p className="text-sm font-bold capitalize text-neon-cyan">{analysisResult.marketIntelligence.demand}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                              <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Primary Angle</p>
                              <p className="text-sm font-bold text-white/80 truncate">{analysisResult.outreachStrategy.primaryAngle}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-4 mb-8">
                      <span className="text-5xl font-display font-bold text-white/10">02</span>
                      <h3 className="text-2xl font-display font-bold text-white tracking-tight">Target Intelligence</h3>
                    </div>
                    <div className="space-y-6">
                      <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4 block">Target Company / Department</label>
                        <input 
                          type="text"
                          value={targetCompany}
                          onChange={(e) => setTargetCompany(e.target.value)}
                          placeholder="e.g. Google Cloud, Marketing Dept"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:border-neon-cyan transition-all font-medium"
                        />
                      </div>
                      <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4 block">Target Role / Contact Title</label>
                        <input 
                          type="text"
                          value={targetRole}
                          onChange={(e) => setTargetRole(e.target.value)}
                          placeholder="e.g. VP of Engineering"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:border-neon-cyan transition-all font-medium"
                        />
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-4 mb-8">
                      <span className="text-5xl font-display font-bold text-white/10">03</span>
                      <h3 className="text-2xl font-display font-bold text-white tracking-tight">Tone Refinement</h3>
                    </div>
                    <div className="glass-panel p-10 rounded-[2rem] border border-white/5 bg-black/40 space-y-12">
                      <div>
                        <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold mb-6">
                          <span className="text-white/40">Casual</span>
                          <span className="text-white">Formal</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={tone.formal}
                          onChange={(e) => setTone({...tone, formal: parseInt(e.target.value)})}
                          className="w-full h-1 bg-white/10 appearance-none cursor-pointer accent-neon-cyan"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold mb-6">
                          <span className="text-white/40">Brief</span>
                          <span className="text-white">Detailed</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={tone.detail}
                          onChange={(e) => setTone({...tone, detail: parseInt(e.target.value)})}
                          className="w-full h-1 bg-white/10 appearance-none cursor-pointer accent-neon-cyan"
                        />
                      </div>
                    </div>
                  </section>

                  <button
                    onClick={generateSequence}
                    disabled={loading || !targetCompany || !targetRole}
                    className="w-full py-8 rounded-[2rem] bg-neon-cyan text-black flex items-center justify-center gap-6 hover:bg-neon-cyan/80 transition-all disabled:opacity-50 group shadow-[0_0_30px_rgba(0,243,255,0.2)]"
                  >
                    {loading ? (
                      <RefreshCw className="w-8 h-8 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                        <span className="text-lg uppercase tracking-[0.3em] font-bold">Forge Sequence</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Preview */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-4 mb-8">
                    <h3 className="text-2xl font-display font-bold text-white tracking-tight">Sequence Preview</h3>
                    <div className="h-[1px] flex-1 bg-white/10" />
                  </div>
                  <div className="flex-1 glass-panel p-10 rounded-[2.5rem] border border-white/5 bg-black/40 overflow-y-auto max-h-[800px] relative">
                    {generatedSequence ? (
                      <div className="space-y-16">
                        {generatedSequence.steps.map((step: any, idx: number) => (
                          <div key={idx} className="space-y-6 relative">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 flex items-center justify-center text-xs font-bold font-mono">
                                0{idx + 1}
                              </div>
                              <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">
                                {step.type.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="p-8 bg-white/5 rounded-3xl border border-white/10 text-white/80 leading-relaxed font-medium relative group">
                              {step.subject && (
                                <div className="mb-6 pb-6 border-b border-white/10">
                                  <span className="text-[10px] uppercase tracking-widest font-bold text-white/40 block mb-2">Subject:</span>
                                  <span className="text-white">{step.subject}</span>
                                </div>
                              )}
                              <p className="whitespace-pre-wrap">{step.content}</p>
                              
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => navigator.clipboard.writeText(step.content)}
                                  className="p-2 rounded-lg bg-white/10 hover:bg-neon-cyan hover:text-black transition-all"
                                  title="Copy to Clipboard"
                                >
                                  <LayoutDashboard className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                        <Sliders className="w-32 h-32 mb-8" />
                        <p className="text-xs uppercase tracking-[0.4em] font-bold">Awaiting Intelligence Forge</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'simulator' && (
            <motion.div 
              key="simulator"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="h-full"
            >
              <InterviewSimulator userId={userId} />
            </motion.div>
          )}

          {activeTab === 'tracker' && (
            <motion.div 
              key="tracker"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <OutreachTracker userId={userId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
