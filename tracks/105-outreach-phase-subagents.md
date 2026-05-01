# Track 105: Outreach Phase Sub-Agents & Tools

## 1. Plan
**Goal:** Assess and develop design and implementation strategies for two specialized sub-agents used by Skylar during the Outreach phase. These will follow the pattern established in the previous tracks: implemented as Genkit tools, using "no-code" dynamic system prompts from Firestore, strict Zod schemas for structured output data, and persisting directly to the user's Wavvault.

**Sub-Agents to Design and Implement:**

1. **Job Matching & Application Execution Engine:**
   - *Input:* User ID, user's Wavvault (Best Self, Extinguishers, Future Vision constraints), and market/job postings data.
   - *Output/Schema:* `JobExecutionSchema` - Includes recommended job matches (with match scores), computed "Wrong Job Risks" based on the user's Extinguishers, drafted recruiter introductions, and proposed application schedules.
   - *Persistence:* Writes to `wavvault.jobExecution` as a top-level field (overwriting/merging when updated).
   - *No-Code Prompting:* Uses system prompt stored in `agentConfigs` doc `execute_job_matching`.

2. **AI Job Interview Simulator & Coach:**
   - *Input:* User ID, target role, simulated question, and user's transcribed response/behavioral context.
   - *Output/Schema:* `InterviewCoachingSchema` - Real-time coaching feedback on tone, posture, and delivery, an overall performance score, and the next recommended interview question to continue the simulation.
   - *Persistence:* Appends feedback and session data into the user's `interviewSessions` array on their main Wavvault document or stores it under a dedicated sub-collection over time.
   - *No-Code Prompting:* Uses system prompt stored in `agentConfigs` doc `coach_interview_simulation`.

**Review Plan:**
- Documented intended inputs, strict Zod schemas, direct Firestore persistence, and no-code prompt configurations for the 2 Outreach tools.
- Clarifications applied: (1) `matchedOpportunities` will be appended as an array in Firestore over time, and (2) `interviewSessions` will be appended as an array to track simulation progress.

## 2. Setup
- Updating Zod schemas and Wavvault interface to reflect array accumulations for opportunities and interview sessions.

## 3. Build
- Defined strict Zod schemas for `JobExecutionSchema`, `JobOpportunitySchema`, and `InterviewCoachingSchema`.
- Updated `WavVault` interface with `matchedOpportunities` and `interviewSessions` arrays.
- Developed Genkit tools `execute_job_matching` and `coach_interview_simulation` inside `genkitService.ts`.
- Tools handle fetching specific prompts from `agentConfigs` and appending results (`FieldValue.arrayUnion`) to maintain an ongoing history without overwriting.
