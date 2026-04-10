# Track 034: Database Infrastructure - Centralized Configuration System

## Objective
Create a centralized configuration system in Firestore to manage global Skylar metadata and journey stage configurations.

## Plan
1. **Database Schema & Security (Firestore)**
   - Update `firebase-blueprint.json` to define `skylar_global` and `journey_stages` schemas.
   - Update `firestore.rules` to enforce security (read-only for authenticated users, write access for admins).
   - Deploy the updated Firestore rules.
2. **TypeScript Interfaces**
   - Define strict TypeScript interfaces for `SkylarGlobalConfig` and `JourneyStageConfig` in `src/types/config.ts`.
3. **Service Layer Implementation**
   - Create `src/services/configService.ts`.
   - Implement `getSkylarGlobalConfig()`, `getJourneyStages()`, and `getJourneyStage(stageId)` with memory caching.
   - Add proper error handling using the existing `handleFirestoreError` utility.
4. **Documentation & Tracking**
   - Update `docs/TECH_SPECS.md` with the new database collections and service specifications.
   - Update `CHANGELOG.md` upon completion.

## Status
- [x] Plan Approved
- [x] Setup Complete
- [x] Build Complete
