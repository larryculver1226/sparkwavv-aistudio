import React from 'react';
import { motion } from 'motion/react';
import {
  Briefcase,
  Target,
  Zap,
  ChevronRight,
  Star,
  MapPin,
  DollarSign,
  Clock,
} from 'lucide-react';

interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  matchScore: number;
  tags: string[];
  postedAt: string;
}

const MOCK_MATCHES: JobMatch[] = [
  {
    id: '1',
    title: 'Senior Product Designer',
    company: 'NeuralLink Systems',
    location: 'Remote / San Francisco',
    salary: '$180k - $240k',
    matchScore: 98.4,
    tags: ['AI/ML', 'Design Systems', 'Product Strategy'],
    postedAt: '2 hours ago',
  },
  {
    id: '2',
    title: 'Creative Director',
    company: 'Vibrant Media',
    location: 'New York, NY',
    salary: '$200k - $280k',
    matchScore: 96.2,
    tags: ['Branding', 'Motion Design', 'Leadership'],
    postedAt: '5 hours ago',
  },
  {
    id: '3',
    title: 'UX Strategy Lead',
    company: 'FutureFlow',
    location: 'Remote',
    salary: '$160k - $210k',
    matchScore: 94.8,
    tags: ['User Research', 'Service Design', 'Innovation'],
    postedAt: '1 day ago',
  },
];

interface JobMatchesViewProps {
  onBack: () => void;
}

export const JobMatchesView: React.FC<JobMatchesViewProps> = ({ onBack }) => {
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
          <div className="flex items-center gap-2 text-neon-lime">
            <Target className="w-5 h-5" />
            <h2 className="text-2xl font-display font-bold uppercase tracking-tight">
              Precision Job Matches
            </h2>
          </div>
        </div>
        <p className="text-white/40 text-sm max-w-2xl pl-14">
          Our neural engine has identified these high-value opportunities that align with your
          unique professional DNA and career trajectory.
        </p>
      </header>

      <div className="grid gap-6">
        {MOCK_MATCHES.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-8 group hover:border-neon-lime/40 transition-all duration-500 relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neon-lime">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold group-hover:text-neon-lime transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-white/60 font-medium">{job.company}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-white/40">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-1.5 text-neon-lime">
                    <DollarSign className="w-3.5 h-3.5" />
                    {job.salary}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {job.postedAt}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center justify-between md:items-end gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2 text-neon-lime mb-1">
                    <Star className="w-4 h-4 fill-neon-lime" />
                    <span className="text-2xl font-display font-bold tracking-tight">
                      {job.matchScore}%
                    </span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
                    Match Precision
                  </p>
                </div>

                <button className="px-6 py-3 rounded-xl bg-neon-lime/10 border border-neon-lime/20 text-neon-lime text-xs font-bold uppercase tracking-widest hover:bg-neon-lime/20 transition-all flex items-center gap-2 group/btn">
                  Apply with DNA
                  <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-lime/5 blur-[100px] -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
