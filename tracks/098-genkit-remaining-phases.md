# Track 098: Genkit Integration for Remaining Journey Phases

## 1. Plan

**Goal**: Extend the Genkit sub-agent and tool architecture to the remaining Sparkwavv Journey phases (Ignition, Discovery, Branding, and Outreach), building securely on the pattern established in Track 097.

**Proposed Enhancements per Phase:**

1. **Ignition Phase (Self-Reflection & Baseline)**
   - **Tool**: `update_pie_of_life`: A tool allowing Skylar to autonomously save the user's "Pie of Life" and "Perfect Day" configurations into their `wavvault_artifacts` collection.

2. **Discovery Phase (Extraction & Brand DNA)**
   - **Sub-Agent / Flow**: `storyExtractorSubAgent`: A specialized sub-agent strictly focused on parsing the user's chaotic accomplishment dumps and extracting structured "STAR" (Situation, Task, Action, Result) stories and mapping them to their core attributes.
   - **Tool**: `synthesize_brand_dna`: Saves the finalized 3-pillar "Cinematic Brand DNA" directly to the dashboard/Wavvault.

3. **Branding Phase (Market Positioning)**
   - **Tool**: We already have `invokeResumeReviewerTool` from Track 097.
   - **Sub-Agent / Flow**: `linkedinOptimizerSubAgent`: A sub-agent focused on transforming the "Journalist" and "Reflective" versions of their Five Stories into highly optimized LinkedIn About and Experience sections. 

4. **Outreach Phase (Execution)**
   - **Sub-Agent / Flow**: `outreachStrategistSubAgent`: A sub-agent to draft highly personalized networking emails, follow-ups, and recruiter reach-outs based on the user's brand DNA and the specific recipient profile.

**Development Approach**:
- **In-Place Extensions**: We will define these new flows (`ai.defineFlow`) and tools (`ai.defineTool`) inside `backend/services/genkitService.ts`.
- **Zod Schemas**: Every tool/sub-agent will have strict input/output Zod schema definitions.
- **AgentOps Visibility**: Since `runJourneyStageFlow` inherently logs all executed tools, the `AgentOps` dashboard will automatically pick up and beautifully render these new executions without modifying the frontend dashboard further.

### Execution Steps
1. **Ignition**: Draft `update_pie_of_life` tool.
2. **Discovery**: Draft `storyExtractorSubAgent` and `synthesize_brand_dna`.
3. **Branding**: Draft `linkedinOptimizerSubAgent`.
4. **Outreach**: Draft `outreachStrategistSubAgent`.
5. **Testing**: Run a simulated interaction through `skylarService.ts` for each of these phases to confirm tools are correctly picked up and AgentOps traces populate properly.

## 2. Setup
*(Pending user approval of the plan)*

## 3. Build

- **Status**: Iterative Backend Architecture Migration Executed.
- **Implementations**:
  - We transitioned the raw frontend `@google/genai` model calls located directly in `skylarService.ts` to strict, schema-validated server-side `Genkit` flows.
  - Re-mapped `startInterviewSession`, `sendInterviewResponse`, and `getInterviewDebrief` (Ignition Phase core functionalities) to Genkit.
  - Re-mapped the `performSynthesis` capability mapping a "Knowledge Graph" array of arrays for the `Discovery` phase.
  - Re-mapped `generateLiveResume` capability utilizing narrative structure building for the `Branding` phase.
  - Added new REST-based endpoints to `server.ts` to seamlessly direct the frontend `skylarService.ts` utility class out towards our hardened backend flows.
- **Suggested Next Steps / Enhancements**:
  - **Tool Enhancements**: In the future when approved, we can upgrade these flows. For example, adding `update_pie_of_life` into the Ignition `sendInterviewResponse` flow, so it natively and silently updates the DB when the user types it in.
  - **Further Migrations**: The `Interactive Portfolio` generation and `Targeted Sequence` algorithms for Outreach still sit natively on the frontend. We can push these identical to the ones above when requested.
