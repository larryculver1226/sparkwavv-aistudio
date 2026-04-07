# Track 017: Skylar Ignition Subagent

## 1. Goal
Design and implement the Skylar Ignition Subagent, which takes over when a user transitions from the Dive-In phase to the Ignition phase. It guides the user through the Pie of Life, Perfect Day, and Career DNA Hypothesis exercises.

## 2. Approach
- **Data Model**: Update user profile/dashboard types to include `ignitionExercises` (structured `pieOfLife` and `perfectDay`) and `careerDnaHypothesis` (array of strings).
- **AI Model**: Add `IGNITION_PROMPT` to `skylarService.ts` to handle the Dual-Logic (Spark/Kick) persona for these specific exercises.
- **Tools**: Add `save_ignition_exercises` and `save_career_dna_hypothesis` to the Gemini tools array.
- **Backend**: Update `/api/agent/chat` in `server.ts` to intercept these new tools and write to Firestore.
- **Frontend**: Update `SkylarSidebar.tsx` to handle custom toast messages and voice confirmations for these actions.

## 3. Status
- [x] Plan Approved
- [x] Setup (Track file created, TECH_SPECS updated)
- [x] Build (Code changes)
- [x] QA & Testing
