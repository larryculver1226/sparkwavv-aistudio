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

## Skylar Agent Architecture (Track 022 & 027)
### Orchestration (LangGraph)
- **Framework**: `@langchain/langgraph`, `@langchain/core`, `@langchain/google-vertexai`.
- **Graph State**: Tracks `messages` (conversation history), `stageConfig` (current journey stage definition), and `executedActions` (tools called during the run).
- **Nodes**:
  - `agent`: Invokes the `ChatVertexAI` model with the current state and bound tools.
  - `tools`: Executes the tools requested by the model (using LangChain's `ToolNode`).
- **Edges**: Conditional routing between `agent` and `tools`, ending when a final response is generated.

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
  - `metadata`: Stores global configuration (e.g., `skylar_global`).
  - `journey_stages`: Stores configuration for specific journey stages.
  - `user_activities`: Stores user activity events.
  - `dashboards`: Stores user dashboard state, including `phaseProgress`.
  - `wavvault_artifacts`: Stores distilled artifacts.
- **Firebase Storage**:
  - `users/{userId}/profile.*`: Stores user profile images uploaded via the ProfilePage.
- **`configService.ts`**:
  - Fetches and caches `SkylarGlobalConfig` and `SkylarStageConfig` from Firestore.
  - Subscribes to real-time updates for `skylar_global`.
- **`SkylarConfigContext.tsx`**:
  - Manages global configuration state and current journey stage metadata.
  - Exposes `useSkylarConfig` hook for components to access `global`, `currentStage`, `isLoading`, and `refreshConfig`.
- **`interpolation.ts`**:
  - Replaces `{{variable}}` tags in system prompts with real user/session data (e.g., `{{user.displayName}}`, `{{stage.title}}`).

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

## Track 031: Regression Tests & Admin Feedback
### Test Architecture
- **Framework**: Playwright for E2E, Vitest for Unit/Component.
- **Suites**: Full Regression (`npm run test:e2e`) and Smoke (`npm run test:e2e:smoke`).
- **Mocking**: Playwright `page.route` used to mock Firebase Auth and Gemini API for deterministic testing.

### Admin Dashboard Integration
- **Execution Endpoint**: `POST /api/admin/tests/run` (Restricted to `SUPER_ADMIN`). Spawns child process for Playwright.
- **Results Endpoint**: `GET /api/admin/tests/results`. Fetches JSON reports from `test-results/report.json`.
- **UI**: "System Tests" tab in Admin Portal.

### User Feedback Mechanism
- **Data Store**: Firestore `feedback_issues` collection.
- **Schema**: Maps to Jira (Summary, Description, IssueType, Reporter).
- **UI**: Global "Feedback" widget in NavBar, and "User Feedback" tab in Admin Portal.
