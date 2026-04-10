# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
### Added
- **Track 033**: Home Page and User Dashboard Changes (Updated NavBar to show Dashboard Login/Vault/User Profile conditionally, added Dive-In section to Home Page, and updated Dive-In auth flow).
- **Track 031**: Regression Tests & Admin Feedback (Added Playwright JSON reporting, `smoke` test suite, `System Tests` and `User Feedback` panels in the Admin Dashboard, and a global `FeedbackModal` in the NavBar).
- **Track 030**: Fix Skylar Chat Error (Updated the deprecated `gemini-1.5-pro` model to `gemini-3.1-pro-preview` in `skylarService.ts` to resolve the "Failed to communicate with Skylar" error).
- **Track 029**: Theme Consistency for all tabs and user dashboard items (Replaced hardcoded light theme colors in `HighFidelitySynthesisLab`, `InteractivePortfolio`, `LiveResume`, and `SkylarInteractionPanel` with dark theme utility classes).
- **Track 028**: Fix User Dashboard UI Scheme/Colors (Removed 'yin' theme overrides and hardcoded light backgrounds to ensure consistency with the Home Page dark theme).
- **Track 027**: Migrate Skylar Logic to LangGraph (Refactored `skylarService.ts` to use `@langchain/langgraph` and `@langchain/google-genai` for stateful, graph-based agent orchestration).
- **Track 026**: Redesign Dive-In as Pre-Registration Onboarding (Moved Dive-In to a public route `/dive-in`, added resume upload, updated Skylar to trigger account creation, and removed Dive-In from the authenticated dashboard).
- **Track 024**: Migrate Skylar Agent Definitions to Firestore & Build Agent Ops UI (Created `agent_configs` collection, `agentOpsService`, and `AgentOpsPanel` in Admin Dashboard for dynamic prompt management).
- **Track 023**: Integration of SkylarInteractionPanel into the User Dashboard for Dive-In Phase (Replaced the static Dive-In view with the dynamic Skylar Agent interface).
- **Track 022**: Skylar Agent Definitions for Sparkwavv Journey Steps (Architected generic `JourneyStageDefinition` schema, refactored `skylarService.ts` to use dynamic prompts, and built the unified `SkylarInteractionPanel`).
- **Track 021**: Implement User Profile Image Upload (Added Firebase Storage integration, `storageService`, and updated `ProfilePage` to upload profile images).
- **Track 020**: Set up your coding assistant with Gemini MCP and Skills (Added Gemini Docs MCP, API Development Skills, and a local Project Context MCP Server).
- **Track 019**: Model Garden Models Setup (Replaced hardcoded Gemini fallbacks with environment variables for Vertex AI fine-tuned endpoints).
- **Track 018**: Fix Login Hang (Resolved infinite loop during login and removed email verification banner).
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
