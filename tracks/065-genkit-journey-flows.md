# Track 065: Genkit Integration for Journey Flow Control

## Status
- [x] Plan: 2026-04-15
- [x] Setup: 2026-04-15
- [x] Build: 2026-04-15

## Objectives
- Investigate and design the integration of Google Genkit to manage Sparkwavv Journey phases.
- Enable "no-code" editability of flows via the Admin Dashboard.
- Support multi-modal input/output and robust activity logging.

## Design Solution

### 1. Architecture Overview
Currently, Sparkwavv uses LangGraph (`skylarGraph.ts`) for orchestration. We propose migrating this to **Google Genkit**. Genkit provides a more streamlined, strongly-typed approach to defining AI workflows (Flows) with built-in telemetry, tracing, and multi-modal support.

- **Backend (Express)**: Genkit will be initialized on the Node.js server.
- **Flow Definition**: A universal `runJourneyStage` flow will be defined. Instead of hardcoding the logic for each stage, the flow will dynamically fetch its configuration (prompts, allowed tools, required artifacts) from Firestore.
- **Admin Dashboard**: The existing Stage Management UI will update the Firestore documents. Because the Genkit flow reads from Firestore at runtime, changes made in the dashboard will instantly alter the flow's behavior without requiring code deployments ("no-code" updates).

### 2. Dynamic "No-Code" Flow Control
Genkit flows are code-based, but their execution path can be data-driven.
- **Input Schema**: `{ userId: string, stageId: string, userMessage: string, attachments?: any[] }`
- **Execution Steps**:
  1. `fetchStageConfig`: Retrieves the `JourneyStageDefinition` from Firestore.
  2. `buildPrompt`: Constructs the system instruction using the dynamic template and user data.
  3. `selectTools`: Dynamically binds Genkit tools (e.g., `updateDashboard`, `generateArtifact`) based on the stage configuration.
  4. `generateResponse`: Calls the Gemini model (via Genkit's `generate` function) with multi-modal inputs.
  5. `evaluateGate`: Checks if the required artifacts for the stage are complete to unlock the next phase.

### 3. Multi-Modal Input/Output
Genkit natively supports multi-modal inputs. The frontend will pass base64-encoded images, audio, or PDFs to the Express backend, which will map them to Genkit's `Part` interface (e.g., `{ media: { url: "data:image/png;base64,...", contentType: "image/png" } }`).

### 4. Activity Logging & Telemetry
- **Genkit Developer UI**: Provides a local UI to inspect every step, prompt, and tool call during development.
- **Production Tracing**: Genkit integrates with Google Cloud Trace and Logging for production observability.
- **User-Facing Logging**: We will use Genkit's `run` (step) function to emit custom events to the `user_activities` Firestore collection, providing a real-time audit trail on the user's dashboard.

## Implementation Plan

### Phase 1: Setup & Initialization
1. Install Genkit dependencies (`@genkit-ai/core`, `@genkit-ai/googleai`, `@genkit-ai/vertexai`).
2. Initialize Genkit in `server.ts` (or a dedicated `src/services/genkitService.ts`).

### Phase 2: Tool Migration
1. Convert existing LangChain tools (in `skylarGraph.ts`) to Genkit tools using `defineTool` and Zod schemas.
   - Example: `createSparkwavvAccountTool`, `searchWavvaultTool`, `executeMinorUpdateTool`.

### Phase 3: Flow Definition
1. Create the `runJourneyStage` flow using `defineFlow`.
2. Implement the dynamic Firestore configuration lookup within the flow.
3. Implement multi-modal message parsing.

### Phase 4: API Integration & Admin UI
1. Update the Express `/api/chat` endpoint to invoke the Genkit flow instead of LangGraph.
2. Ensure the Admin Dashboard's Stage Management panel correctly formats the JSON schemas expected by the Genkit flow.

## Review & Approval
Awaiting user approval on this design before proceeding to the Setup and Build phases.
