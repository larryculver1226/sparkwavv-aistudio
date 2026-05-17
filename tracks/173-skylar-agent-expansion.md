# Track 173: Skylar Agent-Base AI Expansion

## Status
- [ ] Phase 1: Memory (Archeology) - Done.
- [ ] Phase 2: Audit (Critique) - Done.
- [ ] Phase 3: Setup (Technical Specs) - Done.
- [ ] Phase 4: Build (Execution) - **PIVOTED/CANCELLED**
- [ ] Phase 5: Verify (QA) - N/A

> **Note on Pivot**: Per user request, this track is being archived/reset to clear context for a new feature research process.

## Goal
Extend Skylar from a reactive chat interface into an autonomous agent capable of background monitoring, proactive nudging, and visual capability tracking.

## Technical Specs (Phase 3)

### 1. Database Schema (`firebase-blueprint.json`)
- **`agent_state`**:
  - `status`: 'idle' | 'processing' | 'researching' | 'analyzing'
  - `last_sync`: Timestamp
  - `active_skills`: Array of strings (e.g., ['scraping', 'job_matching', 'outreach'])
- **`agent_logs`**:
  - `timestamp`: Timestamp
  - `event`: string
  - `details`: string
  - `type`: 'info' | 'success' | 'warning'
- **`nudges`**:
  - `content`: string
  - `type`: 'job_alert' | 'skill_suggestion' | 'network_nudge'
  - `read`: boolean
  - `action_link`: string (optional)

### 2. Infrastructure: "Lazy Background Worker"
- **Trigger**: Dashboard mount or chat interaction.
- **Router**: `POST /api/agent/sync`
- **Logic**:
  - Check `last_sync`. If > 24h, run `DailyAnalystFlow`.
  - `DailyAnalystFlow`:
    1. Scrapes latest data based on user interests.
    2. Compares with `career_health` document.
    3. Generates `nudges` if actionable insights found.
    4. Updates `agent_state`.

### 3. Capability UI (`src/components/agent/AgentDashboard.tsx`)
- **Agent Pulse**: A visual indicator of Skylar's heartbeat.
- **Skill Map**: A grid showing "Enabled" vs "Disabled" agent modules.
- **Event Feed**: A vertical scroll of recent background actions.

### 4. Proactive Logic (Gemini)
- Use `gemini-3-flash-preview` for high-speed analysis of background data.
- System Prompt focus: "Identify opportunities the user missed."

## Approval
- [ ] User approved Technical Specs.

## Memory Context
- Skylar already has tools for Scraping, Scheduling, and Outreach (Tracks 110-112).
- Security rules were hardened in Track 171 to support this expanded agency.

## Audit Findings
- **Missing Link**: Asynchronous reasoning. Skylar currently only "wakes up" when a REST request is sent.
- **UI Gap**: Users don't know Skylar's "Agent Mode" exists unless they happen to ask the right question in chat.
- **Solution**: Implement an "Agent Operations" center in the user dashboard and a background worker loop for daily "Syncing".
