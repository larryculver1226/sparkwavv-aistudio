import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { z } from 'zod';
import { ai } from './genkitService.js';
import jsonSchemaToZod from 'json-schema-to-zod';

export let mcpClient: Client | null = null;
export let mcpTools: any[] = [];

// Convert JSON Schema to Zod Schema string and parse it (simple fallback if complex)
function schemaToZodObj(schema: any): z.ZodTypeAny {
  try {
    // Basic conversion logic to map simple JSON schemas to primitive zod types
    if (!schema || !schema.properties) return z.any().describe(schema?.description || "Dynamic input");
    
    // Fallback: Just return `z.any()` right now to pass validation for dynamically fetched schemas,
    // since `jsonSchemaToZod` usually generates string code, not executable Zod objects.
    // For a robust implementation we define an object schema that accepts generic record.
    return z.record(z.any());
  } catch (error) {
    return z.any();
  }
}

export async function initializeMcpClient() {
  if (mcpClient) return mcpTools;

  try {
    const transport = new StdioClientTransport({
      command: "npx",
      args: ["tsx", "scripts/mcp-server/index.ts"]
    });

    mcpClient = new Client({
      name: "sparkwavv-genkit-mcp-client",
      version: "1.0.0",
    }, {
      capabilities: {
        tools: {},
      }
    });

    await mcpClient.connect(transport);
    
    const toolsResponse = await mcpClient.listTools();
    
    mcpTools = toolsResponse.tools.map(mcpTool => {
      // Define a dynamic tool map inside Genkit
      return ai.defineTool(
        {
          name: mcpTool.name,
          description: mcpTool.description || `MCP Tool: ${mcpTool.name}`,
          inputSchema: z.any().describe("JSON arguments for tool"), // Using generic any for remote tools
        },
        async (input) => {
          if (!mcpClient) throw new Error("MCP Client not connected");
          const result = await mcpClient.callTool({
            name: mcpTool.name,
            arguments: input as any
          });
          return { content: result.content };
        }
      );
    });

    console.log(`[MCP Bridge] Successfully connected. Loaded ${mcpTools.length} tools from local MCP server.`);
    return mcpTools;
  } catch (error) {
    console.error("[MCP Bridge] Failed to initialize:", error);
    return [];
  }
}
