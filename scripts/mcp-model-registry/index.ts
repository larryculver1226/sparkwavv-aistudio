import axios from "axios";

/**
 * Referrer Fix: Global fetch override for Node.js 18+ to ensure referer is never empty.
 * This resolves 403 Forbidden errors from restricted API keys.
 * MUST BE AT THE VERY TOP before other imports.
 */
if (typeof fetch !== 'undefined') {
  // Use a symbol to track if we've already patched
  const FETCH_PATCHED = Symbol.for('sparkwavv_fetch_patched');
  
  if (!(global as any)[FETCH_PATCHED]) {
    const systemFetch = fetch;
    const appUrl = "https://ais-dev-6de5lrtpnvciah3xwxmagf-232918548667.us-east1.run.app";
    const sharedUrl = "https://ais-pre-6de5lrtpnvciah3xwxmagf-232918548667.us-east1.run.app";

    // @ts-ignore
    global.fetch = async (url, options: any = {}) => {
      const urlStr = url.toString();
      // Only apply referer rotation to Google AI APIs
      if (!urlStr.includes('googleapis.com')) {
        return systemFetch(url, options);
      }

      const tryFetch = async (referer: string | null) => {
        const headers: Record<string, string> = {};
        
        // Copy original headers
        if (options.headers) {
          if (options.headers instanceof Headers) {
            options.headers.forEach((v, k) => { headers[k] = v; });
          } else if (Array.isArray(options.headers)) {
            options.headers.forEach(([k, v]) => { headers[k] = v; });
          } else {
            Object.assign(headers, options.headers);
          }
        }

        if (referer) {
          headers['Referer'] = referer;
          headers['Origin'] = referer;
        }

        try {
          // Use axios as it's more reliable for setting forbidden headers in Node
          const axiosRes = await axios({
            url: urlStr,
            method: (options.method || 'GET').toUpperCase(),
            data: options.body,
            headers,
            responseType: 'arraybuffer',
            validateStatus: () => true, // Don't throw on non-200
          });

          // Convert axios response back to fetch-like Response
          return new Response(axiosRes.data, {
            status: axiosRes.status,
            statusText: axiosRes.statusText,
            headers: axiosRes.headers as any,
          });
        } catch (e: any) {
          console.error(`[MCP Registry Patch] Axios bridge failed for ${urlStr}: ${e.message}`);
          return systemFetch(url, options);
        }
      };

      // First attempt with shared url
      let response = await tryFetch(sharedUrl);
      
      // If blocked, try dev url
      if (response.status === 403) {
        response = await tryFetch(appUrl);
      }
      
      // If still blocked, try without referer
      if (response.status === 403) {
        response = await tryFetch(null);
      }

      return response;
    };
    (global as any)[FETCH_PATCHED] = true;
    (global as any).systemFetch = systemFetch;
    console.error("[MCP Registry] Global fetch patched with Axios bridge for Referer support");
  }
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const MODELS = {
  CORE_REASONING: "gemini-1.5-flash",
  UTILITY_TASK: "gemini-1.5-flash",
};

/**
 * Custom fetch to handle the "Referrer <empty>" issue
 */
const customFetch = async (url: any, options: any) => {
  const appUrl = "https://ais-dev-6de5lrtpnvciah3xwxmagf-232918548667.us-east1.run.app";
  const sharedUrl = "https://ais-pre-6de5lrtpnvciah3xwxmagf-232918548667.us-east1.run.app";
  
  const isGoogleApi = url.toString().includes('googleapis.com');
  if (!isGoogleApi) return fetch(url, options);

  const tryWithReferer = async (referer: string | null) => {
    const headers = new Headers(options?.headers || {});
    if (referer) {
      headers.set("Referer", referer);
      headers.set("referer", referer);
      headers.set("Origin", referer);
      headers.set("origin", referer);
    } else {
      headers.delete("Referer");
      headers.delete("referer");
      headers.delete("Origin");
      headers.delete("origin");
    }
    
    const plainHeaders: Record<string, string> = {};
    headers.forEach((v, k) => plainHeaders[k] = v);
    
    // We use the patched global fetch or original if available
    // But since we are already handling referer here, 
    // we want to avoid infinite recursion if fetch is patched.
    // If FETCH_PATCHED is true, we should use the hidden systemFetch.
    const FETCH_PATCHED = Symbol.for('sparkwavv_fetch_patched');
    const systemFetch = (global as any)[FETCH_PATCHED] ? (global as any).systemFetch : fetch;
    
    return (systemFetch || fetch)(url, { ...options, headers: plainHeaders });
  };

  let response = await tryWithReferer(sharedUrl);
  if (response.status === 403) {
    console.error(`[MCP customFetch] 403 for ${sharedUrl}, trying ${appUrl}`);
    response = await tryWithReferer(appUrl);
  }
  if (response.status === 403) {
    console.error(`[MCP customFetch] 403 for ${appUrl}, trying WITHOUT referer`);
    response = await tryWithReferer(null);
  }
  return response;
};

// Initialize Google AI with custom fetch if possible
// Note: @google/generative-ai uses standard fetch, we can override globally or pass in if SDK supports it.
// Node 18+ has global fetch.

const getApiKeys = () => {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.API_KEY,
    process.env.VITE_GEMINI_API_KEY,
    process.env.GOOGLE_AI_API_KEY,
    process.env.GENAI_API_KEY
  ].filter(Boolean) as string[];
  
  console.error(`[MCP Registry] Detected ${keys.length} potential keys in environment.`);
  
  // Filter out placeholder patterns like {{...}} or empty placeholders
  const validKeys = keys.filter(k => 
    k &&
    k.length > 5 && 
    !k.startsWith('{{') && 
    !k.endsWith('}}') &&
    k !== 'undefined'
  );

  console.error(`[MCP Registry] Found ${validKeys.length} valid keys after filtering.`);
  return [...new Set(validKeys)]; // Unique keys only
};

let availableKeys = getApiKeys();
let currentKeyIndex = 0;

const getApiKey = () => {
  if (availableKeys.length === 0) return "";
  const key = availableKeys[currentKeyIndex];
  const masked = `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  console.error(`[MCP Registry] Using Key Index ${currentKeyIndex}: ${masked}`);
  return key;
};

const rotateApiKey = () => {
  if (availableKeys.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % availableKeys.length;
    console.error(`[MCP Registry] Rotated to next available API key (Index: ${currentKeyIndex}, Total: ${availableKeys.length})`);
    return true;
  }
  console.error(`[MCP Registry] No more keys to rotate to (Total: ${availableKeys.length})`);
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
  if (!apiKey) {
    throw new Error("Missing Gemini API Key in MCP environment.");
  }

  const ai = new GoogleGenAI({ apiKey, fetch: customFetch });
  
  // Try Primary Model
  try {
    console.error(`[MCP Registry] Attempting generation with primary model: ${requestedModel} (Key Index: ${currentKeyIndex})`);
    
    // Convert contents to the format expected by @google/genai if it's not already
    // The @google/genai generateContent expects { model, contents }
    const result = await ai.models.generateContent({
      model: requestedModel,
      contents,
      config: { temperature }
    });
    
    let text = result.text || "";
    const attachments: any[] = [];
    
    // We can iterate through candidates parts if needed, but result.text is usually enough
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

    return {
      text: text,
      attachments,
      model: requestedModel,
      status: "success"
    };
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    console.error(`[MCP Registry] Primary model failed: ${errorMsg}`);

    // Critical: If key is expired or invalid, reporting it is better than trying fallback if it uses same key
    const isApiKeyError = errorMsg.includes('API key expired') || 
                          errorMsg.includes('API_KEY_INVALID') || 
                          errorMsg.includes('403') ||
                          errorMsg.includes('400') ||
                          errorMsg.includes('blocked') ||
                          errorMsg.includes('referer') ||
                          errorMsg.includes('forbidden');

    if (isApiKeyError) {
      if (rotateApiKey() && retryCount < availableKeys.length) {
        return generateWithFallback(contents, requestedModel, temperature, retryCount + 1);
      }
      return {
        text: `I'm sorry, my Gemini API Key appears to be expired or invalid. Please renew the API key in the Google AI Studio settings to restore my intelligence capabilities. (Error: ${errorMsg})`,
        model: requestedModel,
        status: "error_api_key",
        originalError: errorMsg
      };
    }

    const isModelUnavailable = errorMsg.includes("404") || errorMsg.includes("not found") || errorMsg.includes("permission");
    
    if (isModelUnavailable && requestedModel !== MODELS.UTILITY_TASK) {
      console.error(`[MCP Registry] Primary model ${requestedModel} failed or unavailable. Falling back to ${MODELS.UTILITY_TASK}.`);
      
      // Fallback to Utility Model
      try {
        const result = await generateWithFallback(contents, MODELS.UTILITY_TASK, temperature, retryCount);
        return {
          ...result,
          status: result.status === 'success' ? "fallback_success" : result.status,
          originalError: errorMsg
        };
      } catch (fallbackError: any) {
        return {
          text: `Critical Failure: Primary and Fallback models failed. ${errorMsg}`,
          model: requestedModel,
          status: "failure"
        };
      }
    }
    
    throw error;
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
