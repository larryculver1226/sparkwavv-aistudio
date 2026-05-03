import React, { useState, useEffect } from 'react';
import { SkylarStageWrapper } from '../skylar/SkylarStageWrapper';
import { ActionCenter } from './ActionCenter';
import { NeuralSynthesisEngine } from './NeuralSynthesisEngine';
import { ActivityFeed } from './ActivityFeed';
import { SectorIntelligence } from './SectorIntelligence';
import { WavvaultHighlights } from './WavvaultHighlights';
import { StrengthsProfileWidget } from './widgets/StrengthsProfileWidget';
import { JobMatchesPreviewWidget } from './widgets/JobMatchesPreviewWidget';
import { SynthesisLabEntryWidget } from './widgets/SynthesisLabEntryWidget';
import { PhaseGateBanner } from './PhaseGateBanner';

import { useJourneyStage } from '../../hooks/useJourneyStage';
import { DashboardData } from '../../types/dashboard';
import { WavvaultData } from '../../types/wavvault';

interface DynamicPhaseViewProps {
  userId: string;
  currentStage: string;
  data: DashboardData | null;
  artifacts: any[];
  profile: any;
  onActionClick: (actionId: string) => void;
  onNavigate: (view: string) => void;
  onActivityClick?: (activity: any) => void;
  wavvaultData?: WavvaultData | null;
}

export const DynamicPhaseView: React.FC<DynamicPhaseViewProps> = ({
  userId,
  currentStage,
  data,
  artifacts,
  profile,
  onActionClick,
  onNavigate,
  onActivityClick,
  wavvaultData
}) => {
  const { config: stageConfig, isLoading: loading } = useJourneyStage(currentStage);
  const [missingArtifacts, setMissingArtifacts] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (stageConfig && stageConfig.requiredArtifacts) {
      const userArtifacts = wavvaultData?.artifacts || [];
      const missing = stageConfig.requiredArtifacts.filter(reqName => 
        !userArtifacts.some(a => a.type.toLowerCase().includes(reqName.toLowerCase()) || a.title?.toLowerCase().includes(reqName.toLowerCase()))
      );
      setMissingArtifacts(missing);
    } else {
      setMissingArtifacts([]);
    }
    // We delay readiness slightly to ensure missingArtifacts calculation is complete before Skylar mounts
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, [stageConfig, wavvaultData]);

  if (loading || !stageConfig || !isReady) {
    return <div className="p-8 text-white/50">Loading phase configuration...</div>;
  }

  const handleHelpRequested = (artifactName: string) => {
    // Optionally auto-populate Skylar's input or trigger an action
    // But Skylar already prompts them automatically via [SYSTEM_INIT]
    // A quick way is to trigger an event that Skylar Interaction Panel listens for, or just scroll to Skylar
    const skylarPanel = document.querySelector('.skylar-interaction-panel');
    if (skylarPanel) skylarPanel.scrollIntoView({ behavior: 'smooth' });
  };

  const renderWidget = (widget: any, idx: number) => {
    const key = widget.id || `widget-${widget.type}-${idx}`;
    switch (widget.type) {
      case 'ActionCenter':
        return <ActionCenter key={key} currentStage={currentStage} onActionClick={onActionClick} wavvaultData={wavvaultData} />;
      case 'NeuralSynthesisEngine':
        return <NeuralSynthesisEngine key={key} userId={userId} currentStage={currentStage} />;
      case 'ActivityFeed':
        return <ActivityFeed key={key} userId={userId} limitCount={widget.props?.limitCount || 5} onActivityClick={onActivityClick} />;
      case 'SectorIntelligence':
        if (!profile?.specializedSector || profile.specializedSector === 'General') return null;
        return <SectorIntelligence key={key} sector={profile.specializedSector} userId={userId} />;
      case 'WavvaultHighlights':
        return <WavvaultHighlights key={key} artifacts={artifacts} stage={stageConfig.title} isLocked={false} />;
      case 'StrengthsProfile':
        return <StrengthsProfileWidget key={key} profile={profile} onNavigate={onNavigate} />;
      case 'JobMatchesPreview':
        return <JobMatchesPreviewWidget key={key} data={data} onNavigate={onNavigate} />;
      case 'SynthesisLabEntry':
        return <SynthesisLabEntryWidget key={key} onNavigate={onNavigate} />;
      case 'CustomMarkdown':
        return (
          <div key={key} className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40 text-white/80 prose prose-invert">
            {widget.props?.content || 'No content provided.'}
          </div>
        );
      default:
        console.warn(`Unknown widget type: ${widget.type}`);
        return null;
    }
  };

  const widgets = stageConfig.uiConfig?.widgets || [];
  const headerWidgets = widgets.filter(w => w.position === 'header').sort((a, b) => a.order - b.order);
  const mainWidgets = widgets.filter(w => w.position === 'main').sort((a, b) => a.order - b.order);
  const sidebarWidgets = widgets.filter(w => w.position === 'sidebar').sort((a, b) => a.order - b.order);

  return (
    <SkylarStageWrapper stageId={currentStage} layout={stageConfig.uiConfig.layout} missingArtifacts={missingArtifacts}>
      <div className="space-y-8">
        
        {/* Phase Gate Tracker (Track 069) */}
        <PhaseGateBanner 
          currentStageId={currentStage} 
          wavvaultData={wavvaultData || null} 
          onHelpRequested={handleHelpRequested}
        />

        {/* Header Zone */}
        {headerWidgets.map((w, i) => renderWidget(w, i))}
        
        {/* Main Content Area */}
        {sidebarWidgets.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              {mainWidgets.map((w, i) => renderWidget(w, i))}
            </div>
            <div className="space-y-8">
              {sidebarWidgets.map((w, i) => renderWidget(w, i))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {mainWidgets.map((w, i) => renderWidget(w, i))}
          </div>
        )}
      </div>
    </SkylarStageWrapper>
  );
};
