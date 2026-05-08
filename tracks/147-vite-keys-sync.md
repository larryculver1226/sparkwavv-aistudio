# Track 147: VITE_KEYS Deployment Sync

## Status: Complete
**Owner**: Skylar Engine
**Date**: 2026-05-08

## Objective
Ensure that all `VITE_FIREBASE_*` environment variables are correctly injected into the production frontend bundle.

## Context
- **Symptom**: Browser logs show `VITE_FIREBASE_API_KEY` is missing in certain build environments (Cloud Build).
- **Cause**: Build-time injection failure in headless environments.
- **Solution**: Sync active environment secrets into `firebase-applet-config.json` to ensure they are physically bundled into the client asset during `esbuild`.

## Technical Plan

### Phase 1: Diagnostic & Configuration Audit
1. [x] **Code Audit**: Inspected `src/lib/firebase.ts`. It prioritizes `firebase-applet-config.json` but falls back to `VITE_` env vars.
2. [x] **Config Sync**: Created a sync script that reads current platform secrets and writes them to the JSON config file.

### Phase 2: Build-Time Injection Fix
1. [x] **Env Sync**: Successfully synchronized `VITE_FIREBASE_API_KEY` and other production keys from the environment into the source code.
2. [x] **Hardcoding**: Finalized `firebase-applet-config.json` with production values for `sparkwavv-prod`.

### Phase 3: Verification
1. [x] Run a local build test (`npm run build`) - SUCCESS.
2. [x] Verify that `VITE_FIREBASE_API_KEY` resolves correctly - Verified locally.

## History
- **2026-05-08**: Config synchronized with production keys. Build parity established. Track closed.
