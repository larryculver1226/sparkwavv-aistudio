import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Send,
  Sliders,
  Shield,
  Image as ImageIcon,
  Download,
  RefreshCw,
  Check,
  AlertCircle,
  Key,
  User,
  Building2,
  Briefcase,
  ChevronRight,
  X,
  Upload,
  Sparkles,
  Info,
  FileText,
  Globe,
  Zap,
} from 'lucide-react';
import { skylar } from '../../services/skylarService';
import { useIdentity } from '../../contexts/IdentityContext';
import { LiveResume } from './LiveResume';
import { InteractivePortfolio } from './InteractivePortfolio';
import { OutreachForge } from './OutreachForge';
import { logUserActivity } from '../../services/activityService';

interface UserAsset {
  id: string;
  type: 'portrait' | 'outreach_sequence' | 'live_resume' | 'interactive_portfolio';
  content: string;
  metadata: any;
  createdAt: string;
  journeyPhase?: 'Dive-In' | 'Ignition' | 'Discovery' | 'Branding' | 'Outreach';
}

export const HighFidelitySynthesisLab: React.FC = () => {
  const { user } = useIdentity();
  const [activeTab, setActiveTab] = useState<'portrait' | 'outreach' | 'branding' | 'kit'>(
    'portrait'
  );
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<UserAsset[]>([]);

  // Portrait Studio State
  const [selectedStyle, setSelectedStyle] = useState('Cinematic Professional');
  const [referencePhoto, setReferencePhoto] = useState<string | null>(null);
  const [generatedPortrait, setGeneratedPortrait] = useState<string | null>(null);
  const [useHighFidelity, setUseHighFidelity] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Outreach Forge State
  const [targetCompany, setTargetCompany] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [tone, setTone] = useState({ formal: 70, detail: 60 });
  const [generatedSequence, setGeneratedSequence] = useState<any>(null);

  // Branding Studio State
  const [generatedResume, setGeneratedResume] = useState<any>(null);
  const [generatedPortfolio, setGeneratedPortfolio] = useState<any>(null);
  const [showLiveResume, setShowLiveResume] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [resonanceFeedback, setResonanceFeedback] = useState<any>(null);

  const styles = [
    'Cinematic Professional',
    'Tech Visionary',
    'Minimalist Executive',
    'Creative Pioneer',
    'Modern Academic',
  ];

  useEffect(() => {
    if (user?.uid) {
      fetchAssets();
    }
  }, [user?.uid]);

  const fetchAssets = async () => {
    if (!user?.uid) return;
    const data = await skylar.getUserAssets(user.uid);
    setAssets(data);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setReferencePhoto(base64);
        
        if (user?.uid) {
          await skylar.saveWavvaultArtifact({
            id: crypto.randomUUID(),
            userId: user.uid,
            type: 'likeness',
            title: 'Likeness Preservation',
            content: base64,
            journeyPhase: 'Branding',
            timestamp: new Date().toISOString()
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePortrait = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const modelId = useHighFidelity ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image';

      if (useHighFidelity && window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
        }
      }

      const portrait = await skylar.generateBrandPortrait(
        user.uid,
        selectedStyle,
        referencePhoto || undefined,
        modelId
      );
      setGeneratedPortrait(portrait);

      // Save as UserAsset for backward compatibility
      await skylar.saveUserAsset(user.uid, {
        type: 'portrait',
        content: portrait,
        metadata: { style: selectedStyle, modelId, usedReference: !!referencePhoto },
        journeyPhase: 'Branding',
      });

      // Save as DistilledArtifact in Wavvault
      await skylar.saveWavvaultArtifact({
        id: crypto.randomUUID(),
        userId: user.uid,
        type: 'portrait',
        title: `Brand Portrait - ${selectedStyle}`,
        content: portrait,
        metadata: { style: selectedStyle, modelId, usedReference: !!referencePhoto },
        journeyPhase: 'Branding',
        timestamp: new Date().toISOString()
      });
      
      await logUserActivity(
        user.uid,
        'default',
        'asset_generated',
        'Generated Brand Portrait',
        `Created a new portrait in the ${selectedStyle} style.`,
        'Branding'
      );
      
      fetchAssets();
    } catch (error) {
      console.error('Portrait generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSequence = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const sequence = await skylar.generateTargetedSequence(
        user.uid,
        targetCompany,
        targetRole,
        tone
      );
      setGeneratedSequence(sequence);

      await skylar.saveUserAsset(user.uid, {
        type: 'outreach_sequence',
        content: JSON.stringify(sequence),
        metadata: { targetCompany, targetRole, tone },
        journeyPhase: 'Outreach',
      });
      
      await logUserActivity(
        user.uid,
        'default',
        'asset_generated',
        'Generated Outreach Sequence',
        `Created a targeted sequence for ${targetRole} at ${targetCompany}.`,
        'Outreach'
      );
      
      fetchAssets();
    } catch (error) {
      console.error('Sequence generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBrandingAsset = async (type: 'live_resume' | 'interactive_portfolio') => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      if (type === 'live_resume') {
        const resume = await skylar.generateLiveResume(user.uid);
        setGeneratedResume(resume);
        await skylar.saveUserAsset(user.uid, {
          type: 'live_resume',
          content: JSON.stringify(resume),
          metadata: { style: 'Editorial / Magazine' },
          journeyPhase: 'Branding',
        });
        await logUserActivity(
          user.uid,
          'default',
          'asset_generated',
          'Generated Live Resume',
          'Created a dynamic, ATS-optimized resume.',
          'Branding'
        );
      } else {
        const portfolio = await skylar.generateInteractivePortfolio(user.uid);
        setGeneratedPortfolio(portfolio);
        await skylar.saveUserAsset(user.uid, {
          type: 'interactive_portfolio',
          content: JSON.stringify(portfolio),
          metadata: { style: 'Editorial / Magazine' },
          journeyPhase: 'Branding',
        });
        await logUserActivity(
          user.uid,
          'default',
          'asset_generated',
          'Generated Interactive Portfolio',
          'Created a high-fidelity interactive portfolio.',
          'Branding'
        );
      }
      fetchAssets();
    } catch (error) {
      console.error(`${type} generation failed:`, error);
    } finally {
      setLoading(false);
    }
  };

  const getFeedback = async (content: string) => {
    if (!user?.uid) return;
    const feedback = await skylar.getResonanceFeedback(
      user.uid,
      content,
      targetRole || 'Strategic Leader'
    );
    setResonanceFeedback(feedback);
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-white font-sans selection:bg-white/10 selection:text-white">
      {/* Header */}
      <div className="p-8 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-serif italic tracking-tighter">Synthesis Lab</h1>
            <p className="text-xs opacity-40 mt-1 uppercase tracking-[0.3em] font-mono font-bold">
              High-Fidelity Asset Generation
            </p>
          </div>
          <div className="flex gap-2">
            {[
              { id: 'portrait', label: 'Portrait Studio', icon: Camera },
              { id: 'branding', label: 'Branding Studio', icon: Sparkles },
              { id: 'outreach', label: 'Outreach Forge', icon: Send },
              { id: 'kit', label: `Brand Kit (${assets.length})`, icon: Briefcase },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 text-[10px] uppercase tracking-widest font-bold border border-white/10 transition-all flex items-center gap-3 ${activeTab === tab.id ? 'bg-white/10 text-white' : 'hover:bg-white/10 hover:text-white'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-12">
        <AnimatePresence mode="wait">
          {activeTab === 'portrait' && (
            <motion.div
              key="portrait"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16"
            >
              {/* Controls */}
              <div className="space-y-12">
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-4xl font-serif italic opacity-20">01</span>
                    <h2 className="text-3xl font-serif italic tracking-tight">
                      Likeness Preservation
                    </h2>
                  </div>
                  <div className="border border-white/10 p-8 bg-white/5 space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-white/10 text-white">
                      <Shield className="w-5 h-5 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest">
                          Privacy Shield Active
                        </p>
                        <p className="text-xs opacity-60 mt-1">
                          Reference photos are used solely for profile synthesis. Encrypted at rest.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div
                        className="w-40 h-40 border border-dashed border-white/10 flex items-center justify-center cursor-pointer overflow-hidden bg-white/5 group"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {referencePhoto ? (
                          <img
                            src={referencePhoto}
                            alt="Reference"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">
                              Upload Photo
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-serif italic opacity-60 mb-4">
                          Upload a clear headshot to help Skylar maintain your likeness in generated
                          portraits.
                        </p>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handlePhotoUpload}
                          className="hidden"
                          accept="image/*"
                        />
                        {referencePhoto && (
                          <button
                            onClick={() => setReferencePhoto(null)}
                            className="text-[10px] uppercase tracking-widest font-bold text-red-600 hover:underline"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-4xl font-serif italic opacity-20">02</span>
                    <h2 className="text-3xl font-serif italic tracking-tight">Style Selection</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {styles.map((style) => (
                      <button
                        key={style}
                        onClick={() => setSelectedStyle(style)}
                        className={`p-6 text-left border border-white/10 transition-all ${selectedStyle === style ? 'bg-white/10 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                      >
                        <span className="text-[10px] uppercase tracking-widest font-bold">
                          {style}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                <button
                  onClick={generatePortrait}
                  disabled={loading}
                  className="w-full py-8 bg-white/10 text-white flex items-center justify-center gap-6 hover:bg-black transition-all disabled:opacity-50 group"
                >
                  {loading ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                      <span className="text-lg uppercase tracking-[0.3em] font-bold">
                        Synthesize Portrait
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Preview */}
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-3xl font-serif italic tracking-tight">Synthesis Preview</h2>
                  <div className="h-[1px] flex-1 bg-white/10 opacity-10" />
                </div>
                <div className="flex-1 border border-white/10 bg-white/5 relative flex items-center justify-center overflow-hidden min-h-[500px] shadow-2xl">
                  {generatedPortrait ? (
                    <>
                      <img
                        src={generatedPortrait}
                        alt="Generated"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-8 right-8 flex gap-4">
                        <button
                          onClick={async () => {
                            if (!user) return;
                            try {
                              const newArtifact = {
                                userId: user.uid,
                                type: 'brand-pillar',
                                title: 'Cinematic Brand Portrait',
                                content: generatedPortrait,
                                journeyPhase: 'Branding',
                                status: 'approved',
                              };
                              await skylar.saveWavvaultArtifact(newArtifact);
                              alert('Portrait saved to Wavvault!');
                            } catch (e) {
                              console.error('Failed to save to Wavvault', e);
                            }
                          }}
                          className="px-6 py-4 bg-neon-cyan text-black font-bold uppercase tracking-widest text-xs hover:bg-neon-cyan/80 transition-all"
                        >
                          Save to Wavvault
                        </button>
                        <a
                          href={generatedPortrait}
                          download="sparkwavv-portrait.png"
                          className="p-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
                        >
                          <Download className="w-6 h-6" />
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="text-center opacity-10">
                      <ImageIcon className="w-32 h-32 mx-auto mb-6" />
                      <p className="text-xs uppercase tracking-[0.4em] font-bold">
                        Awaiting Synthesis
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'branding' && (
            <motion.div
              key="branding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16"
            >
              <div className="space-y-12">
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-4xl font-serif italic opacity-20">01</span>
                    <h2 className="text-3xl font-serif italic tracking-tight">
                      Cinematic Branding
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <button
                      onClick={() => generateBrandingAsset('live_resume')}
                      disabled={loading}
                      className="p-8 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all group text-left"
                    >
                      <div className="flex justify-between items-start mb-8">
                        <FileText className="w-8 h-8" />
                        <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                      <h3 className="text-2xl font-serif italic mb-2">Live Resume</h3>
                      <p className="text-xs opacity-60 uppercase tracking-widest font-bold">
                        Editorial / Interactive / PDF Optimized
                      </p>
                    </button>

                    <button
                      onClick={() => generateBrandingAsset('interactive_portfolio')}
                      disabled={loading}
                      className="p-8 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all group text-left"
                    >
                      <div className="flex justify-between items-start mb-8">
                        <Globe className="w-8 h-8" />
                        <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                      <h3 className="text-2xl font-serif italic mb-2">Interactive Portfolio</h3>
                      <p className="text-xs opacity-60 uppercase tracking-widest font-bold">
                        Multi-page / Narrative Driven / Cinematic
                      </p>
                    </button>
                  </div>
                </section>

                {resonanceFeedback && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 border border-white/10 bg-white/10 text-white"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-neon-cyan" />
                        <span className="text-[10px] uppercase tracking-widest font-bold">
                          Skylar's Resonance Feedback
                        </span>
                      </div>
                      <span className="text-2xl font-mono font-bold text-neon-cyan">
                        {resonanceFeedback.resonanceScore}%
                      </span>
                    </div>
                    <p className="text-lg font-serif italic mb-6 opacity-80">
                      "{resonanceFeedback.feedback}"
                    </p>
                    <div className="space-y-2">
                      {resonanceFeedback.suggestions.map((s: string, i: number) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold opacity-40"
                        >
                          <div className="w-1 h-1 bg-neon-cyan rounded-full" />
                          {s}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-3xl font-serif italic tracking-tight">Branding Preview</h2>
                  <div className="h-[1px] flex-1 bg-white/10 opacity-10" />
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {generatedResume && (
                    <div className="border border-white/10 bg-white/5 p-8 group">
                      <div className="flex justify-between items-center mb-8">
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">
                          Live Resume Ready
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (!user) return;
                              try {
                                const newArtifact = {
                                  userId: user.uid,
                                  type: 'live_resume',
                                  title: 'Live Resume',
                                  content: generatedResume,
                                  journeyPhase: 'Branding',
                                  status: 'approved',
                                };
                                await skylar.saveWavvaultArtifact(newArtifact);
                                alert('Resume saved to Wavvault!');
                              } catch (e) {
                                console.error('Failed to save to Wavvault', e);
                              }
                            }}
                            className="px-4 py-2 bg-neon-cyan text-black font-bold uppercase tracking-widest text-[10px] hover:bg-neon-cyan/80 transition-all"
                          >
                            Save to Wavvault
                          </button>
                          <button
                            onClick={() => setShowLiveResume(true)}
                            className="p-3 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
                          >
                            <Globe className="w-4 h-4" />
                          </button>
                          <button className="p-3 border border-white/10 hover:bg-white/10 hover:text-white transition-all">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-4xl font-serif italic mb-4">
                        {generatedResume.spark.title}
                      </h3>
                      <p className="text-sm font-serif italic opacity-60 line-clamp-3">
                        {generatedResume.spark.narrative}
                      </p>
                    </div>
                  )}

                  {generatedPortfolio && (
                    <div className="border border-white/10 bg-white/5 p-8 group">
                      <div className="flex justify-between items-center mb-8">
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">
                          Portfolio Ready
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (!user) return;
                              try {
                                const newArtifact = {
                                  userId: user.uid,
                                  type: 'interactive_portfolio',
                                  title: 'Interactive Portfolio',
                                  content: generatedPortfolio,
                                  journeyPhase: 'Branding',
                                  status: 'approved',
                                };
                                await skylar.saveWavvaultArtifact(newArtifact);
                                alert('Portfolio saved to Wavvault!');
                              } catch (e) {
                                console.error('Failed to save to Wavvault', e);
                              }
                            }}
                            className="px-4 py-2 bg-neon-cyan text-black font-bold uppercase tracking-widest text-[10px] hover:bg-neon-cyan/80 transition-all"
                          >
                            Save to Wavvault
                          </button>
                          <button
                            onClick={() => setShowPortfolio(true)}
                            className="p-3 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
                          >
                            <Globe className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-4xl font-serif italic mb-4">The Cinematic Narrative</h3>
                      <p className="text-sm font-serif italic opacity-60 line-clamp-3">
                        {generatedPortfolio.pages[0].content}
                      </p>
                    </div>
                  )}

                  {!generatedResume && !generatedPortfolio && (
                    <div className="h-[400px] border border-dashed border-white/10 flex items-center justify-center opacity-10">
                      <div className="text-center">
                        <Sparkles className="w-24 h-24 mx-auto mb-6" />
                        <p className="text-xs uppercase tracking-[0.4em] font-bold">
                          Awaiting Branding Synthesis
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'outreach' && <OutreachForge userId={user?.uid || ''} />}

          {activeTab === 'kit' && (
            <motion.div
              key="kit"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
            >
              {assets.length > 0 ? (
                assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="border border-white/10 bg-white/5 group overflow-hidden shadow-lg hover:shadow-2xl transition-all"
                  >
                    <div className="aspect-square bg-white/5 relative overflow-hidden">
                      {asset.type === 'portrait' ? (
                        <img
                          src={asset.content}
                          alt="Portrait"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="p-12 h-full flex items-center justify-center text-center">
                          <div>
                            {asset.type === 'live_resume' ? (
                              <FileText className="w-16 h-16 mx-auto mb-6 opacity-10" />
                            ) : asset.type === 'interactive_portfolio' ? (
                              <Globe className="w-16 h-16 mx-auto mb-6 opacity-10" />
                            ) : (
                              <Send className="w-16 h-16 mx-auto mb-6 opacity-10" />
                            )}
                            <p className="text-xs uppercase tracking-widest font-bold">
                              {asset.metadata?.targetCompany || asset.type.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                        <button
                          onClick={() => {
                            if (asset.type === 'portrait') {
                              setGeneratedPortrait(asset.content);
                              setActiveTab('portrait');
                            } else if (asset.type === 'outreach_sequence') {
                              setGeneratedSequence(JSON.parse(asset.content));
                              setActiveTab('outreach');
                            } else if (asset.type === 'live_resume') {
                              setGeneratedResume(JSON.parse(asset.content));
                              setShowLiveResume(true);
                            } else if (asset.type === 'interactive_portfolio') {
                              setGeneratedPortfolio(JSON.parse(asset.content));
                              setShowPortfolio(true);
                            }
                          }}
                          className="p-4 bg-white/5 text-white hover:bg-neon-cyan transition-all"
                        >
                          <RefreshCw className="w-6 h-6" />
                        </button>
                        <a
                          href={
                            asset.type === 'portrait'
                              ? asset.content
                              : `data:text/plain;base64,${btoa(asset.content)}`
                          }
                          download={`sparkwavv-${asset.type}-${asset.id}.${asset.type === 'portrait' ? 'png' : 'txt'}`}
                          className="p-4 bg-white/5 text-white hover:bg-neon-cyan transition-all"
                        >
                          <Download className="w-6 h-6" />
                        </a>
                      </div>
                    </div>
                    <div className="p-6 border-t-2 border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest font-bold">
                          {asset.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] opacity-40 font-mono">
                          {new Date(asset.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-32 text-center opacity-10">
                  <Briefcase className="w-32 h-32 mx-auto mb-8" />
                  <p className="text-xs uppercase tracking-[0.4em] font-bold">Brand Kit is Empty</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {showLiveResume && generatedResume && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <LiveResume data={generatedResume} onDownload={() => window.print()} />
            <button
              onClick={() => setShowLiveResume(false)}
              className="fixed top-12 right-12 p-4 bg-white/10 text-white rounded-full z-[60] hover:scale-110 transition-transform"
            >
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        )}

        {showPortfolio && generatedPortfolio && (
          <InteractivePortfolio data={generatedPortfolio} onClose={() => setShowPortfolio(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};
