# Remote MCP on Cloud Run Skill

This module defines the architecture for a remote MCP server hosted on Cloud Run.

## Core Principles
1. **Server-Side Logic:** Host MCP on Cloud Run in region `us-central1`.
2. **TypeScript/Node.js:** Use the same language as the main project.
3. **Tool Definition:** Define structured tools for Firestore and Vertex AI.
4. **Security:** Use API keys or OAuth to secure the MCP endpoint.

## Implementation Patterns

### 1. Basic MCP Server Setup
Use the `@modelcontextprotocol/sdk` to define your server.

```typescript
// src/mcp/server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "firebase-mcp-server",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "query_firestore",
        description: "Query Firestore for career data",
        inputSchema: { ... }
      }
    ]
  };
});
```

### 2. Cloud Run Deployment
- Use a `Dockerfile` to containerize the MCP server.
- Expose a POST endpoint if using HTTP transport instead of Stdio.
- Use `process.env.PORT` for the listening port.

### 3. AI Studio Agent Integration
The AI Studio agent can call this remote server via HTTP.
- Endpoint: `https://[service-name]-[project-number].us-central1.run.app/mcp`
- Authentication: Pass the `GEMINI_API_KEY` or a custom secret in the headers.
