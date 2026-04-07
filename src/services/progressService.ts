import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DashboardData, Milestone } from '../types/dashboard';
import { DistilledArtifact } from '../types/wavvault';

export async function calculateAndUpdateProgress(
  userId: string,
  dashboardData: DashboardData,
  artifacts: DistilledArtifact[]
) {
  try {
    const milestones = dashboardData.milestones || [];
    
    // Define phase structure and required artifacts
    const phases = {
      'Dive-In': { artifacts: ['spark'] },
      'Ignition': { artifacts: ['pie-of-life', 'perfect-day'] },
      'Discovery': { artifacts: ['five-stories'] },
      'Branding': { artifacts: ['brand-pillar'] },
      'Outreach': { artifacts: ['manifesto'] }
    };

    const newPhaseProgress = {
      diveIn: 0,
      ignition: 0,
      discovery: 0,
      branding: 0,
      outreach: 0
    };

    // Helper to calculate progress for a specific phase
    const calculatePhase = (phaseName: string, phaseKey: keyof typeof newPhaseProgress) => {
      // 1. Milestone progress (50% weight)
      // Assuming milestones are roughly distributed or we just calculate overall completion
      // For a more accurate phase-specific milestone progress, we'd need milestones to be tagged with phases.
      // Since they aren't explicitly tagged by phase in the current schema, we'll use a simplified approach:
      // We'll calculate progress based on the artifacts for that phase.
      
      const phaseArtifactTypes = phases[phaseName as keyof typeof phases].artifacts;
      const completedArtifacts = artifacts.filter(a => 
        a.journeyPhase === phaseName || phaseArtifactTypes.includes(a.type)
      ).length;
      
      const requiredArtifactsCount = phaseArtifactTypes.length;
      const artifactProgress = requiredArtifactsCount > 0 
        ? Math.min(100, (completedArtifacts / requiredArtifactsCount) * 100) 
        : 0;

      // For milestones, let's just use the overall milestone completion as a base multiplier
      // or if we have week numbers, we can map weeks to phases.
      // Dive-In: Week 1-2
      // Ignition: Week 3-4
      // Discovery: Week 5-7
      // Branding: Week 8-10
      // Outreach: Week 11-12
      let phaseMilestones: Milestone[] = [];
      if (phaseName === 'Dive-In') phaseMilestones = milestones.filter(m => m.week <= 2);
      else if (phaseName === 'Ignition') phaseMilestones = milestones.filter(m => m.week > 2 && m.week <= 4);
      else if (phaseName === 'Discovery') phaseMilestones = milestones.filter(m => m.week > 4 && m.week <= 7);
      else if (phaseName === 'Branding') phaseMilestones = milestones.filter(m => m.week > 7 && m.week <= 10);
      else if (phaseName === 'Outreach') phaseMilestones = milestones.filter(m => m.week > 10);

      const completedPhaseMilestones = phaseMilestones.filter(m => m.completed).length;
      const milestoneProgress = phaseMilestones.length > 0 
        ? (completedPhaseMilestones / phaseMilestones.length) * 100 
        : 0;

      // Combine them (50/50 weight)
      let totalProgress = 0;
      if (phaseMilestones.length > 0 && requiredArtifactsCount > 0) {
        totalProgress = (artifactProgress * 0.5) + (milestoneProgress * 0.5);
      } else if (phaseMilestones.length > 0) {
        totalProgress = milestoneProgress;
      } else if (requiredArtifactsCount > 0) {
        totalProgress = artifactProgress;
      }

      newPhaseProgress[phaseKey] = Math.round(totalProgress);
    };

    calculatePhase('Dive-In', 'diveIn');
    calculatePhase('Ignition', 'ignition');
    calculatePhase('Discovery', 'discovery');
    calculatePhase('Branding', 'branding');
    calculatePhase('Outreach', 'outreach');

    // Check if progress actually changed to avoid unnecessary writes
    const currentProgress = dashboardData.phaseProgress || { diveIn: 0, ignition: 0, discovery: 0, branding: 0, outreach: 0 };
    const hasChanged = 
      currentProgress.diveIn !== newPhaseProgress.diveIn ||
      currentProgress.ignition !== newPhaseProgress.ignition ||
      currentProgress.discovery !== newPhaseProgress.discovery ||
      currentProgress.branding !== newPhaseProgress.branding ||
      currentProgress.outreach !== newPhaseProgress.outreach;

    if (hasChanged) {
      const docRef = doc(db, 'dashboards', userId);
      await updateDoc(docRef, {
        phaseProgress: newPhaseProgress
      });
      return newPhaseProgress;
    }

    return currentProgress;
  } catch (error) {
    console.error('Error calculating progress:', error);
    return null;
  }
}
