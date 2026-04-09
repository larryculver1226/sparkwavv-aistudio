import React from 'react';
import { NeuralSynthesisEngine } from './NeuralSynthesisEngine';
import { SectorIntelligence } from './SectorIntelligence';
import { WavvaultHighlights } from './WavvaultHighlights';
import { ActionCenter } from './ActionCenter';
import { ActivityFeed } from './ActivityFeed';
import { DashboardData } from '../../types/dashboard';
import { Camera, ChevronRight, Briefcase, Target, Award, FileText, Brain, Eye, EyeOff, History } from 'lucide-react';
import { SkylarInteractionPanel } from '../skylar/SkylarInteractionPanel';
import { useIdentity } from '../../contexts/IdentityContext';

interface PhaseViewProps {
  userId: string;
  currentStage: string;
  data: DashboardData | null;
  artifacts: any[];
  profile: any;
  onActionClick: (actionId: string) => void;
  onNavigate: (view: string) => void;
  transparencyMode?: 'full' | 'under-the-hood';
  toggleTransparency?: () => void;
  setShowEvolution?: (show: boolean) => void;
  onActivityClick?: (activity: any) => void;
}

export const IgnitionView: React.FC<PhaseViewProps> = ({ userId, currentStage, onActionClick, onNavigate, profile, onActivityClick }) => (
  <div className="space-y-8">
    <ActionCenter currentStage={currentStage} onActionClick={onActionClick} />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-8">
        <NeuralSynthesisEngine userId={userId} currentStage={currentStage} />
        <ActivityFeed userId={userId} limitCount={5} onActivityClick={onActivityClick} />
      </div>
      
      <div className="glass-panel p-10 rounded-[2.5rem] border border-white/5 bg-black/40">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
          <Award className="w-4 h-4 text-neon-cyan" />
          My Strengths Profile (Gallup)
        </h3>
        <div className="space-y-8">
          {(profile?.brandDNAAttributes?.length
            ? profile.brandDNAAttributes
            : ['Strategic', 'Analytical', 'Creative', 'Collaborative']
          ).map((attr: string, i: number) => {
            const value = 85 - i * 8;
            return (
              <div key={i} className="space-y-3">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                  <span className="text-white/60">{attr}</span>
                  <span className="text-neon-cyan neon-text-cyan">{value}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div
                    style={{ width: `${value}%` }}
                    className="h-full bg-gradient-to-r from-neon-cyan/60 to-neon-cyan shadow-[0_0_10px_rgba(0,243,255,0.3)]"
                  />
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => onNavigate('strengths')}
          className="w-full mt-12 py-4 rounded-2xl border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-neon-cyan/10 hover:border-neon-cyan/30 transition-all"
        >
          Details Profile
        </button>
      </div>
    </div>
  </div>
);

export const DiscoveryView: React.FC<PhaseViewProps> = ({ userId, currentStage, onActionClick, profile, data, onNavigate, onActivityClick }) => (
  <div className="space-y-8">
    <ActionCenter currentStage={currentStage} onActionClick={onActionClick} />
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-8">
        <NeuralSynthesisEngine userId={userId} currentStage={currentStage} />
        <ActivityFeed userId={userId} limitCount={5} onActivityClick={onActivityClick} />
      </div>
      {profile?.specializedSector && profile.specializedSector !== 'General' && (
        <SectorIntelligence sector={profile.specializedSector} userId={userId} />
      )}
    </div>

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
  </div>
);

export const BrandingView: React.FC<PhaseViewProps> = ({ userId, currentStage, onActionClick, artifacts, onNavigate, onActivityClick }) => (
  <div className="space-y-8">
    <ActionCenter currentStage={currentStage} onActionClick={onActionClick} />
    
    <button
      onClick={() => onNavigate('synthesis')}
      className="w-full glass-panel p-10 rounded-[2.5rem] border border-neon-cyan/20 bg-neon-cyan/5 hover:bg-neon-cyan/10 transition-all group relative overflow-hidden flex items-center justify-between"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center gap-8 relative z-10">
        <div className="w-20 h-20 rounded-3xl bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Camera className="w-10 h-10 text-neon-cyan" />
        </div>
        <div className="text-left">
          <h3 className="text-3xl font-display font-bold text-white mb-2">
            High-Fidelity Synthesis Lab
          </h3>
          <p className="text-sm text-white/60 max-w-xl">
            Generate cinematic brand portraits and professional outreach sequences
            grounded in your unique DNA.
          </p>
        </div>
      </div>
      <div className="relative z-10 flex items-center gap-3 text-neon-cyan font-bold uppercase tracking-widest text-xs">
        Enter Lab
        <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
      </div>
    </button>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <WavvaultHighlights
        artifacts={artifacts}
        stage="Branding"
        isLocked={false}
      />
      <div className="space-y-8">
        <NeuralSynthesisEngine userId={userId} currentStage={currentStage} />
        <ActivityFeed userId={userId} limitCount={5} onActivityClick={onActivityClick} />
      </div>
    </div>
  </div>
);

export const OutreachView: React.FC<PhaseViewProps> = ({ userId, currentStage, onActionClick, data, onNavigate, onActivityClick }) => (
  <div className="space-y-8">
    <ActionCenter currentStage={currentStage} onActionClick={onActionClick} />
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="glass-panel p-10 rounded-[2.5rem] border border-white/5 bg-black/40">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
          <Target className="w-4 h-4 text-neon-cyan" />
          Job Matches & Coaching
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
      <div className="space-y-8">
        <NeuralSynthesisEngine userId={userId} currentStage={currentStage} />
        <ActivityFeed userId={userId} limitCount={5} onActivityClick={onActivityClick} />
      </div>
    </div>
  </div>
);
