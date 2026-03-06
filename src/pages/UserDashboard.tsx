import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  User, 
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
  Database
} from 'lucide-react';
import { DashboardData } from '../types/dashboard';

const GaugeChart: React.FC<{ value: number }> = ({ value }) => {
  const radius = 80;
  const stroke = 12;
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const angle = (normalizedValue / 100) * 180;
  const rotation = -90 + angle;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* Background Arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#ffffff10"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Value Arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(normalizedValue / 100) * 251} 251`}
        />
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
        {/* Needle */}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="30"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: '100px 100px',
            transition: 'transform 1s ease-out'
          }}
        />
        <circle cx="100" cy="100" r="5" fill="#fff" />
      </svg>
      <div className="absolute bottom-2 text-center">
        <span className="text-4xl font-display font-bold text-white">{value}</span>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mt-1">Career Happiness Meter</p>
      </div>
    </div>
  );
};

export const UserDashboard: React.FC<{ userId: string }> = ({ userId }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/user/dashboard?userId=${userId}`);
        if (response.ok) {
          const dashboardData = await response.json();
          setData(dashboardData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-amber-500 selection:text-black flex">
      {/* Sidebar */}
      <aside className="w-64 bg-black/40 border-r border-white/5 p-6 flex flex-col gap-8 hidden lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-amber-500" />
          </div>
          <span className="text-2xl font-display font-bold tracking-tight">Skylar</span>
        </div>

        <nav className="flex flex-col gap-2">
          {[
            { icon: LayoutDashboard, label: 'Dashboard', active: true },
            { icon: User, label: 'Profile' },
            { icon: Award, label: 'My Strengths' },
            { icon: Briefcase, label: 'Job Matches' },
            { icon: Users, label: 'Community' },
            { icon: Settings, label: 'Settings' },
          ].map((item, i) => (
            <button 
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-12 h-12 text-amber-500" />
            </div>
            <div className="relative z-10 flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center overflow-hidden">
                <img 
                  src="https://picsum.photos/seed/robot/200" 
                  alt="AI Companion" 
                  className="w-full h-full object-cover grayscale opacity-80"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h4 className="text-sm font-bold">Skylar</h4>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">(AI Companion)</p>
              </div>
              <button className="text-[10px] text-amber-500 uppercase tracking-widest font-bold hover:underline">
                Settings
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex items-center justify-between mb-12">
          <h1 className="text-3xl font-display font-bold">Skylar Dashboard</h1>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right">
                <p className="text-sm font-bold">Burnt Amber</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Pro Member</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 overflow-hidden">
                <img src="https://picsum.photos/seed/user/100" alt="Avatar" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Happiness Meter */}
          <div className="lg:col-span-1 glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center justify-center">
            <GaugeChart value={data.careerHappiness} />
          </div>

          {/* Strengths Profile Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Strengths', desc: 'AI Companion for emotional intelligence', icon: Award },
              { label: 'Revvault', desc: 'Persistent data layer (credentials)', icon: Database },
              { label: 'Job Matches', desc: 'Modern Strengths-based profiling', icon: Briefcase },
            ].map((card, i) => (
              <div key={i} className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <card.icon className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">{card.label}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Discovery Timeline */}
        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02] mb-8">
          <div className="flex items-center justify-center gap-12 mb-8">
            <div className="flex items-center gap-4">
              <span className={`text-4xl font-display font-bold ${data.discoveryProgress === 'discovery' ? 'text-amber-500' : 'text-white/20'}`}>Discovery</span>
              <ChevronRight className="w-8 h-8 text-white/10" />
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-4xl font-display font-bold ${data.discoveryProgress === 'map' ? 'text-amber-500' : 'text-white/20'}`}>Map</span>
              <ChevronRight className="w-8 h-8 text-white/10" />
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-4xl font-display font-bold ${data.discoveryProgress === 'match' ? 'text-amber-500' : 'text-white/20'}`}>Match</span>
            </div>
          </div>
          
          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-amber-500 transition-all duration-1000"
              style={{ width: data.discoveryProgress === 'discovery' ? '33%' : data.discoveryProgress === 'map' ? '66%' : '100%' }}
            />
            <div className="absolute top-0 left-0 w-full h-full flex justify-between px-[15%] -translate-y-1/2 mt-1">
              <div className={`w-10 h-10 rounded-full border-4 border-[#050505] flex items-center justify-center ${data.discoveryProgress === 'discovery' ? 'bg-amber-500' : 'bg-white/10'}`}>
                <Search className="w-4 h-4 text-black" />
              </div>
              <div className={`w-10 h-10 rounded-full border-4 border-[#050505] flex items-center justify-center ${data.discoveryProgress === 'map' ? 'bg-amber-500' : 'bg-white/10'}`}>
                <Compass className="w-4 h-4 text-black" />
              </div>
              <div className={`w-10 h-10 rounded-full border-4 border-[#050505] flex items-center justify-center ${data.discoveryProgress === 'match' ? 'bg-amber-500' : 'bg-white/10'}`}>
                <Handshake className="w-4 h-4 text-black" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gallup Strengths */}
          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-8">My Strengths Profile (Gallup)</h3>
            <div className="space-y-6">
              {data.strengths.map((strength, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-white/60">{strength.name}</span>
                    <span className="text-amber-500">{strength.value}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${strength.value}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full bg-amber-500/60"
                    />
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
              Details Profile
            </button>
          </div>

          {/* Resume & Credentials */}
          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-8">Resume & Credentials (Wavvault)</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4 group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-amber-500/10 transition-all">
                  <Database className="w-5 h-5 text-white/20 group-hover:text-amber-500" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold mb-1">Resume Process</h4>
                  <p className="text-xs text-white/40">{data.resumeStatus}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20" />
              </div>
              <div className="flex items-start gap-4 group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-amber-500/10 transition-all">
                  <User className="w-5 h-5 text-white/20 group-hover:text-amber-500" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold mb-1">Career Profile</h4>
                  <p className="text-xs text-white/40">{data.careerProfileStatus}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20" />
              </div>
            </div>
            <button className="w-full mt-8 py-3 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
              Revvault Details
            </button>
          </div>

          {/* Job Matches */}
          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-8">Job Matches & Coaching</h3>
            <div className="space-y-6">
              {data.jobMatches.map((job, i) => (
                <div key={i} className="flex items-start gap-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-amber-500/10 transition-all">
                    <Briefcase className="w-5 h-5 text-white/20 group-hover:text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold mb-1">{job.title}</h4>
                    <p className="text-xs text-white/40">{job.company} • {job.matchScore}% Match</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20" />
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
              Job Matches
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
