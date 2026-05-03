import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Upload, FileText, Loader2, CheckCircle2, ChevronRight, Activity, ArrowRight, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIdentity } from '../contexts/IdentityContext';
import { SkylarStageWrapper } from '../components/skylar/SkylarStageWrapper';
import { parseResume } from '../services/geminiService';
import { OnboardingContainer } from '../containers/OnboardingContainer';
import { CinematicTeaserOverlay } from '../components/kickspark/CinematicTeaserOverlay';

export default function DiveInPage() {
  const { user, status } = useIdentity();
  const navigate = useNavigate();
  const [resumeData, setResumeData] = useState<any>(null);
  const [isParsing, setIsParsing] = useState(false);

  const [effortTier, setEffortTier] = useState<string>('');
  const [pieOfLife, setPieOfLife] = useState<any[]>([]);
  const [strengths, setStrengths] = useState<any[]>([]);
  const [perfectDay, setPerfectDay] = useState<any[]>([]);
  const [financials, setFinancials] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [cinematicScenes, setCinematicScenes] = useState<any[]>([]);
  const [showCinematic, setShowCinematic] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      let base64 = '';
      const reader = new FileReader();
      
      const fileReadPromise = new Promise<void>((resolve, reject) => {
        reader.onload = () => {
          base64 = (reader.result as string).split(',')[1];
          resolve();
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(file);
      await fileReadPromise;

      const result = await parseResume(base64, file.type);
      if (result) {
        setResumeData(result);
      }
    } catch (error) {
      console.error('Error parsing resume:', error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSkylarAction = async (action: string, payload: any) => {
    if (action === 'update_dive_in_ui') {
      if (payload.effortTier) setEffortTier(payload.effortTier);
      if (payload.pieOfLife) setPieOfLife(payload.pieOfLife);
      if (payload.strengths) setStrengths(payload.strengths);
      if (payload.perfectDay) setPerfectDay(payload.perfectDay);
      if (payload.financialExpenses) setFinancials(payload.financialExpenses);
    } else if (action === 'play_cinematic_teaser') {
      if (payload.scenes && payload.scenes.length > 0) {
        setCinematicScenes(payload.scenes);
        setShowCinematic(true);
      }
    } else if (action === 'create_sparkwavv_account') {
      setIsSaving(true);
      try {
        const idToken = await user?.getIdToken();
        if (idToken) {
          // Push updates to API
          await fetch('/api/wavvault/dive-in-commitments', {
             method: 'POST',
             headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
             body: JSON.stringify({
               data: {
                 effortTier,
                 pieOfLife,
                 perfectDay,
                 strengths,
                 financialExpenses: financials
               }
             })
          });
        }
      } catch (err) {
        console.error('Failed to save DiveIn state:', err);
      } finally {
        setIsSaving(false);
        navigate('/');
      }
    }
  };

  const handleManualSave = () => {
     handleSkylarAction('create_sparkwavv_account', {});
  };

  // Step 1: Authentication Screen (for unauthenticated users)
  if (!user && status !== 'initializing') {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col p-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />
        </div>
        <div className="relative z-10 w-full h-full flex-1 flex flex-col justify-center items-center pt-10">
          <OnboardingContainer 
            onBackToHome={() => navigate('/')}
            onSuccess={() => {
              // Once authenticated, the component will re-render and skip this block,
              // moving to Step 2 (Context Injection / Resume Upload).
            }}
          />
        </div>
      </div>
    );
  }

  // Step 2 & 3: Context Injection & Skylar Chat (for authenticated users)
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col p-6 relative overflow-hidden">
      {showCinematic && (
        <CinematicTeaserOverlay 
          scenes={cinematicScenes}
          onComplete={() => setShowCinematic(false)}
        />
      )}
      
      {/* Background Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />
      </div>

      <div className="max-w-7xl w-full mx-auto relative z-10 h-[calc(100vh-3rem)]">
        <SkylarStageWrapper 
          stageId="dive-in" 
          onActionTriggered={handleSkylarAction}
          initialContext={resumeData ? `User Context: ${JSON.stringify(resumeData)}` : undefined}
          layout="split"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col h-full overflow-y-auto w-full lg:max-w-md xl:max-w-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">Dive-In Actions</h3>
              {isSaving && <Loader2 className="w-4 h-4 text-neon-cyan animate-spin" />}
            </div>

            <div className="space-y-6 flex-1">
              {/* Context Upload */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-white mb-3">Context Upload</h4>
                {!resumeData ? (
                  <div className="border border-dashed border-white/20 rounded-xl p-4 text-center hover:bg-white/5 transition-colors relative group">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={isParsing}
                    />
                    <div className="flex flex-col items-center gap-2">
                      {isParsing ? (
                        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6 text-white/40 group-hover:text-blue-400 transition-colors" />
                      )}
                      <p className="text-xs font-medium text-white/60">
                        {isParsing ? 'Analyzing...' : 'Upload Resume'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-sm font-bold text-white">{resumeData.name || 'Resume Parsed'}</p>
                        <p className="text-xs text-blue-400">Context Loaded</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  </div>
                )}
              </div>

              {/* Effort Tier */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white">Effort Tier</h4>
                  {effortTier && <CheckCircle2 className="w-4 h-4 text-neon-cyan" />}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEffortTier('3.5 Hours/Week')}
                    className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg border transition-all ${effortTier === '3.5 Hours/Week' ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'border-white/10 text-white/60 hover:bg-white/5 hover:border-white/30'}`}
                  >
                    3.5 Hrs / Wk
                  </button>
                  <button 
                    onClick={() => setEffortTier('7 Hours/Week')}
                    className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg border transition-all ${effortTier === '7 Hours/Week' ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'border-white/10 text-white/60 hover:bg-white/5 hover:border-white/30'}`}
                  >
                    7 Hrs / Wk
                  </button>
                </div>
              </div>

              {/* Pie of Life & Perfect Day indicators */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`border rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all ${pieOfLife.length > 0 ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/5 border-white/10'}`}>
                  <Activity className={`w-6 h-6 mb-2 ${pieOfLife.length > 0 ? 'text-purple-400' : 'text-white/40'}`} />
                  <p className="text-xs font-bold text-white/80">Pie of Life</p>
                  <p className="text-[10px] text-white/40 mt-1">{pieOfLife.length > 0 ? 'Captured' : 'Discussing...'}</p>
                </div>
                
                <div className={`border rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all ${perfectDay.length > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
                  <Activity className={`w-6 h-6 mb-2 ${perfectDay.length > 0 ? 'text-emerald-400' : 'text-white/40'}`} />
                  <p className="text-xs font-bold text-white/80">Perfect Day</p>
                  <p className="text-[10px] text-white/40 mt-1">{perfectDay.length > 0 ? 'Captured' : 'Discussing...'}</p>
                </div>
              </div>

              {/* Strengths & Financials Indicators */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`border rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all ${strengths.length > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-white/5 border-white/10'}`}>
                  <p className="text-xs font-bold text-white/80">Core Strengths</p>
                  <p className="text-[10px] text-white/40 mt-1">{strengths.length > 0 ? `${strengths.length} Validated` : 'Extracting...'}</p>
                </div>
                
                <div className={`border rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all ${financials.length > 0 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10'}`}>
                  <p className="text-xs font-bold text-white/80">Target Financials</p>
                  <p className="text-[10px] text-white/40 mt-1">{financials.length > 0 ? 'Locked' : 'Calculating...'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10">
              <button
                onClick={handleManualSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3 px-4 rounded-xl hover:bg-neon-cyan transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                   <>Saving... <Loader2 className="w-4 h-4 animate-spin"/></>
                ) : (
                   <>Finalize & Enter Dashboard <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </motion.div>
        </SkylarStageWrapper>
      </div>
    </div>
  );
}
