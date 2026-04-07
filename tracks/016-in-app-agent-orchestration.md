# Track 016: In-App Agent Orchestration

**Status**: Completed
**Date**: 2026-04-07
**Objective**: Build a Code-First Custom Agent Orchestrator directly into the Express backend using Gemini API Function Calling, replacing the need for a separate Google Cloud Agent Builder project.

## 1. Problem Identification
Configuring the Skylar Agent in a separate Google Cloud Agent Builder project creates friction, requires context-switching, and makes version control difficult. The user wants to keep the agent configuration entirely within the Sparkwavv codebase.

## 2. Technical Plan
- **Subagent Router**: Implement a router in `skylarService.ts` that dynamically loads the correct System Prompt based on the user's `journeyPhase` (e.g., Dive-In, Ignition).
- **Tool Definitions**: Define Gemini Function Declarations for Dive-In tools (`save_dive_in_commitments`, `update_journey_stage`) directly in TypeScript.
- **Orchestration Loop**: Create an orchestrator function that handles the interaction with Gemini, intercepts `functionCall` requests, executes the local TypeScript functions to update Firestore, and returns the results to Gemini.
- **API Endpoint**: Add a new endpoint `/api/agent/chat` in `server.ts` to expose the orchestrator to the frontend.

## 3. Progress
- [x] Track Initialized
- [x] Subagent Router implemented
- [x] Dive-In Tools defined
- [x] Orchestration Loop implemented
- [x] API Endpoint created
- [x] Verified functionality
