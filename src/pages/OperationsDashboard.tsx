import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  MoreVertical, 
  UserX, 
  Key, 
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Info,
  LogOut,
  Plus,
  Trash2,
  Layers,
  GraduationCap,
  RefreshCw,
  Edit2,
  X,
  Globe,
  TrendingUp,
  Activity,
  Heart,
  MessageSquare,
  Shield,
  ArrowDownRight,
  ShieldCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useIdentity } from '../contexts/IdentityContext';
import { ROLES } from '../constants';

type TabType = 'users' | 'cohorts' | 'programs' | 'content' | 'analytics';

const TENANTS = [
  { id: 'all', name: 'Global (All Tenants)' },
  { id: 'sparkwavv', name: 'Sparkwavv' },
  { id: 'kwieri', name: 'Kwieri' }
];

export const OperationsDashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const navigate = useNavigate();
  const { role: adminRole, logout } = useIdentity();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [selectedTenant, setSelectedTenant] = useState('all');
  const [users, setUsers] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const isReadOnly = adminRole === 'viewer';

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) return;
    
    setIsActionLoading(id);
    try {
      let endpoint = '';
      if (activeTab === 'users') endpoint = '/api/admin/delete-user';
      else if (activeTab === 'cohorts') endpoint = `/api/admin/cohorts/${id}`;
      else if (activeTab === 'programs') endpoint = `/api/admin/programs/${id}`;

      const res = await fetch(endpoint, {
        method: activeTab === 'users' ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: activeTab === 'users' ? JSON.stringify({ uid: id }) : undefined
      });

      if (res.ok) {
        if (activeTab === 'users') fetchUsers();
        else if (activeTab === 'cohorts') fetchCohorts();
        else if (activeTab === 'programs') fetchPrograms();
      }
    } catch (e) {
      console.error("Delete failed:", e);
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'users') endpoint = editingItem ? '/api/admin/update-user' : '/api/admin/create-user';
      else if (activeTab === 'cohorts') endpoint = '/api/admin/cohorts';
      else if (activeTab === 'programs') endpoint = '/api/admin/programs';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeTab === 'users' ? { ...formData, uid: editingItem?.uid } : { ...formData, id: editingItem?.id })
      });

      if (res.ok) {
        setIsModalOpen(false);
        if (activeTab === 'users') fetchUsers();
        else if (activeTab === 'cohorts') fetchCohorts();
        else if (activeTab === 'programs') fetchPrograms();
      }
    } catch (e) {
      console.error("Submit failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    if (onLogout) onLogout();
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'cohorts') fetchCohorts();
    if (activeTab === 'programs') fetchPrograms();
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users-v2');
      if (res.ok) {
        const data = await res.json();
        // Filter to only show regular users (user, client, guest)
        const regularUsers = (data.users || []).filter((u: any) => {
          const role = typeof u.role === 'string' ? u.role : u.role?.role;
          return role === ROLES.USER || role === ROLES.CLIENT || role === ROLES.GUEST;
        });
        setUsers(regularUsers);
      }
    } catch (e) {
      console.error("Failed to fetch users:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCohorts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cohorts');
      if (res.ok) {
        const data = await res.json();
        setCohorts(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch cohorts:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/programs');
      if (res.ok) {
        const data = await res.json();
        setPrograms(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch programs:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableUser = async (uid: string, currentStatus: boolean) => {
    setIsActionLoading(uid);
    try {
      const res = await fetch('/api/admin/disable-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, disabled: !currentStatus })
      });
      if (res.ok) {
        setUsers(users.map(u => u.uid === uid ? { ...u, disabled: !currentStatus } : u));
      }
    } catch (e) {
      console.error("Failed to toggle user status:", e);
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleResetPassword = async (uid: string) => {
    const newPassword = prompt("Enter new password (min 6 chars):");
    if (!newPassword || newPassword.length < 6) return;

    setIsActionLoading(uid);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, newPassword })
      });
      if (res.ok) {
        alert("Password reset successfully");
      }
    } catch (e) {
      console.error("Failed to reset password:", e);
    } finally {
      setIsActionLoading(null);
    }
  };

  const ActionButton = ({ 
    icon: Icon, 
    label, 
    onClick, 
    variant = 'default',
    loading = false
  }: { 
    icon: any; 
    label: string; 
    onClick: () => void; 
    variant?: 'default' | 'danger' | 'success';
    loading?: boolean;
  }) => {
    const button = (
      <button
        disabled={isReadOnly || loading}
        onClick={onClick}
        className={`p-2 rounded-lg transition-all ${
          isReadOnly 
            ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' 
            : loading
              ? 'bg-gray-100 text-gray-400 cursor-wait'
              : variant === 'danger'
                ? 'hover:bg-neon-magenta/10 text-neon-magenta border border-transparent hover:border-neon-magenta/20'
                : variant === 'success'
                  ? 'hover:bg-neon-lime/10 text-neon-lime border border-transparent hover:border-neon-lime/20'
                  : 'hover:bg-neon-cyan/10 text-neon-cyan border border-transparent hover:border-neon-cyan/20'
        }`}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
      </button>
    );

    if (isReadOnly) {
      return (
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <div className="inline-block">{button}</div>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-gray-900 text-white px-3 py-1.5 rounded text-xs font-medium shadow-xl z-[100]"
                sideOffset={5}
              >
                Permissions Required
                <Tooltip.Arrow className="fill-gray-900" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      );
    }

    return button;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans selection:bg-neon-cyan selection:text-black">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                <Layers className="w-7 h-7 text-neon-cyan" />
              </div>
              <h1 className="text-4xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                Operations Control
              </h1>
            </div>
            <p className="text-white/40 font-medium tracking-wide uppercase text-[10px] ml-16">
              Sparkwavv System Management • {adminRole?.toUpperCase()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {(adminRole === ROLES.SUPER_ADMIN || adminRole === ROLES.ADMIN) && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest"
              >
                <ShieldCheck className="w-4 h-4 text-neon-cyan" />
                System Admin
              </button>
            )}
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-cyan" />
              <select 
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="pl-12 pr-8 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-neon-cyan/50 outline-none appearance-none cursor-pointer hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-widest"
              >
                {TENANTS.map(t => (
                  <option key={t.id} value={t.id} className="bg-gray-900">{t.name}</option>
                ))}
              </select>
            </div>

            {!isReadOnly && (
                <button 
                  onClick={() => {
                    setEditingItem(null);
                    setFormData({
                      subscriptionTier: 'DIVE-IN',
                      hasWavvault: false,
                      onboardingProgress: 0,
                      role: 'user'
                    });
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-neon-cyan text-black font-display font-bold rounded-2xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                >
                  <Plus className="w-5 h-5" />
                  Create {activeTab.slice(0, -1)}
                </button>
              )}
              <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-neon-cyan transition-colors" />
              <input
                type="text"
                placeholder="Search resources..."
                className="pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-neon-cyan/50 outline-none w-72 transition-all hover:bg-white/10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button 
              onClick={handleLogout}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-neon-magenta/10 hover:text-neon-magenta hover:border-neon-magenta/20 transition-all font-medium flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit overflow-x-auto max-w-full">
          {[
            { id: 'users', label: 'Users', icon: Users },
            { id: 'cohorts', label: 'Cohorts', icon: GraduationCap },
            { id: 'programs', label: 'Programs', icon: Layers },
            { id: 'content', label: 'Moderation', icon: MessageSquare },
            { id: 'analytics', label: 'Business Insights', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-semibold text-sm ${
                activeTab === tab.id 
                  ? 'bg-neon-cyan text-black shadow-[0_0_20px_rgba(0,255,255,0.3)]' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="glass-panel rounded-[32px] border border-white/5 bg-white/[0.02] overflow-hidden backdrop-blur-xl">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-display font-bold capitalize">{activeTab} Management</h2>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                {activeTab === 'users' ? users.length : activeTab === 'cohorts' ? cohorts.length : programs.length} Total
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => activeTab === 'users' ? fetchUsers() : activeTab === 'cohorts' ? fetchCohorts() : fetchPrograms()}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <RefreshCw className={`w-5 h-5 text-neon-cyan ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                disabled={isReadOnly}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                  isReadOnly 
                    ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                    : 'bg-neon-lime text-black hover:shadow-[0_0_25px_rgba(50,255,50,0.4)] hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                <Plus className="w-5 h-5" />
                Add {activeTab.slice(0, -1)}
              </button>
            </div>
          </div>

          {activeTab === 'content' ? (
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-neon-magenta/10 text-neon-magenta">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-white/60">Pending Review</h4>
                  </div>
                  <p className="text-3xl font-display font-bold">12</p>
                  <p className="text-xs text-white/20 mt-2">Flagged by AI sentiment analysis</p>
                </div>
                <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-neon-lime/10 text-neon-lime">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-white/60">Resolved Today</h4>
                  </div>
                  <p className="text-3xl font-display font-bold">48</p>
                  <p className="text-xs text-white/20 mt-2">Manual actions taken</p>
                </div>
                <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-neon-cyan/10 text-neon-cyan">
                      <Heart className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-white/60">Avg Sentiment</h4>
                  </div>
                  <p className="text-3xl font-display font-bold">84%</p>
                  <p className="text-xs text-white/20 mt-2">Positive community health</p>
                </div>
              </div>

              <div className="glass-panel rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-lg font-display font-bold">Recent Flagged Content</h3>
                  <button className="text-xs font-bold text-neon-cyan uppercase tracking-widest hover:underline">View All Reports</button>
                </div>
                <div className="divide-y divide-white/5">
                  {[
                    { id: 1, user: 'User_882', content: 'This program is not what I expected, very disappointed with the support.', reason: 'Negative Sentiment (High)', time: '2m ago' },
                    { id: 2, user: 'User_129', content: 'Check out this external link for better resources: [redacted]', reason: 'External Link Policy', time: '15m ago' },
                    { id: 3, user: 'User_441', content: 'I hate how this cohort is structured, it makes no sense.', reason: 'Hostility Detected', time: '1h ago' }
                  ].map(item => (
                    <div key={item.id} className="p-6 flex items-start justify-between hover:bg-white/[0.01] transition-colors">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-neon-cyan">{item.user}</span>
                          <span className="text-[10px] text-white/20 uppercase tracking-widest">{item.time}</span>
                          <span className="px-2 py-0.5 rounded bg-neon-magenta/10 text-neon-magenta text-[9px] font-bold uppercase tracking-widest border border-neon-magenta/20">{item.reason}</span>
                        </div>
                        <p className="text-sm text-white/70 italic">"{item.content}"</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-neon-lime/10 hover:text-neon-lime transition-all" title="Dismiss">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-neon-magenta/10 hover:text-neon-magenta transition-all" title="Remove Content">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'analytics' ? (
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-panel p-8 rounded-[32px] border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-display font-bold">User Growth</h3>
                      <p className="text-xs text-white/40">New registrations over time</p>
                    </div>
                    <div className="flex items-center gap-2 text-neon-lime">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-bold">+12.5%</span>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { name: 'Mon', users: 400 },
                        { name: 'Tue', users: 300 },
                        { name: 'Wed', users: 600 },
                        { name: 'Thu', users: 800 },
                        { name: 'Fri', users: 500 },
                        { name: 'Sat', users: 900 },
                        { name: 'Sun', users: 1100 },
                      ]}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                          itemStyle={{ color: '#00f3ff' }}
                        />
                        <Area type="monotone" dataKey="users" stroke="#00f3ff" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-panel p-8 rounded-[32px] border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-display font-bold">Engagement Metrics</h3>
                      <p className="text-xs text-white/40">Daily active users vs Retention</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-neon-cyan" />
                        <span className="text-[10px] text-white/40 uppercase font-bold">DAU</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-neon-magenta" />
                        <span className="text-[10px] text-white/40 uppercase font-bold">Retention</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'W1', dau: 4000, ret: 2400 },
                        { name: 'W2', dau: 3000, ret: 1398 },
                        { name: 'W3', dau: 2000, ret: 9800 },
                        { name: 'W4', dau: 2780, ret: 3908 },
                        { name: 'W5', dau: 1890, ret: 4800 },
                        { name: 'W6', dau: 2390, ret: 3800 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        />
                        <Bar dataKey="dau" fill="#00f3ff" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="ret" fill="#ff00ff" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Avg Session', value: '18.4m', trend: '+2.1m', icon: Activity, color: 'text-neon-cyan' },
                  { label: 'Retention Rate', value: '64.2%', trend: '+4.8%', icon: Users, color: 'text-neon-magenta' },
                  { label: 'Conversion', value: '12.8%', trend: '+1.2%', icon: TrendingUp, color: 'text-neon-lime' },
                  { label: 'Churn Rate', value: '2.4%', trend: '-0.8%', icon: ArrowDownRight, color: 'text-neon-magenta' }
                ].map((stat, i) => (
                  <div key={i} className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.02] relative overflow-hidden group">
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{stat.label}</p>
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                      <div className="flex items-end justify-between">
                        <h3 className="text-2xl font-display font-bold">{stat.value}</h3>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 ${stat.trend.startsWith('+') ? 'text-neon-lime' : 'text-neon-magenta'}`}>
                          {stat.trend}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02]">
                  {activeTab === 'users' && (
                    <>
                      <th className="px-8 py-5 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">User Identity</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Status</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Tier</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Vault</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Onboarding</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Last Login</th>
                    </>
                  )}
                  {activeTab === 'cohorts' && (
                    <>
                      <th className="px-8 py-5 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Cohort Name</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Type</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Members</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Institution</th>
                    </>
                  )}
                  {activeTab === 'programs' && (
                    <>
                      <th className="px-8 py-5 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Program Name</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Type</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Description</th>
                    </>
                  )}
                  <th className="px-8 py-5 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-8 py-24 text-center">
                      <Loader2 className="w-12 h-12 text-neon-cyan animate-spin mx-auto mb-4" />
                      <p className="text-white/40 font-display font-medium uppercase tracking-widest text-sm">Synchronizing Data...</p>
                    </td>
                  </tr>
                ) : (activeTab === 'users' ? users : activeTab === 'cohorts' ? cohorts : programs).length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-8 py-24 text-center">
                      <p className="text-white/20 font-display font-medium uppercase tracking-widest text-sm">No records found in this sector.</p>
                    </td>
                  </tr>
                ) : (activeTab === 'users' ? users : activeTab === 'cohorts' ? cohorts : programs).map((item: any) => (
                  <tr key={item.uid || item.id} className="hover:bg-white/[0.03] transition-all group">
                    {activeTab === 'users' && (
                      <>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-cyan/5 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan font-display font-bold text-lg shadow-[0_0_15px_rgba(0,255,255,0.05)] overflow-hidden">
                              {item.photoURL ? (
                                <img src={item.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                item.displayName?.[0]?.toUpperCase() || item.email?.[0]?.toUpperCase() || '?'
                              )}
                            </div>
                            <div>
                              <p className="font-display font-bold text-white group-hover:text-neon-cyan transition-colors">{item.displayName || 'Anonymous'}</p>
                              <p className="text-[10px] font-mono text-white/40 tracking-tighter">{item.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest ${
                            item.disabled 
                              ? 'bg-neon-magenta/10 text-neon-magenta border border-neon-magenta/20' 
                              : 'bg-neon-lime/10 text-neon-lime border border-neon-lime/20'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${item.disabled ? 'bg-neon-magenta' : 'bg-neon-lime'} animate-pulse`} />
                            {item.disabled ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-bold text-neon-cyan uppercase tracking-widest">{item.subscriptionTier || 'DIVE-IN'}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`text-xs font-bold uppercase tracking-widest ${item.hasWavvault ? 'text-neon-lime' : 'text-white/20'}`}>
                            {item.hasWavvault ? 'Enabled' : 'Locked'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-neon-cyan transition-all duration-500" 
                              style={{ width: `${item.onboardingProgress || 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-white/40 mt-1 block font-mono">{item.onboardingProgress || 0}% Complete</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-medium text-white/40">
                            {item.metadata?.lastSignInTime ? new Date(item.metadata.lastSignInTime).toLocaleString() : 'Never'}
                          </span>
                        </td>
                      </>
                    )}
                    {activeTab === 'cohorts' && (
                      <>
                        <td className="px-8 py-6">
                          <p className="font-display font-bold text-white group-hover:text-neon-cyan transition-colors">{item.name}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{item.type}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-medium text-white/40">{item.memberCount || 0} Members</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-medium text-white/40">{item.institution || 'N/A'}</span>
                        </td>
                      </>
                    )}
                    {activeTab === 'programs' && (
                      <>
                        <td className="px-8 py-6">
                          <p className="font-display font-bold text-white group-hover:text-neon-cyan transition-colors">{item.name}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{item.type}</span>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs text-white/40 max-w-xs truncate">{item.description || 'No description provided.'}</p>
                        </td>
                      </>
                    )}
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            {!isReadOnly && (
                              <ActionButton 
                                icon={Edit2} 
                                label={`Edit ${activeTab.slice(0, -1)}`} 
                                onClick={() => {
                                  setEditingItem(item);
                                  setFormData(item);
                                  setIsModalOpen(true);
                                }} 
                              />
                            )}
                            {activeTab === 'users' && (
                              <>
                                {(adminRole === ROLES.SUPER_ADMIN || adminRole === ROLES.ADMIN || (adminRole === ROLES.OPERATOR && item.role !== ROLES.ADMIN && item.role !== ROLES.SUPER_ADMIN)) && (
                                  <>
                                    <ActionButton 
                                      icon={Key} 
                                      label="Reset Password" 
                                      loading={isActionLoading === item.uid}
                                      onClick={() => handleResetPassword(item.uid)} 
                                    />
                                    <ActionButton 
                                      icon={item.disabled ? CheckCircle2 : UserX} 
                                      label={item.disabled ? "Enable Account" : "Disable Account"} 
                                      variant={item.disabled ? "success" : "danger"}
                                      loading={isActionLoading === item.uid}
                                      onClick={() => handleDisableUser(item.uid, item.disabled)} 
                                    />
                                  </>
                                )}
                              </>
                            )}
                            {(adminRole === ROLES.SUPER_ADMIN || adminRole === ROLES.ADMIN || (adminRole === ROLES.OPERATOR && (activeTab !== 'users' || (item.role !== ROLES.ADMIN && item.role !== ROLES.SUPER_ADMIN)))) && (
                              <ActionButton 
                                icon={Trash2} 
                                label={`Delete ${activeTab.slice(0, -1)}`} 
                                variant="danger"
                                loading={isActionLoading === (item.uid || item.id)}
                                onClick={() => handleDelete(item.uid || item.id)} 
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
      {/* Resource Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display font-bold text-white">
                {editingItem ? 'Edit' : 'Create'} {activeTab.slice(0, -1)}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-white/40" />
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {activeTab === 'users' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Display Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-neon-cyan/50 outline-none"
                      value={formData.displayName || ''}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Email</label>
                    <input 
                      type="email" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-neon-cyan/50 outline-none"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Subscription Tier</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-neon-cyan/50 outline-none"
                      value={formData.subscriptionTier || 'DIVE-IN'}
                      onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value })}
                    >
                      <option value="DIVE-IN">DIVE-IN</option>
                      <option value="IGNITION">IGNITION</option>
                      <option value="BRANDING">BRANDING</option>
                      <option value="DISCOVERY">DISCOVERY</option>
                      <option value="OUTREACH">OUTREACH</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Role</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-neon-cyan/50 outline-none"
                      value={formData.role || 'user'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="user">User</option>
                      <option value="client">Client</option>
                      <option value="guest">Guest</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="hasWavvault"
                      className="w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-2 focus:ring-neon-cyan/50 outline-none"
                      checked={formData.hasWavvault || false}
                      onChange={(e) => setFormData({ ...formData, hasWavvault: e.target.checked })}
                    />
                    <label htmlFor="hasWavvault" className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Vault Access (Wavvault)</label>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Onboarding Progress (%)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-neon-cyan/50 outline-none"
                      value={formData.onboardingProgress || 0}
                      onChange={(e) => setFormData({ ...formData, onboardingProgress: parseInt(e.target.value) })}
                    />
                  </div>
                </>
              )}

              {activeTab === 'cohorts' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Cohort Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-neon-cyan/50 outline-none"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Type</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-neon-cyan/50 outline-none"
                      value={formData.type || ''}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Institution</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-neon-cyan/50 outline-none"
                      value={formData.institution || ''}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    />
                  </div>
                </>
              )}

              {activeTab === 'programs' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Program Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-neon-cyan/50 outline-none"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Type</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-neon-cyan/50 outline-none"
                      value={formData.type || ''}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Description</label>
                    <textarea 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-neon-cyan/50 outline-none min-h-[100px]"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-white/5 text-white font-display font-bold rounded-xl hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-neon-cyan text-black font-display font-bold rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,255,0.2)]"
                >
                  {editingItem ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      </div>
    </div>
  );
};
