import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  Cloud, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Database, 
  LogOut,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Heart,
  Menu,
  X,
  UserCog,
  Shield
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { AuthDiagnostics } from './AuthDiagnostics';
import { FirebaseSetup } from './FirebaseSetup';

interface AdminStats {
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    storageUsage: number;
    networkTraffic: number;
  };
  users: {
    total: number;
    active: number;
    newToday: number;
    pendingVerification: number;
  };
  content: {
    totalPosts: number;
    flagged: number;
    pendingReview: number;
  };
  system: {
    status: string;
    uptime: string;
    lastBackup: string;
  };
  engagement: {
    avgSessionDuration: string;
    bounceRate: string;
    retentionRate: string;
    topModules: { name: string; views: number; engagement: number }[];
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    trends: { day: string; score: number }[];
  };
}

export const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    console.log("[ADMIN] Fetching users...");
    setFetchingUsers(true);
    try {
      const response = await fetch('/api/admin/users-v2');
      console.log("[ADMIN] Response status:", response.status);
      const contentType = response.headers.get("content-type");
      
      if (response.ok && contentType?.includes("application/json")) {
        const data = await response.json();
        console.log("[ADMIN] Fetched users data:", data);
        const fetchedUsers = data.users || [];
        console.log("[ADMIN] Setting users state to:", fetchedUsers);
        setUsers(fetchedUsers);
      } else {
        const text = await response.text();
        console.error("Admin API Error - Status:", response.status, "Content-Type:", contentType, "Body:", text.substring(0, 100));
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching admin users:", error);
    } finally {
      setFetchingUsers(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers(); // Fetch users on mount to show in Recent Activity
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    onLogout();
  };

  const handleUpdateRole = async (uid: string, newRole: string) => {
    try {
      const response = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, role: newRole }),
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-12 h-12 text-neon-cyan animate-spin" />
          <p className="text-neon-cyan font-display uppercase tracking-widest animate-pulse">Initializing Admin Environment...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#00f3ff', '#8b5cf6', '#10b981', '#f59e0b'];

  const resourceData = [
    { name: 'CPU', value: stats?.resources?.cpuUsage || 0 },
    { name: 'Memory', value: stats?.resources?.memoryUsage || 0 },
    { name: 'Storage', value: stats?.resources?.storageUsage || 0 },
  ];

  const sentimentPieData = [
    { name: 'Positive', value: stats?.sentiment?.positive || 0, color: '#10b981' },
    { name: 'Neutral', value: stats?.sentiment?.neutral || 0, color: '#f59e0b' },
    { name: 'Negative', value: stats?.sentiment?.negative || 0, color: '#ef4444' },
  ];

  // Derive real user activity data from users list
  const userActivityData = (() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const activityMap = new Map();
    
    // Initialize with last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      activityMap.set(dayName, { name: dayName, active: 0, new: 0 });
    }

    if (users && users.length > 0) {
      users.forEach(user => {
        if (user.creationTime) {
          const creationDate = new Date(user.creationTime);
          const dayName = days[creationDate.getDay()];
          if (activityMap.has(dayName)) {
            const current = activityMap.get(dayName);
            activityMap.set(dayName, { ...current, new: current.new + 1 });
          }
        }
        
        // For 'active', we can use emailVerified as a proxy for this demo
        if (user.emailVerified && user.lastSignInTime) {
          const lastSeen = new Date(user.lastSignInTime);
          const dayName = days[lastSeen.getDay()];
          if (activityMap.has(dayName)) {
            const current = activityMap.get(dayName);
            activityMap.set(dayName, { ...current, active: current.active + 1 });
          }
        }
      });
    }

    return Array.from(activityMap.values());
  })();

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-neon-cyan selection:text-black">
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-72 bg-black border-r border-white/5 z-[70] lg:hidden overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-neon-cyan" />
                    </div>
                    <div>
                      <h1 className="font-display font-bold text-xl tracking-tight">Sparkwavv</h1>
                      <p className="text-[10px] text-neon-cyan font-display uppercase tracking-widest">Admin Console</p>
                    </div>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-white/40 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <nav className="space-y-2">
                  {[
                    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                    { id: 'users', label: 'Users & Roles', icon: Users },
                    { id: 'cloud', label: 'Cloud Resources', icon: Cloud },
                    { id: 'content', label: 'Content Monitor', icon: AlertTriangle },
                    { id: 'security', label: 'Security', icon: ShieldCheck },
                    { id: 'logs', label: 'System Logs', icon: Activity },
                    { id: 'diagnostics', label: 'Diagnostics', icon: ShieldCheck },
                    { id: 'firebase-setup', label: 'Firebase Setup', icon: Database },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeTab === item.id 
                          ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20' 
                          : 'text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-8 mt-auto">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-black border-r border-white/5 z-50 hidden lg:block">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-neon-cyan" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl tracking-tight">Sparkwavv</h1>
              <p className="text-[10px] text-neon-cyan font-display uppercase tracking-widest">Admin Console</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'users', label: 'Users & Roles', icon: Users },
              { id: 'cloud', label: 'Cloud Resources', icon: Cloud },
              { id: 'content', label: 'Content Monitor', icon: AlertTriangle },
              { id: 'security', label: 'Security', icon: ShieldCheck },
              { id: 'logs', label: 'System Logs', icon: Activity },
              { id: 'diagnostics', label: 'Diagnostics', icon: ShieldCheck },
              { id: 'firebase-setup', label: 'Firebase Setup', icon: Database },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id 
                    ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-8">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-8 min-h-screen">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl font-display font-bold">
              {activeTab === 'overview' && 'System Overview'}
              {activeTab === 'users' && 'User Analytics'}
              {activeTab === 'cloud' && 'Cloud Infrastructure'}
              {activeTab === 'content' && 'Content & Sentiment'}
              {activeTab === 'security' && 'Security Audit'}
              {activeTab === 'logs' && 'System Logs'}
              {activeTab === 'diagnostics' && 'Connectivity Diagnostics'}
              {activeTab === 'firebase-setup' && 'Firebase Configuration'}
            </h2>
            <p className="text-white/40">
              {activeTab === 'overview' && 'Real-time metrics and environment status'}
              {activeTab === 'content' && 'User engagement and sentiment analysis'}
              {activeTab === 'diagnostics' && 'Evaluate Sparkwavv & Firebase integration status'}
              {activeTab === 'firebase-setup' && 'Step-by-step guide to connect your Firebase project'}
              {activeTab !== 'overview' && activeTab !== 'content' && activeTab !== 'diagnostics' && activeTab !== 'firebase-setup' && 'Detailed system metrics'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <Menu className="w-6 h-6 text-neon-cyan" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-emerald-500 uppercase tracking-widest">{stats?.system.status}</span>
            </div>
            <button 
              onClick={fetchStats}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {activeTab === 'overview' ? (
            <>
              {[
                { label: 'Total Users', value: stats?.users?.total || 0, trend: 'Total', icon: Users, color: 'text-neon-cyan' },
                { label: 'Verified Users', value: stats?.users?.active || 0, trend: 'Verified', icon: Activity, color: 'text-purple-500' },
                { label: 'New Today', value: stats?.users?.newToday || 0, trend: 'Today', icon: Heart, color: 'text-emerald-500' },
                { label: 'Cloud Usage', value: `${stats?.resources?.cpuUsage || 0}%`, trend: 'Normal', icon: Cloud, color: 'text-emerald-500' },
              ].map((stat, i) => (
                <div key={i} className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.02] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <stat.icon className={`w-12 h-12 ${stat.color}`} />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <p className="text-sm font-medium text-white/40 uppercase tracking-widest">{stat.label}</p>
                    <div className="flex items-end justify-between">
                      <h3 className="text-3xl font-display font-bold">{stat.value}</h3>
                      <span className="text-xs font-medium px-2 py-1 rounded-lg bg-white/5 text-white/40">
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : activeTab === 'content' ? (
            <>
              {[
                { label: 'Avg Session', value: stats?.engagement.avgSessionDuration, trend: '+2m', icon: Activity, color: 'text-neon-cyan' },
                { label: 'Retention', value: stats?.engagement.retentionRate, trend: '+4%', icon: Users, color: 'text-purple-500' },
                { label: 'Positive Sentiment', value: `${stats?.sentiment.positive}%`, trend: '+8%', icon: Heart, color: 'text-emerald-500' },
                { label: 'Bounce Rate', value: stats?.engagement.bounceRate, trend: '-3%', icon: ArrowDownRight, color: 'text-red-500' },
              ].map((stat, i) => (
                <div key={i} className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.02] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <stat.icon className={`w-12 h-12 ${stat.color}`} />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <p className="text-sm font-medium text-white/40 uppercase tracking-widest">{stat.label}</p>
                    <div className="flex items-end justify-between">
                      <h3 className="text-3xl font-display font-bold">{stat.value}</h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded-lg bg-white/5 ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-white/40'}`}>
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : activeTab === 'diagnostics' ? (
            <div className="col-span-4">
              <AuthDiagnostics />
            </div>
          ) : activeTab === 'firebase-setup' ? (
            <div className="col-span-4">
              <FirebaseSetup />
            </div>
          ) : (
            <div className="col-span-4 glass-panel p-12 text-center border-white/5 bg-white/[0.02] rounded-3xl">
              <p className="text-white/40 italic">Detailed metrics for {activeTab} are being aggregated...</p>
            </div>
          )}
        </div>

        {/* Dynamic Content based on Tab */}
        {activeTab === 'users' && (
          <div className="glass-panel rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-display font-bold">User Management & RBAC</h3>
              <button 
                onClick={fetchUsers}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                disabled={fetchingUsers}
              >
                <RefreshCw className={`w-4 h-4 ${fetchingUsers ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-white/20 uppercase tracking-widest border-b border-white/5">
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Verification</th>
                    <th className="px-6 py-4 font-medium">Joined</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.length > 0 ? (
                    users.map((user, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-medium">{user.displayName}</td>
                        <td className="px-6 py-4 text-white/60">{user.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Shield className={`w-3 h-3 ${
                              user.role === 'admin' ? 'text-neon-cyan' : 
                              user.role === 'operator' ? 'text-purple-500' :
                              user.role === 'mentor' ? 'text-emerald-500' :
                              user.role === 'agent' ? 'text-amber-500' : 'text-white/40'
                            }`} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${
                              user.role === 'admin' ? 'text-neon-cyan' : 
                              user.role === 'operator' ? 'text-purple-500' :
                              user.role === 'mentor' ? 'text-emerald-500' :
                              user.role === 'agent' ? 'text-amber-500' : 'text-white/40'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${
                            user.emailVerified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {user.emailVerified ? 'VERIFIED' : 'PENDING'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/40 text-sm">
                          {user.creationTime ? new Date(user.creationTime).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user.uid, e.target.value)}
                            className="bg-black border border-white/10 rounded-lg text-[10px] uppercase font-bold tracking-widest px-2 py-1 focus:outline-none focus:border-neon-cyan"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="operator">Operator</option>
                            <option value="mentor">Mentor</option>
                            <option value="agent">Agent</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-white/40 italic">
                        {fetchingUsers ? 'Fetching users from Firebase...' : 'No users found in Firebase.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <>
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-display font-bold">User Growth & Activity</h3>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-neon-cyan" />
                      <span className="text-xs text-white/40">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-xs text-white/40">New</span>
                    </div>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userActivityData}>
                      <defs>
                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="active" stroke="#00f3ff" fillOpacity={1} fill="url(#colorActive)" />
                      <Area type="monotone" dataKey="new" stroke="#8b5cf6" fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
                <h3 className="text-xl font-display font-bold mb-8">Resource Allocation</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={resourceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        cursor={{ fill: '#ffffff05' }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {resourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Detailed Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-panel rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-xl font-display font-bold">Recent User Activity</h3>
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="text-xs text-neon-cyan uppercase tracking-widest font-bold hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs text-white/20 uppercase tracking-widest border-b border-white/5">
                        <th className="px-6 py-4 font-medium">User</th>
                        <th className="px-6 py-4 font-medium">Email</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.length > 0 ? (
                        users
                          .sort((a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime())
                          .slice(0, 5)
                          .map((user, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4 font-medium">{user.displayName}</td>
                              <td className="px-6 py-4 text-white/60">{user.email}</td>
                              <td className="px-6 py-4">
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${
                                  user.emailVerified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                }`}>
                                  {user.emailVerified ? 'Verified' : 'Pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-white/40 text-sm">
                                {user.creationTime ? new Date(user.creationTime).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-white/40 italic">
                            {fetchingUsers ? 'Loading activity...' : 'No recent activity found.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02] space-y-8">
                <h3 className="text-xl font-display font-bold">System Health</h3>
                <div className="space-y-6">
                  {[
                    { label: 'Uptime', value: stats?.system?.uptime || 'N/A', icon: Activity },
                    { label: 'Last Backup', value: stats?.system?.lastBackup || 'N/A', icon: Database },
                    { label: 'Storage Usage', value: `${stats?.resources?.storageUsage || 0}%`, icon: Database },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <item.icon className="w-4 h-4 text-white/40" />
                        </div>
                        <span className="text-sm text-white/60">{item.label}</span>
                      </div>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-white/5">
                  <button className="w-full py-3 rounded-xl bg-neon-cyan text-black font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:scale-[1.02] transition-transform">
                    Run Diagnostic
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'content' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
                <h3 className="text-xl font-display font-bold mb-8">Sentiment Trends</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.sentiment.trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="day" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#10b981" fill="#10b98120" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center">
                <h3 className="text-xl font-display font-bold mb-8 self-start">Sentiment Distribution</h3>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentPieData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sentimentPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-8 w-full">
                  {sentimentPieData.map((item, i) => (
                    <div key={i} className="text-center">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">{item.name}</p>
                      <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h3 className="text-xl font-display font-bold">Top Performing Modules</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs text-white/20 uppercase tracking-widest border-b border-white/5">
                      <th className="px-6 py-4 font-medium">Module Name</th>
                      <th className="px-6 py-4 font-medium">Total Views</th>
                      <th className="px-6 py-4 font-medium">Engagement Score</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats?.engagement.topModules.map((module, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-medium">{module.name}</td>
                        <td className="px-6 py-4 text-white/60">{module.views.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-grow h-1.5 bg-white/5 rounded-full overflow-hidden max-w-[100px]">
                              <div 
                                className="h-full bg-neon-cyan" 
                                style={{ width: `${module.engagement}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-neon-cyan">{module.engagement}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500">
                            Optimal
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
