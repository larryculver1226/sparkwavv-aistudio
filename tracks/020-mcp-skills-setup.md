# Track 020: Set up your coding assistant with Gemini MCP and Skills

## Goal
Integrate Gemini MCP (Model Context Protocol) and Gemini API Development Skills into the project workspace to enhance AI coding assistant capabilities (both in AI Studio and for local IDEs like Cursor/Cline). Additionally, migrate the existing project history (`/tracks`, `CHANGELOG.md`, `docs/`) to integrate seamlessly with this new toolset.

## Approach (Plan)

### 1. Configure Gemini Docs MCP & Skills
- **MCP Configuration**: Create the standard MCP configuration files (e.g., `mcp.json` or `.cursor/mcp.json`) to connect the Gemini Docs MCP server, allowing the assistant to pull real-time Gemini API documentation.
- **Install API Skills**: Add the recommended Gemini API development skills (`gemini-api-dev`, `gemini-live-api-dev`, `gemini-interactions-api`) into the project's agent configuration directory (e.g., `.cursor/rules` or `.agent/skills`) so they are automatically applied to AI interactions.

### 2. Migrate Project History to MCP Toolset
To make the rich history of this project (`/tracks`, `CHANGELOG.md`, `TECH_SPECS.md`) easily accessible to an MCP-enabled coding assistant, we will:
- **Build a Local Project Context MCP Server**: Create a lightweight Node.js MCP server (e.g., in `scripts/mcp-server/`) using the official `@modelcontextprotocol/sdk`.
- **Expose Resources & Tools**: Configure this local MCP server to expose the `/tracks` directory, `CHANGELOG.md`, and `TECH_SPECS.md` as queryable resources and tools (e.g., `get_track_history`, `read_tech_specs`).
- **Data Consolidation**: Ensure all existing tracks are cleanly formatted and indexed so the MCP server can serve them efficiently to the LLM context window.

### 3. Update Workflow (`AGENTS.md`)
- Update `AGENTS.md` to reflect the new MCP-driven workflow. Future tracks and changelog updates will be managed with the awareness that they are being indexed and served via the local Project Context MCP server.

## Status
- [x] Plan
- [x] Setup
- [x] Build
- [x] QA & Testing
