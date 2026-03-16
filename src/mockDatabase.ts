export interface ConfirmedUser {
  firstName: string;
  lastName: string;
  jobTitle: string;
  companyOrg: string;
  email: string;
  phone: string;
  programTrack: string;
  lifecycleStage: string;
  outcomesAttributes: string;
  feedbackQuote: string;
  userId: string;
  tenantId?: string;
  generationalPersona?: string;
  careerStageRole?: string;
  hierarchicalRole?: string;
  brandPersona?: string;
  brandDNAAttributes?: string[];
  journeyStage?: string;
}

export const CONFIRMED_USERS: ConfirmedUser[] = [
  {
    firstName: "Michael",
    lastName: "T.",
    jobTitle: "Software Engineer",
    companyOrg: "",
    email: "michael.t@testcrm.com",
    phone: "555-0101",
    programTrack: "Skylar Beta User",
    lifecycleStage: "Closed Won (Placed)",
    outcomesAttributes: "Used AI-powered application process; matched with a new career path.",
    feedbackQuote: "The strengths assessment was eye-opening. Skylar identified talents I didn't even realize I had and matched me with a career path I hadn't considered...",
    userId: "michael.t",
    tenantId: "sparkwavv",
    generationalPersona: "Millennial",
    careerStageRole: "Career Switcher",
    hierarchicalRole: "Independent Contractor",
    brandPersona: "Right Brain (Spark/Yang)",
    brandDNAAttributes: ["analyst", "builder"],
    journeyStage: "Discovery"
  },
  {
    firstName: "Priya",
    lastName: "K.",
    jobTitle: "Healthcare Administrator",
    companyOrg: "",
    email: "priya.k@testcrm.com",
    phone: "555-0102",
    programTrack: "Skylar Beta User",
    lifecycleStage: "Active",
    outcomesAttributes: "Testimonial user for Skylar.",
    feedbackQuote: "",
    userId: "priya.k",
    tenantId: "kwieri",
    generationalPersona: "Millennial",
    careerStageRole: "Explorer",
    hierarchicalRole: "Director or Manager",
    brandPersona: "Left Brain (Kick/Yin)",
    brandDNAAttributes: ["connector", "advocate"],
    journeyStage: "Ignition"
  },
  {
    firstName: "Sarah",
    lastName: "J.",
    jobTitle: "Marketing Professional",
    companyOrg: "",
    email: "sarah.j@testcrm.com",
    phone: "555-0103",
    programTrack: "Skylar Beta User",
    lifecycleStage: "Closed Won (Interviews)",
    outcomesAttributes: "Within two weeks, had three interviews lined up for positions.",
    feedbackQuote: "Skylar completely transformed my job search. Within two weeks, I had three interviews lined up...",
    userId: "sarah.j",
    tenantId: "sparkwavv",
    generationalPersona: "Millennial",
    careerStageRole: "Wave Rider",
    hierarchicalRole: "Director or Manager",
    brandPersona: "Right Brain (Spark/Yang)",
    brandDNAAttributes: ["creator", "strategist"],
    journeyStage: "Branding"
  },
  {
    firstName: "Gen Z",
    lastName: "User",
    jobTitle: "Product Designer",
    companyOrg: "Series B SaaS Company",
    email: "genz.user@testcrm.com",
    phone: "555-0104",
    programTrack: "Wave Rider M4",
    lifecycleStage: "Closed Won (3 Offers)",
    outcomesAttributes: "Landed a role at a Series B SaaS company.",
    feedbackQuote: "In 7 weeks I went from ‘I’ll take anything’ to three offers. The Discovery Map and Branding Blueprint finally made sense of my zig-zag story.",
    userId: "genz.user",
    tenantId: "sparkwavv",
    generationalPersona: "Gen Z",
    careerStageRole: "Wave Rider",
    hierarchicalRole: "Independent Contractor",
    brandPersona: "Right Brain (Spark/Yang)",
    brandDNAAttributes: ["creator", "builder"],
    journeyStage: "Outreach"
  },
  {
    firstName: "Late Millennial",
    lastName: "User",
    jobTitle: "Manager",
    companyOrg: "",
    email: "millennial.user@testcrm.com",
    phone: "555-0105",
    programTrack: "Wave Rider Pro",
    lifecycleStage: "Closed Won (Promoted)",
    outcomesAttributes: "Achieved an internal promotion and a salary bump.",
    feedbackQuote: "The Outreach Ramp and dashboard took all the emotion out of ‘networking’ – it became a series of small waves instead of a tidal wave of anxiety.",
    userId: "millennial.user",
    tenantId: "sparkwavv",
    generationalPersona: "Millennial",
    careerStageRole: "Wave Rider",
    hierarchicalRole: "Director or Manager",
    brandPersona: "Left Brain (Kick/Yin)",
    brandDNAAttributes: ["builder", "strategist"],
    journeyStage: "Dive-In"
  },
  {
    firstName: "Gen X",
    lastName: "User",
    jobTitle: "Media Executive",
    companyOrg: "",
    email: "genx.user@testcrm.com",
    phone: "555-0106",
    programTrack: "Explorer Pro M4",
    lifecycleStage: "Closed Won (Board Roles)",
    outcomesAttributes: "Landed a portfolio of 3 nonprofit boards and 1 advisory role.",
    feedbackQuote: "Mark helped me exit gracefully from a 20-year post, rebuild my reputation, and land a portfolio of board roles that actually feel like my encore.",
    userId: "genx.user",
    tenantId: "sparkwavv",
    generationalPersona: "Gen X",
    careerStageRole: "Explorer",
    hierarchicalRole: "C-suite",
    brandPersona: "Left Brain (Kick/Yin)",
    brandDNAAttributes: ["strategist", "curator"],
    journeyStage: "Discovery"
  },
  {
    firstName: "Andy",
    lastName: "Levin",
    jobTitle: "Fortune 500 Chief Learning Officer",
    companyOrg: "Fortune 500 Company",
    email: "andy.levin@testcrm.com",
    phone: "555-0107",
    programTrack: "Pepperdine University Small-Group Intensive",
    lifecycleStage: "Closed Won (Corporate)",
    outcomesAttributes: "Co-designed executive education session; applied SPARKWavv tools to internal leadership cohorts.",
    feedbackQuote: "In a single afternoon, Mark reframed how our Fortune 500 learning culture talks about career arcs. The SPARKWavv tools translated instantly to our high-potential leaders.",
    userId: "andy.levin",
    tenantId: "kwieri",
    generationalPersona: "Baby Boomer",
    careerStageRole: "Explorer",
    hierarchicalRole: "C-suite",
    brandPersona: "Left Brain (Kick/Yin)",
    brandDNAAttributes: ["mentor", "strategist"],
    journeyStage: "Ignition"
  }
];

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
