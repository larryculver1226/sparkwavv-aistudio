# Track 114: Dive-In Phase Skills (Onboarding & Triage)

## Overview
This track introduces highly specific micro-skills for the "Dive-In" phase, allowing Skylar to actively listen, structure raw user input, and dynamically alter the user's journey based on their current state.

## Implementation Details
1. **Tool (`extractPainPoints`)**:
   - Converts unstructured venting (e.g., "I hate my boss and I'm underpaid") into a structured, trackable "Current Blockers" array saved to the user's profile.
   - Prepares data for a future UI widget.

2. **Tool (`recommendCustomJourneyPath`)**:
   - Allows Skylar to dynamically adjust the UI journey map. For instance, suggesting an experienced user skip "Ignition" and jump straight to "Branding."
   - Engages a Role-Playing Partner (RPP, e.g., Kwieri) by outputting a specific recommendation state that can be used to alter the journey flow.

3. **Prompt Augmentation**:
   - Updates `skylarBase.prompt` to explicitly mention `extractPainPoints` and `recommendCustomJourneyPath` for triage and dynamic journey routing during the Dive-In phase.

## UI Usage
When users vent or describe their current situation in the Dive-In phase, Skylar uses `extractPainPoints` to memorialize their blockers, and `recommendCustomJourneyPath` to propose skipping or focusing on specific journey phases, engaging an RPP for specialized advice if necessary.
