import React from 'react';
import { AnimatePresence } from 'motion/react';
import { ValidationGateEvent, DistilledArtifact } from '../../types/wavvault';
import { CinematicReader } from './CinematicReader';
import { useWavvaultExplorer } from '../../hooks/useWavvaultExplorer';
import { IntroSequence } from './explorer/IntroSequence';
import { ExplorerHeader } from './explorer/ExplorerHeader';
import { ExplorerSearch } from './explorer/ExplorerSearch';
import { TimelineFeed } from './explorer/TimelineFeed';
import { ResonanceGraph } from './explorer/ResonanceGraph';
import { ExplorerFooter } from './explorer/ExplorerFooter';

interface WavvaultExplorerProps {
  userId: string;
  events: ValidationGateEvent[];
  artifacts: DistilledArtifact[];
}

export const WavvaultExplorer: React.FC<WavvaultExplorerProps> = ({ userId, events, artifacts }) => {
  const {
    viewMode,
    setViewMode,
    selectedArtifact,
    setSelectedArtifact,
    searchQuery,
    setSearchQuery,
    selectedPhase,
    setSelectedPhase,
    narrativeStage,
    activeArtifactId,
    setActiveArtifactId,
    timelineItems
  } = useWavvaultExplorer(events, artifacts);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-neon-cyan/30 relative overflow-hidden">
      {/* Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-neon-cyan/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-neon-magenta/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Intro Sequence Overlay */}
      <IntroSequence stage={narrativeStage} />

      {/* Treasury Header */}
      <ExplorerHeader viewMode={viewMode} setViewMode={setViewMode} />

      <main className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        {/* Search & Filter Bar */}
        <ExplorerSearch 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          selectedPhase={selectedPhase}
          setSelectedPhase={setSelectedPhase}
        />

        <AnimatePresence mode="wait">
          {viewMode === 'linear' ? (
            <TimelineFeed 
              items={timelineItems} 
              onSelectArtifact={setSelectedArtifact} 
              onHoverArtifact={setActiveArtifactId} 
            />
          ) : (
            <ResonanceGraph artifacts={artifacts} activeId={activeArtifactId} />
          )}
        </AnimatePresence>
      </main>

      {/* Cinematic Reader Modal */}
      <CinematicReader 
        artifact={selectedArtifact} 
        onClose={() => setSelectedArtifact(null)} 
      />

      {/* Security Footer */}
      <ExplorerFooter userId={userId} />
    </div>
  );
};
