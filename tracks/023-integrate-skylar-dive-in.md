# Track 023: Integration of SkylarInteractionPanel into the User Dashboard for Dive-In Phase

## Goal
Integrate the newly built `SkylarInteractionPanel` into the `UserDashboard` when the user is in the "Dive-In" phase. This will replace or augment the current static/bespoke UI for the Dive-In phase with the dynamic, parameter-driven Skylar Agent interface.

## Approach (Plan)

### 1. Analyze Current Dashboard Layout
- The `UserDashboard.tsx` currently renders different content based on the `timelineStage` (e.g., `timelineStage === 'Dive-In'`).
- We need to identify the exact section where the Dive-In content is rendered and prepare it to host the `SkylarInteractionPanel`.

### 2. Integrate SkylarInteractionPanel
- Import `SkylarInteractionPanel` and `JOURNEY_STAGES` into `UserDashboard.tsx`.
- When `timelineStage === 'Dive-In'`, render the `SkylarInteractionPanel`.
- Pass the `JOURNEY_STAGES['dive-in']` configuration as the `stageConfig` prop.
- Pass the current `user` object to the panel.

### 3. Handle Layout and Styling
- Ensure the panel fits seamlessly within the dashboard's grid/layout.
- The Dive-In config specifies a `chat-first` layout with a `dark` theme and `neon-cyan` primary color. We will ensure the container in `UserDashboard` allows the panel to expand and scroll properly.

### 4. Connect Callbacks (Future-proofing)
- Wire up the `onArtifactCreated` and `onActionTriggered` callbacks to the dashboard's state management (even if they just log for now, to ensure the plumbing is ready for when Skylar generates artifacts).

## Status
- [x] Plan
- [x] Setup
- [x] Build
- [x] QA & Testing
