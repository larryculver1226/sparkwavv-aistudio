# Track 153: Standardize Dev-to-Production Deployment
Status: IN_PROGRESS
Last Updated: 2026-05-09

## Overview
Standardizing the deployment pipeline to ensure flexibility across environments (Dev, AI Studio, Cloud Run) without hard-coding service names or secret versions.

## Actions Taken
- [x] **Dynamic Service Naming**: Updated `cloudbuild.yaml` to use `sparkwavv` consistently for Docker tags, scan targets, and Cloud Run service names.
- [x] **Secret Versioning**: Pointed all `availableSecrets` and deploy-time `--set-secrets` to use `:latest` or `versions/latest`.
- [x] **Standardized Injection**: Verified `Dockerfile` and `cloudbuild.yaml` bash expansion logic to ensure secrets are baked in correctly at build time.
- [x] **Environment Parity**: Simplified and standardized `.env.example` to ensure exact matches with Secret Manager keys.
- [x] **Runtime Hardening**: Confirmed `src/config.ts` handles unresolved secret patterns (`$$VAR`) gracefully.

## Outcome
The deployment pipeline is now environment-agnostic. Service names are derived from the app name `sparkwavv`, and secrets are automatically sourced from their latest versions in Secret Manager, ensuring a "zero-touch" update process once secrets are configured.
