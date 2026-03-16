import { GoogleGenAI, Modality } from "@google/genai";

// For frontend, we use the environment variable directly as per guidelines
const getApiKey = () => process.env.GEMINI_API_KEY || '';

export type SkylarPersona = 'discovery' | 'branding' | 'outreach' | 'rpp';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const PERSONA_CONFIG = {
  discovery: {
    name: 'Skylar Discovery Architect',
    voice: 'Kore',
    instruction: "You are the Skylar Discovery Architect. Your goal is to help the user identify their 'best self' through attribute extraction from their accomplishments and exercises. Be professional, clear, and analytical. Focus on 'bringing attributes to life'."
  },
  branding: {
    name: 'Skylar Narrative Journalist',
    voice: 'Zephyr',
    instruction: "You are the Skylar Narrative Journalist. Your goal is to help the user transform their accomplishments into dual-perspective stories: a factual 'Journalist' version and an emotional 'Reflective' version. Be calm, steady, and encouraging of emotional depth."
  },
  outreach: {
    name: 'Skylar Kickspark Drill Master',
    voice: 'Puck',
    instruction: "You are the Skylar Kickspark Drill Master. Your goal is to enforce the 80/20 rule and ensure the user is maintaining their 3.5-7 hour weekly commitment. Be energetic, bright, and focused on execution and financial ROI."
  },
  rpp: {
    name: 'Skylar Role Playing Partner',
    voice: 'Kore', // Default, but can adapt
    instruction: "You are acting as the user's Role Playing Partner (RPP). Your job is to audit their 'Five Stories' for factual accuracy and emotional depth. Be a 'Hard Trainer' for facts and a 'Soft Coach' for feelings. You must validate their work before they can proceed."
  }
};

class SkylarService {
  private getAI() {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. AI features will be limited.");
    }
    return new GoogleGenAI({ apiKey });
  }

  async generateResponse(
    persona: SkylarPersona,
    message: string,
    history: ChatMessage[] = [],
    wavvaultContext?: any
  ): Promise<string> {
    const ai = this.getAI();
    const config = PERSONA_CONFIG[persona];
    const systemInstruction = `${config.instruction}\n\nContext from Wavvault: ${JSON.stringify(wavvaultContext || {})}\n\nRemember interactions from previous journeys if relevant.`;

    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction,
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: msg.parts
      }))
    });

    const response = await chat.sendMessage({ message });
    return response.text || "I'm sorry, I couldn't process that.";
  }

  async generateSpeech(text: string, persona: SkylarPersona): Promise<string> {
    const ai = this.getAI();
    const voiceName = PERSONA_CONFIG[persona].voice;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio ? `data:audio/mp3;base64,${base64Audio}` : '';
  }

  // Helper to save chat to Wavvault (would be called from component)
  async saveChatToWavvault(userId: string, history: ChatMessage[]) {
    // This would typically call a backend API to save to Firestore
    try {
      await fetch('/api/wavvault/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, history })
      });
    } catch (error) {
      console.error("Error saving chat:", error);
    }
  }

  async getChatHistory(userId: string): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`/api/wavvault/chat?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        return data.history || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching chat history:", error);
      return [];
    }
  }
}

export const skylar = new SkylarService();
