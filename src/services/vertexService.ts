import { SearchServiceClient } from '@google-cloud/discoveryengine';
import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = process.env.VERTEX_AI_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const LOCATION = process.env.VERTEX_AI_LOCATION || 'global';
const ENGINE_ID = process.env.VERTEX_AI_SEARCH_ENGINE_ID;
const DATA_STORE_ID = process.env.VERTEX_AI_SEARCH_DATA_STORE_ID;

// Initialize clients
const searchClient = new SearchServiceClient();
const vertexAI = new VertexAI({ project: PROJECT_ID || '', location: 'us-central1' });

export class VertexService {
  /**
   * Search the Wavvault using Vertex AI Search (Managed RAG)
   */
  async searchWavvault(query: string, userId?: string): Promise<any> {
    if (!PROJECT_ID || !ENGINE_ID) {
      console.warn('[VERTEX] Missing Project ID or Engine ID for Search.');
      return null;
    }

    const servingConfig = `projects/${PROJECT_ID}/locations/${LOCATION}/collections/default_collection/engines/${ENGINE_ID}/servingConfigs/default_search`;

    const request = {
      servingConfig,
      query,
      pageSize: 10,
      filter: userId ? `userId: ANY("${userId}")` : undefined, // Example filter for multi-tenancy
    };

    try {
      const [response]: any = await searchClient.search(request);
      return response.results || response;
    } catch (error: any) {
      console.error('[VERTEX SEARCH ERROR]', error.message || error);
      return null;
    }
  }

  /**
   * Use MedLM for Healthcare sector career intelligence
   */
  async getHealthcareInsight(prompt: string): Promise<string | null> {
    const modelId = process.env.VERTEX_AI_MEDLM_MODEL_ID || 'medlm-medium';
    const generativeModel = vertexAI.getGenerativeModel({
      model: modelId,
    });

    try {
      const result = await generativeModel.generateContent(prompt);
      const response = await result.response;
      return response.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error: any) {
      console.error('[VERTEX MEDLM ERROR]', error.message || error);
      return null;
    }
  }

  /**
   * Simulate the Philip Lobkowicz Fine-Tuned Model
   * (In a real scenario, this would call a specific Vertex AI endpoint)
   */
  async getLobkowiczCoaching(prompt: string): Promise<string | null> {
    // Placeholder for fine-tuned model endpoint
    // In production, this would use vertexAI.getGenerativeModel({ model: 'projects/.../endpoints/...' })
    const generativeModel = vertexAI.getGenerativeModel({
      model: 'gemini-1.5-pro', // Fallback to standard pro if fine-tuned not yet deployed
    });

    const systemInstruction = `
      You are Skylar, but you are operating with the Philip Lobkowicz Strategic Coaching Methodology.
      Your tone is professional, strategic, and "tough love." 
      Focus on the "Five Stories" framework and "Career DNA" alignment.
    `;

    try {
      const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
      });
      const response = await result.response;
      return response.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error: any) {
      console.error('[VERTEX LOBKOWICZ ERROR]', error.message || error);
      return null;
    }
  }
}

export const vertexService = new VertexService();
