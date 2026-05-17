import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  ArrowRight, 
  Sparkles,
  Briefcase,
  Target,
  Users
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  updateDoc 
} from 'firebase/firestore';

interface Nudge {
  id: string;
  content: string;
  type: 'job_alert' | 'skill_suggestion' | 'network_nudge';
  read: boolean;
  actionLink?: string;
  createdAt: any;
}

interface ProactiveNudgeProps {
  userId: string;
}

export const ProactiveNudge: React.FC<ProactiveNudgeProps> = ({ userId }) => {
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'nudges'),
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(3)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNudges = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Nudge[];
      setNudges(newNudges);
    });

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await updateDoc(doc(db, 'nudges', id), { read: true });
    } catch (error) {
      console.error('Error marking nudge as read:', error);
    }
  };

  const activeNudges = nudges.filter(n => !dismissed.includes(n.id));

  if (activeNudges.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full animate-in slide-in-from-right-10 duration-500">
      {activeNudges.map((nudge) => (
        <div 
          key={nudge.id}
          className="group relative bg-[#0A0A0A]/95 border border-neon-cyan/20 rounded-2xl p-4 backdrop-blur-xl shadow-2xl shadow-neon-cyan/5 hover:border-neon-cyan/40 transition-all cursor-pointer overflow-hidden"
          onClick={() => nudge.actionLink && window.open(nudge.actionLink, '_blank')}
        >
          {/* Neon Glow Accent */}
          <div className="absolute top-0 left-0 w-1 h-full bg-neon-cyan/50" />
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(prev => [...prev, nudge.id]);
              markAsRead(nudge.id);
            }}
            className="absolute top-2 right-2 p-1 text-white/20 hover:text-white/60 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
              {nudge.type === 'job_alert' && <Briefcase className="w-5 h-5 text-neon-cyan" />}
              {nudge.type === 'skill_suggestion' && <Target className="w-5 h-5 text-neon-cyan" />}
              {nudge.type === 'network_nudge' && <Users className="w-5 h-5 text-neon-cyan" />}
            </div>
            
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-neon-cyan uppercase tracking-widest">Skylar Insights</span>
                <span className="text-[10px] text-white/20">•</span>
                <Sparkles className="w-3 h-3 text-neon-cyan animate-pulse" />
              </div>
              <p className="text-sm text-white/90 leading-snug mb-2 font-medium">
                {nudge.content}
              </p>
              {nudge.actionLink && (
                <div className="flex items-center gap-1.5 text-xs text-neon-cyan font-bold group-hover:gap-2 transition-all">
                  Take Action <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
