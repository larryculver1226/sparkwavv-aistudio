# Track 031: Regression Tests for Sparkwavv

## Objective
Develop and implement a comprehensive regression testing strategy for the Sparkwavv application. This includes a complete test suite for major feature additions/updates and a focused test suite for quick fixes and repairs. 

## Status
- [x] Plan
- [x] Setup
- [x] Build
- [x] QA & Testing

## Current State Analysis
The application currently has a foundational testing setup:
- **Unit/Component Tests**: Using `vitest` and `@testing-library/react`. Currently, there are basic tests for `NavBar.test.tsx` and `UserDashboard.test.tsx`.
- **E2E Tests**: Using `@playwright/test`. There are existing specs for `dashboard.spec.ts` and `onboarding.spec.ts`. However, these tests currently fail in the CI/CD environment because the Playwright browsers are not installed (`npx playwright install` is required).

## Proposed Regression Testing Plan

### 1. Test Suite Architecture
We will divide the tests into two primary suites:
- **Full Regression Suite (`npm run test:e2e`)**: Run on major feature branches and before production deployments. Covers all critical paths, edge cases, and integrations.
- **Smoke/Focused Suite (`npm run test:e2e:smoke`)**: Run on minor fixes and repairs. Covers only the most critical "happy paths" (e.g., login, basic navigation, Skylar chat initiation) to ensure core functionality isn't broken.

### 2. Core Testing Areas

#### A. User Navigation
- **Happy Path**: Verify routing between Landing Page, User Dashboard (all tabs: Discovery, Synthesis, Portfolio, Outreach, Mentor), Admin Portal, and Operations Center.
- **State Preservation**: Ensure that navigating away from a tab and returning preserves the state (e.g., Skylar chat history, form inputs).
- **Protected Routes**: Verify that unauthenticated users attempting to access `/dashboard` or `/admin` are redirected to the login/landing page.

#### B. Skylar Interface (AI Agent)
- **Chat Initiation**: Verify that the Skylar sidebar and interaction panels open correctly.
- **Message Sending/Receiving**: Mock the `/api/agent/chat` endpoint to ensure the UI correctly displays user messages, loading states, and Skylar's responses.
- **Tool Execution (UI Reflection)**: Verify that when Skylar executes a tool (e.g., `update_journey_stage`), the UI reflects the change (e.g., toast notifications appear, dashboard stage updates).
- **Voice/Audio**: Verify that the TTS (Text-to-Speech) toggle works and triggers the appropriate audio playback functions.

#### C. Authentication & Authorization (RBAC)
- **Login Flow**: Test the Google Auth login flow (mocked for E2E).
- **Role-Based Access Control (RBAC)**:
  - Verify `USER` role can access User Dashboard but not Admin/Ops.
  - Verify `OPERATOR` role can access Ops Center but not Admin Portal.
  - Verify `SUPER_ADMIN` can access all areas.
- **Session Expiry**: Test behavior when the auth token expires or is invalid.

#### D. Logging & Telemetry
- **Security Logs**: Verify that critical actions (e.g., role changes, unauthorized access attempts) trigger a call to the logging service (`logSecurityEvent`).
- **Wavvault Sync**: Verify that chat history is correctly saved to the user's Wavvault document in Firestore.

#### E. Edge Testing & Error Handling
- **Network Failures**: Simulate offline mode or API failures (e.g., 500 error from Gemini) and verify that the Error Boundary or UI gracefully displays a fallback message instead of crashing.
- **Malformed Data**: Test how the dashboard handles missing or corrupted Firestore data (e.g., missing `sparkwavvId` or `journeyStage`).
- **Rate Limiting/Timeouts**: Ensure that long-running AI requests timeout gracefully and inform the user.

### 3. Implementation Steps (Setup & Build Phases)
1. **Playwright Configuration**: Update `playwright.config.ts` to support a `smoke` tag and ensure browsers are installed in the CI pipeline. Configure Playwright to output results using the JSON reporter.
2. **Mocking Strategy**: Implement Playwright network interception (`page.route`) to mock Firebase Auth and Gemini API responses. This is crucial for reliable, deterministic regression tests without incurring API costs or dealing with flaky external services.
3. **Test Development**: Write the Playwright specs for the areas outlined above.
4. **Admin Dashboard Integration (Test Execution & Results)**:
   - **Execution Endpoint**: Create a secure backend endpoint (`POST /api/admin/tests/run`) restricted to `SUPER_ADMIN` that spawns a child process to run the Playwright/Vitest suites.
   - **Results Viewer**: Create an endpoint (`GET /api/admin/tests/results`) to fetch the generated JSON reports and display them in a new "System Tests" tab within the Admin Portal. The UI will show pass/fail rates, durations, and specific error logs.
5. **User Feedback & Issue Reporting Mechanism**:
   - **User-Facing UI**: Implement a global "Feedback / Report Issue" widget (e.g., a floating button or a menu item in the NavBar) available to all users. This will open a modal to collect: Issue Type (Bug, Feature Request, General Feedback), Description, Steps to Reproduce, and automatically capture the current URL and browser info.
   - **Reporting Software/Mechanism**: 
     - **Native (Primary)**: We will use **Firestore** (a new `feedback_issues` collection) as the primary native datastore. This ensures issues are immediately viewable within a new "User Feedback" tab in the Sparkwavv Admin Console without requiring third-party licenses.
     - **Jira Integration (Secondary/Future)**: The data model will be designed to map directly to Jira issues (Summary, Description, IssueType, Reporter). We can implement a backend service that automatically forwards these tickets to a Jira project via the Jira REST API if Jira credentials are provided in the environment variables.
6. **CI/CD Integration**: Add scripts to `package.json` to easily run the full suite or the focused suite.

---
**Review Request**: Please review this updated plan. Let me know if you approve moving forward to the Setup and Build phases.
