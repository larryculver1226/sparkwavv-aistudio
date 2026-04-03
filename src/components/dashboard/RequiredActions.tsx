import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  ArrowRight, 
  ShieldAlert, 
  Sparkles,
  Zap,
  Target,
  Handshake
} from 'lucide-react';
import { Milestone } from '../../types/dashboard';

interface RequiredActionsProps {
  milestones: Milestone[];
  validationPending?: boolean;
  suggestionsCount: number;
  currentStage: string;
  onActionClick: (action: string) => void;
}

export const RequiredActions: React.FC<RequiredActionsProps> = ({ 
  milestones, 
  validationPending, 
  suggestionsCount,
  currentStage,
  onActionClick
}) => {
  const pendingMilestones = milestones.filter(m => !m.completed);
  
  const actions = [
    ...(validationPending ? [{
      id: 'validation',
      title: 'Human Mentor Review',
      desc: 'Your progress is currently being reviewed by a human mentor.',
      icon: ShieldAlert,
      color: 'text-neon-magenta',
      bg: 'bg-neon-magenta/10',
      border: 'border-neon-magenta/20'
    }] : []),
    ...(suggestionsCount > 0 ? [{
      id: 'suggestions',
      title: `${suggestionsCount} Partner Suggestions`,
      desc: 'New insights from your professional network require your review.',
      icon: Handshake,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/20'
    }] : []),
    ...pendingMilestones.slice(0, 2).map(m => ({
      id: `milestone-${m.id}`,
      title: m.label,
      desc: `Required for ${currentStage} phase completion.`,
      icon: Zap,
      color: 'text-neon-cyan',
      bg: 'bg-neon-cyan/10',
      border: 'border-neon-cyan/20'
    }))
  ];

  if (actions.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-neon-lime/10 border border-neon-lime/20 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-neon-lime" />
        </div>
        <div>
          <h3 className="font-display font-bold text-white">All Actions Complete</h3>
          <p className="text-xs text-white/40">You are fully aligned with the Sparkwavv Journey.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/80">
          <Target className="w-5 h-5 text-neon-cyan" />
          <h3 className="font-display font-bold text-sm tracking-tight uppercase">Required Actions</h3>
        </div>
        <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
          {actions.length} Pending
        </span>
      </div>

      <div className="space-y-3">
        {actions.map((action, i) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onActionClick(action.id)}
            className={`w-full p-4 rounded-2xl border ${action.bg} ${action.border} flex items-center gap-4 group hover:scale-[1.02] transition-all text-left`}
          >
            <div className={`w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center shrink-0 ${action.color}`}>
              <action.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white truncate group-hover:text-neon-cyan transition-colors">
                {action.title}
              </h4>
              <p className="text-[10px] text-white/40 truncate">{action.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-neon-cyan group-hover:translate-x-1 transition-all" />
          </motion.button>
        ))}
      </div>
    </div>
  );
};
