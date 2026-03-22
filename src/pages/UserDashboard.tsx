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
  Camera
} from 'lucide-react';
import { DashboardData, Expense, Milestone } from '../types/dashboard';
import { useIdentity } from '../contexts/IdentityContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { InvitationModal } from '../components/InvitationModal';
import { PartnerSelectionModal } from '../components/PartnerSelectionModal';
import { EveningSpark } from '../components/EveningSpark';
import { NeuralSynthesisEngine } from '../components/dashboard/NeuralSynthesisEngine';
import { HighFidelitySynthesisLab } from '../components/skylar/HighFidelitySynthesisLab';
import { PhaseDetails } from '../components/kickspark/PhaseDetails';
import { MilestoneRoadmap } from '../components/kickspark/MilestoneRoadmap';
import { EvolutionVisualizer } from '../components/EvolutionVisualizer';
import { UserInsight } from '../types/dashboard';
import { X, Eye, EyeOff } from 'lucide-react';

const MiniGauge: React.FC<{ value: number; label: string; color: string }> = ({ value, label, color }) => {
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const circumference = 2 * Math.PI * 32;
  const offset = circumference - (normalizedValue / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="32"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-white/5"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="32"
            stroke={color}
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
          {value}%
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-bold text-center leading-tight max-w-[90px]">
        {label}
      </span>
    </div>
  );
};

const MentorNote: React.FC<{ note: string; timestamp: string }> = ({ note, timestamp }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-6 rounded-2xl bg-neon-cyan/5 border border-neon-cyan/20 space-y-4 mb-12"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-neon-cyan">
        <Users className="w-5 h-5" />
        <h3 className="font-display font-bold text-sm tracking-tight uppercase">Human Mentor Feedback</h3>
      </div>
      <span className="text-[10px] text-white/40 font-mono">
        {new Date(timestamp).toLocaleDateString()} • {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
    <div className="prose prose-invert prose-sm max-w-none text-white/80 leading-relaxed">
      <ReactMarkdown>{note}</ReactMarkdown>
    </div>
  </motion.div>
);

const GaugeChart: React.FC<{ value: number; matrix?: DashboardData['alignmentMatrix'] }> = ({ value, matrix }) => {
  const radius = 85;
  const stroke = 14;
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const angle = (normalizedValue / 100) * 180;
  const rotation = -90 + angle;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 xl:gap-12 w-full">
        {/* Main Gauge */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="relative">
            <svg width="220" height="130" viewBox="0 0 240 140">
              {/* Background Arc */}
              <path
                d="M 30 120 A 90 90 0 0 1 210 120"
                fill="none"
                stroke="#ffffff08"
                strokeWidth={stroke}
                strokeLinecap="round"
              />
              {/* Value Arc */}
              <path
                d="M 30 120 A 90 90 0 0 1 210 120"
                fill="none"
                stroke="url(#cyanNeonGradient)"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${(normalizedValue / 100) * 283} 283`}
                className="drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]"
              />
              <defs>
                <linearGradient id="cyanNeonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0088ff" />
                  <stop offset="50%" stopColor="#00f3ff" />
                  <stop offset="100%" stopColor="#00ffff" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Centered Value */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
              <div className="text-5xl font-display font-bold text-neon-cyan neon-text-cyan">
                {value}
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-neon-cyan/80 font-bold neon-text-cyan whitespace-nowrap">Happiness Meter</p>
            </div>
          </div>
        </div>

        {/* Alignment Matrix */}
        <div className="flex gap-4 sm:gap-8 lg:border-l lg:border-white/10 lg:pl-6 xl:pl-12">
          <MiniGauge 
            value={matrix?.identityClarity || 0} 
            label="Identity Clarity" 
            color="#00f3ff" 
          />
          <MiniGauge 
            value={matrix?.strengthsAlignment || 0} 
            label="Strengths Alignment" 
            color="#ff00ff" 
          />
          <MiniGauge 
            value={matrix?.marketResonance || 0} 
            label="Market Resonance" 
            color="#39ff14" 
          />
        </div>
      </div>
    </div>
  );
};

const JourneyTimeline: React.FC<{ stage: string }> = ({ stage }) => {
  const stages = [
    { id: 'Dive-In', label: 'Dive-In', icon: Sparkles, desc: 'WEEKS 1-2' },
    { id: 'Ignition', label: 'Ignition', icon: Zap, desc: 'WEEKS 3-4' },
    { id: 'Discovery', label: 'Discovery', icon: SearchIcon, desc: 'WEEKS 5-6' },
    { id: 'Branding', label: 'Branding', icon: Compass, desc: 'WEEKS 7-9' },
    { id: 'Outreach', label: 'Outreach', icon: Handshake, desc: 'WEEKS 10-12' },
  ];

  const currentIndex = stages.findIndex(s => s.id === stage);
  const progress = currentIndex === -1 ? 0 : (currentIndex / (stages.length - 1)) * 100;

  return (
    <div className="w-full py-12">
      {/* Labels Layer */}
      <div className="flex justify-between items-end mb-12 px-12 relative">
        {stages.map((s, i) => {
          const isCurrent = i === currentIndex;
          const isCompleted = i < currentIndex;

          return (
            <div key={s.id} className="flex flex-col items-center gap-2 relative z-10 w-32">
              <div className="flex flex-col items-center">
                <span className={`font-display font-bold italic transition-all duration-700 text-center ${
                  isCurrent 
                    ? 'text-neon-cyan text-5xl mb-2 drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]' 
                    : isCompleted ? 'text-white text-2xl opacity-90' : 'text-white/20 text-2xl'
                }`}>
                  {s.label}
                </span>
                <span className={`text-[10px] uppercase tracking-[0.2em] font-bold transition-colors duration-500 ${
                  isCurrent ? 'text-neon-cyan/60' : 'text-white/20'
                }`}>
                  {s.desc}
                </span>
              </div>
              
              {isCurrent && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 px-4 py-1.5 rounded-full bg-neon-cyan text-black font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,243,255,0.4)]"
                >
                  Active Phase
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      <div className="relative px-12 mt-20">
        {/* Background Track - Connecting the centers of the icons */}
        <div className="absolute top-1/2 left-[112px] right-[112px] h-1.5 bg-white/5 -translate-y-1/2 z-0">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="h-full bg-neon-cyan shadow-[0_0_15px_rgba(0,243,255,0.8)] relative"
          >
            {/* Glow effect at the tip of the progress */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-neon-cyan rounded-full blur-md" />
          </motion.div>
        </div>

        {/* Icons Layer */}
        <div className="relative flex justify-between items-center z-10">
          {stages.map((s, i) => {
            const isCurrent = i === currentIndex;
            const isCompleted = i < currentIndex;
            const isLocked = i > currentIndex;

            return (
              <div key={s.id} className="flex flex-col items-center w-32">
                <div 
                  className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-700 relative ${
                    isCurrent 
                      ? 'bg-black border-neon-cyan text-neon-cyan shadow-[0_0_40px_rgba(0,243,255,0.5)] scale-125 ring-8 ring-neon-cyan/5' 
                      : isCompleted
                        ? 'bg-zinc-900/80 border-neon-cyan/30 text-neon-cyan/60'
                        : 'bg-zinc-900 border-white/5 text-white/10'
                  }`}
                >
                  {isLocked ? (
                    <Lock className="w-5 h-5 opacity-20" />
                  ) : (
                    <>
                      <s.icon className={`${isCurrent ? 'w-8 h-8' : 'w-6 h-6'}`} />
                      {isCompleted && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-neon-cyan rounded-full flex items-center justify-center border-2 border-black shadow-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-black font-bold" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

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

export const UserDashboard: React.FC<{ userId: string; isAdmin?: boolean }> = ({ userId, isAdmin = false }) => {
  const { user, profile, status, error: authError } = useIdentity();
  const isConfirmed = status === 'authenticated';
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<UserInsight[]>([]);
  const [showEvolution, setShowEvolution] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activePartners, setActivePartners] = useState<any[]>([]);

  useEffect(() => {
    const fetchPartnerData = async () => {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        
        // Fetch suggestions
        const suggestionsRes = await fetch('/api/user/suggestions', {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        if (suggestionsRes.ok) {
          setSuggestions(await suggestionsRes.json());
        }

        // Fetch active partners
        const partnersRes = await fetch('/api/user/partners', {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        if (partnersRes.ok) {
          setActivePartners(await partnersRes.json());
        }
      } catch (error) {
        console.error("Error fetching partner data:", error);
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
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tenantId })
      });
      setIsPartnerModalOpen(false);
      // Refresh partners
      const partnersRes = await fetch('/api/user/partners', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      setActivePartners(await partnersRes.json());
      alert(`Connected with ${tenantId}! They now have read-only access.`);
    } catch (error) {
      console.error("Error connecting partner:", error);
    }
  };

  const handleSuggestionResponse = async (suggestionId: string, status: 'accepted' | 'declined') => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const suggestion = suggestions.find(s => s.id === suggestionId);
      let synthesisNote = "";

      if (status === 'accepted' && suggestion) {
        // Call Gemini for synthesis note
        const prompt = `As Skylar, the AI Career Engine, generate a brief "Synthesis Note" (max 2 sentences) explaining how this new insight from a Partner integrates with the user's existing DNA. 
        Suggestion Type: ${suggestion.type}
        Content: ${JSON.stringify(suggestion.content)}
        Partner: ${suggestion.partnerName}`;
        
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
          });
          synthesisNote = response.text || "Insight synthesized into your professional DNA.";
        } catch (e) {
          console.error("Gemini synthesis failed:", e);
          synthesisNote = "Insight synthesized into your professional DNA.";
        }
      }

      const res = await fetch(`/api/user/suggestions/${suggestionId}/respond`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, synthesisNote })
      });
      
      if (res.ok) {
        if (status === 'accepted') {
          alert(`Suggestion accepted! Skylar Synthesis: ${synthesisNote}`);
        }
        // Refresh suggestions
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      }
    } catch (error) {
      console.error("Error responding to suggestion:", error);
    }
  };

  const togglePartnerPermission = async (partnerId: string, currentPermissions: string[]) => {
    if (!user) return;
    const newPermissions = currentPermissions.includes('propose') 
      ? ['read'] 
      : ['read', 'propose'];
      
    try {
      const idToken = await user.getIdToken();
      await fetch(`/api/user/partners/${partnerId}/permissions`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permissions: newPermissions })
      });
      // Refresh partners
      const partnersRes = await fetch('/api/user/partners', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      setActivePartners(await partnersRes.json());
    } catch (error) {
      console.error("Error toggling partner permission:", error);
    }
  };
  const [transparencyMode, setTransparencyMode] = useState<'under-the-hood' | 'full'>(
    (localStorage.getItem('skylar_transparency') as any) || 'under-the-hood'
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  const [activeView, setActiveView] = useState<'dashboard' | 'synthesis'>('dashboard');

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
            'Authorization': `Bearer ${idToken}`
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const dashboardData = await response.json();
          setData(dashboardData);
          setError(null);
        } else {
          const errData = await response.json();
          setError(errData.error || "Failed to load dashboard");
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          setError("Dashboard request timed out. Please check your connection.");
        } else {
          console.error("Error fetching dashboard data:", err);
          setError("Network error or server unavailable");
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
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (response.ok) {
        const insightsData = await response.json();
        setInsights(insightsData);
        
        // Seed initial DNA if no insights exist
        if (insightsData.length === 0 && profile) {
          seedInitialDNA();
        }
      }
    } catch (err) {
      console.error("Error fetching insights:", err);
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
        tags: ['initial-dna', 'career-stage']
      },
      {
        type: 'strength',
        content: profile.brandDNAAttributes?.join(', ') || 'General professional strengths',
        status: 'confirmed',
        evidence: 'Initial profile setup',
        tags: ['initial-dna', 'strengths']
      }
    ];

    try {
      const idToken = await user.getIdToken();
      for (const insight of initialInsights) {
        await fetch('/api/user-insights', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ ...insight, userId })
        });
      }
      // Refresh insights after seeding
      fetchInsights();
    } catch (err) {
      console.error("Error seeding initial DNA:", err);
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

    const updatedMilestones = data.milestones?.map(m => 
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    ) || [];

    // Optimistic update
    setData({ ...data, milestones: updatedMilestones });

    try {
      const idToken = await user.getIdToken();
      const milestone = updatedMilestones.find(m => m.id === milestoneId);
      
      const url = '/api/user/milestones';

      await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ 
          milestoneId, 
          completed: milestone?.completed ?? false 
        })
      });
    } catch (err) {
      console.error("Error toggling milestone:", err);
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
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ nextStage })
      });

      if (response.ok) {
        // Update local state
        setData({ ...data, discoveryProgress: nextStage as any });
        // The profile in AuthContext might need a refresh or we can just rely on the dashboard data for now
        // Since we unified the stage usage to timelineStage which uses data.discoveryProgress, it will update the UI
      }
    } catch (err) {
      console.error("Error completing phase:", err);
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
        <p className="text-white/40 text-xs uppercase tracking-widest animate-pulse">Initializing Skylar Dashboard...</p>
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
        <p className="text-white/60 mb-6 max-w-md">{error || authError || "An unexpected error occurred during initialization."}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-neon-cyan text-black font-bold rounded-xl hover:bg-neon-cyan/80 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const currentStage = data?.discoveryProgress || (isAdmin ? 'Ignition' : profile?.journeyStage) || 'Ignition';

  const timelineStage = getTimelineStage(currentStage);

  return (
    <div className="min-h-screen bg-dark-bg text-white font-sans selection:bg-neon-cyan selection:text-black flex">
      {/* Sidebar */}
      <aside className="w-72 bg-black border-r border-white/5 p-8 flex flex-col gap-10 hidden lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-neon-cyan" />
          </div>
          <span className="text-2xl font-display font-bold tracking-tight">Skylar</span>
        </div>

        <nav className="flex flex-col gap-3">
          {[
            { icon: LayoutDashboard, label: 'Dashboard', active: activeView === 'dashboard', onClick: () => setActiveView('dashboard') },
            { icon: Camera, label: 'Synthesis Lab', active: activeView === 'synthesis', onClick: () => setActiveView('synthesis') },
            { icon: UserIcon, label: 'Profile', path: '/profile' },
            { icon: Award, label: 'My Strengths', path: '/strengths' },
            { icon: Briefcase, label: 'Job Matches', path: '/matches' },
            { icon: Users, label: 'Community', path: '/community' },
            { icon: Settings, label: 'Settings', path: '/settings' },
          ].map((item, i) => (
            <button 
              key={i}
              onClick={() => item.onClick ? item.onClick() : navigate(item.path!)}
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
                <h4 className="text-xl font-display font-bold text-white group-hover:text-neon-cyan transition-colors">Skylar</h4>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">(AI Companion)</p>
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
      <main className="flex-1 p-10 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(0,243,255,0.05),transparent_40%)]">
        {activeView === 'synthesis' ? (
          <HighFidelitySynthesisLab />
        ) : (
          <>
            <header className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-display font-bold tracking-tight">
            {isAdmin ? `Viewing: ${data?.displayName || 'User'}` : 'Your Sparkwavv Career Journey'}
          </h1>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsPartnerModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/20 transition-all text-xs font-bold uppercase tracking-wider"
            >
              <Handshake className="w-4 h-4" />
              Find Partner
            </button>
            <button 
              onClick={() => setIsInvitationModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-lime/10 border border-neon-lime/20 text-neon-lime hover:bg-neon-lime/20 transition-all text-xs font-bold uppercase tracking-wider"
            >
              <UserPlus className="w-4 h-4" />
              Invite RPP
            </button>
            <button className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-neon-cyan/40 transition-all">
              <Bell className="w-6 h-6" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-neon-magenta hover:border-neon-magenta/40 transition-all lg:hidden"
              title="Logout"
            >
              <LogOut className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4 pl-6 border-l border-white/10">
              <div className="text-right">
                <p className="text-base font-bold text-white">{profile?.displayName || user?.displayName || 'User'}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">{profile?.role || 'Member'}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 overflow-hidden neon-border-cyan">
                <img src={profile?.photoURL || user?.photoURL || "https://picsum.photos/seed/user/100"} alt="Avatar" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        </header>

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
          <MentorNote note={data.mentorNote} timestamp={data.mentorNoteTimestamp || new Date().toISOString()} />
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
                <h3 className="font-display font-bold text-sm tracking-tight uppercase">Partner Suggestions</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="p-6 bg-amber-400/5 border border-amber-400/20 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/60">
                          {suggestion.type === 'dna_shift' ? 'DNA Shift' : 'New Milestone'}
                        </span>
                        <span className="text-[10px] font-bold text-white/40">From: {suggestion.partnerName}</span>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">
                        {suggestion.type === 'dna_shift' ? `Update ${suggestion.content.field}` : suggestion.content.title}
                      </h4>
                      <p className="text-sm text-white/60 mb-6">
                        {suggestion.type === 'dna_shift' ? `Proposed value: ${suggestion.content.value}` : suggestion.content.description}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleSuggestionResponse(suggestion.id, 'accepted')}
                        className="flex-1 py-2 bg-amber-400 text-black text-xs font-bold rounded-xl hover:bg-amber-300 transition-all"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleSuggestionResponse(suggestion.id, 'declined')}
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

        {/* Neural Synthesis Engine - Prominent Module */}
        <div className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <NeuralSynthesisEngine userId={userId} currentStage={currentStage} />
          </div>
          
          <div className="flex flex-col gap-6">
            {/* Transparency Toggle & Evolution Access */}
            <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-neon-cyan">
                    <Brain className="w-5 h-5" />
                    <h3 className="font-display font-bold text-sm tracking-tight uppercase">Skylar Learning</h3>
                  </div>
                  <button 
                    onClick={toggleTransparency}
                    className={`p-2 rounded-lg border transition-all ${
                      transparencyMode === 'full' 
                        ? 'bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan' 
                        : 'bg-white/5 border-white/10 text-white/40'
                    }`}
                    title={transparencyMode === 'full' ? 'Full Transparency' : 'Under the Hood'}
                  >
                    {transparencyMode === 'full' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                
                <p className="text-xs text-white/60 leading-relaxed mb-6">
                  {transparencyMode === 'full' 
                    ? "Skylar is operating in Full Transparency mode. You can see her evolving understanding of your professional DNA in real-time."
                    : "Skylar is learning from your interactions 'under the hood' to provide increasingly precise guidance."}
                </p>
              </div>

              <button 
                onClick={() => setShowEvolution(true)}
                className="w-full py-4 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-neon-cyan/20 transition-all flex items-center justify-center gap-2"
              >
                <History className="w-4 h-4" />
                View Evolution DNA
              </button>
            </div>
          </div>
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

        {/* Top Row: Happiness & Summary Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
          <div className="xl:col-span-2 glass-panel p-6 lg:p-10 rounded-[2.5rem] border border-white/5 bg-black/40 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.05),transparent_70%)]" />
            
            <div className="relative z-10 w-full flex flex-col items-center">
              <div className="mb-8 text-center">
                <h2 className="text-xl font-display font-bold text-white/90 uppercase tracking-[0.2em]">Systemic Alignment</h2>
                <div className="h-px w-12 bg-neon-cyan/30 mx-auto mt-2" />
              </div>

              <GaugeChart value={data?.careerHappiness || 0} matrix={data?.alignmentMatrix} />

              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] text-white/30 font-medium leading-relaxed max-w-2xl text-center md:text-left border-t border-white/5 pt-8">
                <p>
                  <span className="text-neon-cyan/60 font-bold uppercase tracking-wider block mb-1">Happiness Calculation</span>
                  Weighted aggregate of your Milestone Progress (40%), Journey Phase (40%), and Profile Completeness (20%).
                </p>
                <p>
                  <span className="text-neon-cyan/60 font-bold uppercase tracking-wider block mb-1">Alignment Matrix</span>
                  Identity Clarity tracks profile depth, Strengths Alignment reflects Gallup integration, and Market Resonance averages your top job match scores.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-6">
            {[
              { label: 'Strengths', desc: 'AI Companion for emotional intelligence', icon: Brain, path: '/strengths', stage: 'Discovery' },
              { label: 'Revvault', desc: 'Persistent data layer (credentials)', icon: Database, path: '/wavvault', stage: 'Branding' },
              { label: 'Job Matches', desc: 'Modern Strengths-based profiling', icon: Target, path: '/matches', stage: 'Outreach' },
            ].map((card, i) => {
              const stages = ['Dive-In', 'Ignition', 'Discovery', 'Branding', 'Outreach'];
              const currentIdx = stages.indexOf(timelineStage);
              const cardIdx = stages.indexOf(card.stage);
              const isLocked = currentIdx < cardIdx;

              return (
                <button 
                  key={i} 
                  onClick={() => !isLocked && navigate(card.path)}
                  disabled={isLocked}
                  className={`glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40 transition-all text-left group relative ${
                    isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neon-cyan/5 hover:border-neon-cyan/30'
                  }`}
                >
                  {isLocked && (
                    <div className="absolute top-4 right-4">
                      <Lock className="w-4 h-4 text-white/20" />
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mb-6 transition-all ${
                    !isLocked && 'group-hover:scale-110 group-hover:bg-neon-cyan/20'
                  }`}>
                    <card.icon className="w-6 h-6 text-neon-cyan" />
                  </div>
                  <h3 className={`text-xl font-bold mb-3 transition-colors ${!isLocked && 'group-hover:text-neon-cyan'}`}>{card.label}</h3>
                  <p className="text-xs text-white/40 leading-relaxed font-medium">{card.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle Row: Journey Timeline */}
        <div className="glass-panel p-12 rounded-[2.5rem] border border-white/5 bg-black/40 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02]">
            <Rocket className="w-48 h-48 text-neon-cyan" />
          </div>
          <JourneyTimeline stage={timelineStage} />
        </div>

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
                  <h2 className="text-3xl font-display font-bold text-white mb-2">Kickspark Journey Roadmap</h2>
                  <p className="text-white/40">Your complete 12-week systemic career transition path.</p>
                </div>

                <MilestoneRoadmap 
                  milestones={data?.milestones || []}
                  currentWeek={data?.milestones?.find(m => !m.completed)?.week || 1}
                  onToggleMilestone={handleToggleMilestone}
                  validationGateMode={data?.validationGateMode || 'soft-warning'}
                  rppValidated={data?.rppValidated || false}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Synthesis Lab Quick Access */}
        <div className="mb-12">
          <button 
            onClick={() => setActiveView('synthesis')}
            className="w-full glass-panel p-10 rounded-[2.5rem] border border-neon-cyan/20 bg-neon-cyan/5 hover:bg-neon-cyan/10 transition-all group relative overflow-hidden flex items-center justify-between"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-8 relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-10 h-10 text-neon-cyan" />
              </div>
              <div className="text-left">
                <h3 className="text-3xl font-display font-bold text-white mb-2">High-Fidelity Synthesis Lab</h3>
                <p className="text-sm text-white/60 max-w-xl">
                  Generate cinematic brand portraits and professional outreach sequences grounded in your unique DNA.
                </p>
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-3 text-neon-cyan font-bold uppercase tracking-widest text-xs">
              Enter Lab
              <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </div>
          </button>
        </div>

        {/* Bottom Row: 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: Gallup Strengths */}
          <div className="glass-panel p-10 rounded-[2.5rem] border border-white/5 bg-black/40">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
              <Award className="w-4 h-4 text-neon-cyan" />
              My Strengths Profile (Gallup)
            </h3>
            <div className="space-y-8">
              {(profile?.brandDNAAttributes?.length ? profile.brandDNAAttributes : ['Strategic', 'Analytical', 'Creative', 'Collaborative']).map((attr, i) => {
                const value = 85 - (i * 8); // Mock values for visual impact
                return (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                      <span className="text-white/60">{attr}</span>
                      <span className="text-neon-cyan neon-text-cyan">{value}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 1.5, delay: i * 0.1 }}
                        className="h-full bg-gradient-to-r from-neon-cyan/60 to-neon-cyan shadow-[0_0_10px_rgba(0,243,255,0.3)]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <button 
              onClick={() => navigate('/strengths')}
              className="w-full mt-12 py-4 rounded-2xl border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-neon-cyan/10 hover:border-neon-cyan/30 transition-all"
            >
              Details Profile
            </button>
          </div>

          {/* Column 2: Resume & Credentials */}
          <div className="glass-panel p-10 rounded-[2.5rem] border border-white/5 bg-black/40">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
              <FileText className="w-4 h-4 text-neon-cyan" />
              Resume & Credentials (Wavvault)
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Resume Process', status: 'Reviewing items and themes', path: '/wavvault/resume' },
                { label: 'Custom Profile', status: 'Modified achievements, skills, and stories', path: '/profile' },
                { label: 'Certifications', status: '3 verified credentials', path: '/wavvault/credentials' },
              ].map((item, i) => (
                <button 
                  key={i} 
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-neon-cyan/5 hover:border-neon-cyan/20 transition-all group"
                >
                  <div className="text-left">
                    <h4 className="text-sm font-bold mb-1 group-hover:text-neon-cyan transition-colors">{item.label}</h4>
                    <p className="text-[10px] text-white/40 font-medium">{item.status}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-neon-cyan transition-all" />
                </button>
              ))}
            </div>
            <button 
              onClick={() => navigate('/wavvault')}
              className="w-full mt-12 py-4 rounded-2xl border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-neon-cyan/10 hover:border-neon-cyan/30 transition-all"
            >
              Revvault
            </button>
          </div>

          {/* Column 3: Job Matches */}
          <div className="glass-panel p-10 rounded-[2.5rem] border border-white/5 bg-black/40">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
              <Target className="w-4 h-4 text-neon-cyan" />
              Job Matches & Coaching
            </h3>
            <div className="space-y-6">
              {(data?.jobMatches?.length ? data.jobMatches : [
                { title: 'Senior Product Designer', company: 'TechFlow', matchScore: 94 },
                { title: 'UX Strategist', company: 'Global Creative', matchScore: 88 },
                { title: 'Design Systems Lead', company: 'Innova', matchScore: 82 },
              ]).map((job, i) => (
                <button 
                  key={i} 
                  onClick={() => navigate(`/matches/${i}`)}
                  className="w-full flex items-start gap-5 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-neon-cyan/5 hover:border-neon-cyan/20 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-neon-cyan/10 transition-all">
                    <Briefcase className="w-6 h-6 text-white/20 group-hover:text-neon-cyan" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-sm font-bold mb-1 group-hover:text-neon-cyan transition-colors">{job.title}</h4>
                    <p className="text-[10px] text-white/40 font-medium">{job.company} • {job.matchScore}% Match</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-neon-cyan transition-all mt-1" />
                </button>
              ))}
            </div>
            <button 
              onClick={() => navigate('/matches')}
              className="w-full mt-12 py-4 rounded-2xl border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-neon-cyan/10 hover:border-neon-cyan/30 transition-all"
            >
              Job Matches
            </button>
          </div>
        </div>
      </>
    )}
  </main>

      <InvitationModal 
        isOpen={isInvitationModalOpen} 
        onClose={() => setIsInvitationModalOpen(false)} 
      />

      <PartnerSelectionModal 
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        onSelect={handlePartnerSelect}
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
                        <img src={partner.logoUrl} alt={partner.name} className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                      ) : (
                        <ShieldCheck className="w-6 h-6 text-zinc-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{partner.name}</h4>
                      <p className="text-xs text-white/40">Connected since {new Date(partner.grantedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Propose Access</span>
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
    </div>
  );
};
