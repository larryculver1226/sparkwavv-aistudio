# Track 116: Discovery Phase Skills (Market Alignment)

## Overview
This track introduces highly specific micro-skills for the "Discovery" phase. These tools enable Skylar to assist users in exploring career pivots and discovering adjacent, non-obvious job titles that align with their skillset and Career DNA.

## Implementation Details
1. **Tool (`simulateCareerPivot`)**:
   - Compares the user's current skillset and Career DNA against market requirements for a target role (e.g., "Product Manager").
   - Generates a "Gap Analysis" detailing matching skills and missing skills, ready to be rendered dynamically in the UI.

2. **Tool (`findAdjacentTitles`)**:
   - Analyzes the user's current role and skillset to recommend non-obvious, adjacent job titles (e.g., transitioning from "Customer Success" to "Client Strategy Director").
   - Simulates vector similarity matching against market roles.

3. **Prompt Augmentation**:
   - Updates `skylarBase.prompt` to explicitly mention `simulateCareerPivot` and `findAdjacentTitles` for use during the Discovery phase.

## UI Usage
When users express interest in a completely different role, Skylar uses `simulateCareerPivot` to output a gap analysis widget. When users feel stuck in their current job title, Skylar uses `findAdjacentTitles` to populate a UI list of realistic, alternative career trajectories they may not have considered.
