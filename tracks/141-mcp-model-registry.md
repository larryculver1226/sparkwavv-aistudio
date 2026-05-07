# Track 141: MCP Model Registry (Model Abstraction Layer)

## Status: In Progress
**Started**: 2026-05-07
**Owner**: Senior Backend Architect

## Context
The application currently faces two primary reliability issues:
1. **Model Availability**: Attempts to use newer models (like `gemini-2.0-flash`) can fail if the specific API key or region lacks access, causing hard crashes.
2. **Referrer Blocking**: The server-side use of the Firebase restricted API key often results in `403 Forbidden` errors due to missing referer headers.

## Objective
Create a standalone MCP (Model Context Protocol) Server that acts as a secure, intelligent gateway for all GenAI calls. It will abstract model selection and provide a "Smart Fallback" mechanism.

## Implementation Plan

### 1. Planning & Setup
- [x] Define the `ModelRegistry` mapping logic.
- [x] Setup `@modelcontextprotocol/sdk` dependencies.

### 2. Implementation
- [x] Create `scripts/mcp-model-registry/index.ts` with MCP tool definitions.
- [x] Implement `sparkwavv_genai_call` with `gemini-2.0-flash` -> `gemini-1.5-flash` fallback.
- [x] Configure custom Fetch headers to prevent empty referer blocks.

### 3. Integration & Testing
- [x] Provide documentation for `genkitService.ts` refactoring.
- [x] Verify error handling for 404/400 scenarios (and expired keys).

## Technical Specifications
- **Framework**: Node.js/TypeScript
- **Key Dependencies**: `@modelcontextprotocol/sdk`, `@google/generative-ai`, `dotenv`
- **Output Channel**: MCP Tool Execution
