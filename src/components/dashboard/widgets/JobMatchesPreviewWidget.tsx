import React from 'react';
import { Target, Briefcase, ChevronRight } from 'lucide-react';

interface JobMatchesPreviewWidgetProps {
  data: any;
  onNavigate: (view: string) => void;
}

export const JobMatchesPreviewWidget: React.FC<JobMatchesPreviewWidgetProps> = ({ data, onNavigate }) => {
  return (
    <div className="glass-panel p-10 rounded-[2.5rem] border border-white/5 bg-black/40">
      <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
        <Target className="w-4 h-4 text-neon-cyan" />
        Job Matches Preview
      </h3>
      <div className="space-y-6">
        {(data?.jobMatches?.length
          ? data.jobMatches
          : [
              { title: 'Senior Product Designer', company: 'TechFlow', matchScore: 94 },
              { title: 'UX Strategist', company: 'Global Creative', matchScore: 88 },
              { title: 'Design Systems Lead', company: 'Innova', matchScore: 82 },
            ]
        ).map((job: any, i: number) => (
          <button
            key={i}
            onClick={() => onNavigate('matches')}
            className="w-full flex items-start gap-5 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-neon-cyan/5 hover:border-neon-cyan/20 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-neon-cyan/10 transition-all">
              <Briefcase className="w-6 h-6 text-white/20 group-hover:text-neon-cyan" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-sm font-bold mb-1 group-hover:text-neon-cyan transition-colors">
                {job.title}
              </h4>
              <p className="text-[10px] text-white/40 font-medium">
                {job.company} • {job.matchScore}% Match
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-neon-cyan transition-all mt-1" />
          </button>
        ))}
      </div>
    </div>
  );
};
