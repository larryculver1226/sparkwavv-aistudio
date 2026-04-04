import { useState, useEffect, useMemo } from 'react';
import { ValidationGateEvent, DistilledArtifact } from '../types/wavvault';

export type NarrativeStage = 'idle' | 'sequencing' | 'mapping' | 'spark' | 'complete';

export const useWavvaultExplorer = (
  events: ValidationGateEvent[],
  artifacts: DistilledArtifact[]
) => {
  const [viewMode, setViewMode] = useState<'linear' | 'branching'>('linear');
  const [selectedArtifact, setSelectedArtifact] = useState<DistilledArtifact | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [narrativeStage, setNarrativeStage] = useState<NarrativeStage>('idle');
  const [activeArtifactId, setActiveArtifactId] = useState<string | undefined>();

  useEffect(() => {
    const sequence = async () => {
      setNarrativeStage('sequencing');
      await new Promise((r) => setTimeout(r, 2000));
      setNarrativeStage('mapping');
      await new Promise((r) => setTimeout(r, 2500));
      setNarrativeStage('spark');
      await new Promise((r) => setTimeout(r, 3000));
      setNarrativeStage('complete');
    };
    sequence();
  }, []);

  const filteredArtifacts = useMemo(
    () =>
      artifacts.filter((a) => {
        const matchesSearch =
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPhase = !selectedPhase || a.phase === selectedPhase;
        return matchesSearch && matchesPhase;
      }),
    [artifacts, searchQuery, selectedPhase]
  );

  const filteredEvents = useMemo(
    () =>
      events.filter((e) => {
        const matchesSearch =
          e.phase.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.verdict.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPhase = !selectedPhase || e.phase === selectedPhase;
        return matchesSearch && matchesPhase;
      }),
    [events, searchQuery, selectedPhase]
  );

  const timelineItems = useMemo(
    () =>
      [
        ...filteredArtifacts.map((a) => ({
          type: 'artifact' as const,
          data: a,
          timestamp: new Date(a.timestamp),
        })),
        ...filteredEvents.map((e) => ({
          type: 'event' as const,
          data: e,
          timestamp: new Date(e.timestamp),
        })),
      ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    [filteredArtifacts, filteredEvents]
  );

  return {
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
    timelineItems,
    filteredArtifacts,
  };
};
