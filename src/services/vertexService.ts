import { SearchServiceClient } from '@google-cloud/discoveryengine';
import { VertexAI } from '@google-cloud/vertexai';
import { Storage } from '@google-cloud/storage';

const PROJECT_ID = process.env.VERTEX_AI_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const LOCATION = process.env.VERTEX_AI_LOCATION || 'global';
const ENGINE_ID = process.env.VERTEX_AI_SEARCH_ENGINE_ID;
const DATA_STORE_ID = process.env.VERTEX_AI_SEARCH_DATA_STORE_ID;

// Initialize clients lazily to avoid startup crashes if env vars are missing
let searchClient: SearchServiceClient | null = null;
let vertexAI: VertexAI | null = null;
let storage: Storage | null = null;

function getSearchClient() {
  if (!searchClient) searchClient = new SearchServiceClient();
  return searchClient;
}

function getVertexAI() {
  if (!vertexAI) vertexAI = new VertexAI({ project: PROJECT_ID || '', location: 'us-central1' });
  return vertexAI;
}

function getStorage() {
  if (!storage) storage = new Storage({ projectId: PROJECT_ID });
  return storage;
}

export class VertexService {
  /**
   * Search the Wavvault using Vertex AI Search (Managed RAG)
   */
  async searchWavvault(query: string, tenantId?: string): Promise<any> {
    if (!PROJECT_ID || !ENGINE_ID) {
      console.warn('[VERTEX] Missing Project ID or Engine ID for Search.');
      return null;
    }

    const servingConfig = `projects/${PROJECT_ID}/locations/${LOCATION}/collections/default_collection/engines/${ENGINE_ID}/servingConfigs/default_search`;

    const request = {
      servingConfig,
      query,
      pageSize: 10,
      // Tenant Isolation: Filter by tenantId to ensure data privacy
      filter: tenantId ? `tenantId: ANY("${tenantId}")` : undefined,
    };

    try {
      const client = getSearchClient();
      const [response]: any = await client.search(request);
      return response.results || response;
    } catch (error: any) {
      console.error('[VERTEX SEARCH ERROR]', error.message || error);
      return null;
    }
  }

  /**
   * Use MedLM for Healthcare sector career intelligence
   */
  async getHealthcareInsight(prompt: string, context?: string): Promise<string | null> {
    const modelId = process.env.VERTEX_AI_MEDLM_MODEL_ID || 'medlm-medium';
    const ai = getVertexAI();
    const generativeModel = ai.getGenerativeModel({
      model: modelId,
    });

    // Enhanced Healthcare Prompt with Lobkowicz Methodology
    const enhancedPrompt = `
      You are Skylar's Healthcare Intelligence module, powered by MedLM.
      Your goal is to provide career strategic advice for healthcare professionals using the Philip Lobkowicz methodology.
      
      Context: ${context || 'General healthcare career strategy'}
      User Question: ${prompt}
      
      Instructions:
      1. Use clinical and healthcare administrative precision.
      2. Apply the "Five Stories" framework to the response.
      3. Focus on "Career DNA" alignment within healthcare systems (e.g., clinical vs. research vs. leadership).
      4. Maintain a professional, strategic, and "tough love" tone.
    `;

    try {
      const result = await generativeModel.generateContent(enhancedPrompt);
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
  async getLobkowiczCoaching(prompt: string, context?: string): Promise<string | null> {
    // Placeholder for fine-tuned model endpoint
    // In production, this would use vertexAI.getGenerativeModel({ model: 'projects/.../endpoints/...' })
    const ai = getVertexAI();
    const generativeModel = ai.getGenerativeModel({
      model: 'gemini-3.1-pro-preview', // Fallback to standard pro if fine-tuned not yet deployed
    });

    const systemInstruction = `
      You are Skylar, but you are operating with the Philip Lobkowicz Strategic Coaching Methodology.
      Your tone is professional, strategic, and "tough love." 
      Focus on the "Five Stories" framework and "Career DNA" alignment.
      
      Context: ${context || 'General strategic coaching session'}
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

  /**
   * Upload synthetic data to GCS for fine-tuning
   */
  async uploadToGCS(filename: string, content: string): Promise<string | null> {
    if (!PROJECT_ID) {
      throw new Error('Project ID is required for GCS upload.');
    }

    const bucketName = process.env.VERTEX_AI_FINE_TUNING_BUCKET || `${PROJECT_ID}-fine-tuning`;
    const bucket = getStorage().bucket(bucketName);

    try {
      // Check if bucket exists
      const [exists] = await bucket.exists();
      if (!exists) {
        console.log(`[VERTEX] Creating bucket: ${bucketName}`);
        // Note: This might fail if the service account doesn't have storage.buckets.create permission
        await bucket.create({
          location: 'us-central1',
        });
      }

      const file = bucket.file(filename);
      await file.save(content, {
        contentType: 'application/x-jsonlines',
      });

      return `gs://${bucketName}/${filename}`;
    } catch (error: any) {
      console.error('[VERTEX GCS UPLOAD ERROR]', error.message || error);
      throw error;
    }
  }

  /**
   * Create a Vertex AI Tuning Job (Phase 2)
   */
  async createTuningJob(gcsUri: string, modelName: string = 'gemini-1.5-flash-002') {
    const vertexAI = getVertexAI();
    console.log(`[VERTEX] Creating tuning job for ${modelName} using data from ${gcsUri}`);
    
    // In a real implementation, this would call the Vertex AI Tuning API
    // return await vertexAI.tuningJobs.create({ ... });
    
    return {
      id: `tuning-job-${Date.now()}`,
      state: 'PENDING',
      createTime: new Date().toISOString(),
      model: modelName,
      dataset: gcsUri
    };
  }
}

export const vertexService = new VertexService();
