# Track 115: Ignition Phase Skills (Self-Reflection & DNA)

## Overview
This track introduces highly specific micro-[skills for the "Ignition" phase, allowing Skylar to structure the user's raw inputs into visual energy management quadrants and lock in non-negotiable core values for their Career Blueprint.

## Implementation Details
1. **Tool (`generateEnergyMap`)**:
   - Upgrades the "Pie of Life" by taking daily tasks mentioned by the user and categorizing them into an "Energy Drains vs. Gains" quadrant.
   - Saves this structured map to the database to be rendered by the UI.

2. **Tool (`lockCoreValues`)**:
   - Distills conversational stories into 3-5 hardcoded, non-negotiable core values.
   - Explicitly locks these into the foundational layer of the user's `career_blueprint`.

3. **Prompt Augmentation**:
   - Updates `skylarBase.prompt` to explicitly mention `generateEnergyMap` and `lockCoreValues` for use during the Ignition phase.

## UI Usage
When users list their daily activities or complain about burnout, Skylar uses `generateEnergyMap` to structure their inputs and trigger a quadrant UI widget. When users express deep personal truths or stories, Skylar distills them via `lockCoreValues`, permanently setting their career constraints.
