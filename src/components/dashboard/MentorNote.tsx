import React from 'react';
import { motion } from 'motion/react';
import { Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const MentorNote: React.FC<{ note: string; timestamp: string }> = ({ note, timestamp }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-6 rounded-2xl bg-neon-cyan/5 border border-neon-cyan/20 space-y-4 mb-12"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-neon-cyan">
        <Users className="w-5 h-5" />
        <h3 className="font-display font-bold text-sm tracking-tight uppercase">
          Human Mentor Feedback
        </h3>
      </div>
      <span className="text-[10px] text-white/40 font-mono">
        {new Date(timestamp).toLocaleDateString()} •{' '}
        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
    <div className="prose prose-invert prose-sm max-w-none text-white/80 leading-relaxed">
      <ReactMarkdown>{note}</ReactMarkdown>
    </div>
  </motion.div>
);
