# Track 149: Urgent Firestore Permission Fix

## Status: Planning
**Owner**: Skylar Engine
**Date**: 2026-05-08

## Objective
Fix the "Missing or insufficient permissions" error for public bootstrap data in the production environment.

## Context
- **Symptom**: Unauthenticated frontend users cannot read Skylar configuration.
- **Paths**: `metadata/skylar_global`, `journeyPhaseConfigs/dive-in`.
- **Current Rules**: Public read is granted at the top level of `firestore.rules`.
- **Theory**: The ruleset might be invalid or conflicting in a way that defaults to deny for unauthenticated requests, or the deployment didn't propagate to the correct database instance.

## Technical Plan

### Phase 1: Rule Simplification & Diagnostic
1. [ ] **Rule Isolation**: Move public bootstrap rules to the VERY top of the match block.
2. [ ] **Verbosity**: Ensure `allow read: if true;` is explicit for each document level.
3. [ ] **Redundancy Cleanup**: Remove duplicate connectivity test matches.

### Phase 2: Deployment & Verification
1. [ ] Run `deploy_firebase`.
2. [ ] Verify connectivity via a frontend probe in the next step.
