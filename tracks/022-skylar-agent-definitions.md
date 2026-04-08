# Track 022: Skylar Agent Definitions for Sparkwavv Journey Steps

## Goal
Design and architect a generic, parameter-driven template for the "Skylar" AI Agent across all Sparkwavv Journey Steps (Dive-In, Ignition, Discovery, Branding, Outreach). The architecture must ensure UI/UX consistency, minimize future code changes through parameterization, enable deep personalization, support multi-modal inputs, and define a robust artifact management strategy.

## Approach (Plan)

### 1. Architecture & Data Model Design (Zero-Code Goal)
- **Journey Stage Schema**: Define a JSON/Firestore schema (`JourneyStageDefinition`) that controls the UI and Agent behavior without code changes.
  - Parameters: `stageId`, `title`, `description`, `systemPromptTemplate`, `requiredArtifacts`, `allowedModalities` (text, audio, video, image), `uiConfig`.
- **Skylar Agent Config**: Define how Skylar's persona adapts per stage while maintaining core traits.

### 2. Refactoring Existing Skylar Architecture
- **Consolidate Prompts**: The current `skylarService.ts` has hardcoded prompts (`DIVE_IN_PROMPT`, `IGNITION_PROMPT`, `LOBKOWICZ_PROMPT`, etc.). We will migrate these into the new `JourneyStageDefinition` configuration.
- **Unify UI Components**: Currently, there are multiple disparate components (`HighFidelitySynthesisLab`, `OutreachForge`, `InterviewSimulator`, `SkylarSidebar`, `EveningSpark`). We will refactor these to use the new generic `SkylarInteractionPanel` where applicable, or update them to consume the new configuration schema to ensure UI/UX consistency.
- **Centralize Tool Execution**: Ensure all tool calls (e.g., `save_dive_in_commitments`, `update_journey_stage`) are handled generically based on the stage configuration rather than hardcoded in specific phase views.

### 3. UI/UX Generic Template Design
- **Unified Interaction Panel**: Design a `SkylarInteractionPanel` component that dynamically renders based on the current stage's configuration.
- **Multi-Modal Input Zones**: Integrate seamless UI for text, voice/audio recording, and media uploads (drag-and-drop for images/video), controlled by the `allowedModalities` parameter.
- **Consistent Feedback**: Standardize loading states, synthesis animations (Neural Synthesis Engine), and success/error handling.

### 4. Personalization Engine
- **Context Injection**: Define a standard mechanism to inject user-specific data (Wavvault data, strengths, Pie of Life, career happiness, past artifacts) into Skylar's context window.
- **Dynamic Prompting**: Use template variables (e.g., `{{user.firstName}}`, `{{user.topStrength}}`) in the `systemPromptTemplate` to tailor responses dynamically.

### 5. Artifact Management Strategy (Inputs/Outputs)
- **Standardized Schema**: Define a universal `Artifact` schema (e.g., `id`, `type`, `content`, `metadata`, `modality`, `relatedStage`).
- **Dynamic Renderers**: Create a registry of UI renderers based on artifact `type` (e.g., `MarkdownRenderer`, `DataVizRenderer`, `MediaRenderer`) so new artifact types can be added via configuration rather than hardcoding new UI components.

### 6. Documentation & Tech Specs
- Update `docs/TECH_SPECS.md` with the new schemas, component architecture, and data flow diagrams.
- Document the process for adding a new Journey Step using only configuration.

## Status
- [x] Plan
- [x] Setup
- [x] Build
- [x] QA & Testing
