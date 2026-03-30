import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useIdentity } from '../contexts/IdentityContext';
import { ROLES } from '../constants';
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
  Copy,
  Heart,
  Menu,
  X,
  UserCog,
  Shield,
  Plus,
  Edit2,
  Trash2,
  Save,
  Mail,
  GraduationCap,
  Calendar,
  Fingerprint,
  Brain
} from 'lucide-react';
import { 
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
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
import { auth, db, adminDb } from '../lib/firebase';
import { FirebaseSetup } from './FirebaseSetup';
import { IdentityReconciliation } from './IdentityReconciliation';
import { VertexDashboard } from '../components/admin/VertexDashboard';
import { 
  JOURNEY_STAGES, 
  TENANTS, 
  GENERATIONAL_PERSONAS, 
  CAREER_STAGE_ROLES, 
  HIERARCHICAL_ROLES, 
  BRAND_PERSONAS, 
  BRAND_DNA_ATTRIBUTES,
  ROLES as APP_ROLES
} from '../constants';

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

interface RealTimeLog {
  id: string;
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  service: 'AUTH' | 'API' | 'FIRESTORE' | 'STORAGE' | 'SYSTEM';
  msg: string;
}

interface StorageMetrics {
  totalSize: number;
  artifactCount: number;
  quota: number;
}

const Auth0ManagementPanel = () => {
  const [auth0Users, setAuth0Users] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAuth0Users = async () => {
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/auth0/users', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuth0Users(data);
      }
    } catch (error) {
      console.error("Failed to fetch Auth0 users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuth0Users();
  }, []);

  const handleToggleBlock = async (user: any) => {
    const isBlocked = !user.blocked;
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/auth0/users/${user.user_id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ blocked: isBlocked })
      });
      if (res.ok) {
        setAuth0Users(auth0Users.map(u => u.user_id === user.user_id ? { ...u, blocked: isBlocked } : u));
      }
    } catch (error) {
      console.error("Failed to toggle block status:", error);
    }
  };

  const filteredUsers = auth0Users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input 
            type="text"
            placeholder="Search Auth0 users..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-neon-cyan/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={fetchAuth0Users}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
        >
          <RefreshCw className={`w-4 h-4 text-neon-cyan ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5">
              <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">User</th>
              <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Connection</th>
              <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Last Login</th>
              <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.map(u => (
              <tr key={u.user_id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={u.picture} alt="" className="w-8 h-8 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                    <div>
                      <p className="text-sm font-bold">{u.name || u.nickname}</p>
                      <p className="text-[10px] text-white/40">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-white/60">{u.identities?.[0]?.connection || 'N/A'}</td>
                <td className="px-6 py-4 text-xs text-white/40">{u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${u.blocked ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                    {u.blocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleToggleBlock(u)}
                    className={`p-2 rounded-lg transition-all ${u.blocked ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                    title={u.blocked ? "Unblock User" : "Block User"}
                  >
                    {u.blocked ? <ShieldCheck className="w-4 h-4" /> : <UserCog className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const navigate = useNavigate();
  const { role: adminRole, logout, isAdmin } = useIdentity();
  const isReadOnly = adminRole === 'viewer';
  const isSuperAdmin = isAdmin; // Use the isAdmin from context which includes super_admin
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [journeys, setJourneys] = useState<any[]>([]);
  const [flaggedContent, setFlaggedContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [fetchingPrograms, setFetchingPrograms] = useState(false);
  const [fetchingContent, setFetchingContent] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemLogs, setSystemLogs] = useState<RealTimeLog[]>([]);
  const [storageMetrics, setStorageMetrics] = useState<StorageMetrics | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const q = query(
      collection(adminDb, 'system_logs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          time: data.timestamp?.toDate ? data.timestamp.toDate().toLocaleTimeString() : '...',
          level: data.level,
          service: data.service,
          msg: data.msg
        } as RealTimeLog;
      });
      setSystemLogs(logs);
    });

    return () => unsubscribe();
  }, []);

  const fetchStorageMetrics = async () => {
    if (!auth.currentUser) return;
    
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch('/api/admin/storage/metrics', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStorageMetrics(data);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.warn("Storage metrics API returned error:", res.status, errorData);
      }
    } catch (error) {
      // Only log if it's not a common network error during logout/refresh
      if (auth.currentUser) {
        console.error("Failed to fetch storage metrics:", error);
      }
    }
  };

  useEffect(() => {
    if (auth.currentUser) {
      fetchStorageMetrics();
      const interval = setInterval(fetchStorageMetrics, 30000);
      return () => clearInterval(interval);
    }
  }, [auth.currentUser]);

  const handlePurgeStorage = async () => {
    if (!confirm("Are you sure you want to purge artifacts older than 30 days?")) return;
    
    setIsPurging(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/storage/purge', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (res.ok) {
        const result = await res.json();
        alert(`Successfully purged ${result.count} artifacts.`);
        fetchStorageMetrics();
      }
    } catch (error) {
      console.error("Failed to purge storage:", error);
    } finally {
      setIsPurging(false);
    }
  };

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    title: string; 
    message: string; 
    onConfirm: () => void;
    confirmText?: string;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userTenantFilter, setUserTenantFilter] = useState('all');

  // Date Range for Activity Chart
  const [activityStartDate, setActivityStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const minDate = new Date('2026-01-01');
    const finalDate = d < minDate ? minDate : d;
    return finalDate.toISOString().split('T')[0];
  });
  const [activityEndDate, setActivityEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Security Audit States
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  const [logOffset, setLogOffset] = useState(0);
  const logsPerPage = 20;

  // CRUD States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'user',
    journeyStage: 'Dive-In',
    tenantId: 'sparkwavv',
    generationalPersona: '',
    careerStageRole: '',
    hierarchicalRole: '',
    brandPersona: '',
    brandDNAAttributes: [] as string[]
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('/api/admin/stats', {
        headers: idToken ? { 'Authorization': `Bearer ${idToken}` } : {}
      });
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

  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);

  const fetchDiagnostics = async () => {
    setLoadingDiagnostics(true);
    try {
      const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('/api/admin/diagnostics', {
        headers: idToken ? { 'Authorization': `Bearer ${idToken}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setDiagnosticsData(data);
        setShowDiagnostics(true);
      } else {
        const text = await response.text();
        alert(`Failed to fetch diagnostics: ${text}`);
      }
    } catch (error: any) {
      console.error("Diagnostics error:", error);
      alert(`Diagnostics error: ${error.message}`);
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  const fetchUsers = async () => {
    console.log("[ADMIN] Fetching users...");
    setFetchingUsers(true);
    try {
      const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('/api/admin/users-v2', {
        headers: idToken ? { 'Authorization': `Bearer ${idToken}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter to only show staff (admin, super_admin)
        const staffUsers = (data.users || []).filter((u: any) => {
          const role = typeof u.role === 'string' ? u.role : u.role?.role;
          return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
        });
        setUsers(staffUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching admin users:", error);
    } finally {
      setFetchingUsers(false);
    }
  };

  const fetchProgramsAndCohorts = async () => {
    setFetchingPrograms(true);
    try {
      const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
      const headers = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};
      
      const [pRes, cRes, jRes] = await Promise.all([
        fetch('/api/admin/programs', { headers }),
        fetch('/api/admin/cohorts', { headers }),
        fetch('/api/admin/journeys', { headers })
      ]);

      if (pRes.ok) setPrograms(await pRes.json());
      if (cRes.ok) setCohorts(await cRes.json());
      if (jRes.ok) setJourneys(await jRes.json());
    } catch (error) {
      console.error("Error fetching programs/cohorts:", error);
    } finally {
      setFetchingPrograms(false);
    }
  };

  const fetchSecurityLogs = async (offset = 0) => {
    setFetchingLogs(true);
    try {
      const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch(`/api/admin/security-logs?limit=${logsPerPage}&offset=${offset}`, {
        headers: idToken ? { 'Authorization': `Bearer ${idToken}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setSecurityLogs(data.logs);
        setTotalLogs(data.total);
      }
    } catch (error) {
      console.error("Error fetching security logs:", error);
    } finally {
      setFetchingLogs(false);
    }
  };

  const fetchFlaggedContent = async () => {
    setFetchingContent(true);
    try {
      const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('/api/admin/flagged-content', {
        headers: idToken ? { 'Authorization': `Bearer ${idToken}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setFlaggedContent(data.content || []);
      }
    } catch (error) {
      console.error("Error fetching flagged content:", error);
    } finally {
      setFetchingContent(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers(); // Fetch users on mount to show in Recent Activity
    fetchProgramsAndCohorts();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
    if (activeTab === 'programs') {
      fetchProgramsAndCohorts();
    }
    if (activeTab === 'security') {
      fetchSecurityLogs(0);
      setLogOffset(0);
    }
    if (activeTab === 'content') {
      fetchFlaggedContent();
    }
  }, [activeTab]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    await logout();
    onLogout();
  };

  const handleUpdateRole = async (uid: string, newRole: string) => {
    try {
      const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ uid, role: newRole }),
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify(newUser),
      });
      if (response.ok) {
        setIsAddModalOpen(false);
        setNewUser({ 
          email: '', 
          password: '', 
          displayName: '', 
          role: 'user', 
          journeyStage: 'Dive-In',
          tenantId: 'sparkwavv',
          generationalPersona: '',
          careerStageRole: '',
          hierarchicalRole: '',
          brandPersona: '',
          brandDNAAttributes: []
        });
        fetchUsers();
      } else {
        const err = await response.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          uid: editingUser.uid,
          email: editingUser.email,
          displayName: editingUser.displayName,
          role: editingUser.role,
          journeyStage: editingUser.journeyStage,
          tenantId: editingUser.tenantId,
          generationalPersona: editingUser.generationalPersona,
          careerStageRole: editingUser.careerStageRole,
          hierarchicalRole: editingUser.hierarchicalRole,
          brandPersona: editingUser.brandPersona,
          brandDNAAttributes: editingUser.brandDNAAttributes,
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
          jobTitle: editingUser.jobTitle,
          companyOrg: editingUser.companyOrg,
          phone: editingUser.phone,
          programTrack: editingUser.programTrack,
          lifecycleStage: editingUser.lifecycleStage,
          outcomesAttributes: editingUser.outcomesAttributes,
          feedbackQuote: editingUser.feedbackQuote
        }),
      });
      if (response.ok) {
        setIsEditModalOpen(false);
        setEditingUser(null);
        fetchUsers();
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleResetPassword = async (email: string) => {
    if (!auth) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Reset Password',
      message: `Are you sure you want to send a password reset email to ${email}?`,
      confirmText: 'Send Reset Email',
      onConfirm: async () => {
        setResettingPassword(email);
        try {
          await sendPasswordResetEmail(auth, email);
          setNotification({ message: `Password reset email sent to ${email}`, type: 'success' });
        } catch (error) {
          console.error("Error sending reset email:", error);
          setNotification({ message: "Failed to send reset email.", type: 'error' });
        } finally {
          setResettingPassword(null);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDeleteUser = async (uid: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This will remove them from Auth and Firestore and cannot be undone.',
      confirmText: 'Delete User',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
          const response = await fetch('/api/admin/delete-user', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
            },
            body: JSON.stringify({ uid }),
          });
          if (response.ok) {
            setNotification({ message: "User deleted successfully", type: 'success' });
            fetchUsers();
          } else {
            setNotification({ message: "Failed to delete user", type: 'error' });
          }
        } catch (error) {
          console.error("Error deleting user:", error);
          setNotification({ message: "Error deleting user", type: 'error' });
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleApproveContent = async (id: string) => {
    try {
      const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch(`/api/admin/flagged-content/${id}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        }
      });
      if (response.ok) {
        setNotification({ message: "Content approved successfully", type: 'success' });
        fetchFlaggedContent();
      } else {
        setNotification({ message: "Failed to approve content", type: 'error' });
      }
    } catch (error) {
      console.error("Error approving content:", error);
      setNotification({ message: "Error approving content", type: 'error' });
    }
  };

  const handleDeleteContent = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Flagged Content",
      message: "Are you sure you want to permanently delete this content? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
          const response = await fetch(`/api/admin/flagged-content/${id}/delete`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
            }
          });
          if (response.ok) {
            setNotification({ message: "Content deleted successfully", type: 'success' });
            fetchFlaggedContent();
          } else {
            setNotification({ message: "Failed to delete content", type: 'error' });
          }
        } catch (error) {
          console.error("Error deleting content:", error);
          setNotification({ message: "Error deleting content", type: 'error' });
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
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
    const activityMap = new Map();
    
    const start = activityStartDate ? new Date(activityStartDate) : new Date();
    const end = activityEndDate ? new Date(activityEndDate) : new Date();
    
    // Normalize to midnight for comparison
    if (isNaN(start.getTime())) start.setTime(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
    if (isNaN(end.getTime())) end.setTime(new Date().getTime());

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 0;
    const isQuarterly = diffDays > 30;

    const getQuarterLabel = (date: Date) => {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter} ${date.getFullYear()}`;
    };

    if (isQuarterly) {
      // Initialize quarters in range
      const current = new Date(start);
      let safety = 0;
      while (current <= end && safety < 40) {
        const q = getQuarterLabel(current);
        if (!activityMap.has(q)) {
          activityMap.set(q, { name: q, active: 0, new: 0 });
        }
        current.setMonth(current.getMonth() + 3);
        safety++;
      }
      // Ensure end quarter is included
      const endQ = getQuarterLabel(end);
      if (!activityMap.has(endQ)) {
        activityMap.set(endQ, { name: endQ, active: 0, new: 0 });
      }

      if (users && users.length > 0) {
        users.forEach(user => {
          if (user.creationTime) {
            const d = new Date(user.creationTime);
            if (d >= start && d <= end) {
              const q = getQuarterLabel(d);
              if (activityMap.has(q)) {
                const data = activityMap.get(q);
                activityMap.set(q, { ...data, new: data.new + 1 });
              }
            }
          }
          if (user.emailVerified && user.lastSignInTime) {
            const d = new Date(user.lastSignInTime);
            if (d >= start && d <= end) {
              const q = getQuarterLabel(d);
              if (activityMap.has(q)) {
                const data = activityMap.get(q);
                activityMap.set(q, { ...data, active: data.active + 1 });
              }
            }
          }
        });
      }
    } else {
      // Initialize map with dates in range
      const current = new Date(start);
      // Limit to a reasonable range to prevent infinite loops or massive maps
      let safetyCounter = 0;
      while (current <= end && safetyCounter < 366) {
        const dateStr = current.toISOString().split('T')[0];
        // Format for X-axis: e.g., "Mar 12"
        const label = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        activityMap.set(dateStr, { name: label, fullDate: dateStr, active: 0, new: 0 });
        current.setDate(current.getDate() + 1);
        safetyCounter++;
      }

      if (users && users.length > 0) {
        users.forEach(user => {
          if (user.creationTime) {
            const creationDate = new Date(user.creationTime);
            const dateStr = creationDate.toISOString().split('T')[0];
            if (activityMap.has(dateStr)) {
              const data = activityMap.get(dateStr);
              activityMap.set(dateStr, { ...data, new: data.new + 1 });
            }
          }
          
          if (user.emailVerified && user.lastSignInTime) {
            const lastSeen = new Date(user.lastSignInTime);
            const dateStr = lastSeen.toISOString().split('T')[0];
            if (activityMap.has(dateStr)) {
              const data = activityMap.get(dateStr);
              activityMap.set(dateStr, { ...data, active: data.active + 1 });
            }
          }
        });
      }
    }

    return Array.from(activityMap.values()).sort((a, b) => {
      if (isQuarterly) return a.name.localeCompare(b.name);
      return (a.fullDate || '').localeCompare(b.fullDate || '');
    });
  })();

  return (
    <div className="min-h-screen bg-dark-bg text-white font-sans selection:bg-neon-cyan selection:text-black">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 right-8 z-[200] px-6 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center gap-3 ${
              toast.type === 'success' 
                ? 'bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan' 
                : 'bg-neon-magenta/10 border-neon-magenta/20 text-neon-magenta'
            }`}
          >
            {toast.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-60">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
                      <h1 className="font-display font-bold text-xl tracking-tight">SPARKWavv</h1>
                      <p className="text-[10px] text-neon-cyan font-display uppercase tracking-widest">Admin Console</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(adminRole === ROLES.SUPER_ADMIN || adminRole === ROLES.ADMIN) && (
                      <button
                        onClick={() => navigate('/operations')}
                        className="p-2 rounded-xl bg-neon-lime/10 border border-neon-lime/20 text-neon-lime lg:hidden"
                        title="Operations Center"
                      >
                        <ArrowUpRight className="w-5 h-5" />
                      </button>
                    )}
                    <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-white/40 hover:text-white">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <nav className="space-y-2">
                  {[
                    { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR, ROLES.VIEWER] },
                    { id: 'auth0', label: 'Auth0 Management', icon: UserCog, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
                    { id: 'cloud', label: 'Cloud Resources', icon: Cloud, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
                    { id: 'security', label: 'Security', icon: ShieldCheck, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
                    { id: 'vertex', label: 'Vertex AI', icon: Brain, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
                    { id: 'identity', label: 'Identity Reconciliation', icon: Fingerprint, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
                    { id: 'logs', label: 'System Logs', icon: Activity, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
                    { id: 'diagnostics', label: 'Diagnostics', icon: ShieldCheck, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
                    { id: 'firebase-setup', label: 'Firebase Setup', icon: Database, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
                  ].filter(item => item.roles.includes(adminRole as any)).map((item) => (
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
                  <button
                    onClick={() => navigate('/operations')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neon-lime hover:bg-neon-lime/10 transition-all border border-transparent hover:border-neon-lime/20"
                  >
                    <ArrowUpRight className="w-5 h-5" />
                    <span className="font-medium">Operations Center</span>
                  </button>
                </nav>
              </div>

              <div className="p-8 mt-auto">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neon-magenta hover:bg-neon-magenta/10 transition-all"
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
              <h1 className="font-display font-bold text-xl tracking-tight">SPARKWavv</h1>
              <p className="text-[10px] text-neon-cyan font-display uppercase tracking-widest">Admin Console</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR, ROLES.VIEWER] },
              { id: 'auth0', label: 'Auth0 Management', icon: UserCog, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
              { id: 'cloud', label: 'Cloud Resources', icon: Cloud, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
              { id: 'security', label: 'Security', icon: ShieldCheck, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
              { id: 'vertex', label: 'Vertex AI', icon: Brain, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
              { id: 'identity', label: 'Identity Reconciliation', icon: Fingerprint, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
              { id: 'logs', label: 'System Logs', icon: Activity, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
              { id: 'diagnostics', label: 'Diagnostics', icon: ShieldCheck, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
              { id: 'firebase-setup', label: 'Firebase Setup', icon: Database, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
            ].filter(item => item.roles.includes(adminRole as any)).map((item) => (
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
            <button
              onClick={() => navigate('/operations')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neon-lime hover:bg-neon-lime/10 transition-all border border-transparent hover:border-neon-lime/20"
            >
              <ArrowUpRight className="w-5 h-5" />
              <span className="font-medium">Operations Center</span>
            </button>
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-8">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neon-magenta hover:bg-neon-magenta/10 transition-all"
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
              {activeTab === 'auth0' && 'Auth0 Identity Management'}
              {activeTab === 'cloud' && 'Cloud Infrastructure'}
              {activeTab === 'security' && 'Security Audit'}
              {activeTab === 'identity' && 'Identity Reconciliation'}
              {activeTab === 'logs' && 'System Logs'}
              {activeTab === 'vertex' && 'Vertex AI Enterprise Intelligence'}
              {activeTab === 'diagnostics' && 'Connectivity Diagnostics'}
              {activeTab === 'firebase-setup' && 'Firebase Configuration'}
            </h2>
            <p className="text-white/40">
              {activeTab === 'overview' && 'Real-time metrics and environment status'}
              {activeTab === 'auth0' && 'Manage Auth0 users, roles, and security status'}
              {activeTab === 'vertex' && 'Managed RAG, Fine-Tuning, and Model Garden (Track B)'}
              {activeTab === 'diagnostics' && 'Evaluate SPARKWavv & Firebase integration status'}
              {activeTab === 'firebase-setup' && 'Step-by-step guide to connect your Firebase project'}
              {activeTab !== 'overview' && activeTab !== 'diagnostics' && activeTab !== 'firebase-setup' && 'Detailed system metrics'}
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
              <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
              <span className="text-sm font-medium text-neon-cyan uppercase tracking-widest">{stats?.system?.status}</span>
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
              <div className="glass-panel p-6 rounded-3xl border border-neon-cyan/20 bg-neon-cyan/5 relative overflow-hidden group text-left transition-all">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-xl bg-neon-cyan/10 text-neon-cyan">
                      <Activity className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-neon-cyan uppercase tracking-widest">CPU Load</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-display font-bold">{stats?.resources?.cpuUsage ? `${stats.resources.cpuUsage}%` : '0%'}</span>
                    <span className="text-xs text-white/40 mb-1.5">Avg/min</span>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-neon-cyan/5 rounded-full blur-2xl group-hover:bg-neon-cyan/10 transition-all" />
              </div>

              <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.02] relative overflow-hidden group text-left transition-all">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-xl bg-neon-magenta/10 text-neon-magenta">
                      <Database className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-neon-magenta uppercase tracking-widest">Memory</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-display font-bold">{stats?.resources?.memoryUsage ? `${stats.resources.memoryUsage}%` : '0%'}</span>
                    <span className="text-xs text-white/40 mb-1.5">Utilization</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.02] relative overflow-hidden group text-left transition-all">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-xl bg-neon-lime/10 text-neon-lime">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-neon-lime uppercase tracking-widest">Storage</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-display font-bold">{storageMetrics ? `${(storageMetrics.totalSize / (1024 * 1024)).toFixed(1)}MB` : '0MB'}</span>
                    <span className="text-xs text-white/40 mb-1.5">Artifacts</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.02] relative overflow-hidden group text-left transition-all">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-xl bg-white/10 text-white">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Uptime</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-display font-bold">99.9%</span>
                    <span className="text-xs text-white/40 mb-1.5">SLA Target</span>
                  </div>
                </div>
              </div>
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
        {activeTab === 'security' && (
          <div className="glass-panel rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-display font-bold">Security Audit Ledger</h3>
                <p className="text-sm text-white/40">Real-time record of administrative actions and security events</p>
              </div>
              <button 
                onClick={() => fetchSecurityLogs(logOffset)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                disabled={fetchingLogs}
              >
                <RefreshCw className={`w-4 h-4 ${fetchingLogs ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs text-white/20 uppercase tracking-widest border-b border-white/5">
                    <th className="px-6 py-4 font-medium border-r border-white/5">Timestamp</th>
                    <th className="px-6 py-4 font-medium border-r border-white/5">Actor</th>
                    <th className="px-6 py-4 font-medium border-r border-white/5">Event Type</th>
                    <th className="px-6 py-4 font-medium border-r border-white/5">Target</th>
                    <th className="px-6 py-4 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {securityLogs.length > 0 ? (
                    securityLogs.map((log, i) => (
                      <tr key={i} className="hover:bg-white/[0.05] group transition-all">
                        <td className="px-6 py-4 font-mono text-[11px] text-white/40 border-r border-white/5">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 border-r border-white/5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold group-hover:text-neon-cyan transition-colors">{log.actorEmail}</span>
                            <span className="text-[9px] uppercase tracking-widest text-white/20">{typeof log.actorRole === 'string' ? log.actorRole : (log.actorRole as any)?.role || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 border-r border-white/5">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${
                            log.severity === 'CRITICAL' ? 'bg-neon-magenta/10 text-neon-magenta animate-pulse' :
                            log.severity === 'WARNING' ? 'bg-neon-magenta/10 text-neon-magenta' :
                            'bg-neon-cyan/10 text-neon-cyan'
                          }`}>
                            {log.actionType}
                          </span>
                        </td>
                        <td className="px-6 py-4 border-r border-white/5">
                          <span className="text-xs text-white/60">{log.targetEmail || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(log.details || {}).map(([key, val]: [string, any]) => (
                              <div key={key} className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/5">
                                <span className="text-[9px] uppercase text-white/20">{key}:</span>
                                <span className="text-[10px] font-mono text-white/60">{String(val)}</span>
                              </div>
                            ))}
                            <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/5">
                              <span className="text-[9px] uppercase text-white/20">IP:</span>
                              <span className="text-[10px] font-mono text-white/60">{log.ipAddress}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-white/40 italic">
                        {fetchingLogs ? 'Loading audit ledger...' : 'No security events recorded.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalLogs > logsPerPage && (
              <div className="p-4 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                <span className="text-xs text-white/20">
                  Showing {logOffset + 1} to {Math.min(logOffset + logsPerPage, totalLogs)} of {totalLogs} events
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled={logOffset === 0 || fetchingLogs}
                    onClick={() => {
                      const newOffset = logOffset - logsPerPage;
                      setLogOffset(newOffset);
                      fetchSecurityLogs(newOffset);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/10 disabled:opacity-30 transition-all"
                  >
                    Previous
                  </button>
                  <button 
                    disabled={logOffset + logsPerPage >= totalLogs || fetchingLogs}
                    onClick={() => {
                      const newOffset = logOffset + logsPerPage;
                      setLogOffset(newOffset);
                      fetchSecurityLogs(newOffset);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/10 disabled:opacity-30 transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'identity' && (
          <IdentityReconciliation onNotify={(msg, type) => setNotification({ message: msg, type: type as any })} />
        )}

        {activeTab === 'vertex' && (
          <VertexDashboard onNotify={(msg, type) => setNotification({ message: msg, type: type as any })} />
        )}

        {activeTab === 'auth0' && (
          <Auth0ManagementPanel />
        )}

        {activeTab === 'overview' && (
          <>
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-xl font-display font-bold">User Growth & Activity</h3>
                    <span className="text-xs font-mono text-neon-cyan/60 bg-neon-cyan/5 px-2 py-0.5 rounded-full border border-neon-cyan/10">
                      Total: {users.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                      <Calendar className="w-4 h-4 text-white/40" />
                      <input 
                        type="date" 
                        min="2026-01-01"
                        value={activityStartDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val >= "2026-01-01") {
                            setActivityStartDate(val);
                          }
                        }}
                        className="bg-transparent text-[10px] text-white/80 focus:outline-none uppercase tracking-widest font-bold"
                      />
                      <span className="text-white/20 text-[10px] uppercase tracking-widest font-bold">to</span>
                      <input 
                        type="date" 
                        min="2026-01-01"
                        value={activityEndDate}
                        onChange={(e) => setActivityEndDate(e.target.value)}
                        className="bg-transparent text-[10px] text-white/80 focus:outline-none uppercase tracking-widest font-bold"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-neon-cyan" />
                        <span className="text-xs text-white/40">Active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-neon-magenta" />
                        <span className="text-xs text-white/40">New</span>
                      </div>
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
                      <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="active" stroke="#00f3ff" fillOpacity={1} fill="url(#colorActive)" />
                      <Area type="monotone" dataKey="new" stroke="#ff00ff" fill="transparent" />
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
                              user.emailVerified ? 'bg-neon-lime/10 text-neon-lime' : 'bg-neon-magenta/10 text-neon-magenta'
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
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-display font-bold">Sentiment Trends</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-neon-lime" />
                      <span className="text-xs text-white/40">Positive</span>
                    </div>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.sentiment?.trends || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="day" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#39ff14" fill="#39ff1420" />
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
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-display font-bold">Flagged Content & Moderation</h3>
                <button 
                  onClick={fetchFlaggedContent}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  disabled={fetchingContent}
                >
                  <RefreshCw className={`w-4 h-4 ${fetchingContent ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs text-white/20 uppercase tracking-widest border-b border-white/5">
                      <th className="px-6 py-4 font-medium">Author</th>
                      <th className="px-6 py-4 font-medium">Content Type</th>
                      <th className="px-6 py-4 font-medium">Reason</th>
                      <th className="px-6 py-4 font-medium">Timestamp</th>
                      <th className="px-6 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {flaggedContent.length > 0 ? (
                      flaggedContent.map((item, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-medium">{item.authorName || item.authorEmail}</td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-white/5 text-white/40">
                              {item.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-neon-magenta/10 text-neon-magenta">
                              {item.reason}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-white/40 text-sm">
                            {new Date(item.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleApproveContent(item.id)}
                                className="p-2 rounded-lg bg-neon-lime/10 border border-neon-lime/20 hover:bg-neon-lime/20 text-neon-lime transition-all" 
                                title="Approve"
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteContent(item.id)}
                                className="p-2 rounded-lg bg-neon-magenta/10 border border-neon-magenta/20 hover:bg-neon-magenta/20 text-neon-magenta transition-all" 
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-white/40 italic">
                          No flagged content found. System is clean.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                    {stats?.engagement?.topModules?.map((module, i) => (
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
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-neon-lime/10 text-neon-lime">
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

        {activeTab === 'cloud' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
                <h3 className="text-xl font-display font-bold mb-8">CPU & Memory Utilization</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { time: '00:00', cpu: 32, mem: 45 },
                      { time: '04:00', cpu: 28, mem: 42 },
                      { time: '08:00', cpu: 45, mem: 55 },
                      { time: '12:00', cpu: 65, mem: 72 },
                      { time: '16:00', cpu: 58, mem: 68 },
                      { time: '20:00', cpu: 42, mem: 52 },
                      { time: '23:59', cpu: 35, mem: 48 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="time" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      />
                      <Area type="monotone" dataKey="cpu" stroke="#00f3ff" fill="#00f3ff20" />
                      <Area type="monotone" dataKey="mem" stroke="#8b5cf6" fill="#8b5cf620" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
                <h3 className="text-xl font-display font-bold mb-8">Network Traffic (MB/s)</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { time: 'Mon', in: 450, out: 320 },
                      { time: 'Tue', in: 520, out: 380 },
                      { time: 'Wed', in: 610, out: 450 },
                      { time: 'Thu', in: 580, out: 410 },
                      { time: 'Fri', in: 720, out: 540 },
                      { time: 'Sat', in: 480, out: 310 },
                      { time: 'Sun', in: 420, out: 280 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="time" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      />
                      <Bar dataKey="in" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="out" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Database Connections', value: '142', status: 'Optimal', color: 'text-neon-lime' },
                { label: 'API Latency', value: '42ms', status: 'Fast', color: 'text-neon-lime' },
                { label: 'Error Rate', value: '0.02%', status: 'Low', color: 'text-neon-lime' },
              ].map((item, i) => (
                <div key={i} className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-2">{item.label}</p>
                  <div className="flex items-end justify-between">
                    <h4 className="text-2xl font-display font-bold">{item.value}</h4>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${item.color}`}>{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="glass-panel rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-display font-bold">Real-time System Logs</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-neon-lime animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-neon-lime">Live Stream</span>
              </div>
            </div>
            <div className="p-6 bg-black/40 font-mono text-xs space-y-2 max-h-[600px] overflow-y-auto">
              {systemLogs.length === 0 ? (
                <div className="text-white/20 italic">Waiting for system events...</div>
              ) : (
                systemLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 border-b border-white/5 pb-2 last:border-0">
                    <span className="text-white/20">[{log.time}]</span>
                    <span className={`font-bold ${
                      log.level === 'ERROR' ? 'text-neon-magenta' : 
                      log.level === 'WARN' ? 'text-neon-cyan' : 
                      log.level === 'DEBUG' ? 'text-neon-magenta' : 'text-neon-cyan'
                    }`}>{log.level}</span>
                    <span className="text-white/40 uppercase tracking-tighter">[{log.service}]</span>
                    <span className="text-white/80">{log.msg}</span>
                  </div>
                ))
              )}
              <div className="pt-4 text-white/20 italic animate-pulse">
                &gt; Listening for new events...
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Storage Management Card */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-neon-cyan/10">
                      <Database className="w-5 h-5 text-neon-cyan" />
                    </div>
                    <h3 className="font-bold">Storage Management</h3>
                  </div>
                  <button 
                    onClick={handlePurgeStorage}
                    disabled={isPurging}
                    className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    {isPurging ? 'Purging...' : 'Purge Old Data'}
                  </button>
                </div>

                {storageMetrics ? (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Usage</span>
                      <span className="font-mono">
                        {(storageMetrics.totalSize / (1024 * 1024)).toFixed(2)} MB / {(storageMetrics.quota / (1024 * 1024)).toFixed(0)} MB
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (storageMetrics.totalSize / storageMetrics.quota) * 100)}%` }}
                        className={`h-full ${
                          (storageMetrics.totalSize / storageMetrics.quota) > 0.9 ? 'bg-neon-magenta' : 
                          (storageMetrics.totalSize / storageMetrics.quota) > 0.7 ? 'bg-neon-cyan' : 'bg-neon-cyan'
                        }`}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white/40">
                      <span>{storageMetrics.artifactCount} Artifacts</span>
                      <span>{((storageMetrics.totalSize / storageMetrics.quota) * 100).toFixed(1)}% Capacity</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center text-white/20 italic">
                    Loading metrics...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-2xl font-display font-bold mb-6">Add New User</h3>
              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Display Name</label>
                    <input 
                      type="text" 
                      required
                      value={newUser.displayName}
                      onChange={e => setNewUser({...newUser, displayName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={newUser.email}
                      onChange={e => setNewUser({...newUser, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Password</label>
                    <input 
                      type="password" 
                      required
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Tenant</label>
                    <select 
                      value={newUser.tenantId}
                      onChange={e => setNewUser({...newUser, tenantId: e.target.value})}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all text-white"
                    >
                      {TENANTS.map(t => (
                        <option key={t.id} value={t.id} className="bg-[#111] text-white">{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">System Role</label>
                    <select 
                      value={newUser.role}
                      onChange={e => setNewUser({...newUser, role: e.target.value})}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all text-white"
                    >
                      <option value="user" className="bg-[#111] text-white">User</option>
                      <option value="admin" className="bg-[#111] text-white">Admin</option>
                      <option value="operator" className="bg-[#111] text-white">Operator</option>
                      <option value="mentor" className="bg-[#111] text-white">Mentor</option>
                      <option value="agent" className="bg-[#111] text-white">Agent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Journey Stage</label>
                    <select 
                      value={newUser.journeyStage}
                      onChange={e => setNewUser({...newUser, journeyStage: e.target.value})}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all text-white"
                    >
                      {JOURNEY_STAGES.map(s => (
                        <option key={s} value={s} className="bg-[#111] text-white">{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-neon-cyan mb-4">SPARKWavv Persona Details</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Generational Persona</label>
                      <select 
                        value={newUser.generationalPersona}
                        onChange={e => setNewUser({...newUser, generationalPersona: e.target.value})}
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all text-white"
                      >
                        <option value="" className="bg-[#111] text-white">Select Persona</option>
                        {GENERATIONAL_PERSONAS.map(p => (
                          <option key={p} value={p} className="bg-[#111] text-white">{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Career Stage Role</label>
                      <select 
                        value={newUser.careerStageRole}
                        onChange={e => setNewUser({...newUser, careerStageRole: e.target.value})}
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all text-white"
                      >
                        <option value="" className="bg-[#111] text-white">Select Role</option>
                        {CAREER_STAGE_ROLES.map(r => (
                          <option key={r} value={r} className="bg-[#111] text-white">{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Hierarchical Role</label>
                    <select 
                      value={newUser.hierarchicalRole}
                      onChange={e => setNewUser({...newUser, hierarchicalRole: e.target.value})}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all text-white"
                    >
                      <option value="" className="bg-[#111] text-white">Select Level</option>
                      {HIERARCHICAL_ROLES.map(r => (
                        <option key={r} value={r} className="bg-[#111] text-white">{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Brand Persona</label>
                    <select 
                      value={newUser.brandPersona}
                      onChange={e => setNewUser({...newUser, brandPersona: e.target.value})}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all text-white"
                    >
                      <option value="" className="bg-[#111] text-white">Select Persona</option>
                      {BRAND_PERSONAS.map(p => (
                        <option key={p} value={p} className="bg-[#111] text-white">{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-neon-cyan text-black font-bold uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:scale-105 transition-all"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-2xl font-display font-bold mb-6">Edit User</h3>
              <form onSubmit={handleUpdateUser} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    value={editingUser.email || ''}
                    onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all text-white"
                    placeholder="user@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">First Name</label>
                    <input 
                      type="text" 
                      value={editingUser.firstName || ''}
                      onChange={e => setEditingUser({...editingUser, firstName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Last Name</label>
                    <input 
                      type="text" 
                      value={editingUser.lastName || ''}
                      onChange={e => setEditingUser({...editingUser, lastName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Job Title</label>
                    <input 
                      type="text" 
                      value={editingUser.jobTitle || ''}
                      onChange={e => setEditingUser({...editingUser, jobTitle: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Company/Org</label>
                    <input 
                      type="text" 
                      value={editingUser.companyOrg || ''}
                      onChange={e => setEditingUser({...editingUser, companyOrg: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Phone</label>
                    <input 
                      type="text" 
                      value={editingUser.phone || ''}
                      onChange={e => setEditingUser({...editingUser, phone: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Program/Track</label>
                    <input 
                      type="text" 
                      value={editingUser.programTrack || ''}
                      onChange={e => setEditingUser({...editingUser, programTrack: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Lifecycle Stage</label>
                    <input 
                      type="text" 
                      value={editingUser.lifecycleStage || ''}
                      onChange={e => setEditingUser({...editingUser, lifecycleStage: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Tenant</label>
                    <select 
                      value={editingUser.tenantId || 'sparkwavv'}
                      onChange={e => setEditingUser({...editingUser, tenantId: e.target.value})}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all text-white"
                    >
                      {TENANTS.map(t => (
                        <option key={t.id} value={t.id} className="bg-[#111] text-white">{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Display Name</label>
                    <input 
                      type="text" 
                      required
                      value={editingUser.displayName}
                      onChange={e => setEditingUser({...editingUser, displayName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40">Outcomes & Attributes</label>
                  <textarea 
                    value={editingUser.outcomesAttributes || ''}
                    onChange={e => setEditingUser({...editingUser, outcomesAttributes: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all h-24 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40">Feedback / Quote</label>
                  <textarea 
                    value={editingUser.feedbackQuote || ''}
                    onChange={e => setEditingUser({...editingUser, feedbackQuote: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all h-24 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">System Role</label>
                    <select 
                      value={editingUser.role}
                      onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all text-white"
                    >
                      <option value="user" className="bg-[#111] text-white">User</option>
                      <option value="admin" className="bg-[#111] text-white">Admin</option>
                      <option value="operator" className="bg-[#111] text-white">Operator</option>
                      <option value="mentor" className="bg-[#111] text-white">Mentor</option>
                      <option value="agent" className="bg-[#111] text-white">Agent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Journey Stage</label>
                    <select 
                      value={editingUser.journeyStage}
                      onChange={e => setEditingUser({...editingUser, journeyStage: e.target.value})}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all text-white"
                    >
                      {JOURNEY_STAGES.map(s => (
                        <option key={s} value={s} className="bg-[#111] text-white">{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-neon-cyan mb-4">SPARKWavv Persona Details</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Generational Persona</label>
                      <select 
                        value={editingUser.generationalPersona || ''}
                        onChange={e => setEditingUser({...editingUser, generationalPersona: e.target.value})}
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all text-white"
                      >
                        <option value="" className="bg-[#111] text-white">Select Persona</option>
                        {GENERATIONAL_PERSONAS.map(p => (
                          <option key={p} value={p} className="bg-[#111] text-white">{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Career Stage Role</label>
                      <select 
                        value={editingUser.careerStageRole || ''}
                        onChange={e => setEditingUser({...editingUser, careerStageRole: e.target.value})}
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all text-white"
                      >
                        <option value="" className="bg-[#111] text-white">Select Role</option>
                        {CAREER_STAGE_ROLES.map(r => (
                          <option key={r} value={r} className="bg-[#111] text-white">{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Hierarchical Role</label>
                    <select 
                      value={editingUser.hierarchicalRole || ''}
                      onChange={e => setEditingUser({...editingUser, hierarchicalRole: e.target.value})}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all text-white"
                    >
                      <option value="" className="bg-[#111] text-white">Select Level</option>
                      {HIERARCHICAL_ROLES.map(r => (
                        <option key={r} value={r} className="bg-[#111] text-white">{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Brand Persona</label>
                    <select 
                      value={editingUser.brandPersona || ''}
                      onChange={e => setEditingUser({...editingUser, brandPersona: e.target.value})}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-all text-white"
                    >
                      <option value="" className="bg-[#111] text-white">Select Persona</option>
                      {BRAND_PERSONAS.map(p => (
                        <option key={p} value={p} className="bg-[#111] text-white">{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-neon-cyan text-black font-bold uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:scale-105 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 ${
              notification.type === 'success' 
                ? 'bg-neon-lime/10 border-neon-lime/20 text-neon-lime' 
                : 'bg-neon-magenta/10 border-neon-magenta/20 text-neon-magenta'
            }`}
          >
            {notification.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-medium">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-4 opacity-40 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl bg-[#0a0a0a]"
            >
              <h3 className="text-2xl font-display font-bold mb-4">{confirmModal.title}</h3>
              <p className="text-white/60 mb-8 leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${
                    confirmModal.isDestructive 
                      ? 'bg-neon-magenta text-white hover:bg-neon-magenta/90 shadow-lg shadow-neon-magenta/20' 
                      : 'bg-neon-cyan text-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/20'
                  }`}
                >
                  {confirmModal.confirmText || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Diagnostics Modal */}
      <AnimatePresence>
        {showDiagnostics && diagnosticsData && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDiagnostics(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl bg-[#0a0a0a] max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-bold text-neon-cyan flex items-center gap-3">
                  <Activity className="w-6 h-6" />
                  Firebase Diagnostics
                </h3>
                <button onClick={() => setShowDiagnostics(false)} className="p-2 hover:bg-white/5 rounded-lg transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Admin Configured</p>
                    <p className={`text-lg font-bold ${diagnosticsData.isFirebaseAdminConfigured ? 'text-neon-lime' : 'text-neon-magenta'}`}>
                      {diagnosticsData.isFirebaseAdminConfigured ? 'YES' : 'NO'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Node Env</p>
                    <p className="text-lg font-bold text-white">{diagnosticsData.env.NODE_ENV}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Project IDs</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-white/60">Config/Env:</span>
                      <span className="text-sm font-mono text-neon-cyan">{diagnosticsData.env.FIREBASE_PROJECT_ID}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-white/60">Vite (Build):</span>
                      <span className="text-sm font-mono text-neon-cyan">{diagnosticsData.env.VITE_FIREBASE_PROJECT_ID}</span>
                    </div>
                    {diagnosticsData.env.FIREBASE_PROJECT_ID !== diagnosticsData.env.VITE_FIREBASE_PROJECT_ID && (
                      <div className="p-2 mt-2 rounded-lg bg-neon-magenta/10 border border-neon-magenta/20 text-neon-magenta text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Project ID Mismatch Detected!
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-2">User Counts (Sample)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-white">{diagnosticsData.counts.authUsers}</p>
                      <p className="text-xs text-white/40">Auth Users</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{diagnosticsData.counts.firestoreUsers}</p>
                      <p className="text-xs text-white/40">Firestore Users</p>
                    </div>
                  </div>
                </div>

                {diagnosticsData.sampleUsers && diagnosticsData.sampleUsers.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Sample Auth Users</p>
                    <div className="space-y-2">
                      {diagnosticsData.sampleUsers.map((u: any) => (
                        <div key={u.uid} className="text-xs font-mono text-white/60 bg-black/40 p-2 rounded">
                          {u.email} <span className="opacity-30">({u.uid})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Firestore Database ID</p>
                  <p className="text-sm font-mono text-neon-cyan">
                    {diagnosticsData.firebaseAppletConfig.firestoreDatabaseId || '(default)'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDiagnostics(false)}
                className="w-full mt-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold uppercase tracking-widest text-xs"
              >
                Close Diagnostics
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
