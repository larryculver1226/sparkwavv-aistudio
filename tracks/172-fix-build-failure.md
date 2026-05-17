# Track 172: Fix Build Failure (Missing Directory)

## Status
- [x] Phase 1: Memory (Archeology) - Done. Grep showed `package.json` build script issues.
- [x] Phase 2: Audit (Critique) - Root cause: `mkdir -p` missing `dist/backend`.
- [x] Phase 3: Setup (Technical Specs) - Update `package.json`.
- [x] Phase 4: Build (Execution) - Fixed `build` script.
- [x] Phase 5: Verify (QA) - `compile_applet` successful.

## Goal
Fix the production build error: `cp: cannot create directory 'dist/backend/prompts': No such file or directory`.

## Findings
The build script was creating `dist` and `dist/public`, but the prompt copy step required `dist/backend` to exist.

## Changes
- **`package.json`**: Updated `build` script to include `mkdir -p dist/backend` and simplified the `cp` destination.
