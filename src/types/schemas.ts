import { z } from 'zod';

export const BestSelfProfileSchema = z.object({
  aspirationalProfile: z.string().describe('The synthesized best self profile based on evaluations'),
  mitigations: z.array(z.string()).describe('List of strategies to mitigate negative career elements/extinguishers'),
  coreAttributes: z.array(z.string()).describe('List of core positive attributes'),
});

export const FiveStoriesSchema = z.object({
  narratives: z.array(z.object({
    accomplishmentId: z.string(),
    journalistVersion: z.string().describe('Factual, objective description of the accomplishment'),
    reflectiveVersion: z.string().describe('Internal, emotional version focusing on enjoyment factors')
  }))
});

export const FutureVisionSchema = z.object({
  perfectDaySchedule: z.array(z.object({
    time: z.string().describe('Time block (e.g., 08:00 AM - 10:00 AM)'),
    activity: z.string().describe('Activity description'),
    type: z.enum(['work', 'rest', 'play', 'routine'])
  })),
  decisionMatrix: z.array(z.object({
    factor: z.string().describe('e.g., Remote work, Commute limit, Budget control'),
    priority: z.number().describe('Priority from 1 (highest) to 10'),
    isMakeOrBreak: z.boolean().describe('True if this is a strict requirement')
  }))
});

export const ProductivityPlanSchema = z.object({
  weeklyCommitmentHours: z.number(),
  twelveWeekPlan: z.array(z.object({
    week: z.number(),
    focus: z.string(),
    activities: z.array(z.string())
  })),
  rebootBlocks: z.array(z.object({
    timeOfWeek: z.string().describe('When this block occurs'),
    type: z.enum(['Relax', 'Refresh', 'Review', 'Reflect']),
    durationMinutes: z.number()
  }))
});

export const CareerPersonaSchema = z.object({
  strengthsPortrait: z.array(z.object({
    strength: z.string(),
    description: z.string(),
    application: z.string()
  })),
  careerBlueprint: z.object({
    idealRoles: z.array(z.string()),
    workingStyle: z.string(),
    environmentPreferences: z.string()
  })
});

export const BrandIdentitySchema = z.object({
  narrativeThemes: z.array(z.string()).describe('Core themes connecting past experiences to future goals'),
  moviePosterTagline: z.string().describe('A high-impact, cinematic tagline for the professional identity'),
  brandAttributes: z.array(z.string()).describe('Key traits optimized for external profiles (LinkedIn, etc.)')
});

export const ApplicationMaterialsSchema = z.object({
  resume: z.object({
    summary: z.string().describe('ATS-optimized professional summary'),
    experienceBullets: z.array(z.string()).describe('Tailored accomplishments and impact statements'),
    skills: z.array(z.string()).describe('Relevant matched skills for the role')
  }),
  coverLetter: z.string().describe('A complete, tailored cover letter text')
});

export const CredentialAnalysisSchema = z.object({
  alignmentScore: z.number().describe('Score from 0-100 indicating match strength with the target role'),
  identifiedSkillGaps: z.array(z.string()).describe('Key skills or credentials missing for the role'),
  recommendations: z.array(z.object({
    type: z.enum(['course', 'experiment', 'certification', 'project']),
    title: z.string(),
    description: z.string().describe('How it addresses the identified gap')
  }))
});

export const JobOpportunitySchema = z.object({
  jobId: z.string().describe('A unique identifier for the job posting'),
  jobTitle: z.string(),
  company: z.string(),
  matchScore: z.number().describe('Score from 0 to 100'),
  wrongJobRisks: z.array(z.string()).describe('List of flagged risks based on Extinguishers and constraints'),
  draftedIntro: z.string().describe('A drafted personalized recruiter introduction'),
  applicationSchedule: z.string().describe('Proposed application timeline/schedule')
});

export const JobExecutionSchema = z.object({
  opportunities: z.array(JobOpportunitySchema)
});

export const InterviewCoachingSchema = z.object({
  questionAsked: z.string().describe('The interview question that was simulated'),
  userResponseSummary: z.string().describe('Summary of the user\'s response'),
  feedbackTone: z.string().describe('Feedback on the tone of the response'),
  feedbackPosture: z.string().describe('Feedback on posture, body language, or delivery'),
  performanceScore: z.number().describe('Score from 0 to 100 for this response'),
  nextQuestion: z.string().describe('The recommended next interview question')
});

export type BestSelfProfile = z.infer<typeof BestSelfProfileSchema>;
export type FiveStories = z.infer<typeof FiveStoriesSchema>;
export type FutureVision = z.infer<typeof FutureVisionSchema>;
export type ProductivityPlan = z.infer<typeof ProductivityPlanSchema>;
export type CareerPersona = z.infer<typeof CareerPersonaSchema>;
export type BrandIdentity = z.infer<typeof BrandIdentitySchema>;
export type ApplicationMaterials = z.infer<typeof ApplicationMaterialsSchema>;
export type CredentialAnalysis = z.infer<typeof CredentialAnalysisSchema>;
export type JobOpportunity = z.infer<typeof JobOpportunitySchema>;
export type JobExecution = z.infer<typeof JobExecutionSchema>;
export type InterviewCoachingSession = z.infer<typeof InterviewCoachingSchema>;
