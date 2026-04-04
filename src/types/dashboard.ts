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
    end: string; // HH:mm
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
  mentorNote?: string;
  mentorNoteTimestamp?: string;
  validationPending?: boolean;
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
  alignmentScore?: number;
}

export interface UserInsight {
  id: string;
  userId: string;
  type: 'pivot' | 'core_value' | 'primary_goal' | 'strength';
  content: string;
  status: 'pending' | 'confirmed' | 'superseded';
  timestamp: string;
  evidence?: string;
  conflictWith?: string; // ID of the insight it replaces
  tags?: string[]; // For thematic mapping
}

export interface MarketSignal {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  resonanceScore: number; // 0-100
  dnaAlignment: {
    values: number;
    capabilities: number;
    trajectory: number;
  };
  tags: string[];
  timestamp: string;
  source: string;
  url?: string;
}

export interface DNAGap {
  skill: string;
  currentLevel: number; // 0-100
  targetLevel: number; // 0-100
  importance: 'critical' | 'high' | 'medium';
  learningPath?: {
    title: string;
    provider: string;
    url: string;
  }[];
}

export interface ResonanceHistory {
  industry: string;
  dataPoints: {
    timestamp: string;
    score: number;
  }[];
}

export interface StrategicDirective {
  id: string;
  title: string;
  content: string;
  priority: 'immediate' | 'high' | 'medium';
  type: 'pivot' | 'capability' | 'positioning';
  action: string;
  timestamp: string;
  status: 'active' | 'archived';
}
