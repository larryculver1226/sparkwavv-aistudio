# Technical Specifications

## Environment
- **Runtime**: Node.js v20.x
- **Framework**: React 18+ with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS

## Architecture
- Client-side SPA (Single Page Application) by default.
- Firebase for backend services (Auth, Firestore) if configured.
- **Local MCP Server**: A Model Context Protocol server (`scripts/mcp-server`) running via stdio to expose project history (Tracks, Changelog, Tech Specs) to local AI coding assistants (e.g., Cursor, Cline).

## Skylar Agent Architecture (Track 022)
### Data Models
- **`JourneyStageDefinition`**: JSON/Firestore schema controlling Skylar's behavior per stage.
  - `stageId` (string): e.g., 'dive-in', 'ignition', 'discovery'.
  - `title` (string): Display title.
  - `description` (string): Subtitle/description.
  - `systemPromptTemplate` (string): The core persona prompt with Handlebars-style variables (e.g., `{{user.firstName}}`).
  - `requiredArtifacts` (string[]): List of artifact types required to pass the gate.
  - `allowedModalities` (string[]): e.g., `['text', 'audio', 'image', 'video']`.
  - `uiConfig` (object): Theme overrides, layout preferences.
- **`Artifact`**: Universal schema for inputs/outputs.
  - `id` (string): UUID.
  - `type` (string): e.g., 'text', 'markdown', 'chart', 'video', 'action-plan'.
  - `content` (any): The actual payload.
  - `metadata` (object): Source, creation date, confidence score.
  - `modality` (string): 'text', 'audio', 'image', 'video'.
  - `relatedStage` (string): The `stageId` this artifact belongs to.

### Components
- **`SkylarInteractionPanel`**: A generic, unified UI component that takes a `JourneyStageDefinition` as a prop and dynamically renders:
  - Chat interface.
  - Multi-modal input zones (microphone, drag-and-drop file upload) based on `allowedModalities`.
  - Artifact display area using a Dynamic Renderer Registry.
- **Dynamic Renderers**: Components like `MarkdownRenderer`, `DataVizRenderer`, `MediaRenderer` that are selected based on `Artifact.type`.

### Services
- **`skylarService.ts` Refactoring**:
  - Remove hardcoded prompts (`DIVE_IN_PROMPT`, etc.).
  - Implement `getStageConfig(stageId)` to fetch the `JourneyStageDefinition`.
  - Implement `buildContextualPrompt(user, stageConfig, artifacts)` for dynamic context injection.
  - Centralize tool execution logic to be driven by the stage config.
- **Firestore Collections**:
  - `user_activities`: Stores user activity events.
  - `dashboards`: Stores user dashboard state, including `phaseProgress`.
  - `wavvault_artifacts`: Stores distilled artifacts.
- **Firebase Storage**:
  - `users/{userId}/profile.*`: Stores user profile images uploaded via the ProfilePage.

## Data Models
- `Dashboard.phaseProgress`: Object containing percentage completion (0-100) for `diveIn`, `ignition`, `discovery`, `branding`, `outreach`.
- `UserActivity`: Includes `tags` array and `relatedEntityId` for linking to artifacts/milestones.
- `UserProfile` (or equivalent user data):
  - `ignitionExercises`: Object containing:
    - `pieOfLife`: `{ career: number, family: number, health: number, personalGrowth: number, community: number }`
    - `perfectDay`: `{ morning: string, afternoon: string, evening: string }`
  - `careerDnaHypothesis`: Array of strings representing core attributes.

## Model Garden Fine-Tuned Models
- **Routing Logic**: `vertexService.ts` routes requests to specific fine-tuned models if their corresponding endpoint IDs are set in the environment variables.
- **Environment Variables**:
  - `VERTEX_AI_LOBKOWICZ_ENDPOINT_ID`: Endpoint ID for the Philip Lobkowicz Strategic Coaching Methodology model.
  - `VERTEX_AI_FINANCE_ENDPOINT_ID`: Endpoint ID for the Finance Sector Intelligence model.
  - `VERTEX_AI_TECH_ENDPOINT_ID`: Endpoint ID for the Tech Sector Intelligence model.
- **Fallback Mechanism**: If an endpoint ID is not configured (e.g., in local development), the service safely falls back to the standard `gemini-3.1-pro-preview` model.

## Track 009: User Dashboard Improvements
- **Dynamic Progress Calculation**:
  - Implement `calculatePhaseProgress(dashboardData, artifacts)` in a new `progressService.ts`.
  - Trigger progress recalculation when:
    - A milestone is toggled (`UserDashboard.tsx`).
    - An artifact is created (`wavvaultService.ts`).
  - Update `Dashboard.phaseProgress` in Firestore.
- **Interactive Activity Feed**:
  - Add `onClick` handler to `ActivityFeed` items.
  - Fetch artifact details via `relatedEntityId` when an `artifact_created` event is clicked.
  - Display artifact details in a modal (`ArtifactModal.tsx`).
- **Dedicated History View**:
  - Add `/history` route or a "History" tab in `UserDashboard.tsx`.
  - Create `HistoryView.tsx` component.
  - Implement filtering by `journeyPhase`, `type`, and `tags`.
