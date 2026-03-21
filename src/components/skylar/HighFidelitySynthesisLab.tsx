import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, Send, Sliders, Shield, Image as ImageIcon, 
  Download, RefreshCw, Check, AlertCircle, Key, 
  User, Building2, Briefcase, ChevronRight, 
  X, Upload, Sparkles, Info
} from 'lucide-react';
import { skylar } from '../../services/skylarService';
import { useIdentity } from '../../contexts/IdentityContext';

interface UserAsset {
  id: string;
  type: 'portrait' | 'outreach_sequence';
  content: string;
  metadata: any;
  createdAt: string;
}

export const HighFidelitySynthesisLab: React.FC = () => {
  const { user } = useIdentity();
  const [activeTab, setActiveTab] = useState<'portrait' | 'outreach' | 'kit'>('portrait');
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

  const styles = [
    'Cinematic Professional',
    'Tech Visionary',
    'Minimalist Executive',
    'Creative Pioneer',
    'Modern Academic'
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
      reader.onloadend = () => {
        setReferencePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePortrait = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const modelId = useHighFidelity ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image';
      
      // Check for API key if using 3.1
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
      
      // Save to kit
      await skylar.saveUserAsset(user.uid, {
        type: 'portrait',
        content: portrait,
        metadata: { style: selectedStyle, modelId, usedReference: !!referencePhoto }
      });
      fetchAssets();
    } catch (error) {
      console.error("Portrait generation failed:", error);
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
      
      // Save to kit
      await skylar.saveUserAsset(user.uid, {
        type: 'outreach_sequence',
        content: JSON.stringify(sequence),
        metadata: { targetCompany, targetRole, tone }
      });
      fetchAssets();
    } catch (error) {
      console.error("Sequence generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#E4E3E0] text-[#141414] font-sans">
      {/* Header */}
      <div className="p-8 border-b border-[#141414]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif italic tracking-tight">Synthesis Lab</h1>
            <p className="text-sm opacity-60 mt-1 uppercase tracking-widest font-mono">High-Fidelity Asset Generation</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('portrait')}
              className={`px-4 py-2 text-xs uppercase tracking-widest font-mono border border-[#141414] transition-colors ${activeTab === 'portrait' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414] hover:text-[#E4E3E0]'}`}
            >
              Portrait Studio
            </button>
            <button 
              onClick={() => setActiveTab('outreach')}
              className={`px-4 py-2 text-xs uppercase tracking-widest font-mono border border-[#141414] transition-colors ${activeTab === 'outreach' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414] hover:text-[#E4E3E0]'}`}
            >
              Outreach Forge
            </button>
            <button 
              onClick={() => setActiveTab('kit')}
              className={`px-4 py-2 text-xs uppercase tracking-widest font-mono border border-[#141414] transition-colors ${activeTab === 'kit' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414] hover:text-[#E4E3E0]'}`}
            >
              Brand Kit ({assets.length})
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'portrait' && (
            <motion.div 
              key="portrait"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12"
            >
              {/* Controls */}
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-serif italic mb-4">1. Likeness Preservation</h2>
                  <div className="border border-[#141414] p-6 bg-white/50 space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Privacy Shield Active</p>
                        <p className="text-xs text-blue-700 mt-1">
                          Your reference photos are used solely to maintain likeness in your Sparkwavv profile assets. 
                          They are stored securely and never shared with third parties.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div 
                        className="w-32 h-32 border-2 border-dashed border-[#141414] flex items-center justify-center cursor-pointer overflow-hidden bg-white"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {referencePhoto ? (
                          <img src={referencePhoto} alt="Reference" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-4">
                            <Upload className="w-6 h-6 mx-auto mb-2 opacity-40" />
                            <span className="text-[10px] uppercase tracking-tighter opacity-40">Upload Photo</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs opacity-60 mb-2">Upload a clear headshot to help Skylar maintain your likeness in generated portraits.</p>
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
                            className="text-[10px] uppercase tracking-widest font-mono text-red-600 hover:underline"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-serif italic mb-4">2. Style Selection</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {styles.map(style => (
                      <button
                        key={style}
                        onClick={() => setSelectedStyle(style)}
                        className={`p-4 text-left border border-[#141414] transition-all ${selectedStyle === style ? 'bg-[#141414] text-[#E4E3E0]' : 'bg-white hover:bg-white/80'}`}
                      >
                        <span className="text-xs uppercase tracking-widest font-mono">{style}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-serif italic">3. Model Fidelity</h2>
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 opacity-40" />
                      <span className="text-[10px] uppercase tracking-widest font-mono opacity-40">Gemini 3.1 Ready</span>
                    </div>
                  </div>
                  <div className="border border-[#141414] p-6 bg-white/50">
                    <label className="flex items-center gap-4 cursor-pointer">
                      <div className={`w-12 h-6 rounded-full border border-[#141414] relative transition-colors ${useHighFidelity ? 'bg-emerald-500' : 'bg-white'}`}>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={useHighFidelity}
                          onChange={(e) => setUseHighFidelity(e.target.checked)}
                        />
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-[#141414] transition-all ${useHighFidelity ? 'left-7' : 'left-1'}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider">High-Fidelity Mode (4K)</p>
                        <p className="text-[10px] opacity-60">Uses Gemini 3.1 Flash for superior detail and lighting.</p>
                      </div>
                    </label>
                  </div>
                </section>

                <button
                  onClick={generatePortrait}
                  disabled={loading}
                  className="w-full py-6 bg-[#141414] text-[#E4E3E0] flex items-center justify-center gap-4 hover:bg-black transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      <span className="text-sm uppercase tracking-[0.2em] font-mono font-bold">Synthesize Portrait</span>
                    </>
                  )}
                </button>
              </div>

              {/* Preview */}
              <div className="flex flex-col">
                <h2 className="text-xl font-serif italic mb-4">Synthesis Preview</h2>
                <div className="flex-1 border border-[#141414] bg-white relative flex items-center justify-center overflow-hidden min-h-[400px]">
                  {generatedPortrait ? (
                    <>
                      <img src={generatedPortrait} alt="Generated" className="w-full h-full object-cover" />
                      <div className="absolute bottom-6 right-6 flex gap-4">
                        <a 
                          href={generatedPortrait} 
                          download="sparkwavv-portrait.png"
                          className="p-3 bg-white border border-[#141414] hover:bg-[#141414] hover:text-white transition-all"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="text-center opacity-20">
                      <ImageIcon className="w-24 h-24 mx-auto mb-4" />
                      <p className="text-xs uppercase tracking-widest font-mono">Awaiting Synthesis</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'outreach' && (
            <motion.div 
              key="outreach"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12"
            >
              {/* Controls */}
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-serif italic mb-4">1. Target Intelligence</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-mono opacity-60 mb-2 block">Target Company / Department</label>
                      <input 
                        type="text"
                        value={targetCompany}
                        onChange={(e) => setTargetCompany(e.target.value)}
                        placeholder="e.g. Google Cloud, Marketing Dept"
                        className="w-full p-4 border border-[#141414] bg-white focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-mono opacity-60 mb-2 block">Target Role / Contact Title</label>
                      <input 
                        type="text"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g. VP of Engineering"
                        className="w-full p-4 border border-[#141414] bg-white focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-serif italic mb-4">2. Tone Refinement</h2>
                  <div className="border border-[#141414] p-8 bg-white/50 space-y-8">
                    <div>
                      <div className="flex justify-between text-[10px] uppercase tracking-widest font-mono mb-4">
                        <span>Casual</span>
                        <span>Formal</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={tone.formal}
                        onChange={(e) => setTone({...tone, formal: parseInt(e.target.value)})}
                        className="w-full accent-[#141414]"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] uppercase tracking-widest font-mono mb-4">
                        <span>Brief</span>
                        <span>Detailed</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={tone.detail}
                        onChange={(e) => setTone({...tone, detail: parseInt(e.target.value)})}
                        className="w-full accent-[#141414]"
                      />
                    </div>
                  </div>
                </section>

                <button
                  onClick={generateSequence}
                  disabled={loading || !targetCompany || !targetRole}
                  className="w-full py-6 bg-[#141414] text-[#E4E3E0] flex items-center justify-center gap-4 hover:bg-black transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      <span className="text-sm uppercase tracking-[0.2em] font-mono font-bold">Forge Sequence</span>
                    </>
                  )}
                </button>
              </div>

              {/* Preview */}
              <div className="flex flex-col">
                <h2 className="text-xl font-serif italic mb-4">Sequence Preview</h2>
                <div className="flex-1 border border-[#141414] bg-white p-8 overflow-y-auto max-h-[600px]">
                  {generatedSequence ? (
                    <div className="space-y-12">
                      {generatedSequence.steps.map((step: any, idx: number) => (
                        <div key={idx} className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center text-xs font-mono">
                              {idx + 1}
                            </div>
                            <span className="text-xs uppercase tracking-widest font-mono font-bold">
                              {step.type.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="p-6 bg-[#F5F5F0] border border-[#141414]/10 font-mono text-sm whitespace-pre-wrap">
                            {step.subject && (
                              <div className="mb-4 pb-4 border-b border-[#141414]/10">
                                <span className="opacity-40">Subject:</span> {step.subject}
                              </div>
                            )}
                            {step.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center opacity-20">
                      <div>
                        <Sliders className="w-24 h-24 mx-auto mb-4" />
                        <p className="text-xs uppercase tracking-widest font-mono">Awaiting Forge</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'kit' && (
            <motion.div 
              key="kit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {assets.length > 0 ? (
                assets.map(asset => (
                  <div key={asset.id} className="border border-[#141414] bg-white group overflow-hidden">
                    <div className="aspect-square bg-[#F5F5F0] relative overflow-hidden">
                      {asset.type === 'portrait' ? (
                        <img src={asset.content} alt="Portrait" className="w-full h-full object-cover" />
                      ) : (
                        <div className="p-6 h-full flex items-center justify-center text-center">
                          <div>
                            <Send className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-[10px] uppercase tracking-widest font-mono font-bold">
                              {asset.metadata?.targetCompany || 'Outreach Sequence'}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-[#141414]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button 
                          onClick={() => {
                            if (asset.type === 'portrait') {
                              setGeneratedPortrait(asset.content);
                              setActiveTab('portrait');
                            } else {
                              setGeneratedSequence(JSON.parse(asset.content));
                              setActiveTab('outreach');
                            }
                          }}
                          className="p-3 bg-white text-[#141414] hover:bg-white/90 transition-colors"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                        <a 
                          href={asset.type === 'portrait' ? asset.content : `data:text/plain;base64,${btoa(asset.content)}`}
                          download={`sparkwavv-${asset.type}-${asset.id}.${asset.type === 'portrait' ? 'png' : 'txt'}`}
                          className="p-3 bg-white text-[#141414] hover:bg-white/90 transition-colors"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                    <div className="p-4 border-t border-[#141414]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest font-mono font-bold">{asset.type}</span>
                        <span className="text-[10px] opacity-40 font-mono">{new Date(asset.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-24 text-center opacity-20">
                  <Briefcase className="w-24 h-24 mx-auto mb-4" />
                  <p className="text-xs uppercase tracking-widest font-mono">Brand Kit is Empty</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
