export type UserRole = 'admin' | 'user' | 'operator' | 'mentor' | 'agent';

export type JourneyStage = 'Dive-In' | 'Ignition' | 'Discovery' | 'Branding' | 'Outreach' | 'NONE';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  tenantId: string;
  generationalPersona?: string;
  careerStageRole?: string;
  hierarchicalRole?: string;
  brandPersona?: string;
  brandDNAAttributes?: string[];
  journeyStage: JourneyStage;
  onboardingComplete?: boolean;
  location?: string;
  website?: string;
  bio?: string;
  updatedAt?: any;
}
