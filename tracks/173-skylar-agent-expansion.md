# Track 173: Skylar Agent-Base AI Expansion

## Status
- [x] Phase 1: Memory (Archeology) - Done.
- [x] Phase 2: Audit (Critique) - Done.
- [x] Phase 3: Setup (Technical Specs) - Done.
- [x] Phase 4: Build (Execution) - **PIVOTED**
- [x] Phase 5: Verify (QA) - N/A

> **Note on Pivot**: Per user request, this track was pivoted to Track 174 to clear mental context and refine the "Proactive Insight" strategy.

## Goal
Extend Skylar from a reactive chat interface into an autonomous agent capable of background monitoring, proactive nudging, and visual capability tracking.

## Memory Scan Results (Archeology)
- **Tracks 110-112 (Agent Skills)**: Verified that Scraping, Scheduling, and Outreach tools are fully developed but strictly user-initiated.
- **Track 171 (Security Audit)**: Provided the relational rules needed for the agent to safely write `nudges` and `logs` without exposing cross-user data.
- **Track 108 (Agency Core)**: Referenced the original design intent for Skylar to be an "always-on" career partner.

## Audit Persona Critique
*   **The Architect (Asynchronous Reasoning)**: "Skylar is currently a 'Stateless Oracle'. To become an agent, she needs a temporal dimension. This means background syncing that doesn't rely on an active browser tab."
*   **The Designer (Agent Ops)**: "The user shouldn't just be told Skylar is working; they should see it. We need an 'Operations Center' UI that visualizes the 'Pulse' of the agent."
*   **The Security Auditor (Integrity)**: "We must avoid 'Sync Storms'. If multiple browser instances are open, they might all try to trigger the agent sync. We need a server-side lock."

## Technical Specs (Phase 3)
### 1. Database Schema (`firebase-blueprint.json`)
- **`agent_state`**: `status`, `last_sync`, `active_skills`.
- **`agent_logs`**: `timestamp`, `event`, `details`, `type`.
- **`nudges`**: `content`, `type`, `read`, `action_link`.

### 2. Infrastructure: "Lazy Heartbeat"
- **Trigger**: Dashboard mount or chat interaction.
- **Router**: `POST /api/agent/sync`.

### 3. UI Implementation
- **Component**: `AgentDashboard` (Pulse + Map + Console).

## Pivot Decision
While the technical foundation was sound, the approach lacked high-fidelity "Nudges" and strict concurrency controls. This track served as a crucial prototype for the successful implementation in Track 174.
