# Track 127: Security Audit for Service Account Private Keys

**Status**: Planning
**Date**: 2026-05-05
**Objective**: Assess the project environment for possible accidental exposure of Service Account private keys (JSON and `.p12` files). Identify and develop a mitigation plan to ensure defense in depth.

## 1. Audit Findings
- **.gitignore Permissiveness**: The project correctly ignores `.env*`, but misses specific patterns used for Google Cloud / Firebase service account keys. This could lead to a developer accidentally committing downloaded service accounts.
- **Private Key Logging Snippets (`server.ts`)**: The Firebase Admin initialization in `server.ts` calculates and logs a string snippet of the loaded `FIREBASE_PRIVATE_KEY` (first and last 30 characters). This exposes parts of the raw key in system logs.
- **Client-Side Build Exposures**: `esbuild-config.mjs` injects any environment variable beginning with `VITE_` into the client-side bundle. If a developer accidentally adds `VITE_FIREBASE_PRIVATE_KEY` or `VITE_FIREBASE_SERVICE_ACCOUNT_JSON` to their `.env`, esbuild will bundle the secret.
- **No Direct Exposures Detected**: Full scans of `dist/public/bundle.js` verify that currently, no inline value of `FIREBASE_PRIVATE_KEY` escapes to the client (only reference string names used conditionally).

## 2. Technical Mitigation Plan (Defense in Depth)
1. **Update `.gitignore`**:
    - Add explicit exclusions for `*firebase-adminsdk*.json`, `*service-account*.json`, `*credentials*.json`, `*.p12`, `*.pem`, to create a hard protection layer against committing standard downloaded keys.
2. **Scrub `server.ts` Logging**:
    - Remove lines exposing the `keySnippet` parameter calculation.
    - Rewrite the `console.log` for Firebase initialization to print a generic success message without outputting the raw string.
3. **Build Script Filtration (`scripts/esbuild-config.mjs`)**:
    - Add a `blacklist Regex` in the esbuild config mapped to filter out `VITE_` variables containing the words: `PRIVATE`, `KEY`, `CREDENTIAL`, or `SECRET`. This guarantees protection even if developers misformat `.env`.
4. **Verification**: 
    - Ensure `compile_applet` runs successfully.

## 3. Progress
- [x] Track Initialized
- [x] Environment Assessed & Audit Performed
- [x] Plan approved by user
- [x] `.gitignore` updated explicitly limiting sensitive files
- [x] Removed raw key snippets from `server.ts` logs
- [x] Hardened esbuild filter
- [x] Verification complete
