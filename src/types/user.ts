export type UserRole = 'admin' | 'super_admin' | 'editor' | 'viewer' | 'user' | 'operator' | 'mentor' | 'agent';

export type JourneyStage = 'Dive-In' | 'Ignition' | 'Discovery' | 'Branding' | 'Outreach' | 'NONE';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  jobTitle?: string;
  tenantId: string;
  generationalPersona?: string;
  careerStageRole?: string;
  hierarchicalRole?: string;
  brandPersona?: string;
  brandDNAAttributes?: string[];
  journeyStage: JourneyStage;
  onboardingComplete?: boolean;
  alignmentScore?: number;
  location?: string;
  website?: string;
  bio?: string;
  voiceMode?: boolean;
  specializedSector?: 'Healthcare' | 'Legal' | 'Cybersecurity' | 'Finance' | 'General';
  updatedAt?: any;
}
