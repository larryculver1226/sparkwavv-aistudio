# MASBV Methodology Guide

This guide defines the **Memory-Audit-Setup-Build-Verify** (MASBV) framework used to build and maintain the Sparkwavv platform.

## Why MASBV?
Previous methodologies (like PSB) failed due to:
1. **Software Amnesia**: Forgetting past bug fixes leads to regressions.
2. **Design Drift**: Implementing without questioning if the solution is "correct" for the platform's vision.
3. **Fragile State**: Neglecting state management (Firestore/Zustand) until too late in the build.

---

## The 5 Phases (Mandatory)

### 1. Phase: Memory (Archeology)
Before any code is written, you must search the project history.
- **Requirement**: Use `grep` or `list_dir` to find keywords in `/tracks`, `CHANGELOG.md`, and `docs/`.
- **Outcome**: A summary of "Found Context" (e.g., "We already fixed this permission bug in Track 089").

### 2. Phase: Audit (Critique)
Simulate an internal debate between three personas before proposing a plan.
- **Coder**: "How do we build this fast and clean?"
- **Security Auditor**: "Does this leak keys? Are Firestore rules safe? Is it vulnerable to spoofing?"
- **UX/Design Critic**: "Does this match the Dark Theme/Pro aesthetic? Is it intuitive?"
- **Outcome**: A "Risk Assessment" and "Improved Strategy".

### 3. Phase: Setup (Blueprint)
Establish the "wiring" before the "UI".
- **Requirement**: Update `docs/TECH_SPECS.md` and define the State Management (Zustand) or Data Persistence (Firestore) schema.
- **Outcome**: A technical specification ready for approval.

### 4. Phase: Build (Execution)
Perform the coding according to the approved plan.
- **Requirement**: Update `/tracks/XXX-task-name.md` and `CHANGELOG.md` concurrently.
- **Outcome**: Functional, high-fidelity code.

### 5. Phase: Verify (QA)
Ensure the fix works and hasn't broken the past.
- **Requirement**: Run `npm run qa`. Manually check the "Security Audit" points from Phase 2.
- **Outcome**: A summary of verification results.

---

## Skill Mapping (Tool Integration)

To execute MASBV effectively, the agent MUST leverage specific skills during each phase:

### 1. Phase: Memory
- **Tools**: `grep -rI`, `list_dir`.
- **Knowledge**: Scan `/tracks` and `CHANGELOG.md`.

### 2. Phase: Audit
- **Personas**:
    - **Security Auditor**: Read `/skills/system_skills/firebase-skill` (Permissions/Zero Trust) and `/skills/system_skills/oauth` (Secure Flows).
    - **UX/Design Critic**: Read `/skills/system_skills/design_guidelines` (Aesthetic Recipes) and `/skills/system_skills/shadcn` (Component library).
    - **Technical Lead**: Read `/skills/system_skills/gemini_api` (LLM Orchestration) and `/skills/system_skills/realtime_guidelines` (WebSocket/State).

### 3. Phase: Setup & Build
- **State**: Use `Zustand` (UI) and `Firestore` (Persistence).
- **Components**: Follow `/skills/system_skills/shadcn`.
- **API**: Follow `/skills/system_skills/gemini_api` for all AI-powered features.

---

## Global Invariants (Never Break These)
1. **Dark Theme Only**: No white backgrounds unless explicitly requested.
2. **No Mock Data**: Always connect to Firestore or use Genkit tools.
3. **Sanitized Mode**: If API keys are missing, the app MUST enter "Degraded Mode" (Safe stubs) instead of crashing.
4. **Logic Isolation**: Keep AI logic in `backend/services/` and UI in `src/`.
