export interface DashboardData {
  userId: string;
  careerHappiness: number; // 0-100
  strengths: {
    name: string;
    value: number; // 0-100
  }[];
  discoveryProgress: 'discovery' | 'map' | 'match';
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
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  onboardingComplete: boolean;
}
