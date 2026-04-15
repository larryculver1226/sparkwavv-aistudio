# Track 059: Journey Stage Config Permissions Fix

## 1. Plan
- Resolve "Missing or insufficient permissions" errors when fetching `agent_configs`.
- Update `firestore.rules` to allow public read access to `agent_configs` (required for unauthenticated onboarding).
- Add a "Seed Defaults" utility to the Admin Dashboard to easily populate Firestore with default stage content.

## 2. Setup
- Review `firestore.rules` for `agent_configs`.
- Identify that `isAuthenticated()` was blocking unauthenticated users on the Dive-In page.

## 3. Build
- [x] Update `firestore.rules` to `allow read: if true;` for `agent_configs`.
- [x] Deploy updated Firestore rules.
- [x] Add `handleSeedDefaults` and "Seed Defaults" button to `src/pages/admin/AgentOps.tsx`.
- [x] Verify linting.
- [x] Update `CHANGELOG.md`.
