import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Upload, FileText, Loader2 } from 'lucide-react';
import { useIdentity } from '../contexts/IdentityContext';
import { SkylarStageWrapper } from '../components/skylar/SkylarStageWrapper';
import { parseResume } from '../services/geminiService';

export default function DiveInPage() {
  const { loginWithPopup } = useIdentity();
  const [resumeData, setResumeData] = useState<any>(null);
  const [isParsing, setIsParsing] = useState(false);

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

  const handleSkylarAction = (action: string, payload: any) => {
    if (action === 'create_sparkwavv_account') {
      // In a real app, we would pass payload and resumeData to the signup flow
      console.log('Triggering account creation with:', { payload, resumeData });
      loginWithPopup();
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col p-6 relative overflow-hidden">
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
            className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex-1"
          >
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Context Upload</h3>
            
            {!resumeData ? (
              <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:bg-white/5 transition-colors relative group">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isParsing}
                />
                <div className="flex flex-col items-center gap-3">
                  {isParsing ? (
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-white/40 group-hover:text-blue-400 transition-colors" />
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {isParsing ? 'Analyzing Document...' : 'Upload Resume'}
                    </p>
                    <p className="text-xs text-white/40">PDF, DOCX, or TXT</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{resumeData.name || 'Resume Parsed'}</p>
                  <p className="text-xs text-white/60 mt-1 line-clamp-2">{resumeData.bio || resumeData.role}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-blue-400 font-medium bg-blue-400/10 px-2 py-1 rounded-md">
                      Context Loaded
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </SkylarStageWrapper>
      </div>
    </div>
  );
}
