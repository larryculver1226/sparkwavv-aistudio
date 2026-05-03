# Design & Plan: Dive-In Required Fields

## Problem Statement
In Track 121, we modified the database seeding process so that a new user starts with logical defaults (empty arrays for `strengths`, `pieOfLife`, `perfectDay`, `financialExpenses`, etc.) and a seeded Kanban board. However, the current `DiveInPage.tsx` only offers an "Upload Resume" UI alongside Skylar's chat. It lacks explicit visual representation of the critical onboarding fields we want to capture during this phase before the user fully transitions to their dashboard.

## Proposed Solution: Interactive Dive-In Tracking
We will update `DiveInPage.tsx` to act as a visually interactive onboarding sequence that works in tandem with Skylar to populate these core fields organically.

### 1. UI Enhancements to `DiveInPage.tsx`
We will expand the layout of `DiveInPage.tsx` (the left-hand pane, previously just "Context Upload") to include a visual "Dive-In Checklist" featuring interactive input mechanisms for:
*   **Effort Tier:** A selectable component (e.g., basic 3.5 hrs vs 7 hrs).
*   **Pie of Life:** Interactive sliders or a simple input mechanism for life balance categories (Work, Family, Health, Spirit).
*   **Perfect Day Timeline:** A dynamic list builder for logging their daily energy/focus timeline.
*   **Core Strengths:** A section to lock in their identified top traits.
*   **Target Financials:** Basic fields to capture baseline financial constraints or goals.

### 2. Dual-Entry Capability (User & Skylar)
*   **Organic Skylar Actions:** As Skylar converses with the user during Dive-In and they arrive at answers (e.g., settling on an Effort Tier), Skylar will execute action events that automatically populate the visual UI on `DiveInPage.tsx`.
*   **Manual Override:** The user can also manually fill in these sections in the UI to speed up the onboarding sequence if they prefer not to rely strictly on chat context.

### 3. Payload Delivery to Database Setup
When the final `create_sparkwavv_account` or onboarding completion event triggers, `DiveInPage.tsx` will package the populated state of these additional fields and pass them down (via API or Skylar) when `createDefaultDashboard` fires.
*   We'll adjust `create_sparkwavv_account` and subsequent API endpoints to accept this initial schema and persist it directly instead of starting them from zero arrays if they organically filled them during Dive-In.

### 4. Kanban Synergies
If the user completes elements (like Effort Tier) in the `DiveInPage.tsx` UI, their `kanban_state` will instantly reflect these updates upon arriving at the dashboard, preventing the Kanban board from redundantly asking them to do steps they've just completed.

## Review Request
Please review this approach. If you approve or have any specific guidance on *which* fields to include or emphasize on the Dive-In page, let me know, and I will proceed with creating the Track and executing the code.
