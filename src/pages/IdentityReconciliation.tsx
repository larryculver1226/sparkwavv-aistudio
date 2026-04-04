import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Fingerprint,
  AlertTriangle,
  UserPlus,
  Link as LinkIcon,
  RefreshCw,
  ShieldCheck,
  Search,
  User,
  LayoutDashboard,
  Trash2,
} from 'lucide-react';
import { auth } from '../lib/firebase';

interface ReconData {
  orphanedDashboards: any[];
  usersWithoutDashboards: any[];
  stats: {
    totalUsers: number;
    totalDashboards: number;
    orphans: number;
    missing: number;
  };
}

interface IdentityReconciliationProps {
  onNotify?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const IdentityReconciliation: React.FC<IdentityReconciliationProps> = ({ onNotify }) => {
  const [data, setData] = useState<ReconData | null>(null);
  const [loading, setLoading] = useState(true);
  const [relinking, setRelinking] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/identity-reconciliation', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch reconciliation data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRelink = async (dashboardId: string, newUserId: string, sparkwavvId: string) => {
    if (!confirm(`Are you sure you want to re-link this dashboard to user ${newUserId}?`)) return;

    setRelinking(dashboardId);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/relink-identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ dashboardId, newUserId, sparkwavvId }),
      });

      if (res.ok) {
        alert('Successfully re-linked dashboard.');
        fetchData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error('Failed to re-link identity:', error);
    } finally {
      setRelinking(null);
    }
  };

  const handleDeleteOrphan = async (dashboardId: string) => {
    if (
      !confirm(
        `Are you sure you want to PERMANENTLY DELETE this orphaned dashboard? This cannot be undone.`
      )
    )
      return;

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/dashboards/${dashboardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (res.ok) {
        alert('Dashboard deleted.');
        fetchData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error('Failed to delete dashboard:', error);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-neon-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <Fingerprint className="w-8 h-8 text-neon-cyan" />
            Identity Reconciliation
          </h2>
          <p className="text-white/40 text-sm mt-1">
            Diagnose and fix disconnected user dashboards
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Users',
            value: data?.stats.totalUsers,
            icon: User,
            color: 'text-blue-400',
          },
          {
            label: 'Total Dashboards',
            value: data?.stats.totalDashboards,
            icon: LayoutDashboard,
            color: 'text-purple-400',
          },
          {
            label: 'Orphaned Dashboards',
            value: data?.stats.orphans,
            icon: AlertTriangle,
            color: 'text-neon-magenta',
          },
          {
            label: 'Users Missing Dashboards',
            value: data?.stats.missing,
            icon: UserPlus,
            color: 'text-yellow-400',
          },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            </div>
            <p className="text-white/40 text-xs uppercase tracking-wider font-medium">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Orphaned Dashboards */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-white/5">
            <h3 className="font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-neon-magenta" />
              Orphaned Dashboards
            </h3>
            <p className="text-xs text-white/40 mt-1">
              Dashboards whose userId does not match any existing user UID
            </p>
          </div>
          <div className="divide-y divide-white/10 max-h-[500px] overflow-y-auto">
            {data?.orphanedDashboards.length === 0 ? (
              <div className="p-12 text-center text-white/20 italic">
                No orphaned dashboards found
              </div>
            ) : (
              data?.orphanedDashboards.map((dash) => (
                <div key={dash.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-mono text-white/80">{dash.id}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/60">
                          SparkwavvID: {dash.sparkwavvId || 'N/A'}
                        </span>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/60">
                          Stage: {dash.journeyStage || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-[10px] text-white/40">Last Updated</p>
                        <p className="text-xs">
                          {dash.updatedAt ? new Date(dash.updatedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteOrphan(dash.id)}
                        className="p-2 text-white/20 hover:text-neon-magenta hover:bg-neon-magenta/10 rounded-lg transition-all"
                        title="Delete Orphaned Dashboard"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Users Missing Dashboards */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-white/5">
            <h3 className="font-bold flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-yellow-400" />
              Users Missing Dashboards
            </h3>
            <p className="text-xs text-white/40 mt-1">
              Users who do not have a dashboard document matching their UID
            </p>
          </div>
          <div className="divide-y divide-white/10 max-h-[500px] overflow-y-auto">
            {data?.usersWithoutDashboards.length === 0 ? (
              <div className="p-12 text-center text-white/20 italic">
                No users missing dashboards
              </div>
            ) : (
              data?.usersWithoutDashboards.map((user) => (
                <div key={user.uid} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">{user.displayName || user.email}</p>
                      <p className="text-[10px] font-mono text-white/40">{user.uid}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/60">
                          SparkwavvID: {user.sparkwavvId || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {/* Manual Re-link Action */}
                      <div className="relative group">
                        <button className="px-3 py-1 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 rounded-lg text-xs hover:bg-neon-cyan/20 transition-all flex items-center gap-2">
                          <LinkIcon className="w-3 h-3" />
                          Re-link Orphan
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                          <p className="text-[10px] text-white/40 px-2 mb-2">
                            Select orphan to link to this user:
                          </p>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {data?.orphanedDashboards.map((orphan) => (
                              <button
                                key={orphan.id}
                                onClick={() => handleRelink(orphan.id, user.uid, user.sparkwavvId)}
                                className="w-full text-left px-2 py-1.5 hover:bg-white/5 rounded text-[10px] flex items-center justify-between"
                              >
                                <span className="truncate mr-2">
                                  {orphan.sparkwavvId || orphan.id}
                                </span>
                                <span className="text-neon-cyan shrink-0">Link</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Troubleshooting Guide */}
      <div className="bg-neon-cyan/5 border border-neon-cyan/20 p-6 rounded-2xl">
        <h3 className="text-neon-cyan font-bold flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5" />
          Identity Health Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="space-y-2">
            <p className="font-bold text-white/80">Self-Healing</p>
            <p className="text-white/60 leading-relaxed">
              The system automatically re-links dashboards if a user logs in with a new UID but the
              same SparkwavvID. Manual re-linking is only needed for legacy disconnects.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-white/80">Orphaned Dashboards</p>
            <p className="text-white/60 leading-relaxed">
              These usually occur when a user's account is deleted but their dashboard remains. You
              can link these to a new user record or delete them via the database.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-white/80">Missing Dashboards</p>
            <p className="text-white/60 leading-relaxed">
              New users get a dashboard automatically. If a user is missing one, they will see a
              "Create Dashboard" prompt on their first login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
