# Track 026: Redesign Dive-In as Pre-Registration Onboarding

## Objective
Realign the "Dive-In" phase so that it serves as an interactive, agent-led onboarding experience for *prospective* users who do not yet have a Sparkwavv account. The Dive-In phase will gather their initial commitments and information, culminating in the creation of their Sparkwavv account and dashboard.

## Plan

### 1. Create a Public "Dive-In" Landing/Onboarding Page
- Create a new route (e.g., `/dive-in` or `/onboarding`) that is accessible *without* being logged in.
- This page will host the `SkylarInteractionPanel` configured for the `dive-in` stage.
- *Technical detail*: To allow Skylar to interact with an unauthenticated user, we will either use Firebase Anonymous Authentication for the session or adjust the `skylarService` to handle a temporary session ID until the account is created.

### 2. Update the Skylar "Dive-In" Agent Configuration
- Update the `dive-in` prompt in `agent_configs` (or `journeyStages.ts` fallback) to reflect that the user is a prospect.
- Skylar will collect the required Dive-In artifacts (Effort Tier, RPPs, Energy Protocol) and basic user details (Name, intent).
- Replace the `update_journey_stage` tool for this phase with a new tool: `create_sparkwavv_account`.

### 3. Integrate Resume Upload (DOCX, PDF, Text)
- Adopt the resume parsing and upload logic from the `SPARKWavvApp` landing flow (`src/App.tsx`).
- Provide an option in the Dive-In UI (or within the Skylar chat interface) for the user to upload their resume.
- Parse the uploaded resume to pre-fill the user's context (e.g., name, job title, bio, accomplishments) so Skylar can provide a highly personalized onboarding experience.

### 4. Implement Account Creation Handoff
- When Skylar triggers `create_sparkwavv_account`, the UI will transition to the actual authentication flow (e.g., Google Sign-In or Email/Password).
- Upon successful authentication, the user's newly created account will be populated with the artifacts gathered during the Dive-In chat, the parsed resume data, and their `journeyStage` will be set to `Ignition`.

### 5. Remove Dive-In from the Authenticated Dashboard
- Remove `DiveInView` from `UserDashboard.tsx` and `PhaseViews.tsx`.
- The authenticated `UserDashboard` will now begin at the "Ignition" phase, assuming the user has already completed Dive-In to get their account.

## Status
- [x] Plan
- [x] Setup
- [x] Build
- [x] QA & Testing
