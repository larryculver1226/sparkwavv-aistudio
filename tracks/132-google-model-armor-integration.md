# Track 132: Google Model Armor Integration

**Status**: PLANNING
**Owner**: AI Agent
**Priority**: HIGH
**Date**: 2026-05-05

## 1. Objectives
- Implement **Google Cloud Model Armor** as a safety and governance layer for all Skylar AI interactions.
- Protect against Prompt Injection, Jailbreaking, and PII leakage.
- Ensure model outputs are filtered for Toxicity, Hate Speech, and Non-Compliance.
- Integrate Model Armor seamlessly into the existing Genkit and Vertex AI backend flows.

## 2. Technical Implementation Plan

### Phase 1: Research & Discovery
- [x] Confirm Model Armor API surface within the `@google-cloud/aiplatform` SDK.
- [ ] Identify the high-risk "Interaction Points" where user input is passed directly to LLMs (e.g., Skylar Chat, Ignition Interview, Outreach Personalization).

### Phase 2: Infrastructure & Configuration
- [ ] Define `GOOGLE_MODEL_ARMOR_POLICY_NAME` and `GOOGLE_CLOUD_PROJECT` in `.env.example`.
- [ ] Update `TECH_SPECS.md` to reflect Model Armor as a mandatory safety gate.
- [ ] Create `backend/services/modelArmorService.ts` to encapsulate the Model Armor Client logic.

### Phase 3: Core Service Development
- [ ] **Prompt Sanitization**: Implement a `sanitizePrompt` method that checks for injection/jailbreak before LLM execution.
- [ ] **Response Validation**: Implement a `validateResponse` method that filters model output for safety violations.
- [ ] **PII Scrubbing**: Configure PII filters to prevent sensitive user data (Email, SSN, Phone) from being processed or leaked.

### Phase 4: Skylar Integration
- [ ] Wrap `genkitService.ts` calls with Model Armor middleware.
- [ ] Implement a "Safety Interstitial" in the frontend - handled via a specific error or status code if Model Armor blocks a request.
- [ ] Add Model Armor telemetry to `backend/services/loggingService.ts`.

### Phase 5: Verification & QA
- [ ] Create a Red-Teaming test suite using the "Dirty Dozen" payloads to verify filter effectiveness.
- [ ] Verify that the "restricted key" disclosure (from Track 129/130) is reinforced by Model Armor's policy-based access.

## 3. Progress Tracking
- [x] Track Initialized
- [x] Research Complete
- [x] Infrastructure Setup
- [x] Core Service Implemented
- [x] Integration Complete (All Skylar sub-agents and core Journey flows protected)
- [ ] QA & Red-Teaming Verified

## 4. Pending Questions
- Which specific Model Armor "Security Policy" should be the default (Standard vs Strict)?
- Do we need to support user-specific safety overrides for "Unfiltered" modes? (Probably not, given the sparkway platform context).
