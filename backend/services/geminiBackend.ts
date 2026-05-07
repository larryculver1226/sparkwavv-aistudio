import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { getGeminiApiKey } from '../../src/services/aiConfig';
import { modelArmor } from './modelArmorService';
import { mcpRegistry } from './mcpRegistryClient';

// Lazy initialization of Gemini
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      console.warn('[GeminiBackend] WARNING: GEMINI_API_KEY is not configured in the environment. AI features will fail gracefully.');
      // We don't initialize aiInstance, so subsequent calls will check again or fail gracefully
      return null as any; 
    } else {
      const maskedKey =
        apiKey.length > 8
          ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
          : '****';
      console.log(
        `GeminiBackend: Initializing GoogleGenAI with key: ${maskedKey} (length: ${apiKey.length})`
      );
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export interface UserData {
  onboarding: {
    firstName: string;
    lastName: string;
    jobTitle: string;
    companyOrg: string;
    email: string;
    phone: string;
    programTrack: string;
    lifecycleStage: string;
    outcomesAttributes: string;
    feedbackQuote: string;
    userId: string;
    password?: string;
    // Legacy fields for compatibility
    name: string;
    role: string;
    bio: string;
    industry: string;
  };
  accomplishments: { title: string; description: string }[];
  environment: {
    perfectDay: string;
    extinguishers: string[];
  };
  passions: {
    energizers: string[];
    bestWhen: string;
  };
  attributes: string[];
  tagline: string;
  brandImage?: string;
}

/**
 * Helper to clean and parse JSON from AI response
 */
function safeJsonParse(text: string) {
  try {
    const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonText);
  } catch (e) {
    console.error('[GeminiBackend] JSON Parse Error:', e, text);
    return null;
  }
}

export async function generateBrandImage(
  prompt: string,
  base64Image?: string,
  mimeType?: string,
  size: '512px' | '1K' | '2K' | '4K' = '1K'
) {
  // Model Armor Integration
  const inputSanity = await modelArmor.sanitizePrompt(prompt);
  
  const attachments: any[] = [];
  if (base64Image && mimeType) {
    attachments.push({
      data: base64Image,
      mimeType: mimeType,
    });
  }

  try {
    console.log(`[GeminiBackend] Routing generateBrandImage through MCP Model Registry...`);
    const result = await mcpRegistry.generateContent({
      role: "Visual Brand Designer",
      prompt: `Create a cinematic visual for: ${inputSanity.sanitizedText}. Output purely the image.`,
      attachments
    });

    if (result.attachments && result.attachments.length > 0) {
      const img = result.attachments[0];
      return `data:${img.mimeType || 'image/png'};base64,${img.data}`;
    }
    return null;
  } catch (error: any) {
    console.error('Error generating image:', error);
    const errStr = error.message || String(error);
    if (errStr.includes('Requested entity was not found') || errStr.includes('API_KEY_INVALID') || errStr.includes('expired')) {
      throw new Error('API_KEY_RESET_REQUIRED');
    }
    throw error;
  }
}

export async function generateDiscoverySummary(userData: UserData) {
  // Model Armor Integration - Sanitize user data context
  const context = JSON.stringify(userData);
  const inputSanity = await modelArmor.sanitizePrompt(context);

  const prompt = `
    Act as a high-end career branding strategist for SPARKWavv. 
    Analyze the following user data and generate a "Discovery Summary".
    
    User Context: ${inputSanity.sanitizedText}
  `;

  const schema = {
    type: "object",
    properties: {
      brandPortrait: { type: "string" },
      strengths: { type: "array", items: { type: "string" } },
      careerClusters: { type: "array", items: { type: "string" } },
      nextExperiments: { type: "array", items: { type: "string" } },
      nextSteps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            actionLabel: { type: "string" },
          },
          required: ['title', 'description', 'actionLabel'],
        },
      },
      skillsCloud: { type: "array", items: { type: "string" } },
    },
    required: [
      'brandPortrait',
      'strengths',
      'careerClusters',
      'nextExperiments',
      'nextSteps',
      'skillsCloud',
    ],
  };

  try {
    console.log(`[GeminiBackend] Routing generateDiscoverySummary through MCP Model Registry...`);
    const result = await mcpRegistry.generateContent({
      role: "Strategic Career Branding Strategist",
      prompt,
      responseSchema: JSON.stringify(schema)
    });

    return safeJsonParse(result.text) || {};
  } catch (error: any) {
    console.error('Error generating summary:', error);
    const errStr = error.message || String(error);
    if (errStr.includes('API_KEY_INVALID') || errStr.includes('expired')) {
       return { error: 'API_KEY_EXPIRED', message: 'Please renew your Gemini API Key.' };
    }
    return null;
  }
}

export async function generateCinematicManifesto(userData: UserData) {
  // Model Armor Integration
  const context = JSON.stringify(userData);
  const inputSanity = await modelArmor.sanitizePrompt(context);

  const prompt = `
    Act as a cinematic brand storyteller for SPARKWavv. 
    Based on the following user data, synthesize their "Cinematic Brand Manifesto".
    
    User Context: ${inputSanity.sanitizedText}

    Generate 3 "Brand Pillars".
  `;

  const schema = {
    type: "object",
    properties: {
      pillars: {
        type: "array",
        items: {
          type: "object",
          properties: {
            quote: { type: "string" },
            tagline: { type: "string" },
            visualPrompt: { type: "string" },
          },
          required: ['quote', 'tagline', 'visualPrompt'],
        },
      },
    },
    required: ['pillars'],
  };

  try {
    console.log(`[GeminiBackend] Routing generateCinematicManifesto through MCP Model Registry...`);
    const result = await mcpRegistry.generateContent({
      role: "Cinematic Brand Storyteller",
      prompt,
      responseSchema: JSON.stringify(schema)
    });

    return safeJsonParse(result.text) || {};
  } catch (error: any) {
    console.error('Error generating cinematic manifesto:', error);
    const errStr = error.message || String(error);
    if (errStr.includes('API_KEY_INVALID') || errStr.includes('expired')) {
       return { error: 'API_KEY_EXPIRED', message: 'Please renew your Gemini API Key.' };
    }
    return null;
  }
}

export async function parseResume(fileData: string, mimeType: string) {
  const prompt = `
    Extract information from this resume to build a career brand profile.
  `;

  const schema = {
    type: "object",
    properties: {
      name: { type: "string" },
      email: { type: "string" },
      industry: { type: "string" },
      role: { type: "string" },
      bio: { type: "string" },
      accomplishments: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
          },
          required: ['title', 'description'],
        },
      },
      skills: { type: "array", items: { type: "string" } },
      attributes: { type: "array", items: { type: "string" } },
    },
    required: ['name', 'role', 'bio', 'accomplishments', 'skills', 'attributes', 'industry'],
  };

  try {
    const attachments: any[] = [];
    let customPrompt = prompt;

    if (mimeType === 'text/plain') {
      const inputSanity = await modelArmor.sanitizePrompt(fileData);
      customPrompt = `Resume Content:\n${inputSanity.sanitizedText}\n\n${prompt}`;
    } else {
      attachments.push({
        data: fileData,
        mimeType: mimeType,
      });
    }

    console.log(`[GeminiBackend] Routing parseResume through MCP Model Registry...`);
    const result = await mcpRegistry.generateContent({
      role: "Expert Talent Acquisition & Resume Parser",
      prompt: customPrompt,
      attachments,
      responseSchema: JSON.stringify(schema)
    });

    return safeJsonParse(result.text) || {};
  } catch (error: any) {
    console.error('Error parsing resume:', error);
    const errStr = error.message || String(error);
    if (errStr.includes('API_KEY_INVALID') || errStr.includes('expired')) {
       return { error: 'API_KEY_EXPIRED', message: 'Please renew your Gemini API Key.' };
    }
    return null;
  }
}

export async function generateHomeBenefits(count: number = 5) {
  const prompt = `
    Generate ${count} short, punchy benefit statements for SPARKWavv and its AI assistant, Skylar.
    These statements will be used in a scrolling ticker on the home page.
    Each statement should be a "hook" followed by a benefit, separated by a colon.
  `;

  const schema = {
    type: "object",
    properties: {
      benefits: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ['benefits']
  };

  try {
    console.log(`[GeminiBackend] Routing generateHomeBenefits through MCP Model Registry...`);
    const result = await mcpRegistry.generateContent({
      role: "Marketing Benefit Synchronizer",
      prompt,
      responseSchema: JSON.stringify(schema)
    });

    const data = safeJsonParse(result.text) || { benefits: [] };
    return data.benefits as string[];
  } catch (error) {
    console.error('Error generating home benefits:', error);
    return null;
  }
}
