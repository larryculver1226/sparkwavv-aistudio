import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Rocket,
  User,
  Database,
  Upload,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  Fingerprint,
  Target,
  ArrowRight,
  Loader2,
  Lock,
} from 'lucide-react';
import { useIdentity } from '../contexts/IdentityContext';
import { Button } from '../components/Button';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { parseResume } from '../services/geminiService';

interface IgnitionStep {
  id: number;
  title: string;
  icon: React.ReactNode;
}

const steps: IgnitionStep[] = [
  { id: 1, title: 'Profile', icon: <User className="w-5 h-5" /> },
  { id: 2, title: 'Wavvault', icon: <Database className="w-5 h-5" /> },
  { id: 3, title: 'Resume', icon: <Upload className="w-5 h-5" /> },
  { id: 4, title: 'Subscription', icon: <CreditCard className="w-5 h-5" /> },
];

export const IgnitionPage: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { user, profile, updateProfile, refreshProfile } = useIdentity();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [parsingResume, setParsingResume] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'completed'>('idle');
  const [formData, setFormData] = useState({
    firstName: profile?.displayName?.split(' ')[0] || '',
    lastName: profile?.displayName?.split(' ').slice(1).join(' ') || '',
    jobTitle: profile?.jobTitle || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    industry: '',
    wavvaultSeeds: {
      coreStrength: '',
      primaryGoal: '',
      biggestChallenge: '',
      idealRole: '',
    },
    resumeUploaded: false,
  });

  const handleNext = () => {
    // Validation
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.jobTitle) {
        alert('Please fill in all required profile fields.');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.wavvaultSeeds.coreStrength || !formData.wavvaultSeeds.primaryGoal) {
        alert('Please fill in your core strength and primary goal.');
        return;
      }
    }
    if (currentStep === 4 && paymentStatus !== 'completed') {
      alert('Please complete your subscription to finalize ignition.');
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinalize();
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingResume(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const result = await parseResume(base64, file.type);

        if (result) {
          setFormData((prev) => ({
            ...prev,
            firstName: result.name?.split(' ')[0] || prev.firstName,
            lastName: result.name?.split(' ').slice(1).join(' ') || prev.lastName,
            jobTitle: result.role || prev.jobTitle,
            bio: result.bio || prev.bio,
            industry: result.industry || prev.industry,
            resumeUploaded: true,
          }));
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error parsing resume:', error);
    } finally {
      setParsingResume(false);
    }
  };

  const handlePayment = async () => {
    setPaymentStatus('processing');
    // Simulate payment delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setPaymentStatus('completed');
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    try {
      // Update profile with ignition data
      await updateProfile({
        displayName: `${formData.firstName} ${formData.lastName}`,
        jobTitle: formData.jobTitle,
        bio: formData.bio,
        location: formData.location,
        journeyStage: 'Ignition',
        onboardingComplete: true, // Marking as complete after this flow
      });

      // Seed Wavvault in Firestore
      if (db && user) {
        await updateDoc(doc(db, 'users', user.uid), {
          wavvaultSeeds: formData.wavvaultSeeds,
          ignitionCompletedAt: serverTimestamp(),
          journeyStage: 'Discovery', // Move to next stage
        });

        // Initialize Wavvault entry via API
        const idToken = await user.getIdToken();
        await fetch('/api/wavvault/user', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            identity: `${formData.jobTitle} | ${formData.wavvaultSeeds.idealRole}`,
            strengths: [formData.wavvaultSeeds.coreStrength],
            careerStories: [
              `Primary Goal: ${formData.wavvaultSeeds.primaryGoal}`,
              `Biggest Challenge: ${formData.wavvaultSeeds.biggestChallenge}`,
            ],
            isCommit: true,
          }),
        });
      }

      await refreshProfile();
      onComplete();
    } catch (error) {
      console.error('Error finalizing ignition:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-neon-cyan/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-neon-magenta/10 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Rocket className="w-4 h-4" />
            Phase: Ignition
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tighter mb-4">
            Fuel Your <span className="text-neon-cyan italic">Trajectory</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Complete your profile and seed your Wavvault to unlock the full power of Skylar and the
            SPARKWavv ecosystem.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-16 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 z-0" />
          {steps.map((step) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                  currentStep >= step.id
                    ? 'bg-neon-cyan text-black border-neon-cyan shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                    : 'bg-dark-surface text-white/40 border-white/10'
                }`}
              >
                {currentStep > step.id ? <CheckCircle2 className="w-6 h-6" /> : step.icon}
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest ${currentStep >= step.id ? 'text-neon-cyan' : 'text-white/20'}`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="bg-dark-surface/50 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all outline-none"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all outline-none"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                    Current Job Title
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all outline-none"
                    placeholder="e.g. Senior Product Designer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                    Professional Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all outline-none min-h-[120px] resize-none"
                    placeholder="Tell us a bit about your journey..."
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                      What is your core professional strength?
                    </label>
                    <input
                      type="text"
                      value={formData.wavvaultSeeds.coreStrength}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          wavvaultSeeds: {
                            ...formData.wavvaultSeeds,
                            coreStrength: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all outline-none"
                      placeholder="e.g. Strategic Problem Solving"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                      What is your primary career goal for the next 12 months?
                    </label>
                    <input
                      type="text"
                      value={formData.wavvaultSeeds.primaryGoal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          wavvaultSeeds: { ...formData.wavvaultSeeds, primaryGoal: e.target.value },
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all outline-none"
                      placeholder="e.g. Transition into AI Product Management"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                      What is your biggest professional challenge right now?
                    </label>
                    <textarea
                      value={formData.wavvaultSeeds.biggestChallenge}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          wavvaultSeeds: {
                            ...formData.wavvaultSeeds,
                            biggestChallenge: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all outline-none min-h-[100px] resize-none"
                      placeholder="Be honest, Skylar is here to help..."
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 text-center"
              >
                <div className="py-12 border-2 border-dashed border-white/10 rounded-3xl bg-white/5 hover:bg-white/10 transition-all group cursor-pointer">
                  <div className="w-16 h-16 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-neon-cyan" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Upload Your Resume</h3>
                  <p className="text-white/40 text-sm max-w-xs mx-auto mb-8">
                    Optional: Let Skylar parse your history to build a more accurate DNA profile.
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    id="resume-upload"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleResumeUpload}
                    disabled={parsingResume}
                  />
                  <label
                    htmlFor="resume-upload"
                    className={`px-8 py-3 rounded-full font-bold text-sm transition-colors cursor-pointer flex items-center gap-2 mx-auto w-fit ${
                      parsingResume
                        ? 'bg-white/10 text-white/40 cursor-not-allowed'
                        : 'bg-white text-black hover:bg-neon-cyan'
                    }`}
                  >
                    {parsingResume ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Skylar is Analyzing...
                      </>
                    ) : (
                      'Select File'
                    )}
                  </label>
                  {formData.resumeUploaded && !parsingResume && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-neon-lime text-sm font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      Resume Synthesized Successfully
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-3xl p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/20 blur-3xl rounded-full -mr-16 -mt-16" />
                  <Zap className="w-12 h-12 text-neon-cyan mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-4">Unlock the Sparkwavv Ecosystem</h3>
                  <p className="text-white/60 mb-8 max-w-md mx-auto">
                    Subscribe to Sparkwavv to access Skylar Pro, the Wavvault, and our exclusive
                    career acceleration tools.
                  </p>
                  <div className="flex flex-col gap-4 max-w-sm mx-auto">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="text-left">
                        <p className="font-bold">Sparkwavv Membership</p>
                        <p className="text-xs text-white/40">Full Access to All Features</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-neon-cyan">
                          $49<span className="text-xs font-normal text-white/40">/mo</span>
                        </p>
                      </div>
                    </div>

                    {paymentStatus !== 'completed' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                          <input
                            type="text"
                            placeholder="Card Number"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-neon-cyan/50"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="MM/YY"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-neon-cyan/50"
                            />
                            <input
                              type="text"
                              placeholder="CVC"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-neon-cyan/50"
                            />
                          </div>
                        </div>
                        <Button
                          variant="neon"
                          className="w-full py-4 text-lg flex items-center justify-center gap-2"
                          onClick={handlePayment}
                          disabled={paymentStatus === 'processing'}
                        >
                          {paymentStatus === 'processing' ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Processing Securely...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-5 h-5" />
                              Complete Subscription
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-neon-lime/10 border border-neon-lime/30 text-neon-lime flex flex-col items-center gap-3">
                        <CheckCircle2 className="w-12 h-12" />
                        <p className="font-bold">Subscription Confirmed</p>
                        <p className="text-xs opacity-60">Your access is now active.</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-8 flex items-center justify-center gap-6 text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Secure Payment
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Encrypted Data
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5">
            <button
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
              className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors ${
                currentStep === 1 || loading
                  ? 'text-white/10 cursor-not-allowed'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <Button
              onClick={handleNext}
              disabled={loading}
              className="px-8 py-3 rounded-full flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {currentStep === steps.length ? 'Finalize Ignition' : 'Continue'}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] text-white/20 uppercase tracking-widest font-bold">
          <div className="flex items-center gap-4">
            <Fingerprint className="w-4 h-4" />
            Zero-Knowledge Architecture
          </div>
          <div className="flex items-center gap-4">
            <Target className="w-4 h-4" />
            Precision Career Mapping
          </div>
          <div className="flex items-center gap-4">
            <Zap className="w-4 h-4" />
            AI-Powered Synthesis
          </div>
        </div>
      </div>
    </div>
  );
};
