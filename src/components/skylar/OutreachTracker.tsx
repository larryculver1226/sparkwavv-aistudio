import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  Users,
  Target,
  Activity,
  Filter,
  Search,
  Plus,
  Calendar,
  Linkedin,
  Mail,
  Globe,
  MoreVertical,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  Zap,
  Brain,
} from 'lucide-react';
import { skylar } from '../../services/skylarService';
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
  Cell,
} from 'recharts';

interface OutreachTrackerProps {
  userId: string;
}

const COLORS = ['#00f3ff', '#ff00ff', '#39ff14', '#facc15'];

export const OutreachTracker: React.FC<OutreachTrackerProps> = ({ userId }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'analytics'>('pipeline');
  const [showLogModal, setShowLogModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sequences, setSequences] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state for manual log
  const [logForm, setLogForm] = useState({
    recipient: '',
    platform: 'LinkedIn',
    type: 'sent' as any,
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { metrics: m, actions: s } = await skylar.getOutreachMetrics(userId);
      setMetrics(m);
      setSequences(s.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (error) {
      console.error('Failed to fetch outreach data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogAction = async (e: React.FormEvent) => {
    e.preventDefault();
    await skylar.logOutreachAction(userId, {
      ...logForm,
      templateId: 'manual',
    });
    setShowLogModal(false);
    setLogForm({ recipient: '', platform: 'LinkedIn', type: 'sent', notes: '' });
    fetchData();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-black p-8 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-4xl font-display font-bold text-white tracking-tight mb-2">
            Engagement Command
          </h2>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] font-bold">
            Strategic Outreach Tracking & Analytics
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'pipeline' ? 'bg-neon-cyan text-black' : 'text-white/40 hover:text-white'}`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'analytics' ? 'bg-neon-cyan text-black' : 'text-white/40 hover:text-white'}`}
            >
              Analytics
            </button>
          </div>
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neon-cyan text-black text-[10px] font-bold uppercase tracking-widest hover:bg-neon-cyan/80 transition-all"
          >
            <Plus className="w-4 h-4" />
            Log Action
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          {
            label: 'Total Sent',
            value: metrics?.totalSent || 0,
            icon: Send,
            color: 'text-neon-cyan',
          },
          {
            label: 'Engagement Rate',
            value: metrics?.totalSent
              ? `${((metrics.totalEngaged / metrics.totalSent) * 100).toFixed(1)}%`
              : '0%',
            icon: Activity,
            color: 'text-neon-magenta',
          },
          {
            label: 'Weekly Velocity',
            value: metrics?.velocity || 0,
            icon: Zap,
            color: 'text-neon-lime',
          },
          {
            label: 'Active Sequences',
            value: metrics?.funnel?.find((f: any) => f.name === 'Nurturing')?.value || 0,
            icon: Target,
            color: 'text-amber-400',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/40 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
              <stat.icon className={`w-12 h-12 ${stat.color}`} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${stat.color}`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                {stat.label}
              </span>
            </div>
            <div className="text-3xl font-display font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {activeTab === 'pipeline' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
                <Clock className="w-4 h-4 text-neon-cyan" />
                Recent Activity
              </h3>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all">
                  <Filter className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {sequences.length > 0 ? (
                sequences.map((action, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/40 hover:bg-white/5 transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-6">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          action.type === 'sent'
                            ? 'bg-neon-cyan/10 text-neon-cyan'
                            : action.type === 'engaged'
                              ? 'bg-neon-lime/10 text-neon-lime'
                              : 'bg-neon-magenta/10 text-neon-magenta'
                        }`}
                      >
                        {action.platform === 'LinkedIn' ? (
                          <Linkedin className="w-6 h-6" />
                        ) : (
                          <Mail className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white mb-1">{action.recipient}</h4>
                        <p className="text-[10px] text-white/40 font-medium">
                          {action.platform} • {new Date(action.timestamp).toLocaleDateString()} at{' '}
                          {new Date(action.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div
                        className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border ${
                          action.type === 'sent'
                            ? 'border-neon-cyan/20 text-neon-cyan bg-neon-cyan/5'
                            : action.type === 'engaged'
                              ? 'border-neon-lime/20 text-neon-lime bg-neon-lime/5'
                              : 'border-neon-magenta/20 text-neon-magenta bg-neon-magenta/5'
                        }`}
                      >
                        {action.type}
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(`Outreach to ${action.recipient}`, `copy_${i}`)
                        }
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all"
                      >
                        {copiedId === `copy_${i}` ? (
                          <Check className="w-4 h-4 text-neon-lime" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                  <p className="text-white/20 font-bold uppercase tracking-widest text-xs">
                    No activity logged yet
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Skylar's Strategic Nudges */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
              <Brain className="w-4 h-4 text-neon-cyan" />
              Strategic Nudges
            </h3>

            <div className="glass-panel p-8 rounded-[2rem] border border-neon-cyan/20 bg-neon-cyan/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Zap className="w-16 h-16 text-neon-cyan" />
              </div>
              <p className="text-sm text-white/80 leading-relaxed mb-6 relative z-10">
                "The AI Strategist at TechFlow just engaged with your portfolio. Send the 'Phase 2:
                Technical Deep Dive' follow-up now to maintain momentum."
              </p>
              <button className="w-full py-3 rounded-xl bg-neon-cyan text-black text-[10px] font-bold uppercase tracking-widest hover:bg-neon-cyan/80 transition-all flex items-center justify-center gap-2">
                Execute Follow-up <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40">
              <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-6">
                Sequence Health
              </h4>
              <div className="space-y-4">
                {[
                  { label: 'LinkedIn Connection Velocity', value: 85, color: 'bg-neon-cyan' },
                  { label: 'Email Open Rate', value: 62, color: 'bg-neon-magenta' },
                  { label: 'Portfolio Engagement', value: 44, color: 'bg-neon-lime' },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                      <span className="text-white/60">{item.label}</span>
                      <span className="text-white">{item.value}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        className={`h-full ${item.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Engagement Funnel */}
          <div className="glass-panel p-10 rounded-[2.5rem] border border-white/5 bg-black/40 h-[400px]">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mb-10">
              Outreach Funnel
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.funnel || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#ffffff40"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111',
                    border: '1px solid #ffffff10',
                    borderRadius: '12px',
                  }}
                  itemStyle={{ color: '#00f3ff' }}
                />
                <Bar dataKey="value" fill="#00f3ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Distribution */}
          <div className="glass-panel p-10 rounded-[2.5rem] border border-white/5 bg-black/40 h-[400px]">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mb-10">
              Platform Distribution
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'LinkedIn', value: 65 },
                    { name: 'Email', value: 25 },
                    { name: 'Twitter', value: 10 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111',
                    border: '1px solid #ffffff10',
                    borderRadius: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Manual Log Modal */}
      <AnimatePresence>
        {showLogModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg glass-panel p-10 rounded-[2.5rem] border border-white/10 bg-black/90 shadow-2xl"
            >
              <h3 className="text-2xl font-display font-bold text-white mb-8">
                Log Outreach Action
              </h3>
              <form onSubmit={handleLogAction} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    required
                    value={logForm.recipient}
                    onChange={(e) => setLogForm({ ...logForm, recipient: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan transition-all"
                    placeholder="e.g. Jane Doe"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                      Platform
                    </label>
                    <select
                      value={logForm.platform}
                      onChange={(e) => setLogForm({ ...logForm, platform: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan transition-all appearance-none"
                    >
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Email">Email</option>
                      <option value="Twitter">Twitter</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                      Action Type
                    </label>
                    <select
                      value={logForm.type}
                      onChange={(e) => setLogForm({ ...logForm, type: e.target.value as any })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan transition-all appearance-none"
                    >
                      <option value="sent">Sent</option>
                      <option value="engaged">Engaged</option>
                      <option value="nurturing">Nurturing</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                    Notes
                  </label>
                  <textarea
                    value={logForm.notes}
                    onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-cyan transition-all h-24"
                    placeholder="Add any specific context..."
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowLogModal(false)}
                    className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 rounded-xl bg-neon-cyan text-black text-[10px] font-bold uppercase tracking-widest hover:bg-neon-cyan/80 transition-all"
                  >
                    Log Action
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
