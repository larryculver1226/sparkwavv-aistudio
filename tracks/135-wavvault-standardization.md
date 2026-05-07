# Track 135: Wavvault Standardization & Schema Alignment

## Overview
This track fixes the "Wavvault" pluralization inconsistency and ensures the `User` and `Wavvault` schemas are fully aligned across TypeScript types, the `firebase-blueprint.json` database manifest, and Firestore.

## Status
- [ ] **Renavigation**: Standardize all collection names to `wavvault` (singular).
- [ ] **Schema Alignment - User**: Sync `src/types/user.ts` and `firebase-blueprint.json` with production fields from `firestore.rules`.
- [ ] **Schema Alignment - Wavvault**: Sync `firebase-blueprint.json` with the full schema defined in `src/types/wavvault.ts`.
- [ ] **Verification**: Ensure all backend services point to the singular collection and all types are exhaustive.

## Implementation Plan

### 1. Fix Pluralization Inconsistency
- [ ] Update `backend/services/genkitService.ts`: Replace all `db.collection('wavvaults')` with `db.collection('wavvault')`.
- [ ] Update `server.ts`: Replace `db.collection('wavvaults')` with `db.collection('wavvault')` at line 4613.

### 2. Align User Schema
- [ ] Update `src/types/user.ts`:
    - Add `sparkwavvId`, `firstName`, `lastName`, `companyOrg`, `phone`, `programTrack`, `lifecycleStage`, `outcomesAttributes`, `feedbackQuote`.
    - Add `userData`, `currentStep`, `summary`, `emailVerified`.
    - Ensure all fields in `firestore.rules` (isValidUser) are represented.
- [ ] Update `firebase-blueprint.json`:
    - Add missing properties from `UserProfile` type and `firestore.rules`.

### 3. Align Wavvault Schema
- [ ] Update `firebase-blueprint.json`:
    - Expand the `Wavvault` entity properties to include `effortTier`, `energyManagement`, `rppPartners`, `twentyOneQuestions`, `perfectDay`, `prioritizationRankings`, `pieOfLife`, `extinguishers`, `accomplishmentLedger`, `fiveStories`, `attributeAssignments`, `bestSelfProfile`, `futureVision`, `productivityPlan`, `careerPersona`, `brandIdentity`, `credentialAnalysis`, `matchedOpportunities`, `interviewSessions`.

### 4. Verification
- [ ] Run `npm run lint` and `npm run build` to ensure no breaks.
- [ ] Verify `firestore.rules` still accommodates all fields.
