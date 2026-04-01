export const JOURNEY_STAGES = ['Dive-In', 'Ignition', 'Discovery', 'Branding', 'Outreach', 'NONE'] as const;
export type JourneyStage = typeof JOURNEY_STAGES[number];

export const TENANTS = [
  { 
    id: 'Admin-oev62', 
    name: 'Admin Portal', 
    brand: 'sparkwavv',
    logoUrl: '/logo.png',
    primaryColor: '#00FF00'
  },
  { 
    id: 'Operations-ygv9g', 
    name: 'Operations Center', 
    brand: 'sparkwavv',
    logoUrl: '/logo.png',
    primaryColor: '#00FF00'
  },
  { 
    id: 'Partner-nbbgt', 
    name: 'Partner Ecosystem', 
    brand: 'sparkwavv',
    logoUrl: '/logo.png',
    primaryColor: '#00FF00'
  },
  { 
    id: 'User-h74jf', 
    name: 'User Experience', 
    brand: 'sparkwavv',
    logoUrl: '/logo.png',
    primaryColor: '#00FF00'
  },
  { 
    id: 'sparkwavv', 
    name: 'SPARKWavv', 
    brand: 'sparkwavv',
    logoUrl: '/logo.png',
    primaryColor: '#00FF00'
  }
] as const;

export const GENERATIONAL_PERSONAS = [
  'Gen Z', 'Millennial', 'Gen X', 'Baby Boomer', 'Silent Generation', 'Alpha', 'Beta'
] as const;

export const CAREER_STAGE_ROLES = [
  'Wave Rider', 'Explorer', 'Career Switcher'
] as const;

export const HIERARCHICAL_ROLES = [
  'Owner', 'C-suite', 'Vice President', 'Director or Manager', 'Employee', 'Consultant', 'Independent Contractor'
] as const;

export const BRAND_PERSONAS = [
  'Left Brain (Kick/Yin)', 'Right Brain (Spark/Yang)'
] as const;

export const BRAND_DNA_ATTRIBUTES = [
  'creator', 'builder', 'strategist', 'connector', 'advocate', 'curator', 'mentor', 'analyst'
] as const;

export const ROLES = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
  USER: 'user',
  CLIENT: 'client',
  OPERATOR: 'operator',
  GUEST: 'guest',
  MENTOR: 'mentor',
  AGENT: 'agent'
} as const;

export const PROGRAMS = [
  { id: 'kickspark', name: 'The Kickspark Program', type: 'Kickspark' },
  { id: 'philip-lobkowicz', name: 'Philip Lobkowicz Program', type: 'Kickspark Track' },
  { id: 'career-discovery', name: 'SPARKWavv Career Discovery Track', type: 'SPARKWavv Track' },
  { id: 'wave-rider-program', name: 'Wave Rider', type: 'SPARKWavv Track' },
  { id: 'skylar-pro', name: 'Skylar Pro', type: 'Subscription' },
  { id: 'skylar-max', name: 'Skylar Max / Elite Career Accelerator', type: 'Subscription' },
  { id: 'kwieri-platform', name: 'Kwieri Platform', type: 'Kwieri' }
] as const;

export const INSTITUTIONS = [
  'Pepperdine University',
  'University of Minnesota',
  'Georgetown',
  'Claremont McKenna',
  'USC',
  'Long Beach City College Nursing School'
] as const;

export const COHORT_TYPES = [
  'Wave Rider Cohort',
  'Executive Education',
  'Internal Leadership',
  'Cohort-Based University Program',
  'Student Organization',
  'Club'
] as const;
