export type UserRole =
  | 'admin'
  | 'super_admin'
  | 'editor'
  | 'viewer'
  | 'user'
  | 'operator'
  | 'mentor'
  | 'agent';

export type JourneyStage = 'Dive-In' | 'Ignition' | 'Discovery' | 'Branding' | 'Outreach' | 'NONE';

export interface UserProfile {
  uid: string;
  sparkwavvId?: string;
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
  createdAt?: any;
  firstName?: string;
  lastName?: string;
  companyOrg?: string;
  phone?: string;
  programTrack?: string;
  lifecycleStage?: string;
  outcomesAttributes?: string;
  feedbackQuote?: string;
  userId?: string; // Often redundant with uid but in rules
  userData?: any;
  currentStep?: string;
  summary?: string;
  emailVerified?: boolean;
  ignitionCompletedAt?: any;
  ignitionExercises?: {
    pieOfLife: {
      career: number;
      family: number;
      health: number;
      personalGrowth: number;
      community: number;
    };
    perfectDay: {
      morning: string;
      afternoon: string;
      evening: string;
    };
  };
  careerDnaHypothesis?: string[];
}
