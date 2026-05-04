import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserActivity } from '../../types/dashboard';
import { Activity, Filter, Clock, Tag, Search, FileText, Sparkles, Target, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryViewProps {
  userId: string;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ userId }) => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'user_activities'),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        const fetchedActivities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserActivity[];
        setActivities(fetchedActivities);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  const getActivityIcon = (type: UserActivity['type']) => {
    switch (type) {
      case 'artifact_created': return <FileText className="w-4 h-4 text-neon-cyan" />;
      case 'insight_discovered': return <Sparkles className="w-4 h-4 text-yellow-400" />;
      case 'phase_unlocked': return <Target className="w-4 h-4 text-green-400" />;
      case 'asset_generated': return <Award className="w-4 h-4 text-purple-400" />;
      case 'milestone_completed': return <Target className="w-4 h-4 text-neon-cyan" />;
      case 'profile_updated': return <Activity className="w-4 h-4 text-blue-400" />;
      case 'mentor_note_received': return <FileText className="w-4 h-4 text-amber-400" />;
      default: return <Activity className="w-4 h-4 text-white/40" />;
    }
  };

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const filteredActivities = activities.filter(activity => {
    const matchPhase = filterPhase === 'all' || activity.journeyPhase === filterPhase;
    const matchType = filterType === 'all' || activity.type === filterType;
    const matchSearch = searchQuery === '' || 
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activity.description && activity.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (activity.tags && activity.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    return matchPhase && matchType && matchSearch;
  });

  const uniquePhases = Array.from(new Set(activities.map(a => a.journeyPhase).filter(Boolean)));
  const uniqueTypes = Array.from(new Set(activities.map(a => a.type)));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-black/40">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-neon-cyan/50 transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/40" />
              <select
                value={filterPhase}
                onChange={(e) => setFilterPhase(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-cyan/50"
              >
                <option value="all">All Phases</option>
                {uniquePhases.map(phase => (
                  <option key={phase} value={phase}>{phase}</option>
                ))}
              </select>
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-cyan/50"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filteredActivities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-white/40"
            >
              No activities found matching your filters.
            </motion.div>
          ) : (
            filteredActivities.map((activity, index) => (
              <motion.div
                key={activity.id || `activity-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.5) }}
                className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/40 hover:bg-white/5 transition-colors flex flex-col md:flex-row gap-6"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl border border-white/10 bg-black/80 text-white/40 shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-white/90">{activity.title}</h4>
                    <span className="text-xs text-white/40 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(activity.timestamp)}
                    </span>
                  </div>
                  
                  {activity.description && (
                    <p className="text-xs text-white/60 leading-relaxed">
                      {activity.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {activity.journeyPhase && (
                      <span className="px-2 py-1 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 text-[10px] font-bold uppercase tracking-wider">
                        {activity.journeyPhase}
                      </span>
                    )}
                    {activity.tags?.map(tag => (
                      <span key={tag} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-white/60 text-[10px] flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
