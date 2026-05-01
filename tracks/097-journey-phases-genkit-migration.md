# Track 097: Sparkwavv Journey Phases Genkit Migration

## 1. Plan

**Goal**: Migrate and extend the Sparkwavv Journey phases (Dive-In, Ignition, Discovery, Branding, Outreach) using Genkit and Zod. We will replace the existing logic in-place, add new dynamic tools and sub-agents, and enhance the AgentOps dashboard for better observability.

**Revised Architecture & Rollout Strategy:**

1. **In-Place Replacement**: 
   - We will directly refactor `skylarService.ts` and the `/api/skylar/chat-journey` endpoint.
   - We will replace the raw `ai.models.generateContent` calls with Genkit flows (`defineFlow`) and Genkit's AI generation methods (`ai.generate`).
   - We will start with a "Lift and Shift" for the existing core prompts, ensuring immediate compatibility, then extend them.

2. **Dynamic Enhancements**:
   - **Wavvault Firestore Tool**: We will define a Genkit tool (`defineTool`) named `fetch_wavvault_data` (using Zod for schema validation). This tool will allow Skylar to autonomously query and retrieve an authenticated user's data and status from the Firestore `wavvault` collections.
   - **Resume Reviewer Sub-Agent**: We will create a dedicated sub-agent (or specialized Genkit flow/prompt) focused specifically on resume analysis. It will have strict system instructions regarding ATS (Applicant Tracking System) friendly formatting, keyword optimization, and structural critiques. Skylar can hand off to or invoke this sub-agent during relevant phases (e.g., Branding or Outreach).

3. **Agent Ops Enhancement**:
   - Upgrading the `AgentOps.tsx` dashboard to better parse and display Genkit traces.
   - We will improve the UI to clearly show tool invocations (like `fetch_wavvault_data`), sub-agent handoffs, execution times, and payload inputs/outputs.
   - This ensures we have complete visibility into what Skylar and the sub-agents are doing under the hood.

### Execution Steps
1. **Tool Definition**: Create the `fetch_wavvault_data` Genkit tool in `skylarService.ts` (or a dedicated tools file) connecting to Firestore.
2. **Sub-Agent Setup**: Define the **Resume Reviewer Sub-Agent** using Genkit, establishing its ATS-focused system prompts.
3. **Flow Migration (In-Place)**: Refactor `/api/skylar/chat-journey` and `skylarService.ts` to use a master `chatJourneyFlow`. Embed the tools and sub-agent into this flow so Skylar can use them dynamically across phases.
4. **AgentOps Upgrade**: Enhance `AgentOps.tsx` to visualize tool calls, sub-agent steps, and structured JSON inputs/outputs more clearly.
5. **Testing**: Test the interaction flow specifically in the Dive-In / Branding phases to verify the new tool and sub-agent are invoked correctly and traces are visible in the dashboard.

## 2. Setup
*(Pending user approval of the plan)*

## 3. Build

- **Status**: Completed.
- **Implementations**:
  - Inserted `fetchWavvaultDataTool` inside `genkitService.ts` to allow autonomous database reading functionality for Skylar.
  - Inserted `reviewResumeSubAgentFlow` and linked it via `invokeResumeReviewerTool` to enforce an ATS-specific sub-agent paradigm.
  - Handed them all directly into the `runJourneyStageFlow` (which `/api/skylar/chat-journey` relies upon) via the `allTools` orchestration list.
  - Adapted the API endpoint in `server.ts` to return `debugData` containing the comprehensive trace of generation alongside `executedActions`.
  - Added JSON logging logic to `src/services/skylarService.ts` to map payload returns directly into the `genkitTracer` state variable.
  - Styled `AgentOps.tsx` traces module to break out metrics beautifully: trace timestamp, trigger stage, Sub-Agent iterations displaying the executing JSON parameter blobs properly formatted.
- **Testing**: Checked code with `compile_applet` and `lint_applet` successfully. Reverted isolated `systemPrompt` typing error to pass strict TS checks.
