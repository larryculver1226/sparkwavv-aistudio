export interface Milestone {
  id: string;
  label: string;
  completed: boolean;
  week: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: 'course' | 'coaching' | 'certification' | 'other';
}

export interface DashboardData {
  userId: string;
  displayName?: string;
  careerHappiness: number; // 0-100
  strengths: {
    name: string;
    value: number; // 0-100
  }[];
  discoveryProgress: 'Dive-In' | 'Ignition' | 'Discovery' | 'Branding' | 'Outreach';
  resumeStatus: string;
  careerProfileStatus: string;
  jobMatches: {
    title: string;
    company: string;
    matchScore: number;
  }[];
  aiCompanion: {
    name: string;
    status: string;
    message: string;
  };
  // Kickspark Extensions
  effortTier?: '3.5' | '7'; // Hours per week
  energyTrough?: {
    start: string; // HH:mm
    end: string;   // HH:mm
  };
  financialExpenses?: Expense[];
  validationGateMode?: 'soft-warning' | 'hard-block';
  milestones?: Milestone[];
  pieOfLife?: {
    category: string;
    current: number;
    target: number;
  }[];
  perfectDay?: {
    time: string;
    activity: string;
    type: 'work' | 'meal' | 'reboot' | 'other';
  }[];
  rppValidated?: boolean;
  alignmentMatrix?: {
    identityClarity: number;
    strengthsAlignment: number;
    marketResonance: number;
  };
  _persistenceStatus?: 'active' | 'fallback';
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  onboardingComplete: boolean;
  role?: string;
  location?: string;
  website?: string;
  bio?: string;
  journeyStage?: string;
  brandDNAAttributes?: string[];
}
