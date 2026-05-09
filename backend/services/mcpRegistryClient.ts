import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface GenAICallArgs {
  role: string;
  prompt: string;
  temperature?: number;
  responseSchema?: string;
  attachments?: { data: string; mimeType: string }[];
  messages?: any[];
  useUtilityModel?: boolean;
}

export interface GenAICallResult {
  text: string;
  attachments?: { data: string; mimeType: string }[];
  model: string;
  status: string;
  originalError?: string;
}

/**
 * MCP Client for Sparkwavv Model Registry
 */
export class McpModelRegistryClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;

  private static instance: McpModelRegistryClient;

  private constructor() {}

  public static getInstance(): McpModelRegistryClient {
    if (!McpModelRegistryClient.instance) {
      McpModelRegistryClient.instance = new McpModelRegistryClient();
    }
    return McpModelRegistryClient.instance;
  }

  /**
   * Connects to the MCP Model Registry server
   */
  public async connect(): Promise<void> {
    if (this.client) return;

    // Resolve path to the registry server
    // Assuming we are in backend/services/mcpRegistryClient.ts
    // scripts/mcp-model-registry/index.ts is relative to project root
    const serverPath = path.resolve(process.cwd(), "scripts/mcp-model-registry/index.ts");
    
    console.log(`[MCP Client] Connecting to Model Registry at: ${serverPath}`);

    this.transport = new StdioClientTransport({
      command: "npx",
      args: ["-y", "tsx", serverPath],
      env: {
        ...process.env,
        // Ensure specific keys are definitely passed even if shell environment is sparse
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
        API_KEY: process.env.API_KEY || '',
        APP_URL: process.env.APP_URL || '',
        SHARED_APP_URL: process.env.SHARED_APP_URL || '',
        VITE_APP_URL: process.env.VITE_APP_URL || process.env.APP_URL || '',
        VITE_SHARED_APP_URL: process.env.VITE_SHARED_APP_URL || process.env.SHARED_APP_URL || '',
        VERTEX_AI_PROJECT_ID: process.env.VERTEX_AI_PROJECT_ID || '',
        VERTEX_AI_LOCATION: process.env.VERTEX_AI_LOCATION || ''
      } as any
    });

    this.client = new Client(
      {
        name: "sparkwavv-web-app",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    await this.client.connect(this.transport);
    console.log("[MCP Client] Connected to Sparkwavv Model Registry");
  }

  /**
   * Calls the sparkwavv_genai_call tool
   */
  public async generateContent(args: GenAICallArgs): Promise<GenAICallResult> {
    await this.connect();

    if (!this.client) {
      throw new Error("MCP Client not initialized");
    }

    try {
      const response = await this.client.callTool({
        name: "sparkwavv_genai_call",
        arguments: args,
      });

      if (response.isError) {
        throw new Error(`MCP Tool Error: ${JSON.stringify(response.content)}`);
      }

      // The content should be a JSON string as per our server implementation
      const content = response.content as any[];
      const resultText = content[0]?.text;
      
      if (!resultText) {
        throw new Error("MCP Tool returned empty content");
      }

      return JSON.parse(resultText) as GenAICallResult;
    } catch (error) {
      console.error("[MCP Client] generateContent failed:", error);
      throw error;
    }
  }

  /**
   * Gracefully close the connection
   */
  public async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.client = null;
      this.transport = null;
      console.log("[MCP Client] Disconnected from Model Registry");
    }
  }
}

export const mcpRegistry = McpModelRegistryClient.getInstance();
