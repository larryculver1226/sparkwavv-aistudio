# Track 172: Fix Build Failure (Missing Directory)

## Status
- [x] Phase 1: Memory (Archeology) - Done.
- [x] Phase 2: Audit (Critique) - Done.
- [x] Phase 3: Setup (Technical Specs) - Done.
- [x] Phase 4: Build (Execution) - Done.
- [x] Phase 5: Verify (QA) - Done.

## Goal
Fix the production build error: `cp: cannot create directory 'dist/backend/prompts': No such file or directory`.

## Memory Scan Results (Archeology)
- **Track 168 (Production Prompt Parity)**: Introduced the logic to copy backend prompts into the `dist` directory but assumed the folder structure would be automatically mirrored by Vite.
- **Track 152 (Firebase Key Injection)**: Updated the build script for secret expansion but did not account for filesystem initialization.
- **Grep Audit**: `package.json` revealed that the `build` script only created `dist/public`, leaving the `backend` path orphaned.

## Audit Persona Critique
*   **The Auditor (Root Cause Analysis)**: "The shell command `cp -r backend/prompts dist/backend/` will fail if `dist/backend` hasn't been created yet. This is a classic race condition/initialization oversight that only surfaces in fresh build environments (CI/CD)."
*   **The Coder (Implementation)**: "We need an idempotent fix. `mkdir -p` ensures the path exists regardless of previous build state. We should also consolidate the build steps to prevent fragmentation."
*   **The Designer (DX)**: "A failing build is the worst UX for a developer. We need to ensure the local `npm run build` perfectly mirrors the Cloud Build environment to prevent these issues from reaching production."

## Technical Specs (Phase 3)
- **Command**: `mkdir -p dist/backend` added BEFORE the `cp` operation.
- **Consolidation**: Simplified the recursive copy to target `dist/backend/prompts` directly.

## Execution Summary (Phase 4)
- **Modified `package.json`**: Standardized the `build` script to ensure all required output directories are provisioned.
- **Verification**: Build confirmed successful in the Cloud Build simulator.
