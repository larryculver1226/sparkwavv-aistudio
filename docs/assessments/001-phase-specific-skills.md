# Phase-Specific Skills Assessment for Skylar

## Overview
This document assesses the need for additional, highly specific conversational and technical skills tailored strictly to the five Journey phases (Dive-In, Ignition, Discovery, Branding, Outreach). While Genkit currently provides a strong foundation of global and phase-agnostic tools (like `scrapeUrl`, `executeOutreach`, and `manageCalendar`), injecting strictly phase-specific skills will allow the frontend to render highly tailored widgets and drive a more opinionated, guided experience.

## Assessment: Do we need more phase-specific skills?
**Yes.** Currently, Skylar relies on a few heavy-lifting macro tools per phase. By breaking these down into surgical, UI-triggering micro-skills, we can create moments of "magic" where Skylar autonomously generates interactive dashboards, visual maps, or customized pipelines specific to the user's immediate cognitive load in that exact phase.

---

## Proposed Phase-Specific Skills

### Phase 1: Dive-In (Onboarding & Triage)
**Goal:** Establish trust rapidly, capture raw current state, and tailor the immediate path.
*   **`extractPainPointsTool`**: Actively listens to unstructured user venting (e.g., "I hate my boss, I'm underpaid") and structures these into categorized `ImmediateBlockers` saved to the database. Triggers a UI widget showing "Your Current Blockers" for validation.
*   **`recommendCustomJourneyPathTool`**: Instead of forcing every user through the standard 5-phase pipeline, Skylar assesses their input and might suggest, "You already know your target role. Let's skip Ignition and jump straight to Branding."

### Phase 2: Ignition (Deep Self-Reflection & DNA)
**Goal:** Map the user's internal operating system, constraints, and energy.
*   **`generateEnergyMapTool`**: Goes a step further than the "Pie of Life". It asks users to list their current daily tasks and categorizes them into "Energy Drains" vs. "Energy Gains", generating a quadrant visualization in the UI.
*   **`lockCoreValuesTool`**: After conversational probing, Skylar synthesizes 3-5 absolute non-negotiable core values and uses this tool to explicitly save them as the foundational layer of the "Career Blueprint".

### Phase 3: Discovery (Market Alignment & Pivot Modeling)
**Goal:** Safely explore alternative realities without risking current stability.
*   **`simulateCareerPivotTool`**: "What if I became a Product Manager instead?" This tool compares the user's Career DNA against live market requirements for the requested role, instantly generating a "Gap Analysis" UI widget (e.g., "You have the strategy skills, but lack SQL").
*   **`findAdjacentTitlesTool`**: Uses vector similarity to suggest non-obvious job titles that match the user's skillset (e.g., moving from "Customer Success" to "Client Strategy Director").

### Phase 4: Branding (Narrative & Asset Generation)
**Goal:** Translate the internal blueprint into external market value.
*   **`auditSocialProfileTool`**: A specialized wrapper around the scraper that looks specifically at a provided LinkedIn profile URL and outputs a "Heatmap" of improvements based on the user's targeted Career DNA.
*   **`generatePortfolioStructureTool`**: For creative, tech, or strategic roles, this tool autonomously outlines exactly what case studies or artifacts should be in their portfolio/Wavvault, providing a literal checklist UI.

### Phase 5: Outreach (Connection & Execution)
**Goal:** Conversion, interview performance, and offer negotiation.
*   **`trackApplicationFunnelTool`**: Visually updates the user's application pipeline UI (a Kanban board). When a user says "I just applied to Stripe," Skylar uses this to move the Stripe card to "Applied."
*   **`generateNegotiationStrategyTool`**: Based on scraped market data for the specific role/city, generates a step-by-step negotiation script and strategy, accounting for the user's "Energy Protocol" and baseline financial needs.

## Next Steps
Please review these proposed skills. If approved, we can begin implementing them in Genkit, starting with the highest priority phases, and wiring up the corresponding UI widgets to react to these autonomous tool executions.
