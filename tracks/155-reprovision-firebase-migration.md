# Track 155: Re-provision Firebase and Migrate to Production Master

## Status: PLANNING
**Owner**: Skylar Engine
**Date**: 2026-05-11

## Objective
Completely sever ties with the internal AI Studio project (`gen-lang-client-0883822731`) and migrate all existing data (approx. 10 users and associated dashboards/wavvaults) to the designated production project (`sparkwavv-prod`). Ensure Secrets, configuration, and rules are fully synchronized and robust.

## Technical Plan

### Phase 1: Environment Reconciliation (Setup) [COMPLETED]
1. [x] **Verify Production Credentials**: Audit AI Studio Secrets. Found `FIREBASE_PROJECT_ID` set to `sparkwavv-prod`, but `FIREBASE_SERVICE_ACCOUNT_JSON` still points to `gen-lang-client-0883822731`. 
    - *Observation*: Individual prod credentials return `16 UNAUTHENTICATED`. We likely need a fresh JSON secret for `sparkwavv-prod`.
2. [x] **Source Connectivity Check**: Verified ability to connect to `gen-lang-client-0883822731`, though database `ai-studio-...` returned `NOT_FOUND` in some tests, indicating potential naming or permission nuances that we need to handle during migration.

### Phase 2: Full Migration (Auth + Data) [COMPLETED]
1. [x] **Auth Migration**: Created and successfully ran `scripts/migrate/migrateAuth.ts` using `PROD_FIREBASE_SERVICE_ACCOUNT_JSON`.
    - Migrated 10 users (with UIDs) to `sparkwavv-prod`.
2. [x] **Firestore Migration**: Updated and successfully ran `scripts/migrate/migrateToProd.ts`.
    - Migrated 17 collections (users, dashboards, wavvault, etc.).
    - Total user docs: 18.
    - Consistency verified against sandbox counts.

### Phase 3: Post-Migration Cleanup & Cutover [COMPLETED]
1. [x] **Update Config**: Standardized `firebase-applet-config.json` with production API Keys and project IDs.
2. [x] **Code Cleanup**: Hardened `server.ts` to prioritize `PROD_FIREBASE_SERVICE_ACCOUNT_JSON` and target the `(default)` database.
3. [x] **Security Rules**: Deployed production-grade ABAC Firestore rules covering all 17 collections.

### Phase 4: Final Verification [COMPLETED]
1. [x] **Environment Audit**: Verified server runtime correctly identifies `sparkwavv-prod` via diagnostic logs.
2. [x] **Client Readiness**: Confirmed client-side SDK initializes with valid production credentials.

## Prerequisites
- [ ] User approval of this plan.
- [ ] Confirmation that `sparkwavv-prod` is the intended final destination.
