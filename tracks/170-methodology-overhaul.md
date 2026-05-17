# Track 170: Methodology Overhaul (MASBV Framework)

## Status
- [ ] Phase 1: Memory (Archeology) - **IN PROGRESS**
- [ ] Phase 2: Audit (Design Critique) - **PENDING APPROVAL**
- [ ] Phase 3: Setup (Technical Specs) - **PENDING APPROVAL**
- [ ] Phase 4: Build (Execution) - **PENDING APPROVAL**
- [ ] Phase 5: Verify (QA) - **PENDING APPROVAL**

## Goal
Replace the inadequate "Plan, Setup, Build" (PSB) methodology with the **"Memory-Audit-Setup-Build-Verify" (MASBV)** framework to resolve recurring bugs, amnesia, and design drift.

## Memory Scan Results (Archeology)
- **Recurring Issue: Firestore Permissions**. Seen in tracks 006, 040, 041, 059, 105, 146, 148, 149, 150. Cause: Incremental features forgetting to update `firestore.rules`.
- **Recurring Issue: Gemini API Keys/Headers**. Seen in tracks 126, 129, 154, 156, 158, 167. Cause: CORS/Referrer blocks and server-side vs browser-side key leakage.
- **Recurring Issue: Model Deprecation**. Seen in tracks 030, 060, 062, 092, 097, 102, 143. Cause: Using fixed model names that go EOL.

## Audit Persona Critique (DRAFT)
*   **Architect**: "The transition to MASBV must be backwards compatible with existing tracks. We shouldn't rename old tracks, but we MUST re-index them."
*   **Security Auditor**: "Phase 1 (Memory) must check `firestore.rules` specifically before any write-heavy task."
*   **UX Designer**: "The agent's communication style must remain concise but transparent about its 'critique' findings."

## Implementation Plan
1. **REVISE `AGENTS.md`**: Overhaul the core rules.
2. **CREATE `docs/PERSISTENCE_GUIDE.md`**: Document the 'State of the App' to prevent amnesia.
3. **UPDATE `docs/TECH_SPECS.md`**: Add the MASBV process definitions.
4. **UPDATE `CHANGELOG.md`**.
