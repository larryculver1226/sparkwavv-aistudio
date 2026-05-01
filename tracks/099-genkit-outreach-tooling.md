# Track 099: Genkit Migration - Outreach & Tooling

## 1. Plan

**Goal**: Complete the final migration of Sparkwavv Journey phases to Genkit architectures, specifically migrating "Outreach algorithms" and expanding the toolbox.

**Scope:**
1. **Ignition Tool Insertion**: Define the `update_pie_of_life` Genkit tool and include it in the allowed `skylarTools` / Genkit orchestration array.
2. **Outreach Migration**: Migrate the remaining algorithm functions in `skylarService.ts` to backend Genkit flows:
   - `generateTargetedSequence`
   - `generateInteractivePortfolio`
   - `analyzeEmotionalState`
   - Review Resume / Extract Artifacts if remaining
3. **API Endpoints**: Expose new endpoints in `server.ts` to route these requests to the backend.
4. **Client-side Wiring**: Update `skylarService.ts` to call these new endpoints using `fetch`.

## 2. Setup
*(Pending user approval of the plan)*

## 3. Build

- **Status**: Completed.
- **Implementations**:
  - Expanded Genkit flows (`backend/services/genkitService.ts`) to include the heavily programmatic features: `generateTargetedSequenceFlow`, `generateInteractivePortfolioFlow`, `getEmotionalIntelligenceFlow`, and `getResonanceFeedbackFlow` and `performGateReviewFlow`.
  - Expanded the tool architecture: Created `updatePieOfLifeTool` and successfully injected it directly into the `sendInterviewResponseFlow`. This allows Skylar to seamlessly and autonomously save exercises while interviewing users over their artifacts.
  - Linked all operations securely back through `server.ts` enforcing RBAC (`[ROLES.USER, ROLES.ADMIN]`).
  - Rewrote the frontend `skylarService.ts` to utilize standard `fetch('/api/skylar/...', { body: ... })` eliminating the final traces of disjointed client side model polling.
- **Testing**:
  - Ran compiler and linter. Verified `skylarService.ts` changes aligned symmetrically to the newly provisioned Express endpoints in `server.ts` and `genkitService.ts`. All `genkitService.ts` logic incorporates the safe Genkit Vertex AI Cloud inference failovers when the `GEMINI_API_KEY` is not present globally.
