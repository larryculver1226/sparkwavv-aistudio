export interface Program {
  id: string;
  name: string;
  description: string;
  type: string;
  curriculum?: string[];
  duration?: string;
  tenantId: string;
}

export const MOCK_PROGRAMS: Program[] = [
  {
    id: 'kickspark',
    name: 'The Kickspark Program',
    description: 'A transition and self-discovery program featuring a 3-Step Curriculum.',
    type: 'Kickspark',
    curriculum: ['Discovery', 'Branding', 'Outreach'],
    tenantId: 'sparkwavv'
  },
  {
    id: 'career-discovery',
    name: 'SPARKWavv Career Discovery Track',
    description: 'A 2–4 week interactive, cinematic module program designed to help users identify aligned career directions.',
    type: 'SPARKWavv Track',
    duration: '2-4 weeks',
    tenantId: 'sparkwavv'
  },
  {
    id: 'wave-rider-program',
    name: 'Wave Rider',
    description: 'A specific SPARKWavv program track tailored for Gen Z & early-career individuals.',
    type: 'SPARKWavv Track',
    tenantId: 'sparkwavv'
  },
  {
    id: 'kwieri-platform',
    name: 'Kwieri Platform',
    description: 'An AI-powered learning and collaboration platform program.',
    type: 'Kwieri',
    tenantId: 'kwieri'
  }
];

export interface Cohort {
  id: string;
  programId: string;
  name: string;
  type: string;
  description: string;
  targetAudience: string;
  startDate: string;
  endDate: string;
  institution?: string;
  tenantId: string;
}

export const MOCK_COHORTS: Cohort[] = [
  {
    id: 'wave-rider-spring-2026',
    programId: 'wave-rider-program',
    name: 'Wave Rider Spring 2026',
    type: 'Wave Rider Cohort',
    description: 'Spring cohort for Gen Z and early-career workers.',
    targetAudience: 'Gen Z & Early-Career (0-5 years out of school)',
    startDate: '2026-03-01T00:00:00Z',
    endDate: '2026-05-31T00:00:00Z',
    tenantId: 'sparkwavv'
  },
  {
    id: 'pepperdine-exec-2026',
    programId: 'kwieri-platform',
    name: 'Pepperdine Executive Leadership 2026',
    type: 'Executive Education',
    description: 'Senior leaders and talent cohorts guided in workshops at Pepperdine University.',
    targetAudience: 'Senior Leaders',
    startDate: '2026-04-15T00:00:00Z',
    endDate: '2026-04-17T00:00:00Z',
    institution: 'Pepperdine University',
    tenantId: 'kwieri'
  }
];

export interface Journey {
  id: string;
  userId: string;
  programId: string;
  status: 'active' | 'completed' | 'on-hold';
  currentStep: string;
  steps: {
    name: string;
    status: 'pending' | 'in-progress' | 'completed';
    completedAt?: string;
  }[];
  startedAt: string;
  completedAt?: string;
  tenantId: string;
}

export const MOCK_JOURNEYS: Journey[] = [
  {
    id: 'journey-michael-kickspark',
    userId: 'michael.t',
    programId: 'kickspark',
    status: 'active',
    currentStep: 'Branding',
    steps: [
      { name: 'Discovery', status: 'completed', completedAt: '2026-02-15T10:00:00Z' },
      { name: 'Branding', status: 'in-progress' },
      { name: 'Outreach', status: 'pending' }
    ],
    startedAt: '2026-02-01T09:00:00Z',
    tenantId: 'sparkwavv'
  },
  {
    id: 'journey-genz-wave-rider',
    userId: 'genz.user',
    programId: 'wave-rider-program',
    status: 'completed',
    currentStep: 'Deployment',
    steps: [
      { name: 'Dive-In', status: 'completed', completedAt: '2026-01-10T10:00:00Z' },
      { name: 'Discovery', status: 'completed', completedAt: '2026-01-25T10:00:00Z' },
      { name: 'Design', status: 'completed', completedAt: '2026-02-10T10:00:00Z' },
      { name: 'Deployment', status: 'completed', completedAt: '2026-02-28T10:00:00Z' }
    ],
    startedAt: '2026-01-01T09:00:00Z',
    completedAt: '2026-02-28T10:00:00Z',
    tenantId: 'sparkwavv'
  }
];
