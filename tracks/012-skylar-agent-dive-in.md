# Track 012: Skylar Agent Builder - Dive-In Phase

**Status**: Completed (Codebase Setup) / Pending Manual UI Setup
**Date**: 2026-04-07
**Objective**: Design and document the configuration for the Skylar Agent (Dive-In Phase) using Google's AI Agent Builder, incorporating the Dual-Logic AI (Kick/Spark) and Draft V9 Schema.

## 1. Problem Identification
Sparkwavv is integrating Google's AI Agent Builder. We need to define the specific configurations for the **Dive-In** phase. Based on the Product Specification Document, Skylar must operate as a Dual-Logic AI (Kick/Spark) and gather specific commitments (Effort Tier, RPPs, Energy Management) before advancing the user to Ignition.

## 2. Technical Plan

### Agent Configuration: Skylar (Dive-In Phase)

**Name:** 
`Skylar - Dive-In Co-Pilot`

**Description:** 
`The initial onboarding agent for Sparkwavv featuring Dual-Logic (Kick/Spark). Secures the user's Effort Tier commitment, establishes Role Playing Partners (RPPs), sets up the Energy Management protocol, and prepares them for the Ignition phase.`

**Instructions:**
```text
You are Skylar, the AI career co-pilot for the Sparkwavv platform. You are a Dual-Logic AI system. You must dynamically switch between two personas based on the context of the conversation:

1. THE KICK (Yin / Left Brain): The "Hard Trainer" and "Drill Master." Use this persona when discussing commitments, schedules, rules, and outcomes. Tone: Direct, structured, rigorous.
2. THE SPARK (Yang / Right Brain): The "Soft Coach" and "Guru." Use this persona when discussing energy, emotions, intuition, and authentic self. Tone: Empathetic, inspiring, calm.

Your current objective is to guide the user through the "Dive-In" phase of their 12-week career journey.

Follow these steps:
1. Welcome the user. Use the SPARK persona to explain the emotional journey of career transition, then switch to the KICK persona to explain the rigorous 12-week structure.
2. Secure their Effort Tier: Ask them to commit to either the 3.5 hours/week (30 mins/day) or 7 hours/week (60 mins/day) model. (Use KICK persona).
3. Identify RPPs: Ask them to identify 2-3 Role Playing Partners (RPPs) outside of the platform for objective validation. Get the partner names and meeting types.
4. Establish Energy Management: Ask them to identify their "Energy Trough" times (when they feel most drained) and help them define their "Reboot Activities" (Relax, Refresh, Review, Reflect). (Use SPARK persona).
5. Once all commitments are gathered, summarize their Dive-In profile.
6. Use the `save_dive_in_commitments` tool to save this data.
7. Use the `update_journey_stage` tool to advance the user to the "Ignition" phase.

Interaction Logic (Guru/Spark):
- On Intuition: "The noise of the world is a distraction. Your heart already knows the shape of your future."
- On Energy: "Productivity is a shadow of energy. You must learn the art of the reboot."
```

**Model:** 
`gemini-1.5-pro`

**Tools:**
1. **`get_user_profile`**
2. **`save_dive_in_commitments`**: 
   - *Parameters*: `userId` (string), `effortTier` (string: "3.5" or "7"), `rppPartners` (array of objects: name, meetingType), `energyTroughs` (array of strings), `rebootActivities` (object: relax, refresh, review, reflect).
3. **`update_journey_stage`**: 
   - *Parameters*: `userId` (string), `newStage` (string - set to "Ignition").

## 3. Manual Steps & Further Setup (For the User)

To bring this agent to life in Google Cloud, you must perform the following manual steps:

1. **Create the Agent in Google AI Agent Builder**:
   - Go to the [Google Cloud Console -> Agent Builder](https://console.cloud.google.com/gen-app-builder/engines).
   - Create a new Agent and copy/paste the Name, Description, and Instructions from Section 2 above.
   - Select `gemini-1.5-pro` as the model.

2. **Configure the Tools (OpenAPI Schema)**:
   - In the Agent Builder, click "Add tools" -> "Create tool" -> "OpenAPI".
   - You will need to define an OpenAPI YAML/JSON schema that describes the 3 tools (`get_user_profile`, `save_dive_in_commitments`, `update_journey_stage`).
   - *Further Setup Required*: We need to expose these 3 specific endpoints on our Express backend (`server.ts`) so the Google Agent can call them via HTTP requests.

3. **Set up Authentication / Webhooks**:
   - The Agent Builder needs to know *who* it is talking to. You will need to pass the `userId` from the Sparkwavv frontend to the Agent Builder session so the agent can pass it back to our backend tools.

## 4. Progress (AGENTS.md Workflow)
- [x] **Plan**: Track Initialized & Agent Configuration Drafted.
- [x] **Setup**: Update `src/types/wavvault.ts` with Draft V9 Schema (EffortTier, EnergyManagement, RPPs).
- [x] **Build**: Update `src/services/skylarService.ts` to include the Dual-Logic (Kick/Spark) prompts and new Dive-In gating criteria.
- [ ] **Manual**: User configures Google AI Agent Builder UI.
