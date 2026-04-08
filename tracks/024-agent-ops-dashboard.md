# Track 024: Migrate Skylar Agent Definitions to Firestore & Build Agent Ops UI

## Goal
Migrate the hardcoded Skylar agent definitions (`JOURNEY_STAGES`) into Firestore and build an "Agent Ops" UI in the Admin Dashboard. This will allow non-developers to dynamically update Skylar's prompts, modalities, and UI configurations without deploying code.

## Approach (Plan)

### 1. Database Schema & Security Rules
- **Firestore Collection**: Create an `agent_configs` collection.
- **Document ID**: Use the stage ID (e.g., `dive-in`, `ignition`).
- **Schema**: Match the `JourneyStageDefinition` interface (`title`, `description`, `systemPromptTemplate`, `requiredArtifacts`, `allowedModalities`, `uiConfig`).
- **Security Rules**: 
  - `read`: Authenticated users (so the dashboard can load the prompts).
  - `write`: Only users with the `admin` or `super_admin` role.

### 2. Service Layer Updates
- Create a new service (or add to `skylarService.ts`) to handle fetching and updating `agent_configs`.
- Implement a fallback mechanism: If the Firestore collection is empty (e.g., on first load), fallback to the hardcoded `JOURNEY_STAGES` and optionally seed the database.

### 3. Admin Dashboard UI ("Agent Ops")
- Add a new tab to `AdminDashboard.tsx` called **"Agent Ops"** (or "Prompt Engineering").
- **Stage Selector**: A sidebar or dropdown to select which stage to edit.
- **Prompt Editor**: A large `textarea` for editing the `systemPromptTemplate`.
- **Configuration Toggles**: Checkboxes for `allowedModalities` (text, audio, image, video) and inputs for `uiConfig` (theme, primaryColor).
- **Save Functionality**: Write the updated configuration back to Firestore.

### 4. User Dashboard Integration
- Update `UserDashboard.tsx` or `SkylarInteractionPanel.tsx` to fetch the configuration from Firestore asynchronously when the component mounts, rather than relying solely on the static import.

## Status
- [x] Plan
- [x] Setup
- [x] Build
- [x] QA & Testing
