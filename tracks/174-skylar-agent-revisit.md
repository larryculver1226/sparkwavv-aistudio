# Track 174: Skylar Agent Expansion (Revisit)

## Status
- [x] Phase 1: Memory (Archeology) - Done.
- [x] Phase 2: Audit (Critique) - Done.
- [x] Phase 3: Setup (Technical Specs) - Done.
- [x] Phase 4: Build (Execution) - Done.
- [x] Phase 5: Verify (QA) - Done. Build confirmed.

## Goal
Establish Skylar as a proactive career architect through an asynchronous agent framework, visual capability transparency, and daily actionable nudges.

## Memory Scan Results (Archeology)
- **Tracks 110-112 (Agent Tools)**: Verified tools for Scraping (Jina), Scheduling, and Outreach are functional but lacked a proactive scheduler.
- **Track 007 (Persistence Layer)**: Wavvault remains the single source of truth for user DNA; the agent must pull context from here to personalize nudges.
- **Track 173 (Pivoted Attempt)**: Previous attempt established valid REST triggers but failed the "Memory Audit" due to lack of concurrency locking, leading to a pivot.

## Audit Persona Critique
*   **The Architect (Reliability)**: "The background worker must be decoupled from the browser session. If a Cloud Run instance recycles during a sync, Firestore must maintain the 'Interrupted' state rather than hanging on 'Processing'."
*   **The Security Auditor (Integrity)**: "The `/api/agent/sync` endpoint must be protected by a distributed lock in Firestore. We cannot allow a user to spawn multiple analysis flows, which would inflate Gemini token costs and risk data corruption."
*   **The UX Designer (Engagement)**: "Proactive nudges shouldn't just be 'More Notifications'. They need to be visually distinct 'Insights' that provide immediate value—like a job gap analysis or a skill recommendation based on current market trends."

## Strategy & Principles
1.  **State-First Syncing**: The UI should never feel like it's polling; it should react to a Firestore state stream.
2.  **Concurrency Locking**: Use a 10-minute TTL lock in `agent_sync` to prevent race conditions.
3.  **Proactive Visibility**: Nudges must be surface-level (Dashboard) while detail resides in the `AgentDashboard`.

## Technical Specs (Phase 3)
### 1. Database Schema (`firebase-blueprint.json`)
- **`agent_sync/{userId}`**:
  - `status`: 'idle' | 'processing' | 'researching' | 'analyzing'
  - `lastSync`: Timestamp
  - `lock`: Timestamp (Concurrency Guard)
  - `activeSkills`: string[]
- **`agent_logs/{logId}`**: User-owned event stream for real-time transparency.
- **`nudges/{nudgeId}`**: Proactive actionable career notifications.

### 2. Logic: "The Analyst Heartbeat"
- **Internal Service Route**: `POST /api/agent/sync`
- **Concurrency Control**: 
  - If `lock` exists and is < 10 minutes old, abort with 429.
  - Set `lock` on start, clear on completion.

### 3. UI Implementation
- **`AgentDashboard`**: Live pulse + console stream showing "Skylar's Thought Process".
- **`ProactiveNudge`**: Persistent floating insights for immediate user feedback.

## Execution Summary (Phase 4)
- **Built `AgentDashboard`**: Connected to Firestore listener for real-time operation logging.
- **Implemented `ProactiveNudge`**: Added to `UserDashboard` root to surface Skylar insights.
- **Hardened `/api/agent/sync`**: Added atomic locking logic in `server.ts` to prevent concurrent race conditions.
