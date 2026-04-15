# Track 051: Finalize Firebase and Vertex AI Configuration

## Objective
Complete the technical setup for Firebase and Vertex AI to enable full enterprise intelligence capabilities (Search, Fine-tuned models, MedLM).

## Plan
1. **Audit & Documentation**:
   - Review all environment variables in `.env.example`.
   - Update `docs/TECH_SPECS.md` with a comprehensive "Configuration Guide".
2. **Enhanced Service Initialization**:
   - Update `src/services/vertexService.ts` to support initialization via `FIREBASE_SERVICE_ACCOUNT_JSON`.
   - Add validation logic to ensure all required IDs (Project, Engine, Data Store) are present before attempting calls.
3. **Admin Configuration Dashboard**:
   - Add a "System Status" tab to the Admin Dashboard.
   - Display connection status for Firebase, Gemini, and Vertex AI.
   - Provide clear instructions for the user to provide missing keys via AI Studio settings.
4. **Backend Hardening**:
   - Ensure `server.ts` correctly propagates credentials to all Google Cloud clients.

## Status
- [x] Plan Approved
- [x] Setup Complete
- [x] Build Complete

## Details
- Updated `docs/TECH_SPECS.md` with a comprehensive Configuration Guide for Firebase and Vertex AI.
- Enhanced `src/services/vertexService.ts` to support initialization via `FIREBASE_SERVICE_ACCOUNT_JSON`.
- Added a new **"System Status"** tab to the Admin Dashboard for real-time monitoring of infrastructure health.
- Implemented the `/api/admin/system-status` backend endpoint to provide detailed configuration metrics.
- Created the `SystemStatusPanel` component to display connectivity status and configuration requirements.
