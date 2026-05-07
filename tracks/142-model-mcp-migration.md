# Track 142: Model MCP Migration

## Status: In Progress
**Started**: 2026-05-07
**Owner**: Senior Backend Architect

## Context
Following the successful implementation of the **MCP Model Registry** (Track 141), we now need to migrate the core application services to consume this registry. This migration will provide autonomous model fallback (Gemini 2.0 -> 1.5) and ensure consistent header management (Referrer/Origin) across all AI-driven features.

## Objective
Refactor `genkitService.ts` and `geminiBackend.ts` to route Generative AI calls through the MCP Model Registry gateway.

## Implementation Plan

### 1. Client Implementation
- [ ] Create a reusable MCP Client utility in `backend/services/mcpClient.ts`.
- [ ] Implement logic to connect to the `mcp-model-registry` via stdio.

### 2. Service Refactoring
- [x] Refactor `genkitService.ts` to use `sparkwavv_genai_call` for high-level tasks.
- [x] Update `geminiBackend.ts` to point its core generation logic to the MCP gateway.

### 3. Verification & Safety
- [ ] Test the "Smart Fallback" in a live environment (simulated 404).
- [ ] Verify that 403 Forbidden errors are completely resolved by the MCP Referrer patch.

## Technical Specifications
- **Client**: `@modelcontextprotocol/sdk` (Client/StdioTransport)
- **Target Tool**: `sparkwavv_genai_call`
- **Fallback Logic**: Delegated to MCP Server
