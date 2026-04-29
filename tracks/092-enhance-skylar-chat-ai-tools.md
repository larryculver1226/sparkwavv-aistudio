# Track 092 - Utilize Attached AI Tools to Enhance Skylar Chat

## 1. Plan
**Status:** Waiting for User Clarification

**Objective:** Enhance the Skylar chat using "attached AI tools".

**Pending Clarification:**
I did not receive context for the specific "attached AI tools" in the prompt payload. 
- If this refers to Native Gemini Tools (like Google Search, Google Maps, Code Execution) that we want to wire natively into the chat, we need to map them properly via the SDK so as to avoid the `[400 Bad Request] Please enable tool_config.include_server_side_tool_invocations` Genkit conflicts we faced in Track 090.
- If this refers to custom files or plugins uploaded via the chat, the contents were not correctly parsed by the agent environment. 

**Next Steps Once Clarified:**
1. Draft concrete Step-by-Step implementation plan.
2. Update `TECH_SPECS.md` with the new tool integrations.
3. Build and test the enhanced Skylar chat.

## 2. Setup
*(Pending Plan Approval)*

## 3. Build
**Status:** Completed

**Execution Steps:**
1. Created `useSkylarLive.ts` hook utilizing the standard `@google/genai` Live API connection pattern. Implemented Web Audio API pipeline for mic capture, processor-based audio-to-PCM reduction, and streaming buffers to the `ai.live.connect()` session correctly.
2. Updated `SkylarInteractionPanel.tsx` by applying a new "Voice Mode" button (Mic icon) to dynamically invoke the live connection. Handled the `active` and `loading` states contextually.
3. Hooked up the `skylarTools` to the live socket schema so that the model knows about all Sparkwavv operational tools during voice synthesis.
4. Compiled and verified successfully.
