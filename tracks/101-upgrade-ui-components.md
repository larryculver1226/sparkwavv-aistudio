# Track 101: Upgrading UI Components with Hardcoded State

## 1. Plan
**Goal:** Assess and replace UI components relying on hardcoded state / local storage with live backend/DB implementations.

**Steps:**
1. Upgrade `OutreachTracker.tsx` to save and fetch actual `sequences` tracking history from Firestore properly instead of relying on `localStorage` "mock" logic.
2. Review `AssetSynthesizer.tsx` "versionHash" mocking.
3. Establish robust implementation that handles proper state transitions from `skylarService`.

## 2. Setup
- Completed plan. Confirmed Targets.

## 3. Build
- **Outreach Actions**: Removed `localStorage` inside `skylarService.ts` and replaced `logOutreachAction` and `getOutreachMetrics` to push and read from the `outreach_actions` Firestore collection. Adapted `OutreachTracker.tsx` to display real `actions` returned in the payload.
- **WavVault Artifacts Purge**: Replaced mock return for `purgeOldArtifacts` with native Firestore Date queries targeting records older than the config date.
- **Synthesis Artifact Rendering**: Removed static mock objects backing `AssetSynthesizer.tsx` during initial data simulation and replaced it with live outputs from `skylar.generateLiveResume` and `skylar.generateInteractivePortfolio` dynamically.
- Status: Complete.
