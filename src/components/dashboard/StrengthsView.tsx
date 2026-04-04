import React from 'react';
import { motion } from 'motion/react';
import { Award, Target, Zap, ChevronRight, Star, Brain, Shield, Sparkles } from 'lucide-react';

interface Strength {
  id: string;
  title: string;
  description: string;
  level: number;
  category: string;
  tags: string[];
}

const MOCK_STRENGTHS: Strength[] = [
  {
    id: '1',
    title: 'Strategic Systems Design',
    description:
      'Ability to architect complex digital ecosystems with a focus on scalability and user resonance.',
    level: 95,
    category: 'Design',
    tags: ['Architecture', 'Scalability', 'Ecosystems'],
  },
  {
    id: '2',
    title: 'Neural UX Research',
    description:
      'Deep understanding of cognitive patterns and behavioral psychology applied to interface design.',
    level: 92,
    category: 'Research',
    tags: ['Psychology', 'Cognitive Patterns', 'Behavioral'],
  },
  {
    id: '3',
    title: 'Rapid Prototyping',
    description: 'High-velocity iteration from concept to high-fidelity interactive models.',
    level: 88,
    category: 'Execution',
    tags: ['Velocity', 'High-Fidelity', 'Iteration'],
  },
];

interface StrengthsViewProps {
  onBack: () => void;
}

export const StrengthsView: React.FC<StrengthsViewProps> = ({ onBack }) => {
  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="flex items-center gap-2 text-neon-cyan">
            <Award className="w-5 h-5" />
            <h2 className="text-2xl font-display font-bold uppercase tracking-tight">
              Professional Strengths
            </h2>
          </div>
        </div>
        <p className="text-white/40 text-sm max-w-2xl pl-14">
          Your unique professional DNA, distilled from your experiences, artifacts, and neural
          synthesis.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_STRENGTHS.map((strength, i) => (
          <motion.div
            key={strength.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40 hover:border-neon-cyan/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-neon-cyan/10 flex items-center justify-center group-hover:bg-neon-cyan/20 transition-all">
                <Brain className="w-6 h-6 text-neon-cyan" />
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-neon-cyan uppercase tracking-widest mb-1">
                  {strength.category}
                </div>
                <div className="text-xl font-display font-bold text-white italic">
                  {strength.level}%
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-3 group-hover:text-neon-cyan transition-colors">
              {strength.title}
            </h3>
            <p className="text-sm text-white/60 mb-6 leading-relaxed">{strength.description}</p>

            <div className="flex flex-wrap gap-2">
              {strength.tags.map((tag, j) => (
                <span
                  key={j}
                  className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-wider"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <div className="glass-panel p-10 rounded-[2.5rem] border border-white/5 bg-black/40">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
            <Shield className="w-4 h-4 text-neon-cyan" />
            Verified Competencies
          </h3>
          <div className="space-y-4">
            {[
              'Product Strategy',
              'User Experience',
              'Visual Communication',
              'Technical Architecture',
            ].map((skill, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5"
              >
                <span className="text-sm font-bold text-white/80">{skill}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-cyan" style={{ width: `${90 - i * 5}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-white/40">{90 - i * 5}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-10 rounded-[2.5rem] border border-white/5 bg-black/40">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neon-cyan" />
            Growth Trajectory
          </h3>
          <div className="flex items-center justify-center p-8">
            <div className="relative w-48 h-48">
              <div className="absolute inset-0 rounded-full border-2 border-white/5" />
              <div className="absolute inset-4 rounded-full border-2 border-white/5" />
              <div className="absolute inset-8 rounded-full border-2 border-white/5" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-display font-bold text-neon-cyan italic">+12%</div>
                  <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest">
                    Velocity
                  </div>
                </div>
              </div>
              {/* Simple radar chart decoration */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="502"
                  strokeDashoffset="100"
                  className="text-neon-cyan/20"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
