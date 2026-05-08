# Track 145: Database Migration to sparkwavv-prod

## Status: Complete
**Owner**: Skylar Engine
**Date**: 2026-05-08

## Objective
Consolidate all Sparkwavv application data into the `sparkwavv-prod` project, which is currently mapped to the production domain `sparkwavv.ai`. This migration ensures project parity and prevents data loss during the transition from the AI Studio sandbox to the final production environment.

## Context
- **Source**: `gen-lang-client-0883822731` (Internal AI Studio Project)
- **Destination**: `sparkwavv-prod` (Master Project)
- **Current State**: Data successfully migrated and configuration updated to production master.

## Technical Plan

### Phase 1: Environment Stabilization
1. [x] **Explicit Config**: Update `server.ts` to strictly enforce `sparkwavv-prod` as the project ID.
2. [x] **Connectivity Audit**: Update startup diagnostics for project mismatch detection.

### Phase 2: Data Transfer Orchestration
1. [x] **Migration Script**: Created export/import scripts to handle cross-project authentication.
2. [x] **Execution**: Successfully transferred data from sandbox collections to `sparkwavv-prod`.
3. [x] **Config Update**: Pointed `firebase-applet-config.json` to production.

### Phase 3: Manual Verification Gate
1. [ ] User confirms collections are visible in `sparkwavv-prod` console.
2. [x] Transition implementation complete.

## Manual Steps performed
- [x] Service Account JSON added to AI Studio Secrets.
- [x] Firestore enabled on destination.
- [x] Data transfer completed via automated scripts.

## History
- **2026-05-08**: Migration complete. 18 users, 17 dashboards, and associated activities/wavvault records moved to production.
