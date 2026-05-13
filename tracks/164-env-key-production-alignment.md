# Track 164: Environment Key Production Alignment

## Overview
Address the critical failure of Firebase initialization in production (`sparkwavv-prod`) due to missing `VITE_FIREBASE_API_KEY`. Align development (AI Studio) and production environmental configurations to ensure stability across deployments.

## Tasks
1. [ ] **Audit Environment Configuration**:
    - [ ] Verify `src/config.ts` and `src/lib/firebase.ts` logic for environment variable resolution.
    - [ ] Identify why `firebase-applet-config.json` keys might be ignored or failing validation in production builds.
2. [ ] **Robust Key Resolution**:
    - [ ] Update `getEnvVar` in `src/config.ts` to provide better diagnostic logging when a key is considered "invalid".
    - [ ] Ensure that `VITE_` variables are correctly prioritized and documented.
3. [ ] **Production Deployment Alignment**:
    - [ ] Synchronize `.env.example` with the minimal set of keys required for both dev and prod.
    - [ ] Update `docs/TECH_SPECS.md` with explicit instructions for API Key management in AI Studio Secrets Vault vs CI/CD (Cloud Build).
4. [ ] **Verification**:
    - [ ] Run linter and verify that `isFirebaseConfigured` returns true when valid keys are provided.
    - [ ] Test the "Degraded Mode" UI if keys are missing to ensure user-friendly error reporting.

## Technical Details
- **Files Affected**: `src/config.ts`, `src/lib/firebase.ts`, `.env.example`, `docs/TECH_SPECS.md`.
- **Primary Error**: `FirebaseError: Firebase: Error (auth/invalid-api-key)`.
- **Target Env**: Production (`sparkwavv-prod`).
