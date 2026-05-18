# Track 175: Deployment Infrastructure Audit

## Status
- [x] Phase 1: Memory (Archeology) - Done.
- [x] Phase 2: Audit (Critique) - Done. Identified legacy GCR usage and build-time secret leaks.
- [x] Phase 3: Setup (Technical Specs) - Done.
- [x] Phase 4: Build (Execution) - Done.
- [x] Phase 5: Verify (QA) - Done.

## Goal
Modernize the deployment pipeline by migrating to Artifact Registry, optimizing Docker cache layering, and hardening secret management.

## Memory Scan Results (Archeology)
- **Track 152 (Firebase Key Injection Fix)**: Identified that `bash` entrypoints are required in `cloudbuild.yaml` to expand `$$VAR` syntax. However, it still baked secrets into the image layers.
- **Track 165 (Deployment Hardening)**: Hardcoded the `us-east1` region but missed the migration to Artifact Registry, leaving us on the deprecated GCR service.
- **Track 153 (Fix Dev/Prod Alignment)**: Standardized service naming but maintained inefficient Docker layering, leading to 4-5 minute build times instead of <2 minutes.

## Audit Persona Critique
*   **The Architect (Scalability/Registry)**: "Moving to Artifact Registry is no longer optional. GCR is effectively in maintenance mode. We need proper versioning and cleanup policies to manage image bloat."
*   **The Security Auditor (Identity/Secrets)**: "Baking `SESSION_SECRET` into a Docker image layer is a critical vulnerability. Anyone with pull access to the registry can `docker history` and find the keys. We must move to runtime injection exclusively."
*   **The DevOps Engineer (Performance)**: "Our current `COPY . .` placement is killing our build velocity. Every time a single JS file changes, we re-run `npm install`. We need to pull the package lock into a separate layer."

## Technical Specs (Phase 3)
### 1. Registry Migration
- Target: `us-east1-docker.pkg.dev/$PROJECT_ID/sparkwavv/app`
- Update `cloudbuild.yaml` deploy and push steps.

### 2. Dockerfile Layering
```dockerfile
# Optimal pattern
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
```

### 3. Secret Hardening
- Remove `GEMINI_API_KEY` and `SESSION_SECRET` from `Dockerfile`.
- Ensure they are exclusively provided via `--set-secrets` in `cloudbuild.yaml` (runtime injection).

### 4. Build Performance
- Enable `DOCKER_BUILDKIT=1`.
- Use `--cache-to` and `--cache-from` if using standalone builders.

## Execution Summary (Phase 4)
- **Artifact Registry**: Migrated all registry references to `us-east1-docker.pkg.dev`.
- **Secret Separation**: Removed server-side secrets (`GEMINI_API_KEY`, `SESSION_SECRET`) from the Docker image layers. They are now injected solely at runtime via Cloud Run's secret volume mounts.
- **Cache Optimization**: Reordered `Dockerfile` instructions to prevent unnecessary re-installs on code changes.
- **BuildKit**: Enabled `DOCKER_BUILDKIT=1` in `cloudbuild.yaml` for faster, more parallelized builds.

## Approval
- [ ] User approved migration to Artifact Registry and Secret hardening.
