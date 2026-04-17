import React from 'react';
import { SkylarStageWrapper } from '../skylar/SkylarStageWrapper';
import { ActionCenter } from './ActionCenter';
import { NeuralSynthesisEngine } from './NeuralSynthesisEngine';
import { ActivityFeed } from './ActivityFeed';
import { SectorIntelligence } from './SectorIntelligence';
import { WavvaultHighlights } from './WavvaultHighlights';
import { StrengthsProfileWidget } from './widgets/StrengthsProfileWidget';
import { JobMatchesPreviewWidget } from './widgets/JobMatchesPreviewWidget';
import { SynthesisLabEntryWidget } from './widgets/SynthesisLabEntryWidget';

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

  if (loading || !stageConfig) {
    return <div className="p-8 text-white/50">Loading phase configuration...</div>;
  }

  const renderWidget = (widget: any) => {
    switch (widget.type) {
      case 'ActionCenter':
        return <ActionCenter key={widget.id} currentStage={currentStage} onActionClick={onActionClick} wavvaultData={wavvaultData} />;
      case 'NeuralSynthesisEngine':
        return <NeuralSynthesisEngine key={widget.id} userId={userId} currentStage={currentStage} />;
      case 'ActivityFeed':
        return <ActivityFeed key={widget.id} userId={userId} limitCount={widget.props?.limitCount || 5} onActivityClick={onActivityClick} />;
      case 'SectorIntelligence':
        if (!profile?.specializedSector || profile.specializedSector === 'General') return null;
        return <SectorIntelligence key={widget.id} sector={profile.specializedSector} userId={userId} />;
      case 'WavvaultHighlights':
        return <WavvaultHighlights key={widget.id} artifacts={artifacts} stage={stageConfig.title} isLocked={false} />;
      case 'StrengthsProfile':
        return <StrengthsProfileWidget key={widget.id} profile={profile} onNavigate={onNavigate} />;
      case 'JobMatchesPreview':
        return <JobMatchesPreviewWidget key={widget.id} data={data} onNavigate={onNavigate} />;
      case 'SynthesisLabEntry':
        return <SynthesisLabEntryWidget key={widget.id} onNavigate={onNavigate} />;
      case 'CustomMarkdown':
        return (
          <div key={widget.id} className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40 text-white/80 prose prose-invert">
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
    <SkylarStageWrapper stageId={currentStage} layout={stageConfig.uiConfig.layout}>
      <div className="space-y-8">
        {/* Header Zone */}
        {headerWidgets.map(renderWidget)}
        
        {/* Main Content Area */}
        {sidebarWidgets.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              {mainWidgets.map(renderWidget)}
            </div>
            <div className="space-y-8">
              {sidebarWidgets.map(renderWidget)}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {mainWidgets.map(renderWidget)}
          </div>
        )}
      </div>
    </SkylarStageWrapper>
  );
};
