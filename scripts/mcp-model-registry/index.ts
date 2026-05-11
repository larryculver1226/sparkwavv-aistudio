import axios from "axios";
import "../../backend/services/patchFetch.ts";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenAI } from "@google/genai";
import { VertexAI } from "@google-cloud/vertexai";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const MODELS = {
  CORE_REASONING: "gemini-3-flash-preview",
  UTILITY_TASK: "gemini-3-flash-preview",
};

/**
 * Custom fetch to handle the "Referrer <empty>" issue
 * Now simply delegates to the patched global fetch which handles rotation and axios bridging.
 */
const customFetch = async (url: any, options: any) => {
  // Ensure we are using the global patched fetch which handles rotation
  return global.fetch(url, options);
};

// Vertex AI Config
const vertexProjectId = process.env.VERTEX_AI_PROJECT_ID;
const vertexLocation = process.env.VERTEX_AI_LOCATION || 'us-central1';
const isVertexAvailable = vertexProjectId && vertexProjectId.trim() !== '' && !vertexProjectId.includes('gen-lang-client');

let vertexInstance: VertexAI | null = null;
if (isVertexAvailable) {
  try {
    vertexInstance = new VertexAI({ project: vertexProjectId!, location: vertexLocation });
    console.error(`[MCP Registry] Vertex AI initialized for project: ${vertexProjectId}`);
  } catch (e) {
    console.error(`[MCP Registry] Failed to initialize Vertex AI:`, e);
  }
}

const getApiKeys = () => {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.API_KEY,
    process.env.VITE_GEMINI_API_KEY,
    process.env.GOOGLE_AI_API_KEY,
    process.env.GENAI_API_KEY,
    process.env.VITE_FIREBASE_API_KEY,
    process.env.FIREBASE_API_KEY
  ].filter(Boolean) as string[];
  
  // Filter out placeholder patterns
  const validKeys = keys.filter(k => 
    k &&
    k.length > 5 && 
    !k.startsWith('{{') && 
    !k.endsWith('}}') &&
    k !== 'undefined'
  );

  return [...new Set(validKeys)]; // Unique keys only
};

let availableKeys = getApiKeys();
let currentKeyIndex = 0;

const getApiKey = () => {
  if (availableKeys.length === 0) return "";
  const key = availableKeys[currentKeyIndex];
  return key;
};

const rotateApiKey = (isPermanentFailure: boolean = false) => {
  if (isPermanentFailure && availableKeys.length > 0) {
    const failedKey = availableKeys[currentKeyIndex];
    const masked = failedKey ? `${failedKey.substring(0, 4)}...${failedKey.substring(failedKey.length - 4)}` : "unknown";
    console.error(`[MCP Registry] Removing permanently failed key from rotation: ${masked}`);
    availableKeys.splice(currentKeyIndex, 1);
    // currentKeyIndex stays same, but availableKeys is smaller now
    if (currentKeyIndex >= availableKeys.length) currentKeyIndex = 0;
    return availableKeys.length > 0;
  }

  if (availableKeys.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % availableKeys.length;
    console.error(`[MCP Registry] Rotated to next available API key (Index: ${currentKeyIndex}, Total: ${availableKeys.length})`);
    return true;
  }
  return false;
};

/**
 * Smart Generative AI Call with Fallback
 */
async function generateWithFallback(
  contents: any[],
  requestedModel: string = MODELS.CORE_REASONING,
  temperature: number = 0.7,
  retryCount: number = 0
): Promise<any> {
  const apiKey = getApiKey();
  
  // Try Google AI (Primary)
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey, fetch: customFetch });
      const modelId = requestedModel.startsWith('vertexai/') ? requestedModel.split('/')[1] : requestedModel;
      
      console.error(`[MCP Registry] Attempting Google AI: ${modelId} (Key Index: ${currentKeyIndex})`);
      
      const result = await ai.models.generateContent({
        model: modelId,
        contents,
        config: { temperature }
      });
      
      let text = result.text || "";
      const attachments: any[] = [];
      
      if (!text && result.candidates?.[0]?.content?.parts) {
         for (const part of result.candidates[0].content.parts) {
           if (part.text) text += part.text;
           if (part.inlineData) {
             attachments.push({
               data: part.inlineData.data,
               mimeType: part.inlineData.mimeType
             });
           }
         }
      }

      return { text, attachments, model: `googleai/${modelId}`, status: "success" };
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      const errorBody = error.response ? JSON.stringify(error.response.data) : "";
      const combinedError = `${errorMsg} ${errorBody}`;
      
      console.error(`[MCP Registry] Google AI failed: ${combinedError}`);
      
      const isExpired = combinedError.includes('API key expired') || combinedError.includes('API_KEY_INVALID');
      const isAuthError = isExpired || 
                          combinedError.includes('403') ||
                          combinedError.includes('400') ||
                          combinedError.includes('blocked') ||
                          combinedError.includes('PERMISSION_DENIED');

      if (isAuthError && rotateApiKey(isExpired) && retryCount < (availableKeys.length + 1)) {
        console.error(`[MCP Registry] Retrying with different key due to auth error...`);
        return generateWithFallback(contents, requestedModel, temperature, retryCount + 1);
      }
      
      // If Google AI Auth failed and no more keys, try Vertex AI if available
      if (isVertexAvailable && vertexInstance) {
         console.error(`[MCP Registry] Switching to Vertex AI fallback...`);
         return generateWithVertex(contents, requestedModel, temperature);
      }

      return {
        text: `I'm sorry, my Gemini API Key appears to be expired or blocked. Error: ${combinedError}`,
        model: requestedModel,
        status: "error_api_key",
        originalError: combinedError
      };
    }
  } else if (isVertexAvailable && vertexInstance) {
     return generateWithVertex(contents, requestedModel, temperature);
  }

  throw new Error("No valid AI provider (Google AI or Vertex AI) available.");
}

async function generateWithVertex(contents: any[], modelId: string, temperature: number): Promise<any> {
  if (!vertexInstance) throw new Error("Vertex AI not initialized");
  
  const rawModelId = modelId.includes('/') ? modelId.split('/')[1] : modelId;
  console.error(`[MCP Registry] Attempting Vertex AI: ${rawModelId}`);
  
  const model = vertexInstance.getGenerativeModel({
    model: rawModelId,
    generationConfig: { temperature }
  });

  try {
    const result = await model.generateContent({ contents });
    const response = await result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    return {
      text,
      model: `vertexai/${rawModelId}`,
      status: "success"
    };
  } catch (e: any) {
    console.error(`[MCP Registry] Vertex AI failed:`, e.message);
    throw e;
  }
}

/**
 * MCP Server Implementation
 */
const server = new Server(
  {
    name: "sparkwavv-model-registry",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "sparkwavv_genai_call",
        description: "Executes a Generative AI call with built-in model abstraction and smart fallback (Gemini 2.0 -> 1.5). Use this for all Sparkwavv AI features.",
        inputSchema: {
          type: "object",
          properties: {
            role: {
              type: "string",
              description: "The intended persona or role for the AI (e.g., 'Career Coach', 'Data Analyst').",
            },
            prompt: {
              type: "string",
              description: "The complete prompt text to process.",
            },
            temperature: {
              type: "number",
              description: "Optional temperature for generation (default 0.7).",
              minimum: 0,
              maximum: 1,
            },
            responseSchema: {
              type: "string",
              description: "Optional JSON Schema for structured output (Gemini style).",
            },
            attachments: {
              type: "array",
              description: "Optional multimodal attachments (base64).",
              items: {
                type: "object",
                properties: {
                  data: { type: "string", description: "Base64 encoded file data." },
                  mimeType: { type: "string", description: "MIME type (e.g., 'application/pdf', 'image/png')." }
                },
                required: ["data", "mimeType"]
              }
            },
            messages: {
              type: "array",
              description: "Optional chat history (Gemini format).",
              items: { type: "object" }
            },
            useUtilityModel: {
              type: "boolean",
              description: "If true, bypasses CORE_REASONING and uses the UTILITY_TASK model immediately.",
            }
          },
          required: ["prompt", "role"],
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "sparkwavv_genai_call") {
    throw new Error("Unknown tool");
  }

  const { role, prompt, temperature, responseSchema, attachments, useUtilityModel, messages } = request.params.arguments as any;
  
  let fullPrompt = `Role: ${role}\n\nTask:\n${prompt}${responseSchema ? '\n\nOutput MUST adhere to this JSON Schema: ' + responseSchema : ''}`;
  
    // Add the new prompt and attachments
    const parts: any[] = [{ text: prompt }];
    if (attachments && attachments.length > 0) {
      attachments.forEach((att: any) => {
        parts.push({
          inlineData: {
            data: att.data,
            mimeType: att.mimeType
          }
        });
      });
    }
    
    // Safety: ensure no nested roles or invalid keys in history parts
    const sanitizedMessages = (messages || []).map((m: any) => {
      // Normalize role
      const msgRole = (m.role === 'user' || m.role === 'user' || m.role === 'user_role') ? 'user' : 'model';
      
      const msgParts: any[] = [];
      const partsToProcess = m.parts || m.content || [];
      
      (Array.isArray(partsToProcess) ? partsToProcess : [partsToProcess]).forEach((p: any) => {
        if (typeof p === 'string') {
          msgParts.push({ text: p });
        } else if (p && typeof p === 'object') {
          // If the part itself looks like a Content object (has parts), flatten it
          if (p.parts && Array.isArray(p.parts)) {
            p.parts.forEach((subPart: any) => {
              if (typeof subPart === 'string') msgParts.push({ text: subPart });
              else {
                 const { role, parts, ...rest } = subPart;
                 if (Object.keys(rest).length > 0) msgParts.push(rest);
              }
            });
          } else {
            // Standard part: strip role and parts keys to prevent Gemini rejection
            const { role, parts, ...rest } = p;
            // Only add if there are valid part keys (text, inlineData, etc)
            if (rest.text || rest.inlineData || rest.fileData || rest.functionCall || rest.functionResponse) {
               msgParts.push(rest);
            } else if (Object.keys(rest).length > 0) {
               // Fallback for custom or unknown part types
               msgParts.push(rest);
            }
          }
        }
      });

      return { role: msgRole, parts: msgParts.length > 0 ? msgParts : [{ text: ' ' }] };
    });

    const contents: any[] = sanitizedMessages;
    
    // Prepended system info 
    if (contents.length === 0 || contents[0].role !== 'model') {
       contents.unshift({ role: 'model', parts: [{ text: `I will act as: ${role}` }] });
    }
    
    contents.push({ role: 'user', parts });
  
  const targetModel = useUtilityModel ? MODELS.UTILITY_TASK : MODELS.CORE_REASONING;

  try {
    const result = await generateWithFallback(contents, targetModel, temperature);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Run the server
 */
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Sparkwavv Model Registry MCP Server running on stdio");
}

run().catch((error) => {
  console.error("Fatal error in MCP Server:", error);
  process.exit(1);
});
