# Track 027: Migrate Skylar Logic to LangGraph

## Objective
Refactor Skylar's custom orchestration loop into a formal, stateful graph structure using LangGraph. This will provide better state management, easier debugging, and a more robust foundation for complex multi-agent or multi-step workflows.

## Context
Currently, `skylarService.ts` uses a custom `while` loop to handle tool calls and message history with the `@google/genai` SDK. By migrating to LangGraph (`@langchain/langgraph`), we can formalize this into nodes (e.g., LLM reasoning, Tool execution) and conditional edges.

## Plan
1. **Install Dependencies**: Install `@langchain/langgraph`, `@langchain/core`, and `@langchain/google-genai` (to interface Gemini with LangChain/LangGraph).
2. **Define Graph State**: Create a State interface (e.g., `messages`, `stageConfig`, `userContext`) to hold the conversation and execution state.
3. **Build Nodes & Edges**:
   - **Agent Node**: Invokes the Gemini model with the current state and bound tools.
   - **Tool Node**: Executes the tools requested by the model.
   - **Conditional Edges**: Routes back to the Agent if tools were called, or ends the execution if a final response is generated.
4. **Refactor `skylarService.ts`**: Replace the existing `chatWithVertex` custom loop with the compiled LangGraph execution (`app.invoke(...)`).
5. **Testing**: Verify that existing tools (like `create_sparkwavv_account`, `perform_gate_review`) still trigger correctly and return their actions to the UI.

## Status
- [x] Plan
- [x] Setup
- [x] Build
- [x] QA & Testing
