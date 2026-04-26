# Track 072: Sparkwavv to Production

**Status**: In Progress
**Date**: 2026-04-26
**Objective**: Develop a comprehensive step-by-step plan and execute the migration of the Sparkwavv project from the AI Studio development environment to a production environment (Google Cloud Run + GitHub).

## 1. Specification & Strategy

The project is currently a full-stack Node.js + React/Vite application managed inside AI Studio's sandbox. The backend code uses `server.ts` compiled using esbuild, and runs an Express server serving both APIs and static Vite assets. 

To take this fully into production, we must map our current dev infrastructure to production-grade services on Google Cloud Platform (GCP).

### Core Components Migrating:
1. **Source Control**: GitHub (already connected, needs synchronization).
2. **Hosting/Compute**: Google Cloud Run (Serverless container orchestration).
3. **Continuous Deployment (CI/CD)**: Cloud Build (Optional, but recommended) linked to GitHub to automatically deploy on pushes.
4. **Environment Secrets**: Migrating `.env` values (Vertex AI, Firebase Admin JSON, Gemini API keys, SendGrid) to Google Cloud Secret Manager.

## 2. Technical Plan (Step-by-Step)

### Phase 1: Codebase Preparation & Verification
1. Ensure the `package.json` build and start scripts are fully optimized for standard Node.js environments.
   * *Status*: `build` already uses `esbuild` and `vite build`. `start` points to `node dist/server.js`. Looks good.
2. Ensure Firebase/Vertex AI paths gracefully handle missing local files and rely entirely on Environment Variables in production.
3. Validate that `gcloud` ignores redundant files (create/verify `.gcloudignore`).

### Phase 2: GitHub Synchronization
1. Make sure all final changes are committed and pushed to the `main` branch of the linked GitHub repository.
2. Confirm the repository has the correct structure (especially `package.json` at the root).

### Phase 3: Google Cloud Run Deployment
Since you couldn't see the "Deploy to Cloud Run" option in the UI, we can bypass the UI and deploy it directly using the underlying CLI, or provide you with the exact console steps.

**Option A: Direct CLI Deployment**
1. We will use `gcloud run deploy sparkwavv-prod --source . --region us-east1 --allow-unauthenticated` directly in the terminal, which uses Google Cloud Buildpacks to automatically containerize the Node.js app.
2. Pass environment variables using the `--set-secrets` or `--set-env-vars` flags during deployment.

**Option B: GitHub Integration (Continuous Deployment)**
1. In the Google Cloud Console, navigate to **Cloud Run**.
2. Click **Create Service**.
3. Select **Continuously deploy new revisions from a source repository**.
4. Link your GitHub account and select the Sparkwavv repository.
5. Set Build Type to **Buildpacks** or **Dockerfile** (we will create a `Dockerfile` to make it bulletproof).
6. Configure the Environment Variables and Secrets in the Cloud Run UI.

### Phase 4: Post-Deployment Configuration
1. Update Firebase Authorized Domains to include the new Cloud Run `.run.app` URL.
2. Update any OAuth or integration redirect URIs.
3. Validate Vertex AI & Storage Integrations in the deployed environment.

---

## 3. Immediate Next Steps / Actions for You

I have updated the codebase for an automated Cloud Run build with Docker:
1. Created the **`Dockerfile`** specifically optimized for this split Vite + Express application, and added the necessary `make` and `python3` packages to compile native extensions like `better-sqlite3`.
2. Updated **`server.ts`** to respect `process.env.PORT` which is what Google Cloud Run passes automatically to correctly route traffic.

**Action Required from You:**

1. **Commit and Push to GitHub (in AI Studio)**: 
   Because you are working inside AI Studio, you do not have a local terminal. To push these new files (`Dockerfile`, `.dockerignore`, `server.ts`) to GitHub:
   - Click the **GitHub** button in the AI Studio interface (usually located at the top or in your settings/deploy menu).
   - Follow the prompts to commit and push these latest changes to your repository's `main` branch.

2. **Deploy on Google Cloud (in the Google Cloud Console)**:
   - Go to your web browser and open the [Google Cloud Console: Cloud Run](https://console.cloud.google.com/run). 
   - Click **Create Service**.
   - Select **"Continuously deploy new revisions from a source repository"** and click **Set Up With Cloud Build**.
   - Authenticate with GitHub, select your Sparkwavv repository, and set the branch to `main`.
   - In Build Configuration, choose **Dockerfile** (the root `/Dockerfile`).
   - Leave Authentication as **"Allow unauthenticated invocations"** (so users can actually load the website).
   - Click **Create** / **Save**.

3. **Configure Environment Variables (in the Google Cloud Console)**:
   - Under your new Cloud Run service settings, find the **"Containers" -> "Environment Variables"** (or just "Variables & Secrets") tab.
   - Copy over all sensitive variables from your AI Studio `.env` configuration, specifically:
     - `FIREBASE_SERVICE_ACCOUNT_JSON`
     - `GEMINI_API_KEY`
     - `SENDGRID_API_KEY`
   - Save and deploy the new revision.

Once you've done this, anytime you push to `main` via AI Studio's GitHub integration, Google Cloud Build will automatically build and deploy the newest version of Sparkwavv! 

Say "Deployed" or "Done" once this is complete, and we will finish up the deployment validation and close out Track 072!
