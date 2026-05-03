# Track 120: Journey Phase Kanban-Action List

## Overview
This track introduces the Journey Phase Kanban-Action List, providing a centralized, visual checklist that guides the user through the structural milestones of their current Journey Phase (Ignition, Discovery, Branding, Outreach). It integrates directly with the WavVault to persist kanban state and introduces new tools for Skylar to read the board, update progress, unlock phases, and engage Role-Playing Partners (RPPs) when users are blocked.

## Implementation Details
1. **Tool (`getPhaseActionBoard`)**: 
   - Retrieves the user's current kanban state from `users/{userId}/wavvault/kanban_state` to provide Skylar with real-time awareness of remaining tasks in the active phase.
2. **Tool (`updatePhaseActionStatus`)**:
   - Programmatically updates the status of a specific Kanban task (Todo -> In Progress -> Blocked -> Completed) within the WavVault.
3. **Tool (`engageRolePlayingPartner`)**:
   - Triggers a Role-Playing Partner (RPP) archetype (e.g., Kwieri) to help unblock the user on a specific task when they experience analysis paralysis.
4. **Tool (`assessPhaseReadiness`)**:
   - Evaluates the holistic output of a phase once all tasks are completed and unlocks the transition to the next Journey Phase in the UI.

## Prompt Augmentation
Updates `skylarBase.prompt` to instruct Skylar on maintaining the Kanban board, utilizing RPPs for blocked tasks, and gating phase progression through these kanban capabilities.
