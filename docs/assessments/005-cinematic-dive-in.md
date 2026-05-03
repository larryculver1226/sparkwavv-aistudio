# Dive-In Cinematic Subagent & Architecture Analysis

## 1. Architectural Analysis of Current Dive-In
Currently, `DiveInPage.tsx` acts as a multi-step checklist where the user provides explicit variables (`EffortTier`, `PieOfLife`, `Strengths`, `PerfectDay`, `TargetFinancials`) via chat or direct UI clicks.
- **Current Tools Used:** `updateDiveInUITool`, `parseResumeToVault`, `extractPainPoints`, `recommendCustomJourneyPath`.
- **The Gap:** The onboarding is highly functional but feels like answering a questionnaire. There is no immediate "hook" or emotional resonance that demonstrates the transformative potential of the Sparkwavv platform before the user formally commits.

## 2. Introducing a "Cinematic Approach"
To entice new users, we can bring forward the polished "Cinematic Synthesis" concept into the lowest friction stage (Dive-In) as a "Teaser".

**Concept: The "Cinematic intake" Teaser**
Instead of just acknowledging the resume upload and asking for the remaining checklist items, Skylar will analyze the user's initial state (or uploaded resume) and invoke a **Cinematic Intake Teaser**. This acts as a tailored movie-trailer experience of their potential career trajectory.

## 3. Developing New Tools & UI
**New Tool: `generateCinematicTeaserTool`**
- We will define a new tool in `genkitService.ts`.
- **Purpose**: When the user provides initial context (like an uploaded resume), Skylar calls this to build a 3-4 scene emotional narrative (e.g., "The Anchor", "The Spark", "The Trajectory").
- **Output**: Returns a `uiAction: 'play_cinematic_teaser'` with scene data (visual text, mood, suggested background style).

**UI Enhancements in `DiveInPage.tsx`**
- We will add a `CinematicTeaserOverlay` component to the page.
- When `uiAction === 'play_cinematic_teaser'`, this overlay takes over the screen dynamically, similar to `CinematicSynthesis.tsx`, building hype.
- After the brief cinematic sequence finishes, it smoothly transitions back to the checklist interface, heavily motivating the user to finish the Dive-In required fields having just seen their "Peak Potential" trailer.

## 4. Subagent Consideration
We can create an explicit system instruction or a specialized subagent prompt in `backend/prompts/subagents/cinematicIntake.prompt` (if needed, or just append explicitly to `skylarBase.prompt`) to instruct Skylar: "When a user uploads a resume, immediately craft a cinematic trailer of their future self to hook them using `generateCinematicTeaserTool`."

## Review and Next Steps
Please review this approach. If this Cinematic Teaser aligns with your vision to enhance the new-user hook, let me know and I will proceed with creating Track 123 and implementing the UI and Genkit Tool!
