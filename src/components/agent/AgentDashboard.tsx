import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Terminal, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCcw,
  Box,
  Cpu,
  Globe,
  Mail,
  Calendar,
  Layers
} from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  Timestamp 
} from 'firebase/firestore';

interface AgentLog {
  id: string;
  timestamp: any;
  event: string;
  details: string;
  type: 'info' | 'success' | 'warning';
}

interface AgentSyncState {
  status: 'idle' | 'processing' | 'researching' | 'analyzing';
  lastSync: any;
  activeSkills: string[];
}

interface AgentDashboardProps {
  userId: string;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ userId }) => {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [state, setState] = useState<AgentSyncState | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Listen to logs
    const logsQuery = query(
      collection(db, 'agent_logs'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const newLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AgentLog[];
      setLogs(newLogs);
    });

    // Listen to state
    const unsubscribeState = onSnapshot(doc(db, 'agent_sync', userId), (doc) => {
      if (doc.exists()) {
        setState(doc.data() as AgentSyncState);
      }
    });

    return () => {
      unsubscribeLogs();
      unsubscribeState();
    };
  }, [userId]);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const response = await fetch('/api/agent/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force: true }),
      });
      if (!response.ok) throw new Error('Sync failed');
    } catch (error) {
      console.error('Manual sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'text-neon-cyan';
      case 'researching': return 'text-neon-magenta';
      case 'analyzing': return 'text-yellow-400';
      default: return 'text-white/40';
    }
  };

  const skills = [
    { id: 'scraping', name: 'Web Scraping', icon: Globe, description: 'Live market data retrieval' },
    { id: 'job_matching', name: 'Job Matching', icon: Zap, description: 'Semantic DNA alignment' },
    { id: 'outreach', name: 'Outreach Execution', icon: Mail, description: 'Autonomous networking' },
    { id: 'scheduling', name: 'Temporal Guardian', icon: Calendar, description: 'Energy protocol enforcement' },
    { id: 'memory', name: 'Vector Memory', icon: Layers, description: 'Long-term context recall' },
    { id: 'synthesis', name: 'Neural Synthesis', icon: Cpu, description: 'Pattern identification' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Agent Pulse & Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className={`relative flex items-center justify-center w-12 h-12 rounded-full bg-black border ${state?.status && state.status !== 'idle' ? 'border-neon-cyan animate-pulse' : 'border-white/10'}`}>
            <Activity className={`w-6 h-6 ${state?.status && state.status !== 'idle' ? 'text-neon-cyan' : 'text-white/20'}`} />
            {state?.status && state.status !== 'idle' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-neon-cyan rounded-full animate-ping" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white tracking-tight">Skylar Agent Operations</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs uppercase tracking-widest font-bold ${getStatusColor(state?.status || 'idle')}`}>
                {state?.status || 'idle'}
              </span>
              <span className="text-white/20">•</span>
              <span className="text-xs text-white/40 font-mono">
                Last Sync: {state?.lastSync ? new Date(state.lastSync.toDate()).toLocaleString() : 'Never'}
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={handleManualSync}
          disabled={isSyncing || state?.status !== 'idle'}
          className="flex items-center gap-2 px-4 py-2 bg-neon-cyan text-black text-sm font-bold rounded-lg hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Force Sync
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Capability Map */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider flex items-center gap-2 px-2">
            <Box className="w-4 h-4" />
            Agency Capabilities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((skill) => {
              const isActive = state?.activeSkills?.includes(skill.id);
              return (
                <div 
                  key={skill.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive 
                    ? 'bg-neon-cyan/5 border-neon-cyan/30 text-white' 
                    : 'bg-white/2 border-white/5 text-white/40 grayscale opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <skill.icon className={`w-5 h-5 ${isActive ? 'text-neon-cyan' : 'text-white/20'}`} />
                    {isActive ? (
                      <span className="text-[10px] px-2 py-0.5 bg-neon-cyan/20 border border-neon-cyan/30 rounded text-neon-cyan uppercase font-bold">Active</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white/30 uppercase font-bold">Locked</span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm mb-1">{skill.name}</h4>
                  <p className="text-xs opacity-60 leading-relaxed">{skill.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Console / Log Feed */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider flex items-center gap-2 px-2">
            <Terminal className="w-4 h-4" />
            Agent Logs
          </h3>
          <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[400px]">
            <div className="flex items-center gap-2 px-4 py-2 border-bottom border-white/10 bg-white/5">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
              </div>
              <span className="text-[10px] font-mono text-white/40">skylar-agent-v3.5.log</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/20 text-center p-8">
                  <RefreshCcw className="w-8 h-8 mb-2 animate-spin-slow" />
                  <p>Initialing agent session...</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex gap-3 text-white/60">
                    <span className="text-white/20 shrink-0">
                      {new Date(log.timestamp?.toDate()).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {log.type === 'success' && <CheckCircle2 className="w-3 h-3 text-neon-cyan" />}
                        {log.type === 'warning' && <AlertCircle className="w-3 h-3 text-neon-magenta" />}
                        {log.type === 'info' && <Search className="w-3 h-3 text-white/30" />}
                        <span className={`font-bold ${
                          log.type === 'success' ? 'text-neon-cyan' : 
                          log.type === 'warning' ? 'text-neon-magenta' : 
                          'text-white'
                        }`}>
                          {log.event}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40 leading-relaxed italic">{log.details}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-2 border-t border-white/10 bg-black/20 text-[10px] text-white/20 flex justify-between uppercase tracking-tighter">
              <span>skylar-core-process.sh</span>
              <span>100% stable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
