import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../../");

const server = new Server(
  {
    name: "sparkwavv-context",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_changelog",
        description: "Read the project CHANGELOG.md to understand recent changes.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_tech_specs",
        description: "Read the project TECH_SPECS.md to understand architecture and data models.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_tracks",
        description: "List all track files in the /tracks directory.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_track",
        description: "Read a specific track file to understand its history and decisions.",
        inputSchema: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "The name of the track file (e.g., 020-mcp-skills-setup.md)",
            },
          },
          required: ["filename"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "get_changelog": {
        const content = fs.readFileSync(path.join(PROJECT_ROOT, "CHANGELOG.md"), "utf-8");
        return { content: [{ type: "text", text: content }] };
      }
      case "get_tech_specs": {
        const content = fs.readFileSync(path.join(PROJECT_ROOT, "docs/TECH_SPECS.md"), "utf-8");
        return { content: [{ type: "text", text: content }] };
      }
      case "list_tracks": {
        const tracksDir = path.join(PROJECT_ROOT, "tracks");
        if (!fs.existsSync(tracksDir)) {
          return { content: [{ type: "text", text: "No tracks directory found." }] };
        }
        const files = fs.readdirSync(tracksDir).filter(f => f.endsWith(".md"));
        return { content: [{ type: "text", text: files.join("\n") }] };
      }
      case "get_track": {
        const filename = String(request.params.arguments?.filename);
        const trackPath = path.join(PROJECT_ROOT, "tracks", filename);
        if (!fs.existsSync(trackPath)) {
          return { content: [{ type: "text", text: `Track ${filename} not found.` }], isError: true };
        }
        const content = fs.readFileSync(trackPath, "utf-8");
        return { content: [{ type: "text", text: content }] };
      }
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Sparkwavv Context MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
