import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import {
  LayoutDashboard,
  User as UserIcon,
  Award,
  Briefcase,
  Users,
  Settings,
  Search,
  Compass,
  Handshake,
  Bell,
  ChevronRight,
  Zap,
  Loader2,
  Database,
  Lock,
  Clock,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Target,
  Rocket,
  Brain,
  FileText,
  Sparkles,
  Search as SearchIcon,
  UserPlus,
  Send,
  CheckCircle2,
  LogOut,
  History,
  Camera,
  Menu,
} from 'lucide-react';
import { audioService } from '../services/audioService';
import { SynthesisNarrative } from '../components/dashboard/SynthesisNarrative';
import { DiscoveryBento } from '../components/dashboard/discovery/DiscoveryBento';
import { SkylarSidePanel } from '../components/dashboard/discovery/SkylarSidePanel';
import { DashboardData, Expense, Milestone } from '../types/dashboard';
import { useIdentity } from '../contexts/IdentityContext';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { InvitationModal } from '../components/InvitationModal';
import { PartnerSelectionModal } from '../components/PartnerSelectionModal';
import { EveningSpark } from '../components/EveningSpark';
import { logUserActivity } from '../services/activityService';
import { calculateAndUpdateProgress } from '../services/progressService';
import { NeuralSynthesisEngine } from '../components/dashboard/NeuralSynthesisEngine';
import { HighFidelitySynthesisLab } from '../components/skylar/HighFidelitySynthesisLab';
import { OutreachForge } from '../components/skylar/OutreachForge';
import { JobMatchesView } from '../components/dashboard/JobMatchesView';
import { HistoryView } from '../components/dashboard/HistoryView';
import { StrengthsView } from '../components/dashboard/StrengthsView';
import { PhaseDetails } from '../components/kickspark/PhaseDetails';
import { MilestoneRoadmap } from '../components/kickspark/MilestoneRoadmap';
import { EvolutionVisualizer } from '../components/EvolutionVisualizer';
import { UserInsight, UserActivity } from '../types/dashboard';
import { ArtifactModal } from '../components/dashboard/ArtifactModal';
import { DistilledArtifact } from '../types/wavvault';
import { X, Eye, EyeOff, Brain as BrainIcon } from 'lucide-react';
import { SentimentMotivationModal } from '../components/dashboard/SentimentMotivationModal';
import { GateReviewModal } from '../components/dashboard/GateReviewModal';
import { SectorIntelligence } from '../components/dashboard/SectorIntelligence';
import { InactivityTimeout } from '../components/dashboard/InactivityTimeout';
import { RequiredActions } from '../components/dashboard/RequiredActions';
import { WavvaultHighlights } from '../components/dashboard/WavvaultHighlights';
import { useWavvaultData } from '../hooks/useWavvaultData';
import { skylar } from '../services/skylarService';
import { GaugeChart } from '../components/dashboard/Gauges';
import { JourneyTimeline } from '../components/dashboard/JourneyTimeline';
import { MentorNote } from '../components/dashboard/MentorNote';
import {
  DiveInView,
  IgnitionView,
  DiscoveryView,
  BrandingView,
  OutreachView,
} from '../components/dashboard/PhaseViews';

// Map journey stages to timeline stages
export const getTimelineStage = (s: string) => {
  const normalized = s.toLowerCase();
  if (normalized === 'dive-in') return 'Dive-In';
  if (normalized === 'ignition') return 'Ignition';
  if (normalized === 'discovery' || normalized === 'search') return 'Discovery';
  if (normalized === 'branding' || normalized === 'map') return 'Branding';
  if (normalized === 'outreach' || normalized === 'match') return 'Outreach';
  return s;
};

import { getGeminiApiKey } from '../services/aiConfig';

export const UserDashboard: React.FC<{ userId: string; isAdmin?: boolean }> = ({
  userId,
  isAdmin = false,
}) => {
  const { user, profile, status, error: authError } = useIdentity();
  const isConfirmed = status === 'authenticated';
  const navigate = useNavigate();
  const { artifacts } = useWavvaultData();
  const [data, setData] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<UserInsight[]>([]);
  const [showEvolution, setShowEvolution] = useState(false);
  const [showSynthesisNarrative, setShowSynthesisNarrative] = useState(false);
  const [newInsights, setNewInsights] = useState<UserInsight[]>([]);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activePartners, setActivePartners] = useState<any[]>([]);
  const [activePhaseView, setActivePhaseView] = useState<'ignition' | 'discovery'>('ignition');
  const [selectedArtifact, setSelectedArtifact] = useState<DistilledArtifact | null>(null);
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);

  const handleActivityClick = (activity: UserActivity) => {
    if (activity.type === 'artifact_created' && activity.relatedEntityId) {
      const artifact = artifacts.find(a => a.id === activity.relatedEntityId);
      if (artifact) {
        setSelectedArtifact(artifact);
        setIsArtifactModalOpen(true);
      }
    }
  };

  const currentStage =
    data?.discoveryProgress || (isAdmin ? 'Dive-In' : profile?.journeyStage) || 'Dive-In';
  const timelineStage = getTimelineStage(currentStage);

  useEffect(() => {
    if (timelineStage === 'Discovery') {
      setActivePhaseView('discovery');
      audioService.startMomentumPulse();
    } else {
      setActivePhaseView('ignition');
      audioService.startAmbientHum();
    }
    return () => {
      audioService.stopAmbientHum();
      audioService.stopMomentumPulse();
    };
  }, [timelineStage]);

  useEffect(() => {
    if (!data || !user || !artifacts) return;
    
    const updateProgress = async () => {
      const newProgress = await calculateAndUpdateProgress(userId, data, artifacts);
      if (newProgress && JSON.stringify(newProgress) !== JSON.stringify(data.phaseProgress)) {
        setData(prev => prev ? { ...prev, phaseProgress: newProgress } : prev);
      }
    };
    
    updateProgress();
  }, [artifacts.length, user]); // Only re-run when artifact count changes to avoid infinite loops if data changes

  useEffect(() => {
    const fetchPartnerData = async () => {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();

        // Fetch suggestions
        const suggestionsRes = await fetch('/api/user/suggestions', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (suggestionsRes.ok) {
          setSuggestions(await suggestionsRes.json());
        }

        // Fetch active partners
        const partnersRes = await fetch('/api/user/partners', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (partnersRes.ok) {
          setActivePartners(await partnersRes.json());
        }
      } catch (error) {
        console.error('Error fetching partner data:', error);
      }
    };

    fetchPartnerData();
  }, [user]);

  const handlePartnerSelect = async (tenantId: string) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      await fetch('/api/user/connect-partner', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      });
      setIsPartnerModalOpen(false);
      // Refresh partners
      const partnersRes = await fetch('/api/user/partners', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      setActivePartners(await partnersRes.json());
      alert(`Connected with ${tenantId}! They now have read-only access.`);
    } catch (error) {
      console.error('Error connecting partner:', error);
    }
  };

  const handleSuggestionResponse = async (
    suggestionId: string,
    status: 'accepted' | 'declined'
  ) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const suggestion = suggestions.find((s) => s.id === suggestionId);
      let synthesisNote = '';

      if (status === 'accepted' && suggestion) {
        // Call Gemini for synthesis note
        const prompt = `As Skylar, the AI Career Engine, generate a brief "Synthesis Note" (max 2 sentences) explaining how this new insight from a Partner integrates with the user's existing DNA. 
        Suggestion Type: ${suggestion.type}
        Content: ${JSON.stringify(suggestion.content)}
        Partner: ${suggestion.partnerName}`;

        try {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
          });
          synthesisNote = response.text || 'Insight synthesized into your professional DNA.';
        } catch (e) {
          console.error('Gemini synthesis failed:', e);
          synthesisNote = 'Insight synthesized into your professional DNA.';
        }
      }

      const res = await fetch(`/api/user/suggestions/${suggestionId}/respond`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, synthesisNote }),
      });

      if (res.ok) {
        if (status === 'accepted') {
          alert(`Suggestion accepted! Skylar Synthesis: ${synthesisNote}`);
        }
        // Refresh suggestions
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
      }
    } catch (error) {
      console.error('Error responding to suggestion:', error);
    }
  };

  const togglePartnerPermission = async (partnerId: string, currentPermissions: string[]) => {
    if (!user) return;
    const newPermissions = currentPermissions.includes('propose') ? ['read'] : ['read', 'propose'];

    try {
      const idToken = await user.getIdToken();
      await fetch(`/api/user/partners/${partnerId}/permissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions: newPermissions }),
      });
      // Refresh partners
      const partnersRes = await fetch('/api/user/partners', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      setActivePartners(await partnersRes.json());
    } catch (error) {
      console.error('Error toggling partner permission:', error);
    }
  };
  const [transparencyMode, setTransparencyMode] = useState<'under-the-hood' | 'full'>(
    (localStorage.getItem('skylar_transparency') as any) || 'under-the-hood'
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<
    'dashboard' | 'synthesis' | 'matches' | 'outreach' | 'strengths' | 'history'
  >(() => {
    const view = searchParams.get('view');
    if (view === 'matches') return 'matches';
    if (view === 'synthesis') return 'synthesis';
    if (view === 'outreach') return 'outreach';
    if (view === 'strengths') return 'strengths';
    if (view === 'history') return 'history';
    return 'dashboard';
  });

  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'matches') setActiveView('matches');
    else if (view === 'synthesis') setActiveView('synthesis');
    else if (view === 'outreach') setActiveView('outreach');
    else if (view === 'strengths') setActiveView('strengths');
    else if (view === 'history') setActiveView('history');
    else setActiveView('dashboard');
  }, [searchParams]);

  const handleViewChange = (
    view: 'dashboard' | 'synthesis' | 'matches' | 'outreach' | 'strengths' | 'history'
  ) => {
    setActiveView(view);
    setSearchParams({ view });
    setIsMobileMenuOpen(false);
  };

  const [isEQModalOpen, setIsEQModalOpen] = useState(false);
  const [eqData, setEqData] = useState<any>(null);
  const [isGateModalOpen, setIsGateModalOpen] = useState(false);
  const [gateData, setGateData] = useState<any>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  const theme = profile?.brandPersona === 'Right Brain' ? 'yang' : 'yin';

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    return () => document.body.removeAttribute('data-theme');
  }, [theme]);

  const handleOpenEQ = async () => {
    if (!user) return;
    setIsEQModalOpen(true);
    try {
      const history = await skylar.getChatHistory(userId);
      const analysis = await skylar.getEmotionalIntelligence(userId, history);
      setEqData(analysis);
    } catch (err) {
      console.error('Error fetching EQ data:', err);
    }
  };

  const initiateGateReview = async (targetStage: string) => {
    if (!user || isReviewing) return;

    setIsReviewing(true);
    setIsGateModalOpen(true);
    setGateData({
      currentPhase: timelineStage,
      targetPhase: targetStage,
      status: 'reviewing',
      message: 'Skylar is analyzing your progress and DNA alignment...',
      criteria: [],
    });

    try {
      const history = await skylar.getChatHistory(userId);
      const review = await skylar.performGateReview(userId, timelineStage, targetStage, history);
      setGateData({
        ...review,
        currentPhase: timelineStage,
        targetPhase: targetStage,
      });
    } catch (err) {
      console.error('Error performing gate review:', err);
      setGateData((prev) => ({
        ...prev,
        status: 'denied',
        message: 'Validation service unavailable. Please try again later.',
      }));
    } finally {
      setIsReviewing(false);
    }
  };

  const handleOverride = async () => {
    if (!gateData) return;
    await handleCompletePhase(gateData.targetPhase);
    setIsGateModalOpen(false);
  };

  // Expose gate review to timeline component
  useEffect(() => {
    (window as any).initiateGateReview = initiateGateReview;
    return () => {
      delete (window as any).initiateGateReview;
    };
  }, [initiateGateReview]);

  // Prevent admins from viewing their own user dashboard
  useEffect(() => {
    if (status === 'ready' && profile?.role === 'admin' && userId === profile.uid) {
      console.log('🛡️ Admin attempting to view own user dashboard, redirecting to admin portal');
      navigate('/sparkwavv-admin', { replace: true });
    }
  }, [status, profile, userId, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      try {
        setLoading(true);
        const idToken = await user.getIdToken();
        const response = await fetch(`/api/user/dashboard?userId=${userId}`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const dashboardData = await response.json();
          setData(dashboardData);
          setError(null);
        } else {
          const errData = await response.json();
          setError(errData.error || 'Failed to load dashboard');
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          setError('Dashboard request timed out. Please check your connection.');
        } else {
          console.error('Error fetching dashboard data:', err);
          setError('Network error or server unavailable');
        }
      } finally {
        setLoading(false);
      }
    };

    if (status !== 'initializing' && user) {
      fetchData();
      fetchInsights();
    }
  }, [userId, user, status]);

  const fetchInsights = async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/user-insights?userId=${userId}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (response.ok) {
        const insightsData = await response.json();
        setInsights(insightsData);

        // Check for new insights since last visit
        const lastCount = parseInt(localStorage.getItem(`last_insight_count_${userId}`) || '0');
        if (insightsData.length > lastCount && lastCount > 0) {
          const newlySynthesized = insightsData.slice(0, insightsData.length - lastCount);
          setNewInsights(newlySynthesized);
          setShowSynthesisNarrative(true);
        }
        localStorage.setItem(`last_insight_count_${userId}`, insightsData.length.toString());

        // Seed initial DNA if no insights exist
        if (insightsData.length === 0 && profile) {
          seedInitialDNA();
        }
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
    }
  };

  const seedInitialDNA = async () => {
    if (!user || !profile) return;

    const initialInsights: Partial<UserInsight>[] = [
      {
        type: 'primary_goal',
        content: profile.careerStageRole || 'Defining career trajectory',
        status: 'confirmed',
        evidence: 'Initial profile setup',
        tags: ['initial-dna', 'career-stage'],
      },
      {
        type: 'strength',
        content: profile.brandDNAAttributes?.join(', ') || 'General professional strengths',
        status: 'confirmed',
        evidence: 'Initial profile setup',
        tags: ['initial-dna', 'strengths'],
      },
    ];

    try {
      const idToken = await user.getIdToken();
      for (const insight of initialInsights) {
        await fetch('/api/user-insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ ...insight, userId }),
        });
      }
      // Refresh insights after seeding
      fetchInsights();
    } catch (err) {
      console.error('Error seeding initial DNA:', err);
    }
  };

  const toggleTransparency = () => {
    const newMode = transparencyMode === 'under-the-hood' ? 'full' : 'under-the-hood';
    setTransparencyMode(newMode);
    localStorage.setItem('skylar_transparency', newMode);
  };

  const toggleSkylar = () => {
    window.dispatchEvent(new CustomEvent('toggle-skylar-sidebar'));
  };

  const handleToggleMilestone = async (milestoneId: string) => {
    if (!data || !user) return;

    const updatedMilestones =
      data.milestones?.map((m) => (m.id === milestoneId ? { ...m, completed: !m.completed } : m)) ||
      [];

    // Optimistic update
    setData({ ...data, milestones: updatedMilestones });

    try {
      const idToken = await user.getIdToken();
      const milestone = updatedMilestones.find((m) => m.id === milestoneId);

      const url = '/api/user/milestones';

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          milestoneId,
          completed: milestone?.completed ?? false,
        }),
      });

      if (milestone?.completed) {
        await logUserActivity(
          userId,
          'default',
          'milestone_completed',
          `Completed Milestone: ${milestone.label}`,
          `You have successfully completed the milestone: ${milestone.label}.`,
          data.discoveryProgress as any,
          milestoneId,
          ['milestone']
        );
      }

      // Update progress
      const newProgress = await calculateAndUpdateProgress(userId, { ...data, milestones: updatedMilestones }, artifacts);
      if (newProgress) {
        setData(prev => prev ? { ...prev, phaseProgress: newProgress } : prev);
      }
    } catch (err) {
      console.error('Error toggling milestone:', err);
    }
  };

  const handleCompletePhase = async (nextStage: string) => {
    if (!data || !user) return;

    try {
      const idToken = await user.getIdToken();
      const url = '/api/user/stage';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ nextStage }),
      });

      if (response.ok) {
        // Update local state
        setData({ ...data, discoveryProgress: nextStage as any });
        // The profile in AuthContext might need a refresh or we can just rely on the dashboard data for now
        // Since we unified the stage usage to timelineStage which uses data.discoveryProgress, it will update the UI
        
        // Log activity
        await logUserActivity(
          userId,
          'default', // Default tenantId
          'phase_unlocked',
          `Unlocked Phase: ${nextStage}`,
          `You have successfully advanced to the ${nextStage} phase of your journey.`,
          nextStage as any
        );
      }
    } catch (err) {
      console.error('Error completing phase:', err);
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      navigate('/');
    }
  };

  if (status === 'initializing' || (loading && !data)) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-neon-cyan animate-spin mb-4" />
        <p className="text-white/40 text-xs uppercase tracking-widest animate-pulse">
          Initializing Skylar Dashboard...
        </p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/" />;
  }

  if (status === 'error' || (error && !data)) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-neon-magenta mb-4" />
        <h1 className="text-2xl font-display font-bold mb-2">Dashboard Error</h1>
        <p className="text-white/60 mb-6 max-w-md">
          {error || authError || 'An unexpected error occurred during initialization.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-neon-cyan text-black font-bold rounded-xl hover:bg-neon-cyan/80 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white font-sans selection:bg-neon-cyan selection:text-black flex overflow-hidden h-screen">
      <InactivityTimeout />
      {/* Synthesis Narrative Overlay */}
      <AnimatePresence>
        {showSynthesisNarrative && (
          <SynthesisNarrative
            insights={newInsights}
            onComplete={() => setShowSynthesisNarrative(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-black border-r border-white/5 p-8 flex flex-col gap-10 z-[160] lg:hidden"
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-neon-cyan" />
                  </div>
                  <span className="text-2xl font-display font-bold tracking-tight text-white">
                    Skylar
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-3">
                {[
                  {
                    icon: LayoutDashboard,
                    label: 'Dashboard',
                    active: activeView === 'dashboard',
                    onClick: () => handleViewChange('dashboard'),
                  },
                  { icon: BrainIcon, label: 'Emotional DNA', onClick: handleOpenEQ },
                  {
                    icon: Award,
                    label: 'My Strengths',
                    active: activeView === 'strengths',
                    onClick: () => handleViewChange('strengths'),
                  },
                  {
                    icon: Briefcase,
                    label: 'Job Matches',
                    active: activeView === 'matches',
                    onClick: () => handleViewChange('matches'),
                  },
                  {
                    icon: Camera,
                    label: 'Synthesis Lab',
                    active: activeView === 'synthesis',
                    onClick: () => handleViewChange('synthesis'),
                  },
                  {
                    icon: Send,
                    label: 'Outreach Forge',
                    active: activeView === 'outreach',
                    onClick: () => handleViewChange('outreach'),
                  },
                  {
                    icon: History,
                    label: 'History',
                    active: activeView === 'history',
                    onClick: () => handleViewChange('history'),
                  },
                  { icon: Database, label: 'Vault', path: '/vault' },
                  { icon: UserIcon, label: 'Profile', path: '/profile' },
                  { icon: Users, label: 'Community', path: '/community' },
                  { icon: Settings, label: 'Settings', path: '/settings' },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => (item.onClick ? item.onClick() : navigate(item.path!))}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                      item.active
                        ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 neon-border-cyan'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-bold tracking-wide">{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-auto">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-neon-magenta hover:bg-neon-magenta/10 transition-all group"
                >
                  <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold tracking-wide">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-72 bg-black border-r border-white/5 p-8 flex flex-col gap-10 hidden lg:flex shrink-0">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-neon-cyan" />
          </div>
          <span className="text-2xl font-display font-bold tracking-tight">Skylar</span>
        </div>

        <nav className="flex flex-col gap-3">
          {[
            {
              icon: LayoutDashboard,
              label: 'Dashboard',
              active: activeView === 'dashboard',
              onClick: () => handleViewChange('dashboard'),
            },
            { icon: BrainIcon, label: 'Emotional DNA', onClick: handleOpenEQ },
            {
              icon: Camera,
              label: 'Synthesis Lab',
              active: activeView === 'synthesis',
              onClick: () => handleViewChange('synthesis'),
            },
            {
              icon: Send,
              label: 'Outreach Forge',
              active: activeView === 'outreach',
              onClick: () => handleViewChange('outreach'),
            },
            {
              icon: History,
              label: 'History',
              active: activeView === 'history',
              onClick: () => handleViewChange('history'),
            },
            { icon: Database, label: 'Vault', path: '/vault' },
            { icon: UserIcon, label: 'Profile', path: '/profile' },
            {
              icon: Award,
              label: 'My Strengths',
              active: activeView === 'strengths',
              onClick: () => handleViewChange('strengths'),
            },
            {
              icon: Briefcase,
              label: 'Job Matches',
              active: activeView === 'matches',
              onClick: () => handleViewChange('matches'),
            },
            { icon: Users, label: 'Community', path: '/community' },
            { icon: Settings, label: 'Settings', path: '/settings' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => (item.onClick ? item.onClick() : navigate(item.path!))}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                item.active
                  ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 neon-border-cyan'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-bold tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-neon-magenta hover:bg-neon-magenta/10 transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold tracking-wide">Logout</span>
          </button>

          <button
            onClick={toggleSkylar}
            className="w-full glass-panel p-6 rounded-[2rem] border border-neon-cyan/20 bg-neon-cyan/5 hover:bg-neon-cyan/10 transition-all text-center group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles className="w-16 h-16 text-neon-cyan" />
            </div>
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-neon-cyan/20 border-2 border-neon-cyan/40 p-1">
                <div className="w-full h-full rounded-full overflow-hidden bg-black">
                  <img
                    src="https://picsum.photos/seed/skylar/200"
                    alt="Skylar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <div>
                <h4 className="text-xl font-display font-bold text-white group-hover:text-neon-cyan transition-colors">
                  Skylar
                </h4>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">
                  (AI Companion)
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-neon-cyan uppercase tracking-widest font-bold">
                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                Online
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-24 border-b border-white/5 px-6 md:px-12 flex items-center justify-between bg-black/20 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4 md:gap-8">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-display font-bold tracking-tight">
                {activePhaseView === 'discovery' ? 'Discovery Bento' : 'Ignition Dashboard'}
              </h1>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">
                {activePhaseView === 'discovery'
                  ? 'Market Resonance & Strategic Alignment'
                  : 'Synthesis & Professional DNA Evolution'}
              </p>
            </div>

            <div className="h-8 w-px bg-white/10" />

            <div className="flex items-center gap-4">
              <button
                onClick={() => handleViewChange('dashboard')}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeView === 'dashboard' ? 'bg-neon-cyan text-black' : 'text-white/40 hover:text-white'}`}
              >
                Overview
              </button>
              <button
                onClick={() => handleViewChange('synthesis')}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeView === 'synthesis' ? 'bg-neon-cyan text-black' : 'text-white/40 hover:text-white'}`}
              >
                Evolution
              </button>
              <button
                onClick={() => handleViewChange('matches')}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeView === 'matches' ? 'bg-neon-cyan text-black' : 'text-white/40 hover:text-white'}`}
              >
                Market Fit
              </button>
              <button
                onClick={() => handleViewChange('strengths')}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeView === 'strengths' ? 'bg-neon-cyan text-black' : 'text-white/40 hover:text-white'}`}
              >
                Strengths
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-neon-lime animate-pulse shadow-[0_0_10px_rgba(57,255,20,0.5)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                Skylar Active
              </span>
            </div>

            <button className="relative p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-neon-magenta rounded-full border-2 border-black" />
            </button>

            <div className="flex items-center gap-3 pl-6 border-l border-white/10">
              <div className="text-right">
                <p className="text-xs font-bold text-white">
                  {profile?.displayName || user?.displayName || 'User'}
                </p>
                <p className="text-[10px] text-white/40 uppercase tracking-tighter font-bold">
                  {typeof profile?.role === 'string'
                    ? profile?.role
                    : (profile?.role as any)?.role || 'Member'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center overflow-hidden">
                {profile?.photoURL || user?.photoURL ? (
                  <img
                    src={profile?.photoURL || user?.photoURL || ''}
                    alt=""
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="w-5 h-5 text-neon-cyan" />
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {activePhaseView === 'discovery' ? (
            <DiscoveryBento userId={userId} />
          ) : (
            <div className="p-8 space-y-12">
              {activeView === 'synthesis' ? (
                <HighFidelitySynthesisLab />
              ) : activeView === 'outreach' ? (
                <OutreachForge userId={userId} />
              ) : activeView === 'matches' ? (
                <JobMatchesView onBack={() => handleViewChange('dashboard')} />
              ) : activeView === 'strengths' ? (
                <StrengthsView onBack={() => handleViewChange('dashboard')} />
              ) : activeView === 'history' ? (
                <HistoryView userId={userId} />
              ) : (
                <>
                  <div className="mb-12">
                    <EveningSpark currentStage={timelineStage as any} />
                  </div>

                  {data?.validationPending && (
                    <div className="mb-8 flex items-center gap-3 px-4 py-3 rounded-2xl bg-neon-magenta/10 border border-neon-magenta/20 text-neon-magenta text-xs font-bold uppercase tracking-widest animate-pulse">
                      <ShieldAlert className="w-5 h-5" />
                      <span>Status: Human Mentor Reviewing Progress</span>
                    </div>
                  )}

                  {data?.mentorNote && (
                    <MentorNote
                      note={data.mentorNote}
                      timestamp={data.mentorNoteTimestamp || new Date().toISOString()}
                    />
                  )}

                  {/* Partner Suggestions */}
                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-12 space-y-4"
                      >
                        <div className="flex items-center gap-2 text-amber-400 mb-4">
                          <Sparkles className="w-5 h-5" />
                          <h3 className="font-display font-bold text-sm tracking-tight uppercase">
                            Partner Suggestions
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {suggestions.map((suggestion) => (
                            <div
                              key={suggestion.id}
                              className="p-6 bg-amber-400/5 border border-amber-400/20 rounded-2xl flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-4">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/60">
                                    {suggestion.type === 'dna_shift'
                                      ? 'DNA Shift'
                                      : 'New Milestone'}
                                  </span>
                                  <span className="text-[10px] font-bold text-white/40">
                                    From: {suggestion.partnerName}
                                  </span>
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2">
                                  {suggestion.type === 'dna_shift'
                                    ? `Update ${suggestion.content.field}`
                                    : suggestion.content.title}
                                </h4>
                                <p className="text-sm text-white/60 mb-6">
                                  {suggestion.type === 'dna_shift'
                                    ? `Proposed value: ${suggestion.content.value}`
                                    : suggestion.content.description}
                                </p>
                              </div>
                              <div className="flex gap-3">
                                <button
                                  onClick={async () => {
                                    await handleSuggestionResponse(suggestion.id, 'accepted');
                                    await logUserActivity(
                                      userId,
                                      'default',
                                      'mentor_note_received',
                                      `Accepted Partner Suggestion`,
                                      `You accepted a ${suggestion.type === 'dna_shift' ? 'DNA Shift' : 'New Milestone'} from ${suggestion.partnerName}.`,
                                      data?.discoveryProgress as any,
                                      suggestion.id,
                                      ['partner', 'suggestion']
                                    );
                                  }}
                                  className="flex-1 py-2 bg-amber-400 text-black text-xs font-bold rounded-xl hover:bg-amber-300 transition-all"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() =>
                                    handleSuggestionResponse(suggestion.id, 'declined')
                                  }
                                  className="flex-1 py-2 bg-white/5 border border-white/10 text-white/60 text-xs font-bold rounded-xl hover:bg-white/10 transition-all"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Persistent Career DNA & Timeline */}
                  <div className="mb-12 space-y-8">
                    <div className="glass-panel p-12 rounded-[2.5rem] border border-white/5 bg-black/40 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-10 opacity-[0.02]">
                        <Rocket className="w-48 h-48 text-neon-cyan" />
                      </div>
                      <JourneyTimeline stage={timelineStage} phaseProgress={data?.phaseProgress} />
                    </div>

                    <div className="glass-panel p-6 lg:p-10 rounded-[2.5rem] border border-white/5 bg-black/40 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.05),transparent_70%)]" />
                      <div className="relative z-10 w-full flex flex-col items-center">
                        <div className="mb-8 text-center">
                          <h2 className="text-xl font-display font-bold text-white/90 uppercase tracking-[0.2em]">
                            Systemic Alignment
                          </h2>
                          <div className="h-px w-12 bg-neon-cyan/30 mx-auto mt-2" />
                        </div>
                        <GaugeChart
                          value={data?.careerHappiness || 0}
                          matrix={data?.alignmentMatrix}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phase Specific View */}
                  <div className="mb-12">
                    {timelineStage === 'Dive-In' && (
                      <DiveInView
                        userId={userId}
                        currentStage={timelineStage}
                        data={data}
                        artifacts={artifacts}
                        profile={profile}
                        onActionClick={(actionId) => {
                          if (actionId === 'validation') setIsGateModalOpen(true);
                        }}
                        onNavigate={handleViewChange}
                        transparencyMode={transparencyMode}
                        toggleTransparency={toggleTransparency}
                        setShowEvolution={setShowEvolution}
                        onActivityClick={handleActivityClick}
                      />
                    )}
                    {timelineStage === 'Ignition' && (
                      <IgnitionView
                        userId={userId}
                        currentStage={timelineStage}
                        data={data}
                        artifacts={artifacts}
                        profile={profile}
                        onActionClick={(actionId) => {
                          if (actionId === 'validation') setIsGateModalOpen(true);
                        }}
                        onNavigate={handleViewChange}
                        onActivityClick={handleActivityClick}
                      />
                    )}
                    {timelineStage === 'Discovery' && (
                      <DiscoveryView
                        userId={userId}
                        currentStage={timelineStage}
                        data={data}
                        artifacts={artifacts}
                        profile={profile}
                        onActionClick={(actionId) => {
                          if (actionId === 'validation') setIsGateModalOpen(true);
                        }}
                        onNavigate={handleViewChange}
                        onActivityClick={handleActivityClick}
                      />
                    )}
                    {timelineStage === 'Branding' && (
                      <BrandingView
                        userId={userId}
                        currentStage={timelineStage}
                        data={data}
                        artifacts={artifacts}
                        profile={profile}
                        onActionClick={(actionId) => {
                          if (actionId === 'validation') setIsGateModalOpen(true);
                        }}
                        onNavigate={handleViewChange}
                        onActivityClick={handleActivityClick}
                      />
                    )}
                    {timelineStage === 'Outreach' && (
                      <OutreachView
                        userId={userId}
                        currentStage={timelineStage}
                        data={data}
                        artifacts={artifacts}
                        profile={profile}
                        onActionClick={(actionId) => {
                          if (actionId === 'validation') setIsGateModalOpen(true);
                        }}
                        onNavigate={handleViewChange}
                        onActivityClick={handleActivityClick}
                      />
                    )}
                  </div>

                  {/* Evolution Visualizer Modal */}
                  <AnimatePresence>
                    {showEvolution && (
                      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setShowEvolution(false)}
                          className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 40 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 40 }}
                          className="relative w-full max-w-4xl h-[80vh] bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
                        >
                          <button
                            onClick={() => setShowEvolution(false)}
                            className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-20"
                          >
                            <X className="w-6 h-6" />
                          </button>

                          <EvolutionVisualizer insights={insights} />
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>



                  {/* Phase Details Modal-like Section */}
                  <div className="mb-12">
                    <PhaseDetails
                      stage={timelineStage}
                      milestones={data?.milestones || []}
                      onToggleMilestone={handleToggleMilestone}
                      onViewRoadmap={() => setShowRoadmap(true)}
                      onCompletePhase={handleCompletePhase}
                    />
                  </div>

                  {/* Roadmap Modal */}
                  <AnimatePresence>
                    {showRoadmap && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setShowRoadmap(false)}
                          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 20 }}
                          className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto glass-panel p-8 md:p-12 rounded-[2.5rem] border border-white/10 bg-black/90 shadow-2xl"
                        >
                          <button
                            onClick={() => setShowRoadmap(false)}
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>

                          <div className="mb-10">
                            <h2 className="text-3xl font-display font-bold text-white mb-2">
                              Kickspark Journey Roadmap
                            </h2>
                            <p className="text-white/40">
                              Your complete 12-week systemic career transition path.
                            </p>
                          </div>

                          <MilestoneRoadmap
                            milestones={data?.milestones || []}
                            currentWeek={data?.milestones?.find((m) => !m.completed)?.week || 1}
                            onToggleMilestone={handleToggleMilestone}
                            validationGateMode={data?.validationGateMode || 'soft-warning'}
                            rppValidated={data?.rppValidated || false}
                          />
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>


                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Skylar Side Panel (Discovery Phase) */}
      <AnimatePresence>
        {activePhaseView === 'discovery' && (
          <motion.div
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="shrink-0 h-full"
          >
            <SkylarSidePanel userId={userId} />
          </motion.div>
        )}
      </AnimatePresence>

      <InvitationModal
        isOpen={isInvitationModalOpen}
        onClose={() => setIsInvitationModalOpen(false)}
      />

      <PartnerSelectionModal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        onSelect={handlePartnerSelect}
      />

      <SentimentMotivationModal
        isOpen={isEQModalOpen}
        onClose={() => setIsEQModalOpen(false)}
        data={
          eqData || {
            sentiment: 0,
            motivation: 0,
            topDrivers: [],
            anxieties: [],
            summary: 'Skylar is analyzing your emotional DNA...',
          }
        }
      />

      <GateReviewModal
        isOpen={isGateModalOpen}
        onClose={() => setIsGateModalOpen(false)}
        onConfirm={() => {
          if (gateData?.status === 'approved') {
            handleCompletePhase(gateData.targetPhase);
            setIsGateModalOpen(false);
          }
        }}
        onOverride={handleOverride}
        isAdmin={isAdmin || profile?.role === 'operator'}
        data={
          gateData || {
            currentPhase: '',
            targetPhase: '',
            status: 'reviewing',
            message: '',
            criteria: [],
          }
        }
      />

      {/* Active Partners Section */}
      {activePartners.length > 0 && (
        <div className="max-w-[1600px] mx-auto px-12 pb-20">
          <div className="mt-20 pt-20 border-t border-white/5">
            <div className="flex items-center gap-3 mb-8">
              <Handshake className="w-6 h-6 text-neon-cyan" />
              <h3 className="text-2xl font-display font-bold text-white">Active Partners</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePartners.map((partner) => (
                <div key={partner.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 overflow-hidden">
                      {partner.logoUrl ? (
                        <img
                          src={partner.logoUrl}
                          alt={partner.name}
                          className="w-full h-full object-contain p-2"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <ShieldCheck className="w-6 h-6 text-zinc-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{partner.name}</h4>
                      <p className="text-xs text-white/40">
                        Connected since {new Date(partner.grantedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Propose Access
                    </span>
                    <button
                      onClick={() => togglePartnerPermission(partner.id, partner.permissions)}
                      className={`relative w-10 h-5 rounded-full transition-all ${partner.permissions.includes('propose') ? 'bg-neon-cyan' : 'bg-white/10'}`}
                    >
                      <motion.div
                        animate={{ x: partner.permissions.includes('propose') ? 20 : 2 }}
                        className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ArtifactModal
        isOpen={isArtifactModalOpen}
        onClose={() => setIsArtifactModalOpen(false)}
        artifact={selectedArtifact}
      />
    </div>
  );
};
