# Track 055: Automated Vertex AI Configuration

## Objective
Develop a system to automatically discover, verify, and suggest configurations for Vertex AI environment variables using the provided Service Account.

## Plan

### Phase 1: Discovery Script (`scripts/vertex-discovery.ts`)
- **Credential Loading**: Use `FIREBASE_SERVICE_ACCOUNT_JSON` to authenticate.
- **Resource Scanning**:
    - **Search Engines**: List Discovery Engine apps to find `VERTEX_AI_SEARCH_ENGINE_ID`.
    - **Data Stores**: List data stores to find `VERTEX_AI_SEARCH_DATA_STORE_ID`.
    - **Endpoints**: List Vertex AI endpoints to find `VERTEX_AI_LOBKOWICZ_ENDPOINT_ID`, etc.
    - **Storage**: List buckets to identify a suitable `VERTEX_AI_FINE_TUNING_BUCKET`.
- **Mapping Logic**: Implement heuristic matching (e.g., matching project ID or specific naming conventions like "wavvault-search").

### Phase 2: Verification Service
- **Connectivity Checks**: Implement a `verify()` method in `VertexService` that performs a minimal "ping" for each service.
- **Permission Audit**: Identify if the Service Account lacks specific roles (e.g., `discoveryengine.viewer`, `aiplatform.user`).

### Phase 3: Admin Dashboard Integration
- **Auto-Discovery UI**: Add a "Scan for Resources" button to the `SystemStatusPanel`.
- **Configuration Wizard**: Display discovered values and allow the admin to "Verify & Save" (generating a block for the user to copy into AI Studio Settings).

### Phase 4: Automated Provisioning (Safe Mode)
- **Bucket Creation**: If no suitable bucket exists, offer to create one using the Storage SDK.
- **Search Engine Guidance**: Since Search Engines require manual data ingestion setup, provide deep links to the GCP Console with pre-filled parameters.

## Status
- [x] Discovery Script
- [x] Verification Service
- [x] Admin UI Integration
- [x] Mobile/Desktop UI Sync
- [ ] Automated Provisioning

## Details
- Implemented `VertexDiscoveryService.ts` to scan for Search Engines, Data Stores, Vertex Endpoints, and GCS Buckets using the provided Service Account.
- Added `/api/admin/vertex/discover` endpoint to `server.ts`.
- Integrated "Scan for Resources" button and "Discovery Report" UI into `SystemStatusPanel.tsx`.
- **UI Fix**: Synchronized the mobile and desktop sidebars in `AdminDashboard.tsx` to ensure the "System Status" tab is visible across all device sizes.
- Verified fixes with successful lint and build.
