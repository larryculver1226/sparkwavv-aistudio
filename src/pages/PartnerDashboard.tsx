import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ChevronRight, 
  Target, 
  TrendingUp, 
  Award, 
  Clock,
  ArrowLeft,
  ShieldCheck as Shield
} from 'lucide-react';
import { useIdentity } from '../contexts/IdentityContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Button } from '../components/Button';

interface PartnerAccess {
  id: string;
  userUid: string;
  userName: string;
  relationship: string;
  grantedAt: string;
}

interface UserProgress {
  user: {
    displayName: string;
    journeyStage: string;
    role: string;
  };
  dashboard: any;
}

export const PartnerDashboard: React.FC = () => {
  const { user } = useIdentity();
  const [accessRecords, setAccessRecords] = useState<PartnerAccess[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'partner_access'),
      where('partnerUid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PartnerAccess[];
      setAccessRecords(records);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching access records:", err);
      setError("Failed to load partner access records.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const viewUserProgress = async (userId: string) => {
    setLoading(true);
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/partner/user-progress/${userId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user progress");
      }

      const data = await response.json();
      setSelectedUser(data);
    } catch (err: any) {
      console.error("Error fetching user progress:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedUser) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {!selectedUser ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-neon-cyan/10 rounded-xl">
                  <Users className="w-8 h-8 text-neon-cyan" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Partner Dashboard</h1>
                  <p className="text-zinc-400">View and support your Relational Power Partners</p>
                </div>
              </div>

              {accessRecords.length === 0 ? (
                <div className="glass-panel bg-black/40 border border-white/5 rounded-2xl p-12 text-center">
                  <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Active Partnerships</h3>
                  <p className="text-zinc-400 max-w-md mx-auto">
                    When someone invites you to be their RPP and you accept, their progress will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {accessRecords.map((record) => (
                    <motion.div
                      key={record.id}
                      whileHover={{ scale: 1.02 }}
                      className="glass-panel bg-black/40 border border-white/5 rounded-2xl p-6 cursor-pointer group"
                      onClick={() => viewUserProgress(record.userUid)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-neon-cyan/20 rounded-full flex items-center justify-center text-neon-cyan font-bold text-xl">
                          {record.userName.charAt(0)}
                        </div>
                        <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-zinc-400">
                          {record.relationship}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-1 group-hover:text-neon-cyan transition-colors">
                        {record.userName}
                      </h3>
                      <p className="text-zinc-500 text-sm mb-6 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Partner since {new Date(record.grantedAt).toLocaleDateString()}
                      </p>
                      <Button variant="outline" className="w-full justify-between group border-white/10 hover:border-neon-cyan/50">
                        View Progress
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button 
                onClick={() => setSelectedUser(null)}
                className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Partners
              </button>

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold tracking-tight">{selectedUser.user.displayName}'s Journey</h1>
                    <span className="px-3 py-1 bg-neon-cyan/10 text-neon-cyan rounded-full text-sm font-medium border border-neon-cyan/20">
                      {selectedUser.user.journeyStage}
                    </span>
                  </div>
                  <p className="text-zinc-400">Supporting their career discovery and brand alignment</p>
                </div>
                <div className="flex gap-4">
                  <div className="glass-panel bg-black/40 border border-white/5 rounded-xl px-6 py-3 text-center">
                    <div className="text-2xl font-bold text-neon-cyan">{selectedUser.dashboard?.careerHappiness}%</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider">Happiness</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Progress */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Journey Timeline Summary */}
                  <div className="glass-panel bg-black/40 border border-white/5 rounded-3xl p-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-neon-cyan" />
                      Milestone Progress
                    </h3>
                    <div className="space-y-4">
                      {selectedUser.dashboard?.milestones?.map((milestone: any) => (
                        <div key={milestone.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${milestone.completed ? 'bg-neon-cyan text-black' : 'bg-white/10 text-white/20'}`}>
                            {milestone.completed ? <Award className="w-4 h-4" /> : <div className="w-2 h-2 bg-white/20 rounded-full" />}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{milestone.label}</div>
                            <div className="text-xs text-zinc-500">Week {milestone.week}</div>
                          </div>
                          {milestone.completed && (
                            <span className="text-xs text-neon-cyan font-medium bg-neon-cyan/10 px-2 py-1 rounded">Completed</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths */}
                  <div className="glass-panel bg-black/40 border border-white/5 rounded-3xl p-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Target className="w-5 h-5 text-neon-cyan" />
                      Top Strengths
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.dashboard?.strengths?.map((strength: any) => (
                        <div key={strength.name} className="p-4 bg-white/5 rounded-xl border border-white/5">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{strength.name}</span>
                            <span className="text-neon-cyan font-bold">{strength.value}%</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${strength.value}%` }}
                              className="h-full bg-neon-cyan"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                  <div className="glass-panel bg-black/40 border border-white/5 rounded-3xl p-8">
                    <h3 className="text-lg font-bold mb-4">Partner Status</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm text-zinc-400">
                        <Shield className="w-4 h-4 text-neon-cyan" />
                        <span>Verified RPP Access</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-zinc-400">
                        <Clock className="w-4 h-4 text-neon-cyan" />
                        <span>Last updated: {new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                    <hr className="my-6 border-white/5" />
                    <p className="text-sm text-zinc-500 italic">
                      "As an RPP, your role is to encourage and provide perspective. Check in with {selectedUser.user.displayName} about their recent milestones."
                    </p>
                  </div>

                  <div className="glass-panel bg-neon-cyan/5 border border-neon-cyan/20 rounded-3xl p-8">
                    <h3 className="text-lg font-bold text-neon-cyan mb-2">Support Action</h3>
                    <p className="text-sm text-zinc-400 mb-6">
                      Send a quick message or schedule a check-in to discuss their progress in the {selectedUser.user.journeyStage} stage.
                    </p>
                    <Button className="w-full bg-neon-cyan hover:bg-neon-cyan/90 text-black font-bold uppercase tracking-widest">
                      Send Encouragement
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
