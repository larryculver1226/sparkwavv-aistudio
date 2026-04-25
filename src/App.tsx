import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Rocket,
  Target,
  Zap,
  ShieldAlert,
  ShieldCheck,
  Heart,
  Fingerprint,
  Film,
  ArrowRight,
  ChevronRight,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Trophy,
  Compass,
  Lightbulb,
  Cpu,
  Globe,
  Activity,
  FileUp,
  Upload,
  ExternalLink,
  Mail,
  Image as ImageIcon,
  Camera,
  Settings,
  Lock,
  Database,
  HardDrive,
  Users,
  Award,
  TrendingUp,
  BarChart3,
  Briefcase,
  Quote,
  Star,
} from 'lucide-react';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, isFirebaseConfigured, db } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';
import { ROLES } from './constants';
import { IdentityProvider, useIdentity } from './contexts/IdentityContext';
import { SkylarConfigProvider } from './contexts/SkylarConfigContext';
import { AccessDenied } from './components/AccessDenied';

// Lazy load page components to improve initial load time
const OperationsDashboard = lazy(() =>
  import('./pages/OperationsDashboard').then((m) => ({ default: m.OperationsDashboard }))
);
const AdminLogin = lazy(() =>
  import('./pages/AdminLogin').then((m) => ({ default: m.AdminLogin }))
);
const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() =>
  import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const UserDashboard = lazy(() =>
  import('./pages/UserDashboard').then((m) => ({ default: m.UserDashboard }))
);
const PartnerDashboard = lazy(() =>
  import('./pages/PartnerDashboard').then((m) => ({ default: m.PartnerDashboard }))
);
const PartnerLogin = lazy(() =>
  import('./components/PartnerLogin').then((m) => ({ default: m.PartnerLogin }))
);
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const CookieSettings = lazy(() => import('./pages/CookieSettings'));
const IgnitionPage = lazy(() =>
  import('./pages/IgnitionPage').then((m) => ({ default: m.IgnitionPage }))
);
const WavvaultPage = lazy(() =>
  import('./pages/WavvaultPage').then((m) => ({ default: m.WavvaultPage }))
);
const AcceptInvitation = lazy(() =>
  import('./pages/AcceptInvitation').then((m) => ({ default: m.AcceptInvitation }))
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const CommunityPage = lazy(() =>
  import('./pages/CommunityPage').then((m) => ({ default: m.CommunityPage }))
);
const CinematicSynthesis = lazy(() =>
  import('./components/synthesis/CinematicSynthesis').then((m) => ({
    default: m.CinematicSynthesis,
  }))
);
const PublicBrandPage = lazy(() =>
  import('./components/sharing/PublicBrandPage').then((m) => ({ default: m.PublicBrandPage }))
);
const DiveInPage = lazy(() => import('./pages/DiveInPage'));

import ShareView from './pages/ShareView';
import {
  generateDiscoverySummary,
  parseResume,
  generateBrandImage,
  UserData,
} from './services/geminiService';
import { NavBar } from './components/NavBar';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Documentation } from './components/Documentation';
import { HelpCenter } from './components/HelpCenter';

import { Button } from './components/Button';
import OnboardingGate from './components/OnboardingGate';
import { SkylarSidebar } from './components/skylar/SkylarSidebar';
import { EveningSpark } from './components/skylar/EveningSpark';
import { DashboardData } from './types/dashboard';
import { SkylarIntro, SkylarAvatar, SkylarScrollingText } from './components/landing/SkylarIntro';
import { QuickScan } from './components/landing/QuickScan';
import { BrainModel } from './components/landing/BrainModel';
import { Roadmap } from './components/landing/Roadmap';
import { PricingPlaceholder } from './components/PricingPlaceholder';
import { TimeoutManager } from './components/TimeoutManager';
import { PrecisionMatchingCard } from './components/landing/PrecisionMatchingCard';
import { authService } from './services/authService';
import { OnboardingContainer } from './containers/OnboardingContainer';

type Step =
  | 'landing'
  | 'login'
  | 'onboarding'
  | 'ignition'
  | 'settings'
  | 'module1'
  | 'module2'
  | 'module3'
  | 'module4'
  | 'module5'
  | 'processing'
  | 'synthesis'
  | 'results'
  | 'product-skylar'
  | 'product-features'
  | 'product-technology'
  | 'product-wavvault'
  | 'company-vision'
  | 'company-about'
  | 'company-investors'
  | 'company-give'
  | 'pricing'
  | 'documentation'
  | 'help-center';

// --- Constants ---
const INDUSTRIES = [
  'Aerospace',
  'Automotive',
  'Construction',
  'Defense',
  'Education',
  'Energy',
  'Finance',
  'Government',
  'Healthcare',
  'Hospitality',
  'Legal',
  'Logistics',
  'Manufacturing',
  'Media & Entertainment',
  'Real Estate',
  'Retail',
  'Skilled Trades',
  'Technology',
  'Transportation',
];

const ProtectedRoute = ({
  user,
  children,
  onRedirect,
}: {
  user: any;
  children: React.ReactNode;
  onRedirect: () => void;
}) => {
  useEffect(() => {
    if (!user) {
      onRedirect();
    }
  }, [user, onRedirect]);

  if (!user) return null;
  return <>{children}</>;
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

const ProgressRail = ({ step }: { step: Step }) => {
  const steps: Step[] = [
    'onboarding',
    'module1',
    'module2',
    'module3',
    'module4',
    'module5',
    'processing',
    'results',
  ];
  const currentIndex = steps.indexOf(step);
  if (currentIndex === -1 || step === 'landing' || step === 'login' || step === 'results')
    return null;

  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-50 bg-white/5">
      <motion.div
        className="h-full bg-neon-cyan progress-rail-glow"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
      />
    </div>
  );
};

const InspirationTooltip = ({ content }: { content: string }) => (
  <div className="group relative inline-block ml-2">
    <Lightbulb className="w-4 h-4 text-neon-cyan cursor-help opacity-50 group-hover:opacity-100 transition-opacity" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-dark-surface border border-neon-cyan/20 rounded-xl text-xs text-white/80 opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-y-2 group-hover:translate-y-0 z-50 shadow-2xl">
      <div className="font-bold text-neon-cyan mb-1">Skylar's Tip:</div>
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-dark-surface" />
    </div>
  </div>
);

const ValidationFeedback = ({ value, maxLength }: { value: string; maxLength: number }) => {
  const length = value.trim().length;
  if (length === 0) return null;

  let feedback = '';
  let colorClass = 'text-white/40';

  if (length < maxLength * 0.2) {
    feedback = 'Good start! Add more detail for a better DNA synthesis.';
  } else if (length < maxLength * 0.5) {
    feedback = 'Great detail! Skylar is getting a clear picture.';
  } else if (length < maxLength * 0.9) {
    feedback = 'Excellent! This is a high-impact story.';
  } else {
    feedback = 'Perfect! Very comprehensive.';
    colorClass = 'text-neon-cyan';
  }

  return (
    <div className={`text-[10px] italic ${colorClass} transition-all duration-500 mt-1`}>
      {feedback}
    </div>
  );
};

const Toast = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={`fixed bottom-8 right-8 px-6 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-3 border ${
        type === 'success'
          ? 'bg-neon-lime/20 border-neon-lime/50 text-neon-lime'
          : 'bg-neon-magenta/20 border-neon-magenta/50 text-neon-magenta'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5" />
      ) : (
        <ShieldAlert className="w-5 h-5" />
      )}
      <span className="text-sm font-medium">{message}</span>
    </motion.div>
  );
};

const LoginRedirect: React.FC<{ login: () => void }> = ({ login }) => {
  useEffect(() => {
    login();
  }, [login]);
  return null;
};

export function SPARKWavvApp({
  isAdmin = false,
  initialStep,
}: {
  isAdmin?: boolean;
  initialStep?: Step;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    role,
    status,
    isAdmin: isIdentityAdmin,
    user,
    profile,
    emailVerified,
    onboardingComplete,
    refreshProfile,
    logout,
    login,
    loginWithPopup,
    signUpWithEmail,
    updateProfile: updateIdentityProfile,
  } = useIdentity();
  const authStatus = status;
  const authLoading = status === 'initializing';

  useEffect(() => {
    console.log('🚀 [SPARKWavvApp] Render:', {
      isAdmin,
      isIdentityAdmin,
      initialStep,
      role,
      status,
      path: location.pathname,
    });
  }, [isAdmin, isIdentityAdmin, initialStep, role, status, location.pathname]);
  const [step, setStep] = useState<Step>(() => {
    if (initialStep) return initialStep;
    const saved = localStorage.getItem('sparkwavv_step');
    return (saved as Step) || 'landing';
  });
  const [posterVibe, setPosterVibe] = useState<
    'Minimalist' | 'Brutalist' | 'Corporate' | 'Creative'
  >('Creative');
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  );
  const [userData, setUserData] = useState<UserData>({
    onboarding: {
      firstName: '',
      lastName: '',
      jobTitle: '',
      companyOrg: '',
      email: '',
      phone: '',
      programTrack: '',
      lifecycleStage: '',
      outcomesAttributes: '',
      feedbackQuote: '',
      userId: '',
      password: '',
      name: '',
      role: '',
      bio: '',
      industry: '',
    },
    accomplishments: [
      { title: '', description: '' },
      { title: '', description: '' },
      { title: '', description: '' },
    ],
    environment: { perfectDay: '', extinguishers: [] },
    passions: { energizers: [], bestWhen: '' },
    attributes: [],
    tagline: '',
  });
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [parsingResume, setParsingResume] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [discoveryUnlocked, setDiscoveryUnlocked] = useState(() => {
    return localStorage.getItem('sparkwavv_discovery_unlocked') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sparkwavv_discovery_unlocked', discoveryUnlocked.toString());
    (window as any).DISCOVERY_UNLOCKED = discoveryUnlocked;
    // Dispatch event to notify components
    window.dispatchEvent(
      new CustomEvent('discovery-status-changed', { detail: { unlocked: discoveryUnlocked } })
    );
  }, [discoveryUnlocked]);
  const [showSkylarIntro, setShowSkylarIntro] = useState(true);
  const [showStartOverConfirm, setShowStartOverConfirm] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // Auto-redirect to dashboard or ignition when ready
  useEffect(() => {
    if (authStatus === 'ready' && profile) {
      // Don't redirect if we are on an informational page that should be public/accessible
      const informationalSteps = [
        'product-skylar',
        'product-features',
        'product-technology',
        'product-wavvault',
        'company-vision',
        'company-about',
        'company-investors',
        'company-give',
        'pricing',
        'documentation',
        'help-center',
        'settings',
      ];

      if (informationalSteps.includes(step)) return;

      if (
        isIdentityAdmin ||
        role === 'admin' ||
        role === 'super_admin' ||
        role === 'editor' ||
        role === 'mentor'
      ) {
        if (
          location.pathname !== '/sparkwavv-admin' &&
          location.pathname !== '/admin' &&
          location.pathname !== '/operations'
        ) {
          console.log(
            '🛡️ Admin detected in SPARKWavvApp, redirecting to admin portal. Role:',
            role
          );
          navigate('/sparkwavv-admin');
        }
        return;
      }

      // Fallback for new users without a profile yet
      if (!profile && status === 'ready' && user) {
        if (step === 'landing' || step === 'onboarding') {
          console.log('🌱 New user detected, staying on onboarding flow');
          setStep('onboarding');
          return;
        }
      }

      // If email is verified but onboarding/ignition is not complete, go to ignition
      if (emailVerified && !profile.onboardingComplete && step !== 'ignition') {
        console.log('🔥 Email verified, redirecting to Ignition flow');
        setStep('ignition');
        return;
      }

      if (profile.onboardingComplete) {
        const dashboardPath = `/dashboard/${profile.uid}`;
        if (location.pathname !== dashboardPath && !location.pathname.startsWith('/dashboard/')) {
          console.log('🚀 Auth ready, redirecting to dashboard:', profile.uid);
          navigate(dashboardPath);
        }
      }
    }
  }, [authStatus, profile, emailVerified, navigate, location.pathname, step]);

  // OAuth Message Listener (Removed LinkedIn direct OAuth as Identity Platform handles it)
  useEffect(() => {
    // Identity Platform handles social logins automatically
  }, []);

  useEffect(() => {
    if (user && profile) {
      setUserId(profile.uid);

      const fetchDashboard = async () => {
        try {
          const idToken = await user.getIdToken();
          const dashResponse = await fetch('/api/user/dashboard', {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          const dashData = await dashResponse.json();
          setDashboardData(dashData);
        } catch (error) {
          console.error('Error fetching dashboard:', error);
        }
      };
      fetchDashboard();
    } else {
      setUserId(null);
      setDashboardData(null);
    }
  }, [user, profile]);

  useEffect(() => {
    // Clear notifications/popups on mount for all users
    setErrors({});
  }, []);

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

  // Load progress on mount removed as per user request to remove Resume Journey button

  const startOver = () => {
    localStorage.removeItem('sparkwavv_user_data');
    localStorage.removeItem('sparkwavv_current_step');
    localStorage.removeItem('sparkwavv_summary');
    setUserData({
      onboarding: {
        firstName: '',
        lastName: '',
        jobTitle: '',
        companyOrg: '',
        email: '',
        phone: '',
        programTrack: '',
        lifecycleStage: '',
        outcomesAttributes: '',
        feedbackQuote: '',
        userId: '',
        password: '',
        name: '',
        role: '',
        bio: '',
        industry: '',
      },
      accomplishments: [
        { title: '', description: '' },
        { title: '', description: '' },
        { title: '', description: '' },
      ],
      environment: { perfectDay: '', extinguishers: [] },
      passions: { energizers: [], bestWhen: '' },
      attributes: [],
      tagline: '',
    });
    setSummary(null);
    setStep('onboarding');
  };

  // Save progress whenever state changes
  useEffect(() => {
    const steps: Step[] = [
      'landing',
      'onboarding',
      'module1',
      'module2',
      'module3',
      'module4',
      'module5',
      'processing',
      'results',
    ];
    const currentIndex = steps.indexOf(step);

    if (currentIndex > 1 && !emailVerified && process.env.NODE_ENV !== 'development') {
      setStep('landing');
      setErrors({ general: 'Please confirm your registration via email before continuing.' });
    }

    if (step !== 'landing' && step !== 'processing' && step !== 'results') {
      // Only save if we have some data or we are past onboarding
      const hasData = userData.onboarding.name || userData.onboarding.email || uploadedFileName;
      if (hasData || currentIndex > 1) {
        localStorage.setItem('sparkwavv_user_data', JSON.stringify(userData));
        localStorage.setItem('sparkwavv_current_step', step);

        // Sync to Firestore if logged in and profile is ready
        if (user && db && profile) {
          const syncProgress = async () => {
            try {
              // Only sync if we have a valid user document with required fields
              if (profile.role && profile.tenantId) {
                await setDoc(
                  doc(db, 'users', user.uid),
                  {
                    userData,
                    currentStep: step,
                    emailVerified: user.emailVerified,
                    updatedAt: serverTimestamp(),
                  },
                  { merge: true }
                );
              }
            } catch (e) {
              console.error('Error syncing to Firestore:', e);
            }
          };
          syncProgress();
        }
      }
    }
    if (step === 'results' && summary) {
      localStorage.setItem('sparkwavv_summary', JSON.stringify(summary));

      // Sync results to Firestore if profile is ready
      if (user && db && profile) {
        const syncResults = async () => {
          try {
            if (profile.role && profile.tenantId) {
              await setDoc(
                doc(db, 'users', user.uid),
                {
                  summary,
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              );
            }
          } catch (e) {
            console.error('Error syncing results to Firestore:', e);
          }
        };
        syncResults();
      }
    }
  }, [userData, step, summary, uploadedFileName, emailVerified, user, db, profile]);

  const validateOnboarding = () => {
    const newErrors: Record<string, string> = {};
    const isResumeUploaded = !!uploadedFileName;

    if (!userData.onboarding.email.trim()) newErrors.email = 'Email is required';
    if (!userData.onboarding.firstName.trim()) newErrors.firstName = 'First Name is required';
    if (!userData.onboarding.lastName.trim()) newErrors.lastName = 'Last Name is required';
    if (!userData.onboarding.jobTitle.trim()) newErrors.jobTitle = 'Job Title is required';
    if (!userData.onboarding.companyOrg.trim()) newErrors.companyOrg = 'Company/Org is required';
    if (!userData.onboarding.phone.trim()) newErrors.phone = 'Phone is required';
    if (!userData.onboarding.programTrack.trim())
      newErrors.programTrack = 'Program/Track is required';
    if (!userData.onboarding.lifecycleStage.trim())
      newErrors.lifecycleStage = 'Lifecycle Stage is required';

    if (
      userData.onboarding.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.onboarding.email)
    ) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!userData.onboarding.password || userData.onboarding.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSocialLogin = async (provider: 'google' | 'linkedin') => {
    await loginWithPopup();
  };

  const validateModule1 = () => {
    const newErrors: Record<string, string> = {};
    const filledAcc = userData.accomplishments.filter(
      (a) => a.title.trim().length > 0 || a.description.trim().length > 0
    );
    if (filledAcc.length < 2)
      newErrors.accomplishments = 'Please provide at least 2 accomplishments';

    userData.accomplishments.forEach((acc, i) => {
      if (acc.title.length > 100) newErrors[`acc_title_${i}`] = 'Title is too long (max 100 chars)';
      if (acc.description.length > 300)
        newErrors[`acc_desc_${i}`] = 'Description is too long (max 300 chars)';

      // If one is filled, the other should be too
      if (acc.title.trim() && !acc.description.trim())
        newErrors[`acc_desc_${i}`] = 'Description is required for this accomplishment';
      if (!acc.title.trim() && acc.description.trim())
        newErrors[`acc_title_${i}`] = 'Title is required for this accomplishment';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateModule2 = () => {
    const newErrors: Record<string, string> = {};
    if (!userData.environment.perfectDay.trim())
      newErrors.perfectDay = 'Perfect day description is required';
    else if (userData.environment.perfectDay.length > 1000)
      newErrors.perfectDay = 'Description is too long (max 1000 chars)';

    if (userData.environment.extinguishers.length === 0)
      newErrors.extinguishers = 'Please select at least one extinguisher';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateModule3 = () => {
    const newErrors: Record<string, string> = {};
    if (userData.passions.energizers.length === 0)
      newErrors.energizers = 'Please select at least one energizer';

    if (!userData.passions.bestWhen.trim()) newErrors.bestWhen = 'This field is required';
    else if (userData.passions.bestWhen.length > 500)
      newErrors.bestWhen = 'Description is too long (max 500 chars)';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateModule4 = () => {
    const newErrors: Record<string, string> = {};
    if (userData.attributes.length < 3)
      newErrors.attributes = 'Please select at least 3 attributes';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateModule5 = () => {
    const newErrors: Record<string, string> = {};
    if (!userData.tagline.trim()) newErrors.tagline = 'Tagline is required';
    else if (userData.tagline.length > 100)
      newErrors.tagline = 'Tagline is too long (max 100 chars)';

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

        // Upload as artifact for storage tracking
        try {
          const artifactRes = await fetch('/api/wavvault/artifact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userData.onboarding.userId || 'anonymous',
              type: 'resume',
              content: base64,
              metadata: { fileName: file.name, mimeType: file.type },
            }),
          });

          if (!artifactRes.ok) {
            const err = await artifactRes.json();
            if (err.error === 'bucket_quota_exceeded') {
              alert('Storage quota exceeded. Please contact an administrator.');
              setParsingResume(false);
              return;
            }
          }
        } catch (err) {
          console.error('Failed to store artifact:', err);
        }

        const result = await parseResume(base64, file.type);
        if (result) {
          setUserData((prev) => ({
            ...prev,
            onboarding: {
              ...prev.onboarding,
              firstName: result.name?.split(' ')[0] || prev.onboarding.firstName,
              lastName: result.name?.split(' ').slice(1).join(' ') || prev.onboarding.lastName,
              jobTitle: result.role || prev.onboarding.jobTitle,
              email: result.email || prev.onboarding.email,
              bio: result.bio || prev.onboarding.bio,
              industry: result.industry || prev.onboarding.industry,
              name: result.name || prev.onboarding.name,
              role: result.role || prev.onboarding.role,
            },
            accomplishments:
              result.accomplishments && result.accomplishments.length > 0
                ? result.accomplishments
                    .slice(0, 3)
                    .concat(
                      Array(Math.max(0, 3 - result.accomplishments.length)).fill({
                        title: '',
                        description: '',
                      })
                    )
                : prev.accomplishments,
            passions: {
              ...prev.passions,
              energizers:
                result.skills && result.skills.length > 0
                  ? result.skills
                  : prev.passions.energizers,
            },
            attributes:
              result.attributes && result.attributes.length > 0
                ? result.attributes
                : prev.attributes,
          }));
        }
        setParsingResume(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      setParsingResume(false);
    }
  };

  const nextStep = () => {
    const steps: Step[] = [
      'landing',
      'onboarding',
      'module1',
      'module2',
      'module3',
      'module4',
      'module5',
      'processing',
      'results',
    ];
    const currentIndex = steps.indexOf(step);

    let isValid = true;
    if (step === 'onboarding') {
      if (!user) {
        login();
        return;
      }
      isValid = validateOnboarding();
    } else if (step === 'module1') isValid = validateModule1();
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

        // Generate Summary
        const result = await generateDiscoverySummary(userData);

        // Generate Brand Image (Movie Poster)
        const posterPrompt = `A high-end, cinematic professional movie poster for a person named ${userData.onboarding.name}. 
          Vibe: ${posterVibe}. 
          Tagline: ${userData.tagline}. 
          Attributes: ${userData.attributes.join(', ')}. 
          The style should be modern, professional, and visually striking.`;

        try {
          const brandImage = await generateBrandImage(posterPrompt);
          if (brandImage) {
            setUserData((prev) => ({ ...prev, brandImage }));
          }
        } catch (e) {
          console.error('Error generating brand image:', e);
        }

        if (!result) {
          console.warn('Using fallback summary due to API error');
          setSummary({
            brandPortrait:
              'A visionary leader transforming the career landscape through AI and human-centric design.',
            strengths: ['Strategic Thinking', 'Technical Innovation', 'Empathetic Leadership'],
            careerClusters: ['AI Product Management', 'Career Technology Strategy'],
            nextExperiments: [
              'Launch a beta testing group',
              'Publish a whitepaper on AI in careers',
            ],
            nextSteps: [
              {
                title: 'Review Your Brand',
                description: 'Take a moment to reflect on your new brand portrait.',
                actionLabel: 'Review',
              },
              {
                title: 'Share Your Success',
                description: 'Let others know about your SPARKWavv journey.',
                actionLabel: 'Share',
              },
            ],
          });
        } else {
          setSummary(result);
        }
        setLoading(false);
        setStep('synthesis');
      };
      process();
    }
  }, [step, userData, posterVibe]);

  return (
    <div
      className="min-h-screen selection:bg-neon-cyan selection:text-black relative transition-all duration-1000 overflow-x-hidden"
      style={
        userData.brandImage
          ? {
              backgroundImage: `linear-gradient(to bottom, rgba(10, 10, 10, 0.8), rgba(10, 10, 10, 0.95)), url(${userData.brandImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
            }
          : {}
      }
    >
      <AnimatePresence>
        {showToast && (
          <Toast
            message={showToast.message}
            type={showToast.type}
            onClose={() => setShowToast(null)}
          />
        )}
      </AnimatePresence>

      {/* Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="atmosphere absolute inset-[-100px]" />
      </div>

      <ProgressRail step={step} />

      <header className="relative z-10">
        <NavBar
          onNavigate={(s) => {
            window.scrollTo(0, 0);
            if (s === 'login') {
              login();
            } else if (s === 'onboarding') {
              if (user) {
                setStep('module1');
              } else {
                navigate('/dive-in');
              }
            } else {
              setStep(s as Step);
            }
          }}
        />
      </header>
      <ProgressBar
        current={[
          'landing',
          'onboarding',
          'module1',
          'module2',
          'module3',
          'module4',
          'module5',
          'processing',
          'results',
        ].indexOf(step)}
        total={8}
      />

      <div className="flex flex-col min-h-screen">
        <main className="flex-grow pt-24">
          <AnimatePresence mode="wait">
            {step === 'landing' && (
              <div className="space-y-0">
                <motion.div
                  key="landing"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  className="text-center space-y-4 pt-4 pb-16 px-6 max-w-7xl mx-auto"
                >
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
                    A meticulously engineered career branding framework. Move from "overwhelmed" to
                    "market dominant" through cinematic self-discovery.
                  </p>

                  {/* Skylar Avatar and Scrolling Text */}
                  <AnimatePresence>
                    {showSkylarIntro && (
                      <motion.div
                        initial={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.5 }}
                      >
                        <SkylarIntro onClose={() => setShowSkylarIntro(false)} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <p className="text-xl text-white/60 max-w-4xl mx-auto leading-relaxed italic">
                      I operate on strategy, data, and results—not small talk. My objective is to
                      extract your Career DNA, align it with the Market Intelligence Grid, and guide
                      you through the required Validation Gates to achieve your professional goals.
                      If you are ready to begin, we start at Phase 1: **Dive-In**. Tell me your
                      current role, your immediate pain points, and what is driving your need for a
                      career change, or provide a resume/LinkedIn profile so we can establish your
                      baseline. Let's get to work.
                    </p>
                  </div>
                </motion.div>

                {/* Dive-In Section */}
                {!user && (
                  <div className="w-full max-w-7xl mx-auto mt-16 px-6 pb-12 text-center space-y-8">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
                      Begin Your <span className="text-neon-cyan italic">Dive-In</span>
                    </h2>
                    <p className="text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
                      The Dive-In is a comprehensive, AI-guided onboarding process designed to extract your core professional DNA. Through a series of targeted interactions, Skylar will analyze your background, identify your unique strengths, and establish your baseline. This initial deep dive is completely free and sets the foundation for your entire Sparkwavv journey.
                    </p>
                    <button
                      onClick={() => navigate('/dive-in')}
                      className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-neon-cyan text-black font-bold text-lg hover:bg-white transition-all duration-300 shadow-[0_0_30px_rgba(0,243,255,0.3)] hover:shadow-[0_0_50px_rgba(0,243,255,0.5)] group"
                    >
                      Start Free Dive-In
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}

                {/* Quick DNA Scan Section */}
                {!user && (
                  <QuickScan
                    onDiveIn={() => navigate('/dive-in')}
                  />
                )}

                <BrainModel />
                <Roadmap />

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
                            <p className="text-white/60">
                              ALL Previous Information Will Be Deleted. This action cannot be
                              undone.
                            </p>
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
              </div>
            )}

            {step === 'product-skylar' && (
              <motion.div
                key="product-skylar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto px-6 space-y-16 pb-24"
              >
                <header className="space-y-6 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-xs font-bold uppercase tracking-widest">
                    <Sparkles className="w-4 h-4" />
                    The Future of Guidance
                  </div>
                  <h2 className="text-6xl md:text-7xl font-display font-bold tracking-tighter">
                    Meet <span className="text-neon-cyan italic">Skylar</span>
                  </h2>
                  <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                    Beyond a chatbot. Skylar is a high-fidelity intelligence designed to decode your
                    professional DNA and architect your market dominance.
                  </p>
                </header>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      title: 'Deep Contextual Mapping',
                      description:
                        "Skylar doesn't just read your resume; it understands the narrative arc of your career, identifying patterns you might have missed.",
                      icon: Fingerprint,
                      color: 'text-neon-cyan',
                    },
                    {
                      title: 'Market Dominance Strategy',
                      description:
                        'Real-time analysis of industry trends to position you at the forefront of your field with surgical precision.',
                      icon: Target,
                      color: 'text-neon-magenta',
                    },
                    {
                      title: 'Emotional Intelligence',
                      description:
                        "Built with advanced NLP to understand your aspirations, fears, and the 'why' behind your work.",
                      icon: Heart,
                      color: 'text-neon-lime',
                    },
                  ].map((feature, i) => (
                    <div
                      key={i}
                      className="glass-panel p-8 space-y-6 group hover:border-white/20 transition-all duration-500"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${feature.color}`}
                      >
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold">{feature.title}</h3>
                      <p className="text-white/40 leading-relaxed text-sm">{feature.description}</p>
                    </div>
                  ))}
                </div>

                <div className="glass-panel p-12 border-neon-cyan/20 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                      <h3 className="text-3xl font-bold leading-tight">
                        The Skylar Experience: <br />
                        <span className="text-neon-cyan">From History to Legacy</span>
                      </h3>
                      <div className="space-y-6">
                        {[
                          {
                            step: '01',
                            title: 'The Ignition',
                            desc: 'A deep-dive dialogue to uncover hidden strengths and core motivations.',
                          },
                          {
                            step: '02',
                            title: 'The Discovery',
                            desc: 'Skylar scans the global market landscape to find the precise intersection of your skills and high-value opportunities.',
                          },
                          {
                            step: '03',
                            title: 'The Branding',
                            desc: 'Your professional narrative is transformed into a cinematic identity that commands attention and establishes authority.',
                          },
                          {
                            step: '04',
                            title: 'The Outreach',
                            desc: 'Automated, high-impact engagement strategies that put your brand directly in front of key decision-makers.',
                          },
                        ].map((item, i) => (
                          <div key={i} className="flex gap-6">
                            <span className="text-neon-cyan font-display font-bold text-xl opacity-40">
                              {item.step}
                            </span>
                            <div className="space-y-1">
                              <h4 className="font-bold text-white">{item.title}</h4>
                              <p className="text-sm text-white/40">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center group-hover:border-neon-cyan/30 transition-all duration-700">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neon-cyan/10 via-transparent to-transparent animate-pulse" />

                      {/* Visual representation of Neural Processing */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <div className="w-full h-full relative">
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              animate={{
                                opacity: [0.1, 0.5, 0.1],
                                scale: [1, 1.2, 1],
                              }}
                              transition={{
                                duration: 3,
                                delay: i * 0.5,
                                repeat: Infinity,
                              }}
                              className="absolute border border-neon-cyan/30 rounded-full"
                              style={{
                                top: '50%',
                                left: '50%',
                                width: `${(i + 1) * 20}%`,
                                height: `${(i + 1) * 20}%`,
                                transform: 'translate(-50%, -50%)',
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      <Sparkles className="w-24 h-24 text-neon-cyan opacity-20 group-hover:scale-110 group-hover:opacity-40 transition-all duration-1000" />

                      <div className="absolute bottom-8 left-8 right-8 p-6 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] font-mono text-neon-cyan uppercase tracking-widest">
                            Neural Synthesis Core
                          </p>
                          <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-neon-cyan animate-ping" />
                            <div className="w-1 h-1 rounded-full bg-neon-cyan/40" />
                          </div>
                        </div>

                        {/* Clarified Processing Bar */}
                        <div className="space-y-2">
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                            <motion.div
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-neon-cyan to-transparent shadow-[0_0_15px_#00f3ff]"
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] text-white/40 uppercase font-mono">
                              Analyzing Career DNA
                            </span>
                            <span className="text-[8px] text-neon-cyan font-mono">ACTIVE</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-8">
                  <Button
                    onClick={() => setStep('landing')}
                    variant="neon"
                    className="px-12 py-6 text-lg"
                  >
                    Experience the Ignition
                  </Button>
                  <button
                    onClick={() => setStep('landing')}
                    className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-widest"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Back to Home
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'product-features' && (
              <motion.div
                key="product-features"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto px-6 space-y-16 pb-24"
              >
                <header className="space-y-6 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-magenta/10 border border-neon-magenta/20 text-neon-magenta text-xs font-bold uppercase tracking-widest">
                    <Zap className="w-4 h-4" />
                    The SPARKWavv Toolkit
                  </div>
                  <h2 className="text-6xl md:text-7xl font-display font-bold tracking-tighter">
                    Engineered for <span className="text-neon-magenta italic">Impact</span>
                  </h2>
                  <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                    A comprehensive suite of AI-powered tools designed to amplify your professional
                    presence and streamline your career trajectory.
                  </p>
                </header>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      title: 'Cinematic Branding',
                      desc: 'Transform your history into a high-impact visual narrative that captures attention in seconds.',
                      icon: Film,
                      color: 'text-neon-cyan',
                    },
                    {
                      title: 'Wavvault Storage',
                      desc: 'Secure, encrypted repository for your professional assets, achievements, and career DNA.',
                      icon: ShieldCheck,
                      color: 'text-neon-magenta',
                    },
                    {
                      title: 'Precision Matching',
                      desc: 'Advanced algorithms that align your unique profile with high-value market opportunities.',
                      icon: Target,
                      color: 'text-neon-lime',
                      isPrecision: true,
                    },
                    {
                      title: 'Real-time Analytics',
                      desc: 'Track your market value and engagement metrics with a live professional dashboard.',
                      icon: Zap,
                      color: 'text-neon-cyan',
                    },
                  ].map((feature, i) =>
                    feature.isPrecision ? (
                      <PrecisionMatchingCard
                        key={i}
                        userId={userId}
                        dashboardData={dashboardData}
                      />
                    ) : (
                      <div
                        key={i}
                        className="glass-panel p-8 space-y-6 group hover:border-white/20 transition-all duration-500"
                      >
                        <div
                          className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${feature.color}`}
                        >
                          <feature.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold">{feature.title}</h3>
                        <p className="text-white/40 leading-relaxed text-sm">{feature.desc}</p>
                      </div>
                    )
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="glass-panel p-10 border-white/5 space-y-8">
                    <h3 className="text-2xl font-bold">The Career Engine</h3>
                    <div className="space-y-6">
                      {[
                        'Automated Resume Optimization',
                        'AI-Powered Interview Simulation',
                        'Dynamic Portfolio Generation',
                        'Market Value Benchmarking',
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-5 h-5 rounded-full bg-neon-magenta/20 flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-neon-magenta" />
                          </div>
                          <span className="text-white/60">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-panel p-10 border-white/5 space-y-8">
                    <h3 className="text-2xl font-bold">Strategic Outreach</h3>
                    <div className="space-y-6">
                      {[
                        'Automated Network Engagement',
                        'Personalized Outreach Sequences',
                        'Decision-Maker Identification',
                        'Engagement Performance Tracking',
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-5 h-5 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-neon-cyan" />
                          </div>
                          <span className="text-white/60">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-8">
                  <Button
                    onClick={() => setStep('landing')}
                    variant="neon"
                    className="px-12 py-6 text-lg"
                  >
                    Explore the Full Suite
                  </Button>
                  <button
                    onClick={() => setStep('landing')}
                    className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-widest"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Back to Home
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'product-technology' && (
              <motion.div
                key="product-technology"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto px-6 space-y-16 pb-24"
              >
                <header className="space-y-6 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-lime/10 border border-neon-lime/20 text-neon-lime text-xs font-bold uppercase tracking-widest">
                    <Cpu className="w-4 h-4" />
                    The Engine Behind the Wave
                  </div>
                  <h2 className="text-6xl md:text-7xl font-display font-bold tracking-tighter">
                    Engineered for the <span className="text-neon-lime italic">Future</span>
                  </h2>
                  <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                    SPARKWavv is built on a proprietary stack of advanced neural networks and
                    real-time market intelligence engines.
                  </p>
                </header>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="glass-panel p-10 space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Cpu className="w-32 h-32 text-neon-lime" />
                    </div>
                    <div className="space-y-4 relative z-10">
                      <h3 className="text-3xl font-bold">Neural Synthesis Engine</h3>
                      <p className="text-white/40 leading-relaxed">
                        Our core AI architecture utilizes multi-modal transformers to process
                        resumes, portfolios, and interview transcripts into a unified "Career DNA"
                        profile. This engine identifies latent skills and cross-industry potential
                        that traditional systems miss.
                      </p>
                      <ul className="space-y-3 pt-4">
                        {[
                          'Multi-modal Data Processing',
                          'Latent Skill Identification',
                          'Semantic Career Mapping',
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-white/60">
                            <div className="w-1.5 h-1.5 rounded-full bg-neon-lime" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="glass-panel p-10 space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Globe className="w-32 h-32 text-neon-cyan" />
                    </div>
                    <div className="space-y-4 relative z-10">
                      <h3 className="text-3xl font-bold">Market Intelligence Grid</h3>
                      <p className="text-white/40 leading-relaxed">
                        A global network of real-time data crawlers monitors industry shifts, hiring
                        trends, and skill demand across 50+ sectors. This intelligence allows Skylar
                        to provide adaptive guidance that evolves as the market does.
                      </p>
                      <ul className="space-y-3 pt-4">
                        {[
                          'Real-time Trend Analysis',
                          'Predictive Demand Modeling',
                          'Global Sector Monitoring',
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-white/60">
                            <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-12 border-white/5">
                  <div className="grid md:grid-cols-3 gap-12">
                    <div className="space-y-4 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-neon-magenta">
                        <ShieldCheck className="w-8 h-8" />
                      </div>
                      <h4 className="text-xl font-bold">Zero-Knowledge Privacy</h4>
                      <p className="text-sm text-white/40">
                        Your data is encrypted at rest and in transit. We utilize zero-knowledge
                        architecture to ensure you remain the sole owner of your professional DNA.
                      </p>
                    </div>
                    <div className="space-y-4 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-neon-lime">
                        <Activity className="w-8 h-8" />
                      </div>
                      <h4 className="text-xl font-bold">Adaptive Learning</h4>
                      <p className="text-sm text-white/40">
                        The system learns from every interaction, refining its understanding of your
                        goals and the market to provide increasingly precise guidance.
                      </p>
                    </div>
                    <div className="space-y-4 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-neon-cyan">
                        <Zap className="w-8 h-8" />
                      </div>
                      <h4 className="text-xl font-bold">High-Fidelity Synthesis</h4>
                      <p className="text-sm text-white/40">
                        Our synthesis engine generates high-fidelity assets, from cinematic brand
                        portraits to optimized outreach sequences, in seconds.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-8">
                  <Button
                    onClick={() => setStep('landing')}
                    variant="neon"
                    className="px-12 py-6 text-lg"
                  >
                    Experience the Tech
                  </Button>
                  <button
                    onClick={() => setStep('landing')}
                    className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-widest"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Back to Home
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'product-wavvault' && (
              <motion.div
                key="product-wavvault"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto px-6 space-y-16 pb-24"
              >
                <header className="space-y-6 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-xs font-bold uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4" />
                    Fortified Career Assets
                  </div>
                  <h2 className="text-6xl md:text-7xl font-display font-bold tracking-tighter">
                    The <span className="text-neon-cyan italic">Wavvault</span>
                  </h2>
                  <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                    Your professional DNA deserves a fortress. Wavvault is the industry's first
                    zero-knowledge repository for high-fidelity career assets.
                  </p>
                </header>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      title: 'Immutable Storage',
                      desc: 'Every version of your resume, portfolio, and cinematic brand portrait is stored with blockchain-grade integrity.',
                      icon: Database,
                      color: 'text-neon-cyan',
                    },
                    {
                      title: 'Zero-Knowledge Encryption',
                      desc: "We don't just encrypt your data; we ensure we can't even see it. Your keys, your assets, your future.",
                      icon: Lock,
                      color: 'text-neon-magenta',
                    },
                    {
                      title: 'Instant Retrieval',
                      desc: 'Deploy your assets to any opportunity in milliseconds with our high-speed global delivery network.',
                      icon: Zap,
                      color: 'text-neon-lime',
                    },
                  ].map((feature, i) => (
                    <div
                      key={i}
                      className="glass-panel p-8 space-y-6 group hover:border-white/20 transition-all duration-500"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${feature.color}`}
                      >
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold">{feature.title}</h3>
                      <p className="text-white/40 leading-relaxed text-sm">{feature.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="glass-panel p-12 border-white/5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                      <h3 className="text-3xl font-bold leading-tight">
                        Beyond a Cloud Drive: <br />
                        <span className="text-neon-cyan">A Dynamic Asset Engine</span>
                      </h3>
                      <div className="space-y-6">
                        {[
                          {
                            title: 'Smart Versioning',
                            desc: 'Skylar automatically tracks and optimizes every iteration of your professional profile.',
                          },
                          {
                            title: 'Secure Sharing',
                            desc: 'Generate time-limited, encrypted links for recruiters and decision-makers.',
                          },
                          {
                            title: 'Asset Synthesis',
                            desc: 'Wavvault works with Skylar to dynamically generate new assets based on your stored DNA.',
                          },
                        ].map((item, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="mt-1">
                              <CheckCircle2 className="w-5 h-5 text-neon-cyan" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-bold text-white">{item.title}</h4>
                              <p className="text-sm text-white/40">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center group-hover:border-neon-cyan/30 transition-all duration-700">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neon-cyan/10 via-transparent to-transparent animate-pulse" />
                      <HardDrive className="w-24 h-24 text-neon-cyan opacity-20 group-hover:scale-110 group-hover:opacity-40 transition-all duration-1000" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <div className="w-full max-w-xs space-y-2">
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              animate={{ width: ['0%', '100%'] }}
                              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                              className="h-full bg-neon-cyan shadow-[0_0_10px_#00f3ff]"
                            />
                          </div>
                          <p className="text-[10px] font-mono text-neon-cyan uppercase tracking-widest">
                            Encrypting Career DNA...
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-8">
                  <Button
                    onClick={() => setStep('landing')}
                    variant="neon"
                    className="px-12 py-6 text-lg"
                  >
                    Secure Your Future
                  </Button>
                  <button
                    onClick={() => setStep('landing')}
                    className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-widest"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Back to Home
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'company-vision' && (
              <motion.div
                key="company-vision"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto px-6 space-y-16 pb-24"
              >
                <header className="space-y-6 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-xs font-bold uppercase tracking-widest">
                    <Compass className="w-4 h-4" />
                    The Future of Career Wellness
                  </div>
                  <h2 className="text-6xl md:text-7xl font-display font-bold tracking-tighter">
                    A New <span className="text-neon-cyan italic">Paradigm</span>
                  </h2>
                  <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                    We envision a world where every professional is empowered by their own history,
                    navigating the market with absolute clarity and cinematic authority.
                  </p>
                </header>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      title: 'Human-Centric Intelligence',
                      desc: 'We believe AI should amplify human potential, not replace it. Skylar is designed to be a partner in your self-discovery journey.',
                      icon: Heart,
                      color: 'text-neon-cyan',
                    },
                    {
                      title: 'Universal Opportunity',
                      desc: 'Our mission is to democratize high-level career strategy, making elite-level branding and guidance accessible to everyone.',
                      icon: Globe,
                      color: 'text-neon-magenta',
                    },
                    {
                      title: 'Data Sovereignty',
                      desc: 'In the age of information, your professional DNA is your most valuable asset. We are committed to absolute privacy and user ownership.',
                      icon: ShieldCheck,
                      color: 'text-neon-lime',
                    },
                  ].map((feature, i) => (
                    <div
                      key={i}
                      className="glass-panel p-8 space-y-6 group hover:border-white/20 transition-all duration-500"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${feature.color}`}
                      >
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold">{feature.title}</h3>
                      <p className="text-white/40 leading-relaxed text-sm">{feature.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="glass-panel p-12 border-white/5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <div className="relative z-10 space-y-12">
                    <div className="max-w-3xl">
                      <h3 className="text-4xl font-bold leading-tight mb-6">
                        Redefining the <span className="text-neon-cyan">Professional Journey</span>
                      </h3>
                      <p className="text-lg text-white/60 leading-relaxed">
                        Traditional career development is broken. It's reactive, fragmented, and
                        often ignores the human element. SPARKWavv is building the infrastructure
                        for a proactive, unified, and cinematic career experience.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <h4 className="text-xl font-bold text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
                            <Target className="w-4 h-4 text-neon-cyan" />
                          </div>
                          Strategic Pillars
                        </h4>
                        <ul className="space-y-4">
                          {[
                            'Cinematic Self-Discovery as a standard',
                            'Real-time market alignment engines',
                            'Zero-knowledge professional DNA storage',
                            'High-fidelity brand synthesis for all',
                          ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-white/40">
                              <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-6">
                        <h4 className="text-xl font-bold text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-neon-magenta/10 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-neon-magenta" />
                          </div>
                          The SPARKWavv Impact
                        </h4>
                        <p className="text-white/40 leading-relaxed italic">
                          "By 2030, we aim to have empowered 100 million professionals to reclaim
                          their narrative and dominate their chosen markets through the power of
                          cinematic intelligence."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-8">
                  <Button
                    onClick={() => setStep('landing')}
                    variant="neon"
                    className="px-12 py-6 text-lg"
                  >
                    Join the Vision
                  </Button>
                  <button
                    onClick={() => setStep('landing')}
                    className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-widest"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Back to Home
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'company-about' && (
              <motion.div
                key="company-about"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto px-6 space-y-16 pb-24"
              >
                <header className="space-y-6 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-magenta/10 border border-neon-magenta/20 text-neon-magenta text-xs font-bold uppercase tracking-widest">
                    <Users className="w-4 h-4" />
                    The Team Behind the Engine
                  </div>
                  <h2 className="text-6xl md:text-7xl font-display font-bold tracking-tighter">
                    Our <span className="text-neon-magenta italic">Story</span>
                  </h2>
                  <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                    Born from the intersection of cinematic storytelling and advanced neural
                    science, SPARKWavv is on a mission to redefine the professional narrative.
                  </p>
                </header>

                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8">
                    <h3 className="text-3xl font-bold">Pioneering Cinematic Intelligence</h3>
                    <p className="text-lg text-white/40 leading-relaxed">
                      Founded in 2024, SPARKWavv began as a research project focused on how
                      high-fidelity visual narratives impact professional perception. Today, we are
                      a global team of engineers, designers, and career strategists building the
                      future of professional identity.
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                        <div className="text-3xl font-bold text-neon-magenta">50+</div>
                        <div className="text-xs text-white/40 uppercase tracking-widest">
                          Global Experts
                        </div>
                      </div>
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                        <div className="text-3xl font-bold text-neon-cyan">2024</div>
                        <div className="text-xs text-white/40 uppercase tracking-widest">
                          Year Founded
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 glass-panel p-2">
                    <img
                      src="https://picsum.photos/seed/team/800/800"
                      alt="SPARKWavv Team"
                      className="w-full h-full object-cover rounded-2xl opacity-60 grayscale hover:grayscale-0 transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <div className="absolute bottom-8 left-8 right-8">
                      <p className="text-sm text-white/60 italic font-serif">
                        "We're not just building a platform; we're building a movement to reclaim
                        the professional narrative."
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-12">
                  <h3 className="text-3xl font-bold text-center">Our Leadership</h3>
                  <div className="grid md:grid-cols-3 gap-8">
                    {[
                      {
                        name: 'Alex Rivers',
                        role: 'CEO & Founder',
                        bio: 'Former cinematic director turned AI architect.',
                        icon: Sparkles,
                      },
                      {
                        name: 'Dr. Sarah Chen',
                        role: 'Chief Science Officer',
                        bio: 'Expert in neural synthesis and behavioral data.',
                        icon: Cpu,
                      },
                      {
                        name: 'Marcus Thorne',
                        role: 'Head of Strategy',
                        bio: 'Veteran career strategist for Fortune 500 executives.',
                        icon: Target,
                      },
                    ].map((member, i) => (
                      <div
                        key={i}
                        className="glass-panel p-8 space-y-6 group hover:border-white/20 transition-all duration-500 text-center"
                      >
                        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 group-hover:border-neon-magenta/30 transition-all">
                          <member.icon className="w-10 h-10 text-neon-magenta" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xl font-bold">{member.name}</h4>
                          <p className="text-neon-magenta text-xs font-bold uppercase tracking-widest">
                            {member.role}
                          </p>
                        </div>
                        <p className="text-sm text-white/40 leading-relaxed">{member.bio}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel p-12 border-white/5 text-center space-y-8">
                  <Award className="w-12 h-12 text-neon-lime mx-auto" />
                  <h3 className="text-3xl font-bold">Our Commitment</h3>
                  <p className="text-lg text-white/60 max-w-3xl mx-auto leading-relaxed">
                    We are committed to building technology that is ethical, transparent, and
                    profoundly human. Every line of code we write is dedicated to helping you find
                    your voice and dominate your market.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-8">
                  <Button
                    onClick={() => setStep('landing')}
                    variant="neon"
                    className="px-12 py-6 text-lg"
                  >
                    Meet the Team
                  </Button>
                  <button
                    onClick={() => setStep('landing')}
                    className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-widest"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Back to Home
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'company-investors' && (
              <motion.div
                key="company-investors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto px-6 space-y-16 pb-24"
              >
                <header className="space-y-6 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-xs font-bold uppercase tracking-widest">
                    <TrendingUp className="w-4 h-4" />
                    Partnering for the Future
                  </div>
                  <h2 className="text-6xl md:text-7xl font-display font-bold tracking-tighter">
                    Investor <span className="text-neon-cyan italic">Relations</span>
                  </h2>
                  <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                    SPARKWavv is scaling the next generation of professional identity. We are backed
                    by visionary partners who believe in the power of cinematic intelligence.
                  </p>
                </header>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      title: 'Market Opportunity',
                      desc: 'The global career development and AI market is projected to reach $500B by 2030. SPARKWavv is positioned at the epicenter of this shift.',
                      icon: BarChart3,
                      color: 'text-neon-cyan',
                    },
                    {
                      title: 'Strategic Growth',
                      desc: 'With a 300% YoY growth in user engagement and a proprietary technology stack, we are defining a new category of professional wellness.',
                      icon: TrendingUp,
                      color: 'text-neon-magenta',
                    },
                    {
                      title: 'Global Scale',
                      desc: 'Our infrastructure is designed for universal accessibility, supporting professionals across 50+ sectors and 120 countries.',
                      icon: Globe,
                      color: 'text-neon-lime',
                    },
                  ].map((feature, i) => (
                    <div
                      key={i}
                      className="glass-panel p-8 space-y-6 group hover:border-white/20 transition-all duration-500"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${feature.color}`}
                      >
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold">{feature.title}</h3>
                      <p className="text-white/40 leading-relaxed text-sm">{feature.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="glass-panel p-12 border-white/5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                      <h3 className="text-3xl font-bold leading-tight">
                        Investment <span className="text-neon-cyan">Philosophy</span>
                      </h3>
                      <div className="space-y-6">
                        {[
                          {
                            title: 'Long-term Value',
                            desc: 'We focus on building sustainable, high-impact technology that creates lasting value for our users and partners.',
                          },
                          {
                            title: 'Ethical AI',
                            desc: 'Our commitment to zero-knowledge privacy and ethical data usage is a core competitive advantage.',
                          },
                          {
                            title: 'Category Leadership',
                            desc: "We don't just compete; we define the cinematic intelligence category for the professional market.",
                          },
                        ].map((item, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="mt-1">
                              <CheckCircle2 className="w-5 h-5 text-neon-cyan" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-bold text-white">{item.title}</h4>
                              <p className="text-sm text-white/40">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                        <Briefcase className="w-8 h-8 text-neon-cyan mb-2" />
                        <h4 className="text-xl font-bold">Inquiries</h4>
                        <p className="text-sm text-white/40 leading-relaxed">
                          For institutional investor inquiries, please contact our relations team at{' '}
                          <span className="text-neon-cyan">investors@sparkwavv.com</span>.
                        </p>
                        <Button
                          variant="outline"
                          className="w-full border-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/10"
                        >
                          Download Pitch Deck
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-8">
                  <Button
                    onClick={() => setStep('landing')}
                    variant="neon"
                    className="px-12 py-6 text-lg"
                  >
                    Partner with Us
                  </Button>
                  <button
                    onClick={() => setStep('landing')}
                    className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-widest"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Back to Home
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'company-give' && (
              <motion.div
                key="company-give"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto px-6 space-y-12 text-center pb-24"
              >
                <header className="space-y-4">
                  <h2 className="text-5xl font-bold">Give a Little</h2>
                  <p className="text-neon-cyan font-display uppercase tracking-widest">
                    Our Social Impact
                  </p>
                </header>
                <div className="glass-panel p-12 border-neon-cyan/20">
                  <p className="text-xl text-white/60">
                    Placeholder for our social impact and giving programs. Coming soon.
                  </p>
                </div>
                <Button onClick={() => setStep('landing')} variant="outline">
                  Back to Home
                </Button>
              </motion.div>
            )}

            {step === 'pricing' && <PricingPlaceholder onBack={() => setStep('landing')} />}

            {step === 'documentation' && (
              <motion.div
                key="documentation"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Documentation />
              </motion.div>
            )}

            {step === 'help-center' && (
              <motion.div
                key="help-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <HelpCenter />
              </motion.div>
            )}

            {step === 'login' && (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-12 h-12 text-neon-cyan animate-spin" />
                <p className="ml-4 text-white/60">Redirecting to Identity Platform...</p>
                <LoginRedirect login={login} />
              </div>
            )}

            {step === 'settings' && user && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto px-6 space-y-12 pb-24"
              >
                <header className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-bold">Account Settings</h2>
                    <p className="text-white/60">Manage your profile and security preferences.</p>
                  </div>
                  <Button onClick={() => setStep('landing')} variant="outline">
                    Back to Home
                  </Button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-1 space-y-4">
                    <div className="glass-panel p-6 text-center space-y-4">
                      <div className="w-24 h-24 rounded-full bg-neon-cyan/10 border-2 border-neon-cyan/30 flex items-center justify-center mx-auto relative group">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl font-bold text-neon-cyan">
                            {user.email?.[0].toUpperCase()}
                          </span>
                        )}
                        <button className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="w-6 h-6 text-white" />
                        </button>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          {user.displayName || 'SPARKWavv User'}
                        </h3>
                        <p className="text-sm text-white/40">{user.email}</p>
                      </div>
                    </div>

                    <nav className="glass-panel overflow-hidden">
                      <button className="w-full px-6 py-4 text-left text-neon-cyan bg-white/5 border-l-2 border-neon-cyan font-medium">
                        Profile & Security
                      </button>
                      <button className="w-full px-6 py-4 text-left text-white/60 hover:bg-white/5 transition-colors">
                        Notifications
                      </button>
                      <button className="w-full px-6 py-4 text-left text-white/60 hover:bg-white/5 transition-colors">
                        Billing
                      </button>
                    </nav>
                  </div>

                  <div className="md:col-span-2 space-y-8">
                    <section className="glass-panel p-8 space-y-6">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Fingerprint className="w-5 h-5 text-neon-cyan" /> Profile Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-white/40 uppercase">
                            Display Name
                          </label>
                          <input
                            type="text"
                            defaultValue={user.displayName || ''}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-neon-cyan transition-colors"
                            id="settings-display-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-white/40 uppercase">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={user.email || ''}
                            disabled
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 opacity-50 cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={async () => {
                          const name = (
                            document.getElementById('settings-display-name') as HTMLInputElement
                          ).value;
                          if (user) {
                            await authService.updateDisplayName(user, name);
                            setShowToast({
                              message: 'Profile updated successfully!',
                              type: 'success',
                            });
                          }
                        }}
                        variant="secondary"
                      >
                        Save Changes
                      </Button>
                    </section>

                    <section className="glass-panel p-8 space-y-6">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-neon-cyan" /> Voice Mode
                      </h3>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="space-y-1">
                          <p className="font-medium">Proactive Voice Interaction</p>
                          <p className="text-sm text-white/40">
                            Skylar will automatically start listening when the sidebar is opened.
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            const newVoiceMode = !profile?.voiceMode;
                            try {
                              await updateIdentityProfile({ voiceMode: newVoiceMode });
                            } catch (err) {
                              console.error('Failed to update voice mode:', err);
                            }
                          }}
                          className={`w-14 h-7 rounded-full transition-all duration-500 relative ${profile?.voiceMode ? 'bg-neon-cyan' : 'bg-white/10'}`}
                          id="voice-mode-toggle"
                        >
                          <motion.div
                            animate={{ x: profile?.voiceMode ? 28 : 4 }}
                            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg"
                          />
                        </button>
                      </div>
                    </section>

                    <section className="glass-panel p-8 border-red-500/20 space-y-6">
                      <h3 className="text-xl font-bold text-red-500">Danger Zone</h3>
                      <p className="text-white/60 text-sm">
                        To delete your account, please contact support or manage your profile via
                        the Identity Platform dashboard.
                      </p>
                      <Button
                        onClick={() => window.open('mailto:support@sparkwavv.ai')}
                        className="bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20"
                      >
                        Contact Support to Delete Account
                      </Button>
                    </section>

                    <section className="glass-panel p-8 border-neon-cyan/20 space-y-6">
                      <h3 className="text-xl font-bold text-neon-cyan flex items-center gap-2">
                        <Zap className="w-5 h-5" /> Developer Tools
                      </h3>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                        <div>
                          <p className="font-bold">Simulate Discovery Upgrade</p>
                          <p className="text-xs text-white/40">
                            Unlock the Neural Synthesis Engine manually for testing.
                          </p>
                        </div>
                        <button
                          onClick={() => setDiscoveryUnlocked(!discoveryUnlocked)}
                          className={`w-12 h-6 rounded-full transition-colors relative ${discoveryUnlocked ? 'bg-neon-cyan' : 'bg-white/10'}`}
                        >
                          <motion.div
                            animate={{ x: discoveryUnlocked ? 24 : 4 }}
                            className="absolute top-1 w-4 h-4 bg-white rounded-full"
                          />
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'onboarding' && (
              <OnboardingContainer
                onBackToHome={() => setStep('landing')}
                onSuccess={(message) => setShowToast({ message, type: 'success' })}
              />
            )}

            {step === 'ignition' && (
              <motion.div
                key="ignition"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full"
              >
                <IgnitionPage onComplete={() => setStep('module1')} />
              </motion.div>
            )}

            {step === 'module1' && (
              <motion.div
                key="module1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl mx-auto px-6 space-y-12 pb-24"
              >
                <header className="space-y-4">
                  <div className="flex items-center gap-3 text-neon-magenta">
                    <Trophy className="w-6 h-6" />
                    <span className="font-display font-bold uppercase tracking-widest">
                      Module 1
                    </span>
                    <InspirationTooltip content="Focus on the 'How' and the 'Impact'. Instead of 'I managed a team', try 'I led a team of 5 to deliver a project 2 weeks early, saving $20k'." />
                  </div>
                  <h2 className="text-4xl font-bold">Accomplishment Stories</h2>
                  <p className="text-white/60">
                    List 3 key accomplishments that made you feel proud or energized. These are the
                    seeds of your brand.
                  </p>
                </header>

                <div className="space-y-6">
                  {errors.accomplishments && (
                    <p className="text-sm text-red-500 text-center">{errors.accomplishments}</p>
                  )}
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="glass-panel p-6 flex flex-col gap-4 relative">
                        <div className="flex gap-4 items-center">
                          <span className="text-2xl font-display font-bold text-white/20">
                            0{i + 1}
                          </span>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] uppercase tracking-widest text-white/40">
                                Title
                              </label>
                              <span
                                className={`text-[8px] ${(userData.accomplishments[i]?.title?.length || 0) > 100 ? 'text-red-500' : 'text-white/20'}`}
                              >
                                {userData.accomplishments[i]?.title?.length || 0}/100
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
                                setUserData({ ...userData, accomplishments: newAcc });
                              }}
                            />
                            {errors[`acc_title_${i}`] && (
                              <p className="text-[10px] text-red-500">{errors[`acc_title_${i}`]}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1 pl-12">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] uppercase tracking-widest text-white/40">
                              Description
                            </label>
                            <span
                              className={`text-[8px] ${(userData.accomplishments[i]?.description?.length || 0) > 300 ? 'text-red-500' : 'text-white/20'}`}
                            >
                              {userData.accomplishments[i]?.description?.length || 0}/300
                            </span>
                          </div>
                          <textarea
                            className={`w-full bg-white/5 border rounded-lg px-4 py-2 text-sm focus:outline-none transition-all h-24 resize-none ${errors[`acc_desc_${i}`] ? 'border-red-500 text-red-500' : 'border-white/10 focus:border-neon-magenta'}`}
                            placeholder="How did you do it? What was the impact?"
                            value={userData.accomplishments[i]?.description || ''}
                            onKeyDown={(e) => {
                              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                nextStep();
                              }
                            }}
                            onChange={(e) => {
                              const newAcc = [...userData.accomplishments];
                              newAcc[i] = { ...newAcc[i], description: e.target.value };
                              setUserData({ ...userData, accomplishments: newAcc });
                            }}
                          />
                          <ValidationFeedback
                            value={userData.accomplishments[i]?.description || ''}
                            maxLength={300}
                          />
                          {errors[`acc_desc_${i}`] && (
                            <p className="text-[10px] text-red-500">{errors[`acc_desc_${i}`]}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <Button onClick={() => setStep('onboarding')} variant="secondary">
                    Back
                  </Button>
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
                className="max-w-4xl mx-auto px-6 space-y-12 pb-24"
              >
                <header className="space-y-4">
                  <div className="flex items-center gap-3 text-neon-lime">
                    <Compass className="w-6 h-6" />
                    <span className="font-display font-bold uppercase tracking-widest">
                      Module 2
                    </span>
                    <InspirationTooltip content="Think about the environment where you lose track of time. Is it a quiet library, a bustling cafe, or a collaborative workshop?" />
                  </div>
                  <h2 className="text-4xl font-bold">Perfect Day & Extinguishers</h2>
                  <p className="text-white/60">
                    Define your ideal environment and the "deal-breakers" that kill your energy.
                  </p>
                </header>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="glass-panel p-8 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-neon-lime" />
                        The Perfect Day
                      </h3>
                      <span
                        className={`text-[10px] ${userData.environment.perfectDay.length > 1000 ? 'text-red-500' : 'text-white/20'}`}
                      >
                        {userData.environment.perfectDay.length}/1000
                      </span>
                    </div>
                    <textarea
                      className={`w-full bg-white/5 border rounded-xl px-4 py-3 focus:outline-none transition-colors h-48 resize-none ${errors.perfectDay ? 'border-red-500' : 'border-white/10 focus:border-neon-lime'}`}
                      placeholder="Describe your ideal workday flow..."
                      value={userData.environment.perfectDay}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          nextStep();
                        }
                      }}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          environment: { ...userData.environment, perfectDay: e.target.value },
                        })
                      }
                    />
                    <ValidationFeedback value={userData.environment.perfectDay} maxLength={1000} />
                    {errors.perfectDay && (
                      <p className="text-xs text-red-500">{errors.perfectDay}</p>
                    )}
                  </div>

                  <div className="glass-panel p-8 space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-500" />
                      The Extinguishers
                    </h3>
                    <div className="space-y-3">
                      {[
                        'Micromanagement',
                        'Lack of Purpose',
                        'Isolation',
                        'Rigid Hierarchy',
                        'No Growth',
                      ].map((ext) => (
                        <button
                          key={ext}
                          onClick={() => {
                            const current = userData.environment.extinguishers;
                            const next = current.includes(ext)
                              ? current.filter((e) => e !== ext)
                              : [...current, ext];
                            setUserData({
                              ...userData,
                              environment: { ...userData.environment, extinguishers: next },
                            });
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
                    {errors.extinguishers && (
                      <p className="text-xs text-red-500">{errors.extinguishers}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Button onClick={() => setStep('module1')} variant="secondary">
                    Back
                  </Button>
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
                className="max-w-4xl mx-auto px-6 space-y-12 pb-24"
              >
                <header className="space-y-4">
                  <div className="flex items-center gap-3 text-neon-cyan">
                    <Heart className="w-6 h-6" />
                    <span className="font-display font-bold uppercase tracking-widest">
                      Module 3
                    </span>
                    <InspirationTooltip content="Energizers are the tasks that give you energy rather than drain it. What would you do even if you weren't being paid?" />
                  </div>
                  <h2 className="text-4xl font-bold">Passions & Best-When</h2>
                  <p className="text-white/60">
                    What energizes you? Under what conditions do you perform at your absolute best?
                  </p>
                </header>

                <div className="glass-panel p-8 space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white/40 uppercase tracking-widest">
                      Energizers
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {[
                        'Solving Puzzles',
                        'Helping Others',
                        'Building Systems',
                        'Storytelling',
                        'Analyzing Data',
                        'Leading Teams',
                        'Creating Art',
                        'Researching',
                      ].map((item) => (
                        <button
                          key={item}
                          onClick={() => {
                            const current = userData.passions.energizers;
                            const next = current.includes(item)
                              ? current.filter((e) => e !== item)
                              : [...current, item];
                            setUserData({
                              ...userData,
                              passions: { ...userData.passions, energizers: next },
                            });
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
                    {errors.energizers && (
                      <p className="text-xs text-red-500">{errors.energizers}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-white/40 uppercase tracking-widest">
                        I am best when...
                      </h3>
                      <span
                        className={`text-[10px] ${userData.passions.bestWhen.length > 500 ? 'text-red-500' : 'text-white/20'}`}
                      >
                        {userData.passions.bestWhen.length}/500
                      </span>
                    </div>
                    <textarea
                      className={`w-full bg-white/5 border rounded-xl px-4 py-3 focus:outline-none transition-colors h-32 resize-none ${errors.bestWhen ? 'border-red-500' : 'border-white/10 focus:border-neon-cyan'}`}
                      placeholder="e.g., I have a clear goal but total freedom on how to reach it..."
                      value={userData.passions.bestWhen}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          nextStep();
                        }
                      }}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          passions: { ...userData.passions, bestWhen: e.target.value },
                        })
                      }
                    />
                    <ValidationFeedback value={userData.passions.bestWhen} maxLength={500} />
                    {errors.bestWhen && <p className="text-xs text-red-500">{errors.bestWhen}</p>}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Button onClick={() => setStep('module2')} variant="secondary">
                    Back
                  </Button>
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
                className="max-w-4xl mx-auto px-6 space-y-12 pb-24"
              >
                <header className="space-y-4">
                  <div className="flex items-center gap-3 text-neon-magenta">
                    <Fingerprint className="w-6 h-6" />
                    <span className="font-display font-bold uppercase tracking-widest">
                      Module 4
                    </span>
                    <InspirationTooltip content="Choose attributes that resonate with your core identity. Are you the one who starts things (Catalyst) or the one who perfects them (Optimizer)?" />
                  </div>
                  <h2 className="text-4xl font-bold">The Attributes Game</h2>
                  <p className="text-white/60">
                    Select the attributes that form your Brand DNA. Choose 3-5 that define you.
                  </p>
                </header>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    'Creator',
                    'Builder',
                    'Analyst',
                    'Strategist',
                    'Connector',
                    'Mentor',
                    'Disruptor',
                    'Optimizer',
                    'Visionary',
                    'Pragmatist',
                    'Catalyst',
                    'Guardian',
                  ].map((attr) => (
                    <button
                      key={attr}
                      onClick={() => {
                        const current = userData.attributes;
                        const next = current.includes(attr)
                          ? current.filter((a) => a !== attr)
                          : [...current, attr];
                        setUserData({ ...userData, attributes: next });
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
                {errors.attributes && (
                  <p className="text-sm text-red-500 text-center">{errors.attributes}</p>
                )}

                <div className="flex justify-between items-center">
                  <Button onClick={() => setStep('module3')} variant="secondary">
                    Back
                  </Button>
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
                className="max-w-4xl mx-auto px-6 space-y-12 pb-24"
              >
                <header className="space-y-4">
                  <div className="flex items-center gap-3 text-neon-cyan">
                    <Film className="w-6 h-6" />
                    <span className="font-display font-bold uppercase tracking-widest">
                      Module 5
                    </span>
                    <InspirationTooltip content="Your tagline should be a punchy summary of your current professional mission. Think of it as the 'hook' for your career story." />
                  </div>
                  <h2 className="text-4xl font-bold">Season 1: The Movie Poster</h2>
                  <p className="text-white/60">
                    Your career is a story. What is the tagline for this season of your professional
                    life?
                  </p>
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
                      <p className="text-xs font-display uppercase tracking-[0.3em] text-neon-cyan">
                        A SPARKWavv Original
                      </p>
                      <h3 className="text-4xl font-display font-bold tracking-tighter uppercase">
                        {userData.onboarding.name}
                      </h3>
                    </div>

                    <div className="w-full space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">
                          The Tagline
                        </label>
                        <span
                          className={`text-[8px] ${userData.tagline.length > 100 ? 'text-red-500' : 'text-white/20'}`}
                        >
                          {userData.tagline.length}/100
                        </span>
                      </div>
                      <input
                        type="text"
                        className={`w-full bg-white/10 backdrop-blur-md border rounded-lg px-4 py-3 text-center text-sm focus:outline-none transition-all ${errors.tagline ? 'border-red-500' : 'border-white/20 focus:border-neon-cyan'}`}
                        placeholder="e.g., Building the future, one pixel at a time."
                        value={userData.tagline}
                        onChange={(e) => setUserData({ ...userData, tagline: e.target.value })}
                      />
                      {errors.tagline && (
                        <p className="text-[10px] text-red-500">{errors.tagline}</p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      {userData.attributes.slice(0, 3).map((a) => (
                        <span
                          key={a}
                          className="text-[10px] uppercase tracking-widest px-2 py-1 border border-white/20 rounded bg-white/5"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-display uppercase tracking-widest text-white/40 text-center">
                    Choose Your Poster Vibe
                  </h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['Minimalist', 'Brutalist', 'Corporate', 'Creative'].map((vibe) => (
                      <button
                        key={vibe}
                        onClick={() => setPosterVibe(vibe as any)}
                        className={`px-4 py-2 rounded-full border text-xs transition-all ${
                          posterVibe === vibe
                            ? 'bg-neon-cyan/10 border-neon-cyan text-neon-cyan'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                        }`}
                      >
                        {vibe}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Button onClick={() => setStep('module4')} variant="secondary">
                    Back
                  </Button>
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
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-bg/90 backdrop-blur-3xl"
              >
                <div className="absolute inset-0 atmosphere opacity-40" />
                <div className="relative z-10 flex flex-col items-center space-y-8 max-w-md px-6 text-center">
                  <div className="relative">
                    <motion.div
                      className="w-32 h-32 border-2 border-neon-cyan/30 rounded-full"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <Loader2 className="w-12 h-12 text-neon-cyan animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-bold animate-pulse-neon">
                      Synthesizing Your Brand DNA
                    </h2>
                    <p className="text-white/60 leading-relaxed">
                      Skylar is distilling your stories, passions, and achievements into a
                      high-impact professional identity. This takes a moment of deep focus...
                    </p>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-neon-cyan shadow-[0_0_15px_rgba(0,243,255,0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 15, ease: 'linear' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'synthesis' && (
              <CinematicSynthesis
                dashboardData={dashboardData}
                onComplete={(secretId) => {
                  setStep('results');
                  // Optionally store secretId in local state if needed for immediate display
                }}
              />
            )}

            {step === 'results' && summary && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-7xl mx-auto px-6 space-y-12 pb-24"
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
                      <h3 className="text-sm font-display uppercase tracking-widest text-neon-cyan">
                        Brand Portrait
                      </h3>
                      <p className="text-2xl font-medium leading-relaxed italic">
                        "{summary.brandPortrait}"
                      </p>
                    </section>

                    <div className="grid sm:grid-cols-2 gap-8">
                      <section className="glass-panel p-8 space-y-4">
                        <h3 className="text-sm font-display uppercase tracking-widest text-neon-magenta">
                          Core Strengths
                        </h3>
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
                        <h3 className="text-sm font-display uppercase tracking-widest text-neon-lime">
                          Career Clusters
                        </h3>
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
                          <div
                            key={i}
                            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-neon-cyan/40 transition-colors cursor-pointer group"
                          >
                            <p className="text-sm text-white/80 group-hover:text-white transition-colors">
                              {e}
                            </p>
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
                      <div
                        key={i}
                        className="flex flex-col p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-neon-cyan/40 transition-all hover:translate-y-[-4px] group"
                      >
                        <h4 className="text-lg font-bold text-white group-hover:text-neon-cyan transition-colors mb-2">
                          {step.title}
                        </h4>
                        <p className="text-sm text-white/60 leading-relaxed mb-6 flex-grow">
                          {step.description}
                        </p>
                        <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neon-cyan hover:text-white transition-colors">
                          {step.actionLabel}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <footer className="text-center pt-12">
                  <Button
                    onClick={() => {
                      localStorage.removeItem('sparkwavv_user_data');
                      localStorage.removeItem('sparkwavv_current_step');
                      localStorage.removeItem('sparkwavv_summary');
                      setStep('landing');
                    }}
                    variant="secondary"
                  >
                    Start New Ignition
                  </Button>
                </footer>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <Footer
          onNavigate={(s) => {
            window.scrollTo(0, 0);
            setStep(s as Step);
          }}
        />

        {/* Skylar AI Integration */}
        {!isAdmin && (
          <SkylarSidebar
            onLogin={() => {
              window.scrollTo(0, 0);
              setStep('login');
            }}
          />
        )}
        {!isAdmin && <EveningSpark energyTrough={dashboardData?.energyTrough} onClose={() => {}} />}
      </div>
    </div>
  );
}

const UserDashboardWrapper = ({ isAdmin }: { isAdmin: boolean }) => {
  const { userId } = useParams<{ userId: string }>();
  return (
    <OnboardingGate>
      {!isAdmin && <TimeoutManager />}
      <UserDashboard userId={userId || 'default'} isAdmin={isAdmin} />
      {!isAdmin && <SkylarSidebar />}
    </OnboardingGate>
  );
};

const AdminRoute = ({
  children,
  requiredRoles = ['super_admin', 'admin', 'editor', 'viewer'],
  requiredEntryPoint,
}: {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredEntryPoint?: 'admin' | 'operations';
}) => {
  const { user, role, status, loading, error } = useIdentity();

  useEffect(() => {
    if (!loading) {
      console.log('🛡️ [AdminRoute] Check:', {
        hasUser: !!user,
        email: user?.email,
        role,
        requiredRoles,
        status,
        loading,
        requiredEntryPoint,
        pathname: window.location.pathname,
      });
    } else {
      console.log('🛡️ [AdminRoute] Loading...', { status, loading });
    }
  }, [loading, user, role, status, requiredRoles, requiredEntryPoint]);

  if (loading || status === 'initializing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
        <div className="max-w-md w-full bg-black/40 border border-neon-magenta/20 p-8 rounded-3xl backdrop-blur-xl text-center space-y-6">
          <div className="w-20 h-20 bg-neon-magenta/10 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-10 h-10 text-neon-magenta" />
          </div>
          <h2 className="text-2xl font-bold text-white">Authentication Error</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            {error ||
              'An unexpected error occurred during authentication. This may be due to a timeout or connection issue within the preview environment.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:scale-[1.02] transition-transform"
          >
            Retry Login
          </button>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to login
  if (!user || status === 'unauthenticated') {
    const loginPath = requiredEntryPoint === 'operations' ? '/operations/login' : '/admin/login';
    return <Navigate to={loginPath} replace />;
  }

  // Logged in but wrong role -> Access Denied (don't redirect to login)
  if (!role || !requiredRoles.includes(role)) {
    return <AccessDenied requiredRole={requiredRoles[0]} />;
  }

  // Entry point check (Operators strictly locked to operations)
  if (role === 'operator' && requiredEntryPoint === 'admin') {
    return <AccessDenied requiredRole="admin" />;
  }

  return <>{children}</>;
};

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const { user, role, status, loading, error, refreshIdentity, isAuthenticated } = useIdentity();
  const [showRetry, setShowRetry] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
  const isStaff = isAdmin || role === ROLES.EDITOR || role === ROLES.OPERATOR;
  const isGuest = role === ROLES.GUEST;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === 'authenticated' || status === 'initializing') {
      // Increase timeout to 30 seconds to allow for slower initial loads in AI Studio
      timer = setTimeout(() => setShowRetry(true), 30000);
    } else {
      setShowRetry(false);
    }
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (status === 'ready' || status === 'authenticated') {
      console.log('🛡️ [App] Status Check:', { role, isAdmin, path: location.pathname, status });
    }
  }, [status, role, isAdmin, location.pathname]);

  useEffect(() => {
    if (status === 'ready' && isAdmin && location.pathname === '/') {
      console.log('🛡️ [App] Admin detected on home page, redirecting to /admin');
      navigate('/admin', { replace: true });
    }
    if (status === 'ready' && role === ROLES.EDITOR && location.pathname === '/') {
      console.log('🛡️ [App] Editor detected on home page, redirecting to /operations');
      navigate('/operations', { replace: true });
    }
    if (status === 'ready' && isGuest && location.pathname !== '/dive-in') {
      console.log('🛡️ [App] Guest detected, redirecting to /dive-in');
      navigate('/dive-in', { replace: true });
    }
  }, [status, isAdmin, role, isGuest, location.pathname, navigate]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6">
        <div className="max-w-md w-full bg-black/40 border border-red-500/20 p-8 rounded-3xl backdrop-blur-xl text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight">
            Authentication Error
          </h2>
          <div className="space-y-2">
            <p className="text-white/60 text-sm leading-relaxed">
              {error || 'An unexpected error occurred during authentication.'}
            </p>
            <p className="text-white/30 text-[10px] uppercase tracking-widest">
              Preview Environment Constraint Detected
            </p>
          </div>
          <div className="pt-4 space-y-3">
            {error?.includes('auth/network-request-failed') || error?.includes('popup-blocked') || error?.includes('3rd party cookies') ? (
              <button
                onClick={() => window.open(window.location.href, '_blank')}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                Open in New Tab (Fixes Preview Issue)
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (location.pathname === '/dive-in' || location.pathname === '/') {
                    window.location.href = '/';
                  } else {
                    window.location.href = '/admin/login';
                  }
                }}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:scale-[1.02] transition-transform"
              >
                {location.pathname === '/dive-in' || location.pathname === '/'
                  ? 'Retry Login'
                  : 'Retry Admin Login'}
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-colors"
            >
              Refresh Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || status === 'initializing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white p-6">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative z-10" />
        </div>

        <div className="text-center space-y-4 max-w-md relative z-10">
          <h2 className="text-2xl font-display font-bold tracking-tight">
            {status === 'initializing' ? 'Initializing Identity...' : 'Loading Profile...'}
          </h2>
          <p className="text-white/40 text-sm uppercase tracking-[0.2em]">
            Securing Stateless Identity Engine
          </p>

          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 text-left">
            <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40">
              <span>Status</span>
              <span className="text-blue-400 font-mono">{status}</span>
            </div>
            <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40">
              <span>Identity Platform</span>
              <span className={isAuthenticated ? 'text-green-500' : 'text-yellow-500'}>
                {isAuthenticated ? 'Authenticated' : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40">
              <span>Role</span>
              <span className="text-blue-400 font-mono">{role || 'null'}</span>
            </div>
          </div>

          {showRetry && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-8 space-y-4"
            >
              {error && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-3 rounded-xl italic">
                  {error}
                </p>
              )}
              <button
                onClick={() => {
                  setShowRetry(false);
                  refreshIdentity();
                }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm font-bold uppercase tracking-widest flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Connection
              </button>
              <p className="text-[10px] text-white/20">
                If the error persists, please check your internet connection or try again later.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <SkylarConfigProvider>
      <ScrollToTop />

      <Suspense
        fallback={
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white">
            <Loader2 className="w-12 h-12 text-neon-cyan animate-spin" />
            <p className="mt-4 text-white/40 uppercase tracking-widest text-xs">
              Loading Module...
            </p>
          </div>
        }
      >
        <Routes>
          <Route path="/brand/:secretId" element={<PublicBrandPage />} />
          <Route path="/share/:shareId" element={<ShareView />} />
          <Route path="/admin/login" element={<AdminLogin vibe="technical" onLogin={() => {}} />} />
          <Route
            path="/operations/login"
            element={<AdminLogin vibe="vibrant" onLogin={() => {}} />}
          />
          <Route path="/login" element={<Login />} />

          <Route
            path="/admin"
            element={
              <AdminRoute
                requiredRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}
                requiredEntryPoint="admin"
              >
                <AdminDashboard onLogout={() => (window.location.href = '/admin/login')} />
              </AdminRoute>
            }
          />

          <Route
            path="/operations"
            element={
              <AdminRoute
                requiredRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR, ROLES.OPERATOR]}
                requiredEntryPoint="operations"
              >
                <OperationsDashboard
                  onLogout={() => (window.location.href = '/operations/login')}
                />
              </AdminRoute>
            }
          />

          <Route path="/dive-in" element={<DiveInPage />} />

          <Route
            path="/"
            element={
              isAdmin ? (
                <Navigate to="/admin" replace />
              ) : role === ROLES.EDITOR ? (
                <Navigate to="/operations" replace />
              ) : isGuest ? (
                <Navigate to="/dive-in" replace />
              ) : (
                <SPARKWavvApp isAdmin={false} />
              )
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute user={user} onRedirect={() => (window.location.href = '/')}>
                <SPARKWavvApp initialStep="settings" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRoute user={user} onRedirect={() => (window.location.href = '/')}>
                <CommunityPage />
              </ProtectedRoute>
            }
          />
          <Route path="/sparkwavv-admin" element={<Navigate to="/admin" replace />} />
          <Route
            path="/dashboard/:userId"
            element={
              <ProtectedRoute user={user} onRedirect={() => (window.location.href = '/login')}>
                <UserDashboardWrapper isAdmin={!!isAdmin} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner-dashboard"
            element={
              <ProtectedRoute user={user} onRedirect={() => (window.location.href = '/login')}>
                <PartnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute user={user} onRedirect={() => (window.location.href = '/login')}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vault"
            element={
              <ProtectedRoute user={user} onRedirect={() => (window.location.href = '/login')}>
                <OnboardingGate>
                  <WavvaultPage />
                </OnboardingGate>
              </ProtectedRoute>
            }
          />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookies" element={<CookieSettings />} />
          <Route path="/partner/login" element={<PartnerLogin />} />
          <Route path="/partner/dashboard" element={<PartnerDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </SkylarConfigProvider>
  );
}
