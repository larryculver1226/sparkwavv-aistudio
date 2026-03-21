import { GoogleGenAI, Type } from "@google/genai";
import { getGeminiApiKey } from './aiConfig.ts';

// Lazy initialization of Gemini
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      console.error("GeminiService: GEMINI_API_KEY is missing.");
      throw new Error("GEMINI_API_KEY is not configured in the environment variables. Please check your AI Studio settings.");
    } else {
      const maskedKey = apiKey.length > 8 ? `${apiKey.substring(0, 4) }...${apiKey.substring(apiKey.length - 4)}` : "****";
      console.log(`GeminiService: Initializing GoogleGenAI with key: ${maskedKey} (length: ${apiKey.length})`);
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

export async function generateBrandImage(
  prompt: string, 
  base64Image?: string, 
  mimeType?: string,
  size: "1K" | "2K" | "4K" = "1K"
) {
  const ai = getAI();
  
  const parts: any[] = [{ text: prompt }];
  if (base64Image && mimeType) {
    parts.push({
      inlineData: {
        data: base64Image,
        mimeType: mimeType
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: size
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    console.error("Error generating image:", error);
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_RESET");
    }
    throw error;
  }
}

export async function generateDiscoverySummary(userData: UserData) {
  const prompt = `
    Act as a high-end career branding strategist for SPARKWavv. 
    Analyze the following user data and generate a "Discovery Summary".
    
    User Data:
    - Name: ${userData.onboarding.name}
    - Email: ${userData.onboarding.email}
    - Industry: ${userData.onboarding.industry}
    - Current Role/Background: ${userData.onboarding.role}
    - Bio: ${userData.onboarding.bio}
    - Accomplishments: ${userData.accomplishments.map(a => `${a.title}: ${a.description}`).join("; ")}
    - Perfect Day: ${userData.environment.perfectDay}
    - Extinguishers (Deal-breakers): ${userData.environment.extinguishers.join(", ")}
    - Passions/Energizers: ${userData.passions.energizers.join(", ")}
    - Best-When Conditions: ${userData.passions.bestWhen}
    - Brand Attributes: ${userData.attributes.join(", ")}
    - Career Tagline: ${userData.tagline}

    Output a JSON object with:
    1. brandPortrait: A cinematic 2-sentence description of their unique value.
    2. strengths: Top 3 core strengths derived from stories.
    3. careerClusters: 2-3 aligned career direction clusters (e.g., "Creative Strategy in Fintech").
    4. nextExperiments: 3-5 concrete projects or courses to test their brand.
    5. nextSteps: 3-4 actionable next steps with a title, description, and action label (e.g., "Update LinkedIn", "Network in Fintech").
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brandPortrait: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            careerClusters: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextExperiments: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  actionLabel: { type: Type.STRING }
                },
                required: ["title", "description", "actionLabel"]
              }
            }
          },
          required: ["brandPortrait", "strengths", "careerClusters", "nextExperiments", "nextSteps"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating summary:", error);
    return null;
  }
}

export async function parseResume(fileData: string, mimeType: string) {
  const prompt = `
    Extract the following information from this resume to help build a career brand:
    1. Full Name
    2. Email (if found)
    3. Industry (select the best fit from: Aerospace, Automotive, Construction, Defense, Education, Energy, Finance, Government, Healthcare, Hospitality, Legal, Logistics, Manufacturing, Media & Entertainment, Real Estate, Retail, Skilled Trades, Technology, Transportation)
    4. Current or most recent professional role
    5. A brief, professional bio (2-3 sentences) based on their experience.
    4. Top 3 notable projects or accomplishments (each with a short title and 1-2 sentence description).
    5. A list of 5-8 key professional skills or "energizers".
    6. 3-5 professional attributes or archetypes (e.g., Creator, Strategist, Catalyst).

    Output as JSON.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: fileData,
            mimeType: mimeType
          }
        },
        {
          text: prompt
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            email: { type: Type.STRING },
            industry: { type: Type.STRING },
            role: { type: Type.STRING },
            bio: { type: Type.STRING },
            accomplishments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "description"]
              }
            },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            attributes: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "role", "bio", "accomplishments", "skills", "attributes", "industry"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error parsing resume:", error);
    return null;
  }
}
