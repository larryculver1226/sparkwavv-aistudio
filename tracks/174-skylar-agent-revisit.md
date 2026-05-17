# Track 174: Skylar Agent Expansion (Revisit)

## Referenced Tracks
- Track 173 (Archived/Pivoted)
- Tracks 108-118 (Original Agency Core)

## Status
- [x] Phase 1: Memory (Archeology) - Done. Referenced Tracks 108-118 and 173.
- [x] Phase 2: Audit (Critique) - Done. Identified need for State-First Sync and High-Fidelity Pulse UI.
- [x] Phase 3: Setup (Technical Specs) - **PROPOSED**
- [x] Phase 4: Build (Execution) - Done. Implemented AgentDashboard, ProactiveNudge, and server-side Sync route with locking.
- [x] Phase 5: Verify (QA) - Done. Build confirmed.

## Goal
Establish Skylar as a proactive career architect through an asynchronous agent framework, visual capability transparency, and daily actionable nudges.

## Technical Specs (Phase 3)

### 1. Database Schema (`firebase-blueprint.json`)
- **`agent_sync/{userId}`**:
  - `status`: 'idle' | 'processing' | 'researching' | 'analyzing'
  - `lastSync`: Timestamp
  - `lock`: Timestamp (Used to prevent concurrent runs)
  - `activeSkills`: string[] (e.g., ['scraping', 'job_matching', 'outreach'])
- **`agent_logs/{logId}`**:
  - `userId`: string
  - `timestamp`: Timestamp
  - `event`: string
  - `details`: string
  - `type`: 'info' | 'success' | 'warning'
- **`nudges/{nudgeId}`**:
  - `userId`: string
  - `content`: string
  - `type`: 'job_alert' | 'skill_suggestion' | 'network_nudge'
  - `read`: boolean
  - `actionLink`: string (optional)
  - `createdAt`: Timestamp

### 2. Logic: "The Analyst Heartbeat"
- **Internal Service Route**: `POST /api/agent/sync`
- **Concurrency Control**: 
  - If `lock` exists and is < 10 minutes old, abort with 429.
  - Set `lock` on start, clear on completion/error.
- **Workflow**:
  1. **Idle Check**: If `lastSync` < 24h, return early (unless `force: true`).
  2. **Step: Scraping**: Call Jina/Search tools to find market gaps based on Wavvault DNA.
  3. **Step: Synthesis**: Gemini analyzes gaps vs user strengths.
  4. **Step: Nudging**: Persist new `Nudge` documents if high-confidence insights found.

### 3. UI Implementation
- **Component**: `src/components/agent/AgentDashboard.tsx`
- **Features**:
  - **Live Pulse**: Visual ping during active processing.
  - **Console Stream**: Real-time Firestore listener for `agent_logs`.
  - **Skill Toggles**: Visual indicators of enabled Skylar modules.

### 4. Security Rules
- `agent_sync`: User-owned read/create/update.
- `agent_logs`: User-owned read/create. No user deletion.
- `nudges`: User-owned read/update (read-status). Admin-only create.

## Approval
- [ ] User approved Technical Specs.
- **Tooling**: Skylar possesses tools for Scraping (Jina), Scheduling, and Outreach (Tracks 110-112).
- **Persistence**: Wavvault is the master source of user identity (Track 007).
- **Previous Attempt**: Track 173 laid out a REST-triggered background worker but was paused for context reset.

## Audit Findings (Phase 2)
### Design Persona Audit
- **The Coder (Security/Reliability)**: 
    - The background worker needs to be robust against Cloud Run timeouts. 
    - Firestore rules must explicitly protect `agent_logs` and `nudges`.
- **The Auditor (Logic/Compliance)**: 
    - "DailyAnalystFlow" must avoid redundant API calls. Deduplication of market data is critical to control costs.
    - We must ensure `/api/agent/sync` checks for a "lock" to prevent multiple concurrent syncs for the same user.
- **The Designer (UX/UI)**: 
    - The `AgentDashboard` should use the "Skylar Neural Network" aesthetic—dark theme, neon accents, and data-dense but readable layouts.
    - Statuses should transition smoothly: `RESEARCHING` -> `ANALYZING` -> `IDLE`.

## Strategy
1.  **Atomic Syncing**: Break the background flow into discrete, state-tracked steps in Firestore.
2.  **Proactive Nudging**: Skylar generates `Nudge` artifacts that appear on the user's main dashboard, not just in the agent tab.
3.  **Visual Capability Map**: Show users exactly what Skylar *can* do (Scraping, Outreach) to increase perceived value.

## Approval Required
Move to **Phase 3: Setup (Technical Specs)**?
