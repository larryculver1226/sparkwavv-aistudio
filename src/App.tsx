import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Rocket, 
  Target, 
  Zap, 
  ShieldAlert, 
  Heart, 
  Fingerprint, 
  Film, 
  ArrowRight, 
  ChevronRight,
  Loader2,
  CheckCircle2,
  Trophy,
  Compass,
  Lightbulb,
  FileUp,
  Upload,
  ExternalLink,
  Mail,
  Image as ImageIcon,
  Camera,
  Settings,
  Lock
} from 'lucide-react';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './lib/firebase';
import { useAuth } from './hooks/useAuth';
import { generateDiscoverySummary, parseResume, generateBrandImage, UserData } from './services/geminiService';
import { NavBar } from './components/NavBar';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserDashboard } from './pages/UserDashboard';

// --- Types ---
type Step = 'landing' | 'onboarding' | 'module1' | 'module2' | 'module3' | 'module4' | 'module5' | 'processing' | 'results' | 'product-skylar' | 'product-features' | 'product-technology' | 'product-wavvault' | 'company-vision' | 'company-about' | 'company-investors' | 'company-give' | 'company-testimonials';

// --- Constants ---
const INDUSTRIES = [
  "Aerospace",
  "Automotive",
  "Construction",
  "Defense",
  "Education",
  "Energy",
  "Finance",
  "Government",
  "Healthcare",
  "Hospitality",
  "Legal",
  "Logistics",
  "Manufacturing",
  "Media & Entertainment",
  "Real Estate",
  "Retail",
  "Skilled Trades",
  "Technology",
  "Transportation"
];

// --- Components ---

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  loading = false
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline' | 'neon'; 
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}) => {
  const variants = {
    primary: 'bg-white text-black hover:bg-gray-200',
    secondary: 'bg-dark-surface text-white border border-white/10 hover:bg-white/5',
    outline: 'border border-white/20 text-white hover:border-white/40',
    neon: 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/20 neon-border-cyan'
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-6 py-3 rounded-full font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
};

const ProgressBar = ({ current, total }: { current: number; total: number }) => (
  <div className="fixed top-0 left-0 w-full h-1 bg-white/5 z-50">
    <motion.div 
      className="h-full bg-neon-cyan shadow-[0_0_10px_#00f3ff]"
      initial={{ width: 0 }}
      animate={{ width: `${(current / total) * 100}%` }}
    />
  </div>
);

export function SparkwavvApp() {
  const [step, setStep] = useState<Step>('landing');
  const [userData, setUserData] = useState<UserData>({
    onboarding: { name: '', role: '', bio: '', email: '', industry: '', password: '' },
    accomplishments: [
      { title: '', description: '' },
      { title: '', description: '' },
      { title: '', description: '' }
    ],
    environment: { perfectDay: '', extinguishers: [] },
    passions: { energizers: [], bestWhen: '' },
    attributes: [],
    tagline: ''
  });
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [parsingResume, setParsingResume] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [showStartOverConfirm, setShowStartOverConfirm] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const isConfirmed = user?.emailVerified || false;

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  // Load progress on mount
  useEffect(() => {
    const savedData = localStorage.getItem('sparkwavv_user_data');
    const savedStep = localStorage.getItem('sparkwavv_current_step');
    const savedSummary = localStorage.getItem('sparkwavv_summary');

    if (savedData || savedStep || savedSummary) {
      if (savedStep && savedStep !== 'onboarding') {
        setHasSavedProgress(true);
      } else if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.onboarding?.name || parsed.onboarding?.email) {
            setHasSavedProgress(true);
          }
        } catch (e) {
          console.error("Error parsing saved data:", e);
        }
      } else if (savedSummary) {
        setHasSavedProgress(true);
      }
    }
  }, []);

  const resumeJourney = () => {
    const savedData = localStorage.getItem('sparkwavv_user_data');
    const savedStep = localStorage.getItem('sparkwavv_current_step');
    const savedSummary = localStorage.getItem('sparkwavv_summary');

    if (savedData) {
      const parsed = JSON.parse(savedData);
      // Migrate accomplishments if they are in the old string format
      if (parsed.accomplishments && parsed.accomplishments.length > 0 && typeof parsed.accomplishments[0] === 'string') {
        parsed.accomplishments = parsed.accomplishments.map((acc: string) => ({
          title: acc,
          description: ''
        }));
        // Ensure we have exactly 3 slots
        while (parsed.accomplishments.length < 3) {
          parsed.accomplishments.push({ title: '', description: '' });
        }
      }
      setUserData(parsed);
    }
    if (savedStep) setStep(savedStep as Step);
    if (savedSummary) setSummary(JSON.parse(savedSummary));
  };

  const startOver = () => {
    localStorage.removeItem('sparkwavv_user_data');
    localStorage.removeItem('sparkwavv_current_step');
    localStorage.removeItem('sparkwavv_summary');
    setUserData({
      onboarding: { name: '', role: '', bio: '', email: '', industry: '', password: '' },
      accomplishments: [
        { title: '', description: '' },
        { title: '', description: '' },
        { title: '', description: '' }
      ],
      environment: { perfectDay: '', extinguishers: [] },
      passions: { energizers: [], bestWhen: '' },
      attributes: [],
      tagline: ''
    });
    setSummary(null);
    setStep('onboarding');
    setHasSavedProgress(false);
  };

  // Save progress whenever state changes
  useEffect(() => {
    const steps: Step[] = ['landing', 'onboarding', 'module1', 'module2', 'module3', 'module4', 'module5', 'processing', 'results'];
    const currentIndex = steps.indexOf(step);
    
    if (currentIndex > 1 && !isConfirmed) {
      setStep('landing');
      setErrors({ general: "Please confirm your registration via email before continuing." });
    }
    
    if (step !== 'landing' && step !== 'processing' && step !== 'results') {
      // Only save if we have some data or we are past onboarding
      const hasData = userData.onboarding.name || userData.onboarding.email || uploadedFileName;
      if (hasData || currentIndex > 1) {
        localStorage.setItem('sparkwavv_user_data', JSON.stringify(userData));
        localStorage.setItem('sparkwavv_current_step', step);
        setHasSavedProgress(true);
      }
    }
    if (step === 'results' && summary) {
      localStorage.setItem('sparkwavv_summary', JSON.stringify(summary));
      setHasSavedProgress(true);
    }
  }, [userData, step, summary, uploadedFileName, isConfirmed]);

  const validateOnboarding = () => {
    // If a resume is uploaded, we don't strictly require the manual fields to be filled
    // but if they ARE filled, they must be valid.
    // However, the prompt says: "If the user uploads a resume, the user should not be required to also fill the fields in manually"
    // So if uploadedFileName is present, we skip the "required" check but still check lengths if they are present.
    
    const newErrors: Record<string, string> = {};
    const isResumeUploaded = !!uploadedFileName;

    if (!isResumeUploaded) {
      if (!userData.onboarding.name.trim()) newErrors.name = 'Name is required';
      if (!userData.onboarding.role.trim()) newErrors.role = 'Role is required';
      if (!userData.onboarding.bio.trim()) newErrors.bio = 'Bio is required';
      if (!userData.onboarding.email.trim()) newErrors.email = 'Email is required';
      if (!userData.onboarding.industry) newErrors.industry = 'Industry is required';
    }

    if (userData.onboarding.name.length > 50) newErrors.name = 'Name is too long (max 50 chars)';
    if (userData.onboarding.role.length > 100) newErrors.role = 'Role is too long (max 100 chars)';
    if (userData.onboarding.bio.length > 500) newErrors.bio = 'Bio is too long (max 500 chars)';
    
    if (userData.onboarding.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.onboarding.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (isResumeUploaded && !userData.onboarding.email.trim()) {
      // Even if resume is uploaded, we want email now
      newErrors.email = 'Email is required';
    }

    if (!userData.onboarding.password || userData.onboarding.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateOnboarding()) return;

    setIsRegistering(true);
    setRegistrationMessage(null);

    if (!isFirebaseConfigured || !auth) {
      setErrors({ ...errors, general: "Firebase is not configured. Please add your credentials to the environment variables." });
      setIsRegistering(false);
      return;
    }

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.onboarding.email, 
        userData.onboarding.password || ''
      );
      
      // Send verification email
      await sendEmailVerification(userCredential.user);

      // Initialize role in backend
      const idToken = await userCredential.user.getIdToken();
      await fetch('/api/user/init-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      setRegistrationMessage("Confirm Your Registration - Check Your Email to Confirm Your Sparkwavv Account");
      
      // Redirect to landing after 5 seconds
      setTimeout(() => {
        setStep('landing');
        setRegistrationMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error("Firebase registration error:", err);
      let message = "Registration failed. Please try again.";
      if (err.code === 'auth/email-already-in-use') {
        message = "This email is already registered. Please try logging in.";
      } else if (err.code === 'auth/invalid-email') {
        message = "Invalid email address.";
      } else if (err.code === 'auth/weak-password') {
        message = "Password is too weak.";
      }
      setErrors({ ...errors, general: message });
    } finally {
      setIsRegistering(false);
    }
  };

  const validateModule1 = () => {
    const newErrors: Record<string, string> = {};
    const filledAcc = userData.accomplishments.filter(a => a.title.trim().length > 0 || a.description.trim().length > 0);
    if (filledAcc.length < 2) newErrors.accomplishments = 'Please provide at least 2 accomplishments';
    
    userData.accomplishments.forEach((acc, i) => {
      if (acc.title.length > 100) newErrors[`acc_title_${i}`] = 'Title is too long (max 100 chars)';
      if (acc.description.length > 300) newErrors[`acc_desc_${i}`] = 'Description is too long (max 300 chars)';
      
      // If one is filled, the other should be too
      if (acc.title.trim() && !acc.description.trim()) newErrors[`acc_desc_${i}`] = 'Description is required for this accomplishment';
      if (!acc.title.trim() && acc.description.trim()) newErrors[`acc_title_${i}`] = 'Title is required for this accomplishment';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateModule2 = () => {
    const newErrors: Record<string, string> = {};
    if (!userData.environment.perfectDay.trim()) newErrors.perfectDay = 'Perfect day description is required';
    else if (userData.environment.perfectDay.length > 1000) newErrors.perfectDay = 'Description is too long (max 1000 chars)';
    
    if (userData.environment.extinguishers.length === 0) newErrors.extinguishers = 'Please select at least one extinguisher';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateModule3 = () => {
    const newErrors: Record<string, string> = {};
    if (userData.passions.energizers.length === 0) newErrors.energizers = 'Please select at least one energizer';
    
    if (!userData.passions.bestWhen.trim()) newErrors.bestWhen = 'This field is required';
    else if (userData.passions.bestWhen.length > 500) newErrors.bestWhen = 'Description is too long (max 500 chars)';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateModule4 = () => {
    const newErrors: Record<string, string> = {};
    if (userData.attributes.length < 3) newErrors.attributes = 'Please select at least 3 attributes';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateModule5 = () => {
    const newErrors: Record<string, string> = {};
    if (!userData.tagline.trim()) newErrors.tagline = 'Tagline is required';
    else if (userData.tagline.length > 100) newErrors.tagline = 'Tagline is too long (max 100 chars)';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setParsingResume(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const result = await parseResume(base64, file.type);
        if (result) {
          setUserData(prev => ({
            ...prev,
            onboarding: {
              name: result.name || prev.onboarding.name,
              role: result.role || prev.onboarding.role,
              bio: result.bio || prev.onboarding.bio,
              email: result.email || prev.onboarding.email,
              industry: result.industry || prev.onboarding.industry
            },
            accomplishments: result.accomplishments && result.accomplishments.length > 0 
              ? result.accomplishments.slice(0, 3).concat(Array(Math.max(0, 3 - result.accomplishments.length)).fill({ title: '', description: '' }))
              : prev.accomplishments,
            passions: {
              ...prev.passions,
              energizers: result.skills && result.skills.length > 0 ? result.skills : prev.passions.energizers
            },
            attributes: result.attributes && result.attributes.length > 0 ? result.attributes : prev.attributes
          }));
        }
        setParsingResume(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      setParsingResume(false);
    }
  };

  const nextStep = () => {
    const steps: Step[] = ['landing', 'onboarding', 'module1', 'module2', 'module3', 'module4', 'module5', 'processing', 'results'];
    const currentIndex = steps.indexOf(step);
    
    let isValid = true;
    if (step === 'onboarding') {
      if (!isConfirmed) {
        setErrors({ ...errors, general: "Please confirm your registration via email before continuing." });
        return;
      }
      isValid = validateOnboarding();
    }
    else if (step === 'module1') isValid = validateModule1();
    else if (step === 'module2') isValid = validateModule2();
    else if (step === 'module3') isValid = validateModule3();
    else if (step === 'module4') isValid = validateModule4();
    else if (step === 'module5') isValid = validateModule5();

    if (isValid && currentIndex < steps.length - 1) {
      setErrors({});
      setStep(steps[currentIndex + 1]);
    }
  };

  useEffect(() => {
    if (step === 'processing') {
      const process = async () => {
        setLoading(true);
        const result = await generateDiscoverySummary(userData);
        setSummary(result);
        setLoading(false);
        setStep('results');
      };
      process();
    }
  }, [step, userData]);

  return (
    <div 
      className="min-h-screen selection:bg-neon-cyan selection:text-black relative transition-all duration-1000"
      style={userData.brandImage ? {
        backgroundImage: `linear-gradient(to bottom, rgba(10, 10, 10, 0.8), rgba(10, 10, 10, 0.95)), url(${userData.brandImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : {}}
    >
      <header>
        <NavBar onNavigate={(s) => {
          if (s === 'onboarding') {
            if (isConfirmed) {
              setStep('module1');
            } else {
              setStep('onboarding');
            }
          } else {
            setStep(s as Step);
          }
        }} />
      </header>
      <ProgressBar current={['landing', 'onboarding', 'module1', 'module2', 'module3', 'module4', 'module5', 'processing', 'results'].indexOf(step)} total={8} />
      
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow max-w-7xl mx-auto px-6 pt-48 pb-32">
          <AnimatePresence mode="wait">
          {step === 'landing' && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8"
            >
              {isConfirmed && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-2xl mx-auto p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-center font-bold mb-8"
                >
                  Registration Confirmed! You can now login to continue your journey.
                </motion.div>
              )}
              {errors.general && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-2xl mx-auto p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-center font-bold mb-8"
                >
                  {errors.general}
                </motion.div>
              )}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                <span>Ignite Your Career Identity</span>
              </div>
              <h1 className="text-6xl md:text-7xl font-display font-bold leading-tight tracking-tight">
                Meet <span className="text-neon-cyan neon-text-cyan italic">Skylar</span>,<br />
                Your AI Career Guide
              </h1>
              <p className="text-neon-cyan font-display uppercase tracking-[0.3em] text-sm font-bold mt-4">
                The Most Advanced Career Engine Ever Built
              </p>
              <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                A meticulously engineered career branding framework. Move from "overwhelmed" to "market dominant" through cinematic self-discovery.
              </p>
              <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mt-4">
                The next-gen AI-powered career wellness platform that transforms job searching into a personalized journey to career happiness, with smart guidance every step of the way.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                {hasSavedProgress ? (
                  <>
                    <Button onClick={resumeJourney} variant="neon" className="w-full sm:w-auto text-lg px-12 py-4">
                      Resume Journey <ArrowRight className="w-5 h-5" />
                    </Button>
                    <Button onClick={() => setShowStartOverConfirm(true)} variant="outline" className="w-full sm:w-auto text-lg px-12 py-4">
                      Dive-In/Start
                    </Button>
                  </>
                ) : isConfirmed ? (
                  <Button onClick={() => setStep('module1')} variant="neon" className="w-full sm:w-auto text-lg px-12 py-4">
                    Continue to Module 1 <ArrowRight className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button onClick={nextStep} variant="neon" className="w-full sm:w-auto text-lg px-12 py-4">
                    Begin Ignition <ArrowRight className="w-5 h-5" />
                  </Button>
                )}
                <p className="text-sm text-white/40">2-4 weeks to total clarity</p>
              </div>

              {/* Hero Section with 3 Panels */}
              <div className="pt-20">
                <Hero />
              </div>

              {/* Start Over Confirmation Modal */}
              <AnimatePresence>
                {showStartOverConfirm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="glass-panel max-w-md w-full p-8 space-y-6 border-red-500/30"
                    >
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                          <ShieldAlert className="w-8 h-8 text-red-500" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-2xl font-bold text-white">Warning</h3>
                          <p className="text-white/60">ALL Previous Information Will Be Deleted. This action cannot be undone.</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <Button 
                          onClick={() => {
                            startOver();
                            setShowStartOverConfirm(false);
                          }} 
                          variant="neon" 
                          className="w-full bg-red-500 hover:bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                        >
                          Confirmation: Dive-In/Start
                        </Button>
                        <Button 
                          onClick={() => setShowStartOverConfirm(false)} 
                          variant="secondary" 
                          className="w-full"
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {step === 'product-skylar' && (
            <motion.div 
              key="product-skylar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 text-center"
            >
              <header className="space-y-4">
                <h2 className="text-5xl font-bold">Skylar</h2>
                <p className="text-neon-cyan font-display uppercase tracking-widest">Your AI Career Guide</p>
              </header>
              <div className="glass-panel p-12 border-neon-cyan/20">
                <p className="text-xl text-white/60">Placeholder for Skylar's deep-dive experience. Coming soon.</p>
              </div>
              <Button onClick={() => setStep('landing')} variant="outline">Back to Home</Button>
            </motion.div>
          )}

          {step === 'product-features' && (
            <motion.div 
              key="product-features"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 text-center"
            >
              <header className="space-y-4">
                <h2 className="text-5xl font-bold">Features</h2>
                <p className="text-neon-cyan font-display uppercase tracking-widest">The Sparkwavv Toolkit</p>
              </header>
              <div className="glass-panel p-12 border-neon-cyan/20">
                <p className="text-xl text-white/60">Placeholder for Sparkwavv's feature showcase. Coming soon.</p>
              </div>
              <Button onClick={() => setStep('landing')} variant="outline">Back to Home</Button>
            </motion.div>
          )}

          {step === 'product-technology' && (
            <motion.div 
              key="product-technology"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 text-center"
            >
              <header className="space-y-4">
                <h2 className="text-5xl font-bold">Technology</h2>
                <p className="text-neon-cyan font-display uppercase tracking-widest">The Engine Behind the Wave</p>
              </header>
              <div className="glass-panel p-12 border-neon-cyan/20">
                <p className="text-xl text-white/60">Placeholder for Sparkwavv's technology deep-dive. Coming soon.</p>
              </div>
              <Button onClick={() => setStep('landing')} variant="outline">Back to Home</Button>
            </motion.div>
          )}

          {step === 'product-wavvault' && (
            <motion.div 
              key="product-wavvault"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 text-center"
            >
              <header className="space-y-4">
                <h2 className="text-5xl font-bold">Wavvault</h2>
                <p className="text-neon-cyan font-display uppercase tracking-widest">Secure Career Asset Storage</p>
              </header>
              <div className="glass-panel p-12 border-neon-cyan/20">
                <p className="text-xl text-white/60">Placeholder for Wavvault's secure storage features. Coming soon.</p>
              </div>
              <Button onClick={() => setStep('landing')} variant="outline">Back to Home</Button>
            </motion.div>
          )}

          {step === 'company-vision' && (
            <motion.div 
              key="company-vision"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 text-center"
            >
              <header className="space-y-4">
                <h2 className="text-5xl font-bold">Vision</h2>
                <p className="text-neon-cyan font-display uppercase tracking-widest">The Future of Career Wellness</p>
              </header>
              <div className="glass-panel p-12 border-neon-cyan/20">
                <p className="text-xl text-white/60">Placeholder for Sparkwavv's vision. Coming soon.</p>
              </div>
              <Button onClick={() => setStep('landing')} variant="outline">Back to Home</Button>
            </motion.div>
          )}

          {step === 'company-about' && (
            <motion.div 
              key="company-about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 text-center"
            >
              <header className="space-y-4">
                <h2 className="text-5xl font-bold">About Us</h2>
                <p className="text-neon-cyan font-display uppercase tracking-widest">The Team Behind the Engine</p>
              </header>
              <div className="glass-panel p-12 border-neon-cyan/20">
                <p className="text-xl text-white/60">Placeholder for the About Us page. Coming soon.</p>
              </div>
              <Button onClick={() => setStep('landing')} variant="outline">Back to Home</Button>
            </motion.div>
          )}

          {step === 'company-investors' && (
            <motion.div 
              key="company-investors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 text-center"
            >
              <header className="space-y-4">
                <h2 className="text-5xl font-bold">Investors</h2>
                <p className="text-neon-cyan font-display uppercase tracking-widest">Partnering for the Future</p>
              </header>
              <div className="glass-panel p-12 border-neon-cyan/20">
                <p className="text-xl text-white/60">Placeholder for Investor relations. Coming soon.</p>
              </div>
              <Button onClick={() => setStep('landing')} variant="outline">Back to Home</Button>
            </motion.div>
          )}

          {step === 'company-give' && (
            <motion.div 
              key="company-give"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 text-center"
            >
              <header className="space-y-4">
                <h2 className="text-5xl font-bold">Give a Little</h2>
                <p className="text-neon-cyan font-display uppercase tracking-widest">Our Social Impact</p>
              </header>
              <div className="glass-panel p-12 border-neon-cyan/20">
                <p className="text-xl text-white/60">Placeholder for our social impact and giving programs. Coming soon.</p>
              </div>
              <Button onClick={() => setStep('landing')} variant="outline">Back to Home</Button>
            </motion.div>
          )}

          {step === 'company-testimonials' && (
            <motion.div 
              key="company-testimonials"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 text-center"
            >
              <header className="space-y-4">
                <h2 className="text-5xl font-bold">Testimonials</h2>
                <p className="text-neon-cyan font-display uppercase tracking-widest">Success Stories</p>
              </header>
              <div className="glass-panel p-12 border-neon-cyan/20">
                <p className="text-xl text-white/60">Placeholder for user success stories and testimonials. Coming soon.</p>
              </div>
              <Button onClick={() => setStep('landing')} variant="outline">Back to Home</Button>
            </motion.div>
          )}

          {step === 'onboarding' && (
            <motion.div 
              key="onboarding"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <header className="space-y-4">
                <h2 className="text-4xl font-bold">Phase 0: Dive-In</h2>
                <p className="text-white/60">Let's Dive-In, and get started with building your Sparkwavv Profile</p>
              </header>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  {uploadedFileName && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-sm w-fit mx-auto">
                      <FileUp className="w-4 h-4" />
                      <span className="font-medium">{uploadedFileName}</span>
                    </div>
                  )}
                  <div className="glass-panel p-8 border-dashed border-2 border-white/10 hover:border-neon-cyan/40 transition-all group relative">
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      accept=".pdf,.doc,.docx,text/plain"
                      onChange={handleFileUpload}
                    />
                    <div className="flex flex-col items-center justify-center space-y-4 py-4">
                      {parsingResume ? (
                        <>
                          <Loader2 className="w-10 h-10 text-neon-cyan animate-spin" />
                          <p className="text-neon-cyan font-medium animate-pulse">Analyzing Resume...</p>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-cyan/10 transition-colors">
                            <Upload className="w-8 h-8 text-white/40 group-hover:text-neon-cyan transition-colors" />
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-medium">Upload Resume</p>
                            <p className="text-sm text-white/40">PDF, DOCX or TXT (Max 5MB)</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-4 text-white/20 text-xs uppercase tracking-widest">Or fill manually</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <div className="glass-panel p-8 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-white/40 uppercase tracking-wider">Full Name</label>
                    <span className={`text-[10px] ${userData.onboarding.name.length > 50 ? 'text-red-500' : 'text-white/20'}`}>
                      {userData.onboarding.name.length}/50
                    </span>
                  </div>
                  <input 
                    type="text" 
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 focus:outline-none transition-colors ${errors.name ? 'border-red-500' : 'border-white/10 focus:border-neon-cyan'}`}
                    placeholder="Alex Chen"
                    value={userData.onboarding.name}
                    onChange={(e) => setUserData({...userData, onboarding: {...userData.onboarding, name: e.target.value}})}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-white/40 uppercase tracking-wider">Email Address (Required)</label>
                    <Mail className="w-3 h-3 text-white/20" />
                  </div>
                  <input 
                    type="email" 
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 focus:outline-none transition-colors ${errors.email ? 'border-red-500' : 'border-white/10 focus:border-neon-cyan'}`}
                    placeholder="alex@example.com"
                    value={userData.onboarding.email || ''}
                    onChange={(e) => setUserData({...userData, onboarding: {...userData.onboarding, email: e.target.value}})}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-white/40 uppercase tracking-wider">Industry</label>
                    <Compass className="w-3 h-3 text-white/20" />
                  </div>
                  <select 
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 focus:outline-none transition-colors appearance-none ${errors.industry ? 'border-red-500' : 'border-white/10 focus:border-neon-cyan'}`}
                    value={userData.onboarding.industry}
                    onChange={(e) => setUserData({...userData, onboarding: {...userData.onboarding, industry: e.target.value}})}
                  >
                    <option value="" disabled className="bg-dark-bg text-white/40">Select your industry</option>
                    {INDUSTRIES.map(industry => (
                      <option key={industry} value={industry} className="bg-dark-bg text-white">{industry}</option>
                    ))}
                  </select>
                  {errors.industry && <p className="text-xs text-red-500 mt-1">{errors.industry}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-white/40 uppercase tracking-wider">Password (Min 6 characters)</label>
                    <Lock className="w-3 h-3 text-white/20" />
                  </div>
                  <input 
                    type="password" 
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 focus:outline-none transition-colors ${errors.password ? 'border-red-500' : 'border-white/10 focus:border-neon-cyan'}`}
                    placeholder="••••••••"
                    value={userData.onboarding.password || ''}
                    onChange={(e) => setUserData({...userData, onboarding: {...userData.onboarding, password: e.target.value}})}
                  />
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-white/40 uppercase tracking-wider">Current Role or Focus</label>
                    <span className={`text-[10px] ${userData.onboarding.role.length > 100 ? 'text-red-500' : 'text-white/20'}`}>
                      {userData.onboarding.role.length}/100
                    </span>
                  </div>
                  <input 
                    type="text" 
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 focus:outline-none transition-colors ${errors.role ? 'border-red-500' : 'border-white/10 focus:border-neon-cyan'}`}
                    placeholder="Junior Product Designer"
                    value={userData.onboarding.role}
                    onChange={(e) => setUserData({...userData, onboarding: {...userData.onboarding, role: e.target.value}})}
                  />
                  {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-white/40 uppercase tracking-wider">Brief Bio</label>
                    <span className={`text-[10px] ${userData.onboarding.bio.length > 500 ? 'text-red-500' : 'text-white/20'}`}>
                      {userData.onboarding.bio.length}/500
                    </span>
                  </div>
                  <textarea 
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 focus:outline-none transition-colors h-32 resize-none ${errors.bio ? 'border-red-500' : 'border-white/10 focus:border-neon-cyan'}`}
                    placeholder="Tell us about your journey so far..."
                    value={userData.onboarding.bio}
                    onChange={(e) => setUserData({...userData, onboarding: {...userData.onboarding, bio: e.target.value}})}
                  />
                  {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio}</p>}
                </div>
              </div>
            </div>
              
            <div className="flex flex-col gap-6">
              {registrationMessage && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-center font-bold"
                >
                  {registrationMessage}
                </motion.div>
              )}
              
              <div className="flex justify-end gap-4">
                {isConfirmed ? (
                  <Button onClick={nextStep}>
                    Continue to Module 1 <ChevronRight className="w-5 h-5" />
                  </Button>
                ) : !registrationMessage && (
                  <Button onClick={handleRegister} loading={isRegistering}>
                    Register for Dive-In <ArrowRight className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
            </motion.div>
          )}

          {step === 'module1' && (
            <motion.div 
              key="module1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <header className="space-y-4">
                <div className="flex items-center gap-3 text-neon-magenta">
                  <Trophy className="w-6 h-6" />
                  <span className="font-display font-bold uppercase tracking-widest">Module 1</span>
                </div>
                <h2 className="text-4xl font-bold">Accomplishment Stories</h2>
                <p className="text-white/60">List 3 key accomplishments that made you feel proud or energized. These are the seeds of your brand.</p>
              </header>

              <div className="space-y-6">
                {errors.accomplishments && <p className="text-sm text-red-500 text-center">{errors.accomplishments}</p>}
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="glass-panel p-6 flex flex-col gap-4 relative">
                      <div className="flex gap-4 items-center">
                        <span className="text-2xl font-display font-bold text-white/20">0{i+1}</span>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] uppercase tracking-widest text-white/40">Title</label>
                            <span className={`text-[8px] ${(userData.accomplishments[i]?.title?.length || 0) > 100 ? 'text-red-500' : 'text-white/20'}`}>
                              {(userData.accomplishments[i]?.title?.length || 0)}/100
                            </span>
                          </div>
                          <input 
                            type="text"
                            className={`w-full bg-white/5 border rounded-lg px-4 py-2 text-lg focus:outline-none transition-all ${errors[`acc_title_${i}`] ? 'border-red-500 text-red-500' : 'border-white/10 focus:border-neon-magenta'}`}
                            placeholder="What did you achieve?"
                            value={userData.accomplishments[i]?.title || ''}
                            onChange={(e) => {
                              const newAcc = [...userData.accomplishments];
                              newAcc[i] = { ...newAcc[i], title: e.target.value };
                              setUserData({...userData, accomplishments: newAcc});
                            }}
                          />
                          {errors[`acc_title_${i}`] && <p className="text-[10px] text-red-500">{errors[`acc_title_${i}`]}</p>}
                        </div>
                      </div>

                      <div className="space-y-1 pl-12">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase tracking-widest text-white/40">Description</label>
                          <span className={`text-[8px] ${(userData.accomplishments[i]?.description?.length || 0) > 300 ? 'text-red-500' : 'text-white/20'}`}>
                            {(userData.accomplishments[i]?.description?.length || 0)}/300
                          </span>
                        </div>
                        <textarea 
                          className={`w-full bg-white/5 border rounded-lg px-4 py-2 text-sm focus:outline-none transition-all h-24 resize-none ${errors[`acc_desc_${i}`] ? 'border-red-500 text-red-500' : 'border-white/10 focus:border-neon-magenta'}`}
                          placeholder="How did you do it? What was the impact?"
                          value={userData.accomplishments[i]?.description || ''}
                          onChange={(e) => {
                            const newAcc = [...userData.accomplishments];
                            newAcc[i] = { ...newAcc[i], description: e.target.value };
                            setUserData({...userData, accomplishments: newAcc});
                          }}
                        />
                        {errors[`acc_desc_${i}`] && <p className="text-[10px] text-red-500">{errors[`acc_desc_${i}`]}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <Button onClick={() => setStep('onboarding')} variant="secondary">Back</Button>
                <Button onClick={nextStep}>
                  Next: Environment <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'module2' && (
            <motion.div 
              key="module2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <header className="space-y-4">
                <div className="flex items-center gap-3 text-neon-lime">
                  <Compass className="w-6 h-6" />
                  <span className="font-display font-bold uppercase tracking-widest">Module 2</span>
                </div>
                <h2 className="text-4xl font-bold">Perfect Day & Extinguishers</h2>
                <p className="text-white/60">Define your ideal environment and the "deal-breakers" that kill your energy.</p>
              </header>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="glass-panel p-8 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Zap className="w-5 h-5 text-neon-lime" />
                      The Perfect Day
                    </h3>
                    <span className={`text-[10px] ${userData.environment.perfectDay.length > 1000 ? 'text-red-500' : 'text-white/20'}`}>
                      {userData.environment.perfectDay.length}/1000
                    </span>
                  </div>
                  <textarea 
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 focus:outline-none transition-colors h-48 resize-none ${errors.perfectDay ? 'border-red-500' : 'border-white/10 focus:border-neon-lime'}`}
                    placeholder="Describe your ideal workday flow..."
                    value={userData.environment.perfectDay}
                    onChange={(e) => setUserData({...userData, environment: {...userData.environment, perfectDay: e.target.value}})}
                  />
                  {errors.perfectDay && <p className="text-xs text-red-500">{errors.perfectDay}</p>}
                </div>

                <div className="glass-panel p-8 space-y-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                    The Extinguishers
                  </h3>
                  <div className="space-y-3">
                    {['Micromanagement', 'Lack of Purpose', 'Isolation', 'Rigid Hierarchy', 'No Growth'].map(ext => (
                      <button 
                        key={ext}
                        onClick={() => {
                          const current = userData.environment.extinguishers;
                          const next = current.includes(ext) ? current.filter(e => e !== ext) : [...current, ext];
                          setUserData({...userData, environment: {...userData.environment, extinguishers: next}});
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                          userData.environment.extinguishers.includes(ext)
                            ? 'bg-red-500/10 border-red-500 text-red-500'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                        }`}
                      >
                        {ext}
                      </button>
                    ))}
                  </div>
                  {errors.extinguishers && <p className="text-xs text-red-500">{errors.extinguishers}</p>}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button onClick={() => setStep('module1')} variant="secondary">Back</Button>
                <Button onClick={nextStep}>
                  Next: Passions <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'module3' && (
            <motion.div 
              key="module3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <header className="space-y-4">
                <div className="flex items-center gap-3 text-neon-cyan">
                  <Heart className="w-6 h-6" />
                  <span className="font-display font-bold uppercase tracking-widest">Module 3</span>
                </div>
                <h2 className="text-4xl font-bold">Passions & Best-When</h2>
                <p className="text-white/60">What energizes you? Under what conditions do you perform at your absolute best?</p>
              </header>

              <div className="glass-panel p-8 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white/40 uppercase tracking-widest">Energizers</h3>
                  <div className="flex flex-wrap gap-3">
                    {['Solving Puzzles', 'Helping Others', 'Building Systems', 'Storytelling', 'Analyzing Data', 'Leading Teams', 'Creating Art', 'Researching'].map(item => (
                      <button 
                        key={item}
                        onClick={() => {
                          const current = userData.passions.energizers;
                          const next = current.includes(item) ? current.filter(e => e !== item) : [...current, item];
                          setUserData({...userData, passions: {...userData.passions, energizers: next}});
                        }}
                        className={`px-4 py-2 rounded-full border transition-all ${
                          userData.passions.energizers.includes(item)
                            ? 'bg-neon-cyan/10 border-neon-cyan text-neon-cyan'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  {errors.energizers && <p className="text-xs text-red-500">{errors.energizers}</p>}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-white/40 uppercase tracking-widest">I am best when...</h3>
                    <span className={`text-[10px] ${userData.passions.bestWhen.length > 500 ? 'text-red-500' : 'text-white/20'}`}>
                      {userData.passions.bestWhen.length}/500
                    </span>
                  </div>
                  <textarea 
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 focus:outline-none transition-colors h-32 resize-none ${errors.bestWhen ? 'border-red-500' : 'border-white/10 focus:border-neon-cyan'}`}
                    placeholder="e.g., I have a clear goal but total freedom on how to reach it..."
                    value={userData.passions.bestWhen}
                    onChange={(e) => setUserData({...userData, passions: {...userData.passions, bestWhen: e.target.value}})}
                  />
                  {errors.bestWhen && <p className="text-xs text-red-500">{errors.bestWhen}</p>}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button onClick={() => setStep('module2')} variant="secondary">Back</Button>
                <Button onClick={nextStep}>
                  Next: Brand DNA <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'module4' && (
            <motion.div 
              key="module4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <header className="space-y-4">
                <div className="flex items-center gap-3 text-neon-magenta">
                  <Fingerprint className="w-6 h-6" />
                  <span className="font-display font-bold uppercase tracking-widest">Module 4</span>
                </div>
                <h2 className="text-4xl font-bold">The Attributes Game</h2>
                <p className="text-white/60">Select the attributes that form your Brand DNA. Choose 3-5 that define you.</p>
              </header>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {['Creator', 'Builder', 'Analyst', 'Strategist', 'Connector', 'Mentor', 'Disruptor', 'Optimizer', 'Visionary', 'Pragmatist', 'Catalyst', 'Guardian'].map(attr => (
                  <button 
                    key={attr}
                    onClick={() => {
                      const current = userData.attributes;
                      const next = current.includes(attr) ? current.filter(a => a !== attr) : [...current, attr];
                      setUserData({...userData, attributes: next});
                    }}
                    className={`p-6 rounded-2xl border transition-all text-center space-y-2 ${
                      userData.attributes.includes(attr)
                        ? 'bg-neon-magenta/10 border-neon-magenta text-neon-magenta neon-border-magenta'
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xl font-display font-bold">{attr}</div>
                  </button>
                ))}
              </div>
              {errors.attributes && <p className="text-sm text-red-500 text-center">{errors.attributes}</p>}

              <div className="flex justify-between items-center">
                <Button onClick={() => setStep('module3')} variant="secondary">Back</Button>
                <Button onClick={nextStep}>
                  Next: Movie Poster <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'module5' && (
            <motion.div 
              key="module5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <header className="space-y-4">
                <div className="flex items-center gap-3 text-neon-cyan">
                  <Film className="w-6 h-6" />
                  <span className="font-display font-bold uppercase tracking-widest">Module 5</span>
                </div>
                <h2 className="text-4xl font-bold">Season 1: The Movie Poster</h2>
                <p className="text-white/60">Your career is a story. What is the tagline for this season of your professional life?</p>
              </header>

              <div className="relative aspect-[2/3] max-w-sm mx-auto glass-panel overflow-hidden group">
                <img 
                  src="https://picsum.photos/seed/sparkwavv/800/1200?blur=2" 
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
                  alt="Poster Background"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent" />
                
                <div className="absolute inset-0 p-8 flex flex-col justify-end items-center text-center space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-display uppercase tracking-[0.3em] text-neon-cyan">A Sparkwavv Original</p>
                    <h3 className="text-4xl font-display font-bold tracking-tighter uppercase">{userData.onboarding.name}</h3>
                  </div>
                  
                  <div className="w-full space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">The Tagline</label>
                      <span className={`text-[8px] ${userData.tagline.length > 100 ? 'text-red-500' : 'text-white/20'}`}>
                        {userData.tagline.length}/100
                      </span>
                    </div>
                    <input 
                      type="text"
                      className={`w-full bg-white/10 backdrop-blur-md border rounded-lg px-4 py-3 text-center text-sm focus:outline-none transition-all ${errors.tagline ? 'border-red-500' : 'border-white/20 focus:border-neon-cyan'}`}
                      placeholder="e.g., Building the future, one pixel at a time."
                      value={userData.tagline}
                      onChange={(e) => setUserData({...userData, tagline: e.target.value})}
                    />
                    {errors.tagline && <p className="text-[10px] text-red-500">{errors.tagline}</p>}
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    {userData.attributes.slice(0, 3).map(a => (
                      <span key={a} className="text-[10px] uppercase tracking-widest px-2 py-1 border border-white/20 rounded bg-white/5">{a}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button onClick={() => setStep('module4')} variant="secondary">Back</Button>
                <Button onClick={nextStep} variant="neon" className="px-12">
                  Generate Discovery Summary <Zap className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center space-y-8 py-20"
            >
              <div className="relative">
                <div className="w-24 h-24 border-4 border-neon-cyan/20 rounded-full animate-pulse" />
                <Loader2 className="w-12 h-12 text-neon-cyan animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold animate-pulse-neon">Synthesizing Your Brand DNA</h2>
                <p className="text-white/40">Our AI is distilling your stories into a high-impact professional identity...</p>
              </div>
            </motion.div>
          )}

          {step === 'results' && summary && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-12"
            >
              <header className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Discovery Summary Complete</span>
                </div>
                <h2 className="text-5xl font-bold">Your Professional Identity</h2>
              </header>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                  <section className="glass-panel p-8 space-y-4">
                    <h3 className="text-sm font-display uppercase tracking-widest text-neon-cyan">Brand Portrait</h3>
                    <p className="text-2xl font-medium leading-relaxed italic">"{summary.brandPortrait}"</p>
                  </section>

                  <div className="grid sm:grid-cols-2 gap-8">
                    <section className="glass-panel p-8 space-y-4">
                      <h3 className="text-sm font-display uppercase tracking-widest text-neon-magenta">Core Strengths</h3>
                      <ul className="space-y-3">
                        {summary.strengths.map((s: string, i: number) => (
                          <li key={i} className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-neon-magenta" />
                            <span className="text-white/80">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section className="glass-panel p-8 space-y-4">
                      <h3 className="text-sm font-display uppercase tracking-widest text-neon-lime">Career Clusters</h3>
                      <ul className="space-y-3">
                        {summary.careerClusters.map((c: string, i: number) => (
                          <li key={i} className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-neon-lime" />
                            <span className="text-white/80">{c}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                </div>

                <div className="space-y-8">
                  <section className="glass-panel p-8 space-y-6 border-neon-cyan/20">
                    <h3 className="text-sm font-display uppercase tracking-widest text-neon-cyan flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Next Experiments
                    </h3>
                    <div className="space-y-4">
                      {summary.nextExperiments.map((e: string, i: number) => (
                        <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-neon-cyan/40 transition-colors cursor-pointer group">
                          <p className="text-sm text-white/80 group-hover:text-white transition-colors">{e}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                  
                  <Button onClick={() => window.print()} variant="outline" className="w-full">
                    Download Full Report
                  </Button>
                </div>
              </div>

              <section className="glass-panel p-8 space-y-8">
                <div className="flex items-center gap-3">
                  <Rocket className="w-6 h-6 text-neon-cyan" />
                  <h3 className="text-2xl font-bold">Actionable Next Steps</h3>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {summary.nextSteps.map((step: any, i: number) => (
                    <div key={i} className="flex flex-col p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-neon-cyan/40 transition-all hover:translate-y-[-4px] group">
                      <h4 className="text-lg font-bold text-white group-hover:text-neon-cyan transition-colors mb-2">{step.title}</h4>
                      <p className="text-sm text-white/60 leading-relaxed mb-6 flex-grow">{step.description}</p>
                      <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neon-cyan hover:text-white transition-colors">
                        {step.actionLabel}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <footer className="text-center pt-12">
                <Button onClick={() => {
                  localStorage.removeItem('sparkwavv_user_data');
                  localStorage.removeItem('sparkwavv_current_step');
                  localStorage.removeItem('sparkwavv_summary');
                  setStep('landing');
                }} variant="secondary">
                  Start New Ignition
                </Button>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer onNavigate={(s) => setStep(s as Step)} />
    </div>
  </div>
);
}

const UserDashboardWrapper = () => {
  const { userId } = useParams<{ userId: string }>();
  return <UserDashboard userId={userId || 'default'} />;
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/admin/check');
        const data = await response.json();
        setIsAdmin(data.isAdmin);
      } catch (error) {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  if (isAdmin === null) return null;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<SparkwavvApp />} />
        <Route 
          path="/sparkwavv-admin" 
          element={
            isAdmin ? (
              <AdminDashboard onLogout={() => setIsAdmin(false)} />
            ) : (
              <AdminLogin onLogin={() => setIsAdmin(true)} />
            )
          } 
        />
        <Route path="/dashboard/:userId" element={<UserDashboardWrapper />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
