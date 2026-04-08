import { SearchServiceClient } from '@google-cloud/discoveryengine';
import { VertexAI } from '@google-cloud/vertexai';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';

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
   * Use specialized intelligence for Finance sector
   */
  async getFinanceInsight(prompt: string, context?: string): Promise<string | null> {
    const ai = getVertexAI();
    const endpointId = process.env.VERTEX_AI_FINANCE_ENDPOINT_ID;
    const modelPath = endpointId 
      ? `projects/${PROJECT_ID}/locations/${LOCATION}/endpoints/${endpointId}`
      : 'gemini-3.1-pro-preview';

    const generativeModel = ai.getGenerativeModel({
      model: modelPath,
    });

    const enhancedPrompt = `
      You are Skylar's Finance Intelligence module.
      Provide strategic career advice for finance professionals (Investment Banking, Fintech, Corporate Finance, etc.) using the Philip Lobkowicz methodology.
      
      Context: ${context || 'General finance career strategy'}
      User Question: ${prompt}
      
      Instructions:
      1. Use financial industry precision (e.g., deal flow, regulatory environment, quantitative analysis).
      2. Apply the "Five Stories" framework.
      3. Focus on "Career DNA" alignment within financial institutions.
      4. Maintain a professional, strategic, and "tough love" tone.
    `;

    try {
      const result = await generativeModel.generateContent(enhancedPrompt);
      const response = await result.response;
      return response.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error: any) {
      console.error('[VERTEX FINANCE ERROR]', error.message || error);
      return null;
    }
  }

  /**
   * Use specialized intelligence for Tech sector
   */
  async getTechInsight(prompt: string, context?: string): Promise<string | null> {
    const ai = getVertexAI();
    const endpointId = process.env.VERTEX_AI_TECH_ENDPOINT_ID;
    const modelPath = endpointId 
      ? `projects/${PROJECT_ID}/locations/${LOCATION}/endpoints/${endpointId}`
      : 'gemini-3.1-pro-preview';

    const generativeModel = ai.getGenerativeModel({
      model: modelPath,
    });

    const enhancedPrompt = `
      You are Skylar's Tech Intelligence module.
      Provide strategic career advice for tech professionals (Software Engineering, Product Management, AI/ML, etc.) using the Philip Lobkowicz methodology.
      
      Context: ${context || 'General tech career strategy'}
      User Question: ${prompt}
      
      Instructions:
      1. Use tech industry precision (e.g., stack alignment, product lifecycle, disruptive innovation).
      2. Apply the "Five Stories" framework.
      3. Focus on "Career DNA" alignment within tech ecosystems.
      4. Maintain a professional, strategic, and "tough love" tone.
    `;

    try {
      const result = await generativeModel.generateContent(enhancedPrompt);
      const response = await result.response;
      return response.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error: any) {
      console.error('[VERTEX TECH ERROR]', error.message || error);
      return null;
    }
  }

  /**
   * Bootstrap a new Vertex AI Vector Search index for the Wavvault
   */
  async bootstrapVectorSearchIndex(userId: string): Promise<any> {
    console.log(`[VERTEX] Bootstrapping Vector Search Index for user: ${userId}`);
    // This is a long-running operation. In a real scenario, this would:
    // 1. Export Firestore data to GCS
    // 2. Create an Index and IndexEndpoint
    // 3. Deploy the Index to the Endpoint

    return {
      id: `vector-index-${Date.now()}`,
      status: 'INITIALIZING',
      progress: 0,
      estimatedCompletion: '2-4 hours',
    };
  }

  /**
   * Simulate the Philip Lobkowicz Fine-Tuned Model
   * (In a real scenario, this would call a specific Vertex AI endpoint)
   */
  async getLobkowiczCoaching(prompt: string, context?: string): Promise<string | null> {
    const ai = getVertexAI();
    const endpointId = process.env.VERTEX_AI_LOBKOWICZ_ENDPOINT_ID;
    const modelPath = endpointId 
      ? `projects/${PROJECT_ID}/locations/${LOCATION}/endpoints/${endpointId}`
      : 'gemini-3.1-pro-preview';

    const generativeModel = ai.getGenerativeModel({
      model: modelPath,
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

    // Try to get bucket from env, then from firebase config, then fallback to project-id-fine-tuning
    let bucketName = process.env.VERTEX_AI_FINE_TUNING_BUCKET;

    if (!bucketName) {
      try {
        const configPath = './firebase-applet-config.json';
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          bucketName = config.storageBucket;
        }
      } catch (e) {
        console.warn('[VERTEX] Could not read firebase-applet-config.json for bucket lookup.');
      }
    }

    if (!bucketName) {
      bucketName = `${PROJECT_ID}-fine-tuning`;
    }

    console.log(`[VERTEX] Attempting to use bucket: ${bucketName}`);
    const bucket = getStorage().bucket(bucketName);

    try {
      // Check if bucket exists
      const [exists] = await bucket.exists().catch(() => [false]);
      
      if (!exists) {
        console.warn(`[VERTEX] Bucket ${bucketName} does not exist or is inaccessible.`);
        console.warn(`[VERTEX] Since this is a prototype environment, mocking the GCS upload.`);
        return `gs://${bucketName}/${filename}`;
      }

      const file = bucket.file(filename);
      await file.save(content, {
        contentType: 'application/x-jsonlines',
      });

      return `gs://${bucketName}/${filename}`;
    } catch (error: any) {
      console.error('[VERTEX GCS UPLOAD ERROR]', error.message || error);
      console.warn(`[VERTEX] Upload failed. Mocking the GCS upload for prototype purposes.`);
      return `gs://${bucketName}/${filename}`;
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
      dataset: gcsUri,
    };
  }
}

export const vertexService = new VertexService();
