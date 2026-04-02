# Track 001: Baseline Documentation (Brownfield)

**Status**: Initialized
**Date**: 2026-04-02
**Objective**: Document the current "brownfield" state of the Sparkwavv application to serve as a reference for all future tracks.

## 1. Core Architecture
- **Framework**: React 19 + Vite 6 (Frontend), Express 4 (Backend).
- **Language**: TypeScript.
- **Styling**: Tailwind CSS 4.
- **State Management**: React Context (Identity, Dashboard).
- **Routing**: React Router 7.

## 2. AI & Intelligence Layer
- **Primary SDK**: `@google/genai` (Gemini 3.1 Pro/Flash).
- **Enterprise SDK**: `@google-cloud/vertexai` & `@google-cloud/discoveryengine`.
- **Key Services**:
    - `SkylarService`: Orchestrates multi-modal coaching, tool calling, and methodology alignment.
    - `VertexService`: Manages Vertex AI Search (Wavvault), MedLM (Healthcare), and fine-tuning pipelines.
    - `ImageService`: Handles AI-powered image editing (e.g., watermark removal).

## 3. Data & Persistence
- **Database**: Firebase Firestore.
- **Authentication**: Firebase Auth (Google Login).
- **Storage**: Google Cloud Storage (GCS) for career artifacts and fine-tuning data.
- **Key Collections**:
    - `users`: Core profile and "Career DNA" data.
    - `wavvault`: Anonymized career records for semantic search.
    - `validationRequests`: HITL gatekeeping requests for phase transitions.

## 4. Strategic Methodology (Philip Lobkowicz)
- **Frameworks**: Career DNA, Validation Gates, Five Stories, Cinematic Brand Narrative.
- **Phases**: Dive-In -> Ignition -> Discovery -> Branding -> Outreach.
- **Current Gating Status**: Phase 5 (HITL) implemented with manual review capabilities in the Admin Dashboard.

## 5. Current Feature Set
- **Skylar AI Assistant**: Multi-modal, methodology-aware coaching.
- **Wavvault Search**: Semantic search for comparative career insights (Vertex AI).
- **Admin Dashboard**: System health, user management, and Validation Gate review.
- **Evening Spark**: R4 Protocol-based daily reflection tool.
- **Interview Simulator**: Real-time voice/text interview prep.

## 6. Known "Brownfield" State
- Vertex AI Search is integrated but requires specific project/engine IDs in `.env`.
- Validation Gates are "soft" (warnings issued) with a "Proceed Anyway" bypass that triggers HITL review.
- Fine-tuning pipelines are architected but not yet active in production.
