# Track 165: Deployment Hardening & Build-Arg Integration

## Overview
Resolve deployment failures in Google Cloud Build by correctly injecting build-time secrets and fixing a file system error in the `npm run build` command. Standardize the deployment region to `us-east1`.

## Objectives
- [x] **Build Secret Injection**: Update `Dockerfile` and `cloudbuild.yaml` to support `GEMINI_API_KEY` and `SESSION_SECRET` as build arguments.
- [x] **Production Region Hardening**: Hardcode the deployment region to `us-east1` in `cloudbuild.yaml`.
- [x] **Build Script Resilience**: Fix the `cp` error in `package.json` build command by ensuring the destination directory structure is robustly handled.

## Proposed Changes

### Dockerfile
- Add `ARG` and `ENV` for `GEMINI_API_KEY` and `SESSION_SECRET` after the base layer.

### cloudbuild.yaml
- Update the `docker build` step to include `--build-arg` for the new secrets.
- Double-check that `--region us-east1` is consistently used in the `gcloud run deploy` step.

### package.json
- Refactor the `build` script to ensure `dist/` is created at the very beginning.
- Change `cp firebase-applet-config.json dist/` to a more explicit path if needed, though simply ensuring `dist` exists should fix it.

## Verification Plan

### Manual Verification
- Run `npm run check-env` locally to ensure it still passes (with dummy vars if needed).
- Run `npm run build` locally to verify the fix for the `cp` command.

### Automated Verification
- `npm run qa` (Lint & Formatter).
- `npm run lint` (TypeScript).
