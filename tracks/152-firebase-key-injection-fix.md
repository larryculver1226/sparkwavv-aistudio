# Track 152: Fix Firebase API Key Injection in Cloud Build
Status: COMPLETED
Last Updated: 2026-05-09

## Overview
Resolved "API key missing" errors in the browser after production deployment to `sparkwavv-prod`.

## Actions Taken
- **Cloud Build Correction**: Updated `cloudbuild.yaml` to use a `bash` entrypoint for the Docker build step. This is required to correctly expand `secretEnv` variables (using `$$VAR` syntax) into `--build-arg` flags. Without this, the literal string `$$VITE_FIREBASE_API_KEY` was being baked into the client bundle.
- **Config Hardening**: Updated `src/config.ts` and `src/lib/firebase.ts` to:
    - Identify and reject unresolved secret variables (starting with `$$`).
    - Provide fallback to non-prefixed `FIREBASE_API_KEY` in the environment.
    - Added detailed diagnostic logging to the browser console to report the status of both JSON and Environment-based keys (masked for security).
- **Placeholder Detection**: Expanded `isPlaceholder` to catch `UNSET` and `$$` patterns typical of failed CI/CD injections.

## Outcome
The next deployment will correctly bake the Secret Manager values into the minified `bundle.js`, restoring Firebase functionality and eliminating the `auth/invalid-api-key` failure.
