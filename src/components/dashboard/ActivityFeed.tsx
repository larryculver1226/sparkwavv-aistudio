import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserActivity } from '../../types/dashboard';
import { Activity, Sparkles, FileText, Target, Award, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

interface ActivityFeedProps {
  userId: string;
  limitCount?: number;
  onActivityClick?: (activity: UserActivity) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ userId, limitCount = 10, onActivityClick }) => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'user_activities'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newActivities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserActivity[];
      
      setActivities(newActivities);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching activities:", error);
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'user_activities');
    });

    return () => unsubscribe();
  }, [userId, limitCount]);

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

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'just now';
    
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40 animate-pulse">
        <div className="h-4 w-32 bg-white/10 rounded mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-white/10"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 bg-white/10 rounded"></div>
                <div className="h-2 w-1/4 bg-white/10 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40">
      <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
        <Activity className="w-4 h-4 text-neon-cyan" />
        Activity Feed
      </h3>
      
      {activities.length === 0 ? (
        <div className="text-center py-8 text-white/40 text-sm">
          No recent activity. Start exploring the journey!
        </div>
      ) : (
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
          <AnimatePresence>
            {activities.map((activity, index) => (
              <motion.div 
                key={activity.id || `activity-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white/10 bg-black/80 text-white/40 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  {getActivityIcon(activity.type)}
                </div>
                
                <div 
                  className={`w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-white/5 bg-white/5 transition-colors ${onActivityClick ? 'cursor-pointer hover:bg-white/10 hover:border-neon-cyan/30' : 'hover:bg-white/10'}`}
                  onClick={() => onActivityClick && onActivityClick(activity)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white/80">{activity.title}</span>
                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  {activity.description && (
                    <p className="text-[11px] text-white/60 line-clamp-2">{activity.description}</p>
                  )}
                  {activity.journeyPhase && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                      {activity.journeyPhase}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
