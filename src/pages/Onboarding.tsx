import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Brain, Target, Rocket, ShieldCheck } from 'lucide-react';
import { useIdentity } from '../contexts/IdentityContext';

export default function Onboarding() {
  const { user, profile, refreshProfile } = useIdentity();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    identity: '',
    strengths: '',
    careerStories: ''
  });

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!user || !profile) return;
    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/wavvault/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          userId: user.uid,
          tenantId: profile.tenantId || 'sparkwavv',
          identity: formData.identity,
          strengths: formData.strengths.split(',').map(s => s.trim()),
          careerStories: formData.careerStories.split('\n').map(s => s.trim()).filter(s => s.length > 0)
        })
      });

      if (response.ok) {
        await refreshProfile();
      }
    } catch (error) {
      console.error("Error creating Wavvault:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-cyan/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-magenta/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl glass-panel p-8 md:p-12 rounded-[2.5rem] border border-white/10 relative z-10"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-neon-cyan/20 flex items-center justify-center border border-neon-cyan/30">
            <Sparkles className="w-6 h-6 text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Initialize Your Wavvault</h1>
            <p className="text-white/40 text-sm">Step {step} of 3</p>
          </div>
        </div>

        {step === 1 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <Brain className="w-3 h-3" />
                Professional Identity
              </label>
              <textarea 
                value={formData.identity}
                onChange={(e) => setFormData({ ...formData, identity: e.target.value })}
                placeholder="How would you describe your professional self in one paragraph?"
                className="w-full h-32 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-neon-cyan transition-all outline-none resize-none"
              />
            </div>
            <button 
              onClick={handleNext}
              disabled={!formData.identity}
              className="w-full py-4 rounded-2xl bg-neon-cyan text-black font-bold flex items-center justify-center gap-2 hover:bg-neon-cyan/90 transition-all disabled:opacity-50"
            >
              Next Step
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <Target className="w-3 h-3" />
                Core Strengths
              </label>
              <input 
                type="text"
                value={formData.strengths}
                onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                placeholder="e.g. Strategic Thinking, Product Design, Leadership (comma separated)"
                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-neon-cyan transition-all outline-none"
              />
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleBack}
                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-all"
              >
                Back
              </button>
              <button 
                onClick={handleNext}
                disabled={!formData.strengths}
                className="flex-[2] py-4 rounded-2xl bg-neon-cyan text-black font-bold flex items-center justify-center gap-2 hover:bg-neon-cyan/90 transition-all disabled:opacity-50"
              >
                Next Step
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <Rocket className="w-3 h-3" />
                Career Stories
              </label>
              <textarea 
                value={formData.careerStories}
                onChange={(e) => setFormData({ ...formData, careerStories: e.target.value })}
                placeholder="Share 1-2 key achievements or career milestones (one per line)"
                className="w-full h-32 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-neon-cyan transition-all outline-none resize-none"
              />
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleBack}
                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-all"
              >
                Back
              </button>
              <button 
                onClick={handleSubmit}
                disabled={!formData.careerStories || loading}
                className="flex-[2] py-4 rounded-2xl bg-neon-lime text-black font-bold flex items-center justify-center gap-2 hover:bg-neon-lime/90 transition-all disabled:opacity-50"
              >
                {loading ? 'Initializing...' : 'Complete Onboarding'}
                <ShieldCheck className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
