# Track 071: Suggested Tools & Plugins for Expansion and Model Context Protocol

**Status**: Planning
**Date**: 2026-04-18
**Objective**: Elevate the Genkit development environment by implementing Flow orchestration, Vector Indexing for RAG, Dotprompt modularity, Native File APIs for context ingestion, Web Search (Tavily) tools, and Model Context Protocol (MCP) integration.

## 1. Specification
- **Flow Orchestration (`ai.defineFlow`)**: Transition from simple tool execution to full lifecycle flows, natively supporting tracing and UI streaming.
- **Vector Indexing**: Power `search_wavvault` by integrating a real vector store (e.g., Pinecone or Firestore Vector Search) using Genkit plugins.
- **Prompt Modularity (`dotprompt`)**: Move massive persona strings out of application code into configurable `.prompt` files containing YAML schema and Handlebars templates.
- **Native Context Ingestion**: Move away from manual `pdf.js` / `mammoth.js` parsing to use the Genkit / Google GenAI File API.
- **Live Search**: Mount a search tool (like Tavily) enabling the Market Intelligence Grid to provide real-time, non-hallucinated trends.
- **MCP Ecosystem**: Connect Genkit backend to the existing local MCP server (`scripts/mcp-server/index.ts`) using the `@modelcontextprotocol/sdk`.

## 2. Technical Plan

### Phase 1: Preparation & Clean up
1. **Dependencies**: 
   - `npm install @genkit-ai/dotprompt @modelcontextprotocol/sdk json-schema-to-zod`
   - Evaluate Tavily SDK and a vector store SDK (e.g., `@genkit-ai/firebase` indexing or `@vectorize/genkit-pinecone`).

### Phase 2: Refactoring Skylar's Prompts
1. **Implement Dotprompt**:
   - Create a `backend/prompts` directory.
   - Extract Skylar's base persona logic from `src/utils/interpolation.ts` and `src/services/skylarService.ts`.
   - Recreate them as `skylarDiveIn.prompt`, `skylarGateReview.prompt`, etc.
   - *Impact*: Much cleaner codebase, separating LLM steering logic from business logic. Prompts become natively discoverable by the Genkit Dev UI.

### Phase 3: Genkit Flows Implementation
1. **Convert Tools to Flows**:
   - Go to `backend/services/genkitService.ts`.
   - Wrap our primary interactions through an orchestrating flow (`ai.defineFlow('DiveInChatFlow')`) instead of just pushing strings directly against `@google/genai`.
   - *Impact*: Telemetry and Observability dramatically improve in the AgentOps UI and Genkit Dashboard. Flow state allows resumable, standardized conversational handling.

### Phase 4: Enhancing the Skills (File API & Search)
1. **Rework File Ingestion**:
   - Refactor `server.ts` POST `/api/parse-document`. Instead of extracting raw text using Node packages, upload the document buffer using the Genkit File Manager, pass the file URI to Gemini, and let Genkit handle context parsing.
2. **Add Live Tools**:
   - Add a `search_web` Genkit tool specifically bound or scoped for Market Intelligence Grid queries.

### Phase 5: MCP Integration Bridge
1. **Build the Bridge (`backend/services/mcpBridge.ts`)**:
   - Initialize an MCP client.
   - Connect typically over stdio to the local `scripts/mcp-server/index.ts`.
   - Call `mcpClient.listTools()`.
   - Iterate and dynamically wrap the MCP definitions inside `ai.defineTool({ ... }, async (args) => { ... mcpClient.callTool(...) })` so Skylar can execute them.
   - *Impact*: Skylar gains instant access to file/project tracking infrastructure stored in the MCP server with near-zero extra mapping code.

## 3. Progress
- [x] Track Initialized
- [x] Dependencies Installed
- [x] Dotprompt architecture created
- [x] Orchestration Flows established
- [x] File API integrated
- [x] MCP Bridge built and tested

