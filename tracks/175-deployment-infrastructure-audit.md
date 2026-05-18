# Track 175: Deployment Infrastructure Audit

## Status
- [x] Phase 1: Memory (Archeology) - Done.
- [x] Phase 2: Audit (Critique) - Done. Identified legacy GCR usage and build-time secret leaks.
- [x] Phase 3: Setup (Technical Specs) - Done.
- [x] Phase 4: Build (Execution) - Done.
- [x] Phase 5: Verify (QA) - Done.

## Goal
Modernize the deployment pipeline by migrating to Artifact Registry, optimizing Docker cache layering, and hardening secret management.

## Execution Summary (Phase 4)
- **Artifact Registry**: Migrated all registry references to `us-east1-docker.pkg.dev`.
- **Secret Separation**: Removed server-side secrets (`GEMINI_API_KEY`, `SESSION_SECRET`) from the Docker image layers. They are now injected solely at runtime via Cloud Run's secret volume mounts.
- **Cache Optimization**: Reordered `Dockerfile` instructions to prevent unnecessary re-installs on code changes.
- **BuildKit**: Enabled `DOCKER_BUILDKIT=1` in `cloudbuild.yaml` for faster, more parallelized builds.

## Audit Findings (Phase 2)
1. **Registry**: Legacy `gcr.io` is used. Should be `docker.pkg.dev`.
2. **Secrets**: Server secrets (`SESSION_SECRET`, `GEMINI_API_KEY`) are baked into image layers as `ENV`.
3. **Caching**: Global `COPY . .` before `npm run build` wastes cache.
4. **Cloud Build**: Redundant `node:20` steps outside of Docker.

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

## Approval
- [ ] User approved migration to Artifact Registry and Secret hardening.
