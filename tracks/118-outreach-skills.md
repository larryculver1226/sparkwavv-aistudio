# Track 118: Outreach Phase Skills (Connection & Execution)

## Overview
This track introduces highly specific micro-skills for the "Outreach" phase. These tools enable Skylar to seamlessly map conversation into application tracking and actively prep the user for the offer stage with data-driven strategy.

## Implementation Details
1. **Tool (`trackApplicationFunnel`)**:
   - Allows Skylar to log application events into the user's pipeline.
   - When a user says "I just applied to Stripe," this tool autonomously moves or creates a visual Kanban card in the UI pipeline.
   
2. **Tool (`generateNegotiationStrategy`)**:
   - Uses market data and the user's specific context to generate a custom-tailored salary negotiation script and confidence strategy.
   - Triggers when the user mentions hitting the offer stage.

3. **Prompt Augmentation**:
   - Updates `skylarBase.prompt` to explicitly mention `trackApplicationFunnel` and `generateNegotiationStrategy` for use during the Outreach phase.

## UI Usage
When users type "Applying to Google today," Skylar triggers `trackApplicationFunnel` to generate a tracking card visible in the dashboard. When they say "I got an offer from Stripe!", Skylar leverages `generateNegotiationStrategy` to spawn a tactical widget with a precise negotiation script and compensation data.
