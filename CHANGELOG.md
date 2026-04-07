# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
### Added
- **Track 017**: Skylar Ignition Subagent (Added structured data models for Pie of Life and Perfect Day, updated Skylar prompt and tools for the Ignition phase).
- **Track 016**: In-App Agent Orchestration (Code-First Custom Agent Orchestrator using Gemini Function Calling).
- **Track 015**: GCS Upload 404 Error (Mocked GCS upload if the bucket does not exist for prototype purposes).
- **Track 014**: GCS Authentication Error with Synthetic Vertex AI Data (Fixed bucket creation permission issue during upload).
- **Track 013**: Skylar Agent Builder - Ignition Phase (Placed on hold).
- **Track 012**: Skylar Agent Builder - Dive-In Phase (Designed Google AI Agent Builder configuration for the initial onboarding phase).
- **Track 011**: Dashboard ID Generation Fix (Fixed missing sparkwavvId for self-registered users, added self-healing).
- **Track 010**: Identity Platform Names Fix (Fixed UID overwriting display name, added Dashboard ID to table).
- **Track 009**: User Dashboard Improvements (Dynamic Progress Calculation, Interactive Activity Feed, Dedicated History View).
- **Track 008**: User Dashboard Enhancements (UX Consistency, Progress Reflection, User Actions Required, Wavvault Enhancements).
- **Track 007**: Wavvault Journey Analysis.
- **Track 006**: Fixed Firestore permission denied errors.
- **Track 005**: Dashboard UX Upgrades.
- Automated tooling setup (Vitest, Playwright, Prettier, Gemini CLI).
- AGENTS.md to enforce "Plan, Setup, Build" workflow.
- TECH_SPECS.md for technical documentation.
- Standardized track templates in `/tracks`.
- `npm run qa`, `npm run format`, `npm run test`, and `npm run generate` scripts.

### Fixed
- Fixed GCS upload 404 error by mocking the upload process when the Firebase Storage bucket is not provisioned.
- Fixed GCS upload permission denied error in `vertexService.ts` by removing bucket creation checks and directly saving the file.
- Fixed `NavBar.test.tsx` to correctly assert the `navigate('/login')` call instead of the `onNavigate` prop.
- Fixed `UserDashboard.test.tsx` to correctly map the `getTimelineStage` utility tests to the actual implementation logic.
