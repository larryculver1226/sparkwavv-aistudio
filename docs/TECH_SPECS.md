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

## Configuration Guide (Track 051)

To enable full enterprise intelligence, the following environment variables must be configured in the AI Studio Settings:

### 1. Firebase & Core Infrastructure
- `FIREBASE_SERVICE_ACCOUNT_JSON`: The full JSON string of your Google Cloud Service Account key. This enables Firebase Admin and Vertex AI Enterprise features.
- `VITE_FIREBASE_DATABASE_ID`: The ID of your Firestore database (e.g., `(default)` or a custom ID like `sparkwavv-db`).
- `SESSION_SECRET`: A random string for securing user sessions.

### 2. Vertex AI (Enterprise Intelligence)
- `VERTEX_AI_PROJECT_ID`: Your Google Cloud Project ID (defaults to Firebase Project ID if omitted).
- `VERTEX_AI_LOCATION`: The region for Vertex AI services (e.g., `us-central1` or `global`).
- `VERTEX_AI_SEARCH_ENGINE_ID`: The ID of your Vertex AI Search Engine for the Wavvault.
- `VERTEX_AI_SEARCH_DATA_STORE_ID`: The ID of the associated Data Store.
- `VERTEX_AI_MEDLM_MODEL_ID`: The specific MedLM model ID for healthcare intelligence (e.g., `medlm-medium`).
- `VERTEX_AI_FINE_TUNING_BUCKET`: The GCS bucket name for staging training data (e.g., `my-project-fine-tuning`).
- `VERTEX_AI_LOBKOWICZ_ENDPOINT_ID`: The Endpoint ID for the fine-tuned Philip Lobkowicz model.
- `VERTEX_AI_FINANCE_ENDPOINT_ID`: The Endpoint ID for the Finance Sector Intelligence model.
- `VERTEX_AI_TECH_ENDPOINT_ID`: The Endpoint ID for the Tech Sector Intelligence model.

### 3. External APIs
- `GEMINI_API_KEY`: Required for standard Skylar interactions and benefit regeneration.
- `SENDGRID_API_KEY`: Required for sending automated career reports and notifications.
- `GOOGLE_MAPS_API_KEY`: Required for the custom Google Maps tool for geographic data.

## API Management (Track 064)

Sparkwavv uses **Google Apigee** (planned) as the API Management layer to secure and scale its backend services.

### Key Benefits:
- **Security**: Centralized OAuth2/JWT verification and RBAC enforcement.
- **Rate Limiting**: Protection against DoS and quota management for AI-intensive endpoints.
- **Analytics**: Real-time monitoring of API usage across tenants (e.g., Sparkwavv, Kwieri).
- **Partner Enablement**: Securely exposing career intelligence APIs to third-party partners.

### Managed Endpoints:
- `/api/partner/*`: Partner-facing career progress and invitation APIs.
- `/api/admin/*`: Sensitive system management and Vertex AI orchestration APIs.
- `/api/wavvault/*`: Neural Synthesis Engine data access.

## Skylar Agent Architecture (Track 022 & 027)

### System Prompt Standardization Framework
All Journey Phase Prompts must adhere to the standardized framework:
- **IDENTITY & CONTEXT**: Strict usage of {{stage.title}}, {{user.displayName}}, {{user.firstName}}, {{user.role}}, and {{user.sector}}.
- **GOAL**: Clearly defining the objective of the turn/phase.
- **STAGE GATE REQUIREMENTS**: Explicit listing of artifacts that must be validated before unlocking future stage access.
- **DUAL-LOGIC PERSONAS**: The Kick (Yin) / The Spark (Yang) logic splits.
- **UI & DYNAMIC CONTENT AWARENESS**: Instructions on how the UI changes result from Skylar's actions.
- **STEP-BY-STEP INSTRUCTIONS**: Actionable, numbered imperatives outlining the path.
- **ACTION TRIGGERS**: Specific Conversation Triggers mapping directly to Tool Execution.
- **CONSTRAINTS**: Explicit limits (e.g., "Don't give generic advice; always reference the user's Wavvault data").
- **TONE**: Required stylistic characteristics (e.g., three descriptive adjectives).

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
  - Provides `updateGlobalConfig` to save changes to the global configuration.
  - Provides `updateStageConfig` to save changes to specific stage configurations.
- **`SkylarConfigContext.tsx`**:
  - Manages global configuration state and current journey stage metadata.
  - Exposes `useSkylarConfig` hook for components to access `global`, `currentStage`, `isLoading`, and `refreshConfig`.
- **`interpolation.ts`**:
  - Replaces `{{variable}}` tags in system prompts with real user/session data (e.g., `{{user.displayName}}`, `{{stage.title}}`).
- **`SkylarConfigPanel.tsx`**:
  - Admin panel component to edit `SkylarGlobalConfig` (e.g., avatar scale, scrolling benefits).
  - Includes AI-powered "Regenerate" feature for home page benefits using Gemini.
- **`AgentOps.tsx`**:
  - Admin panel component to edit `SkylarStageConfig` (e.g., system prompts, required artifacts, modalities).

## Data Models
- `Dashboard.phaseProgress`: Object containing percentage completion (0-100) for `diveIn`, `ignition`, `discovery`, `branding`, `outreach`.
- `UserActivity`: Includes `tags` array and `relatedEntityId` for linking to artifacts/milestones.
- `UserProfile` (or equivalent user data):
  - `ignitionExercises`: Object containing:
    - `pieOfLife`: `{ career: number, family: number, health: number, personalGrowth: number, community: number }`
    - `perfectDay`: `{ morning: string, afternoon: string, evening: string }`
  - `careerDnaHypothesis`: Array of strings representing core attributes.

## Vertex AI Enterprise Intelligence (Track 056)
### Current Status
- **Managed RAG (v1)**: Active via Vertex AI Search (Discovery Engine).
- **Vector Search (v2)**: Replaced mock data implementation with live Firestore heuristic tracking via NeuralSynthesisEngine.
- **Wavvault Synthesis**: Fully active and dynamically mapping user strengths, identities, and target roles directly replacing former hardcoded MOCK_ lists.
- **Fine-Tuning**: Synthetic data generation active; Tuning job execution in development.
- **Sector Intelligence**: Active with fallbacks; Endpoint integration in progress.

### Planned Completions
- **Vector Search**: Transition to real Index/Endpoint deployment on Vertex AI.
- **Tuning Jobs**: Integration with Vertex AI Tuning API for methodology fine-tuning.
- **GCS Pipeline**: Automated data staging and bucket management.

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
