# Design: Journey Phase Kanban-Action List

## Problem Statement
Currently, users lack visibility into the specific actionable steps required to "complete" a Journey Phase (Ignition, Discovery, Branding, Outreach). While Skylar has many micro-skills, there is no centralized, visual "checklist" or "Kanban board" that guides the user through the structural milestones of their current phase. Furthermore, users can get stuck or experience "analysis paralysis" on specific tasks, halting their progression. Dive-In is explicitly excluded as it functions primarily as an onboarding/triage phase.

## Proposed Concept: The Phase Action Board
A shared, interactive UI component (The Phase Action Board) accessible by both the user and Skylar, serving as the source of truth for phase completion.

### Architecture & Data Model
*   **Database Collection**: `users/{userId}/wavvault/kanban_state`
*   **Dashboard Initialization**: When the user logs into their dashboard, the UI will natively fetch the `kanban_state` document directly from the Wavvault to hydrate the Phase Action Board instantly, avoiding extra latency or desync.
*   **Data Structure**:
    *   `phaseId` (e.g., 'ignition', 'discovery')
    *   `tasks`: Array of predefined or dynamically generated milestone blocks.
        *   `id`: Unique identifier
        *   `title`: User-friendly task title
        *   `status`: `todo`, `in_progress`, `blocked`, `completed`
        *   `requiredTool`: The underlying Genkit tool that aligns with this task
        *   `completedAt`: Timestamp

### Phase-Specific Default Milestones

**Phase 2: Ignition**
1.  Map Energy Drains vs. Gains (Tool: `generateEnergyMap` - Existing)
2.  Lock Core Values (Tool: `lockCoreValues` - Existing)
3.  Assess Operating Style (Tool: `assessOperatingStyle` - Existing)

**Phase 3: Discovery**
1.  Run Gap Analysis / Pivot Simulation (Tool: `simulateCareerPivot` - Existing)
2.  Explore Adjacent Titles (Tool: `findAdjacentTitles` - Existing)
3.  Review Industry Heatmap (Tool: `analyzeIndustryTrends` - Existing)

**Phase 4: Branding**
1.  Audit Social Profiles (Tool: `auditSocialProfile` - Existing)
2.  Draft Networking Pitch (Tool: `draftElevatorPitch` - Existing)
3.  Define Portfolio Constraints (Tool: `generatePortfolioStructure` - Existing)

**Phase 5: Outreach**
1.  Populate Pipeline board (Tool: `trackApplicationFunnel` - Existing)
2.  Run Mock Interview Prep (Tool: `triggerMockInterview` - Existing)
3.  Formulate Negotiation Strategy (Tool: `generateNegotiationStrategy` - Existing)

### Addressing Gaps & Blockers (Role-Playing Partner Engagement)
A major risk is the user failing to proceed because the cognitive load of a phase task (e.g., "What are my core values?") is too high. 

**New Tools to Develop:**
1.  **`engageRolePlayingPartner`** (Gap Resolver): 
    *   If Skylar detects the user is hesitating, blocked on a specific Kanban task, or unable to generate the necessary insight, Skylar triggers this tool to dynamically pull in a Role-Playing Partner (RPP) archetype (e.g., *Kwieri* to challenge mental models, or an *Industry Expert* to break down jargon).
    *   The RPP will guide the user through a tailored micro-exercise specifically designed to unblock that exact Kanban task.
2.  **`getPhaseActionBoard`** (Awareness): 
    *   Provides Skylar with real-time insight into what Kanban tasks remain for the active phase.
3.  **`updatePhaseActionStatus`** (Execution): 
    *   Allows Skylar to programmatically move the task along the board (Todo -> In Progress -> Completed, or mark as Blocked to trigger an RPP).
4.  **`assessPhaseReadiness`** (Phase Gate): 
    *   A tool called when all tasks in a phase hit `completed`. Skylar evaluates the outputs holistically and uses this tool to unlock the next phase in the UI.

### UI Experience
*   The UI presents a visual Kanban or Checklist for the active phase.
*   Tasks can show a "Blocked" state, at which point the UI suggests, "Need help? Talk to Kwieri."
*   Users can click a "To-Do" item to have Skylar automatically start the conversation for that specific task.
*   Once all tasks are marked `completed`, the user is explicitly prompted to transition to the next Journey Phase.

## Review Request
Please review this revised design plan, which explicitly addresses progression blockages via RPP integration and defines the new toolsets required. If you approve, I will move forward with creating the Track and implementing these tools.