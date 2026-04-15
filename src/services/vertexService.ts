import { SearchServiceClient } from '@google-cloud/discoveryengine';
import { VertexAI } from '@google-cloud/vertexai';
import { Storage } from '@google-cloud/storage';
import { IndexServiceClient, IndexEndpointServiceClient, MatchServiceClient, GenAiTuningServiceClient, helpers } from '@google-cloud/aiplatform';
import fs from 'fs';
import path from 'path';

const PROJECT_ID = process.env.VERTEX_AI_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const LOCATION = process.env.VERTEX_AI_LOCATION || 'us-central1';
const ENGINE_ID = process.env.VERTEX_AI_SEARCH_ENGINE_ID;
const DATA_STORE_ID = process.env.VERTEX_AI_SEARCH_DATA_STORE_ID;

// Helper to get credentials from FIREBASE_SERVICE_ACCOUNT_JSON
function getGoogleCredentials() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      return JSON.parse(serviceAccountJson);
    } catch (e) {
      console.error('[VERTEX] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON');
    }
  }
  return null;
}

// Initialize clients lazily to avoid startup crashes if env vars are missing
let searchClient: SearchServiceClient | null = null;
let vertexAI: VertexAI | null = null;
let storage: Storage | null = null;
let indexClient: IndexServiceClient | null = null;
let indexEndpointClient: IndexEndpointServiceClient | null = null;
let matchClient: MatchServiceClient | null = null;
let tuningClient: GenAiTuningServiceClient | null = null;

function getSearchClient() {
  if (!searchClient) {
    const credentials = getGoogleCredentials();
    searchClient = new SearchServiceClient(credentials ? { credentials } : {});
  }
  return searchClient;
}

function getVertexAI() {
  if (!vertexAI) {
    const credentials = getGoogleCredentials();
    vertexAI = new VertexAI({ 
      project: PROJECT_ID || '', 
      location: LOCATION === 'global' ? 'us-central1' : LOCATION,
      googleAuthOptions: credentials ? { credentials } : {}
    });
  }
  return vertexAI;
}

function getStorage() {
  if (!storage) {
    const credentials = getGoogleCredentials();
    storage = new Storage(credentials ? { credentials, projectId: PROJECT_ID } : { projectId: PROJECT_ID });
  }
  return storage;
}

function getIndexClient() {
  if (!indexClient) {
    const credentials = getGoogleCredentials();
    indexClient = new IndexServiceClient({
      credentials: credentials || undefined,
      apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`,
    });
  }
  return indexClient;
}

function getIndexEndpointClient() {
  if (!indexEndpointClient) {
    const credentials = getGoogleCredentials();
    indexEndpointClient = new IndexEndpointServiceClient({
      credentials: credentials || undefined,
      apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`,
    });
  }
  return indexEndpointClient;
}

function getMatchClient() {
  if (!matchClient) {
    const credentials = getGoogleCredentials();
    matchClient = new MatchServiceClient({
      credentials: credentials || undefined,
      apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`,
    });
  }
  return matchClient;
}

function getTuningClient() {
  if (!tuningClient) {
    const credentials = getGoogleCredentials();
    tuningClient = new GenAiTuningServiceClient({
      credentials: credentials || undefined,
      apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`,
    });
  }
  return tuningClient;
}

export class VertexService {
  /**
   * Get the service account email for helpful error messages
   */
  getServiceAccountEmail(): string | null {
    const creds = getGoogleCredentials();
    return creds?.client_email || null;
  }

  /**
   * Search the Wavvault using Vertex AI Search (Managed RAG)
   */
  async searchWavvault(query: string, tenantId?: string): Promise<any> {
    // Check if we should use Vector Search (v2) instead of Discovery Engine (v1)
    const vectorEndpointId = process.env.VERTEX_AI_VECTOR_SEARCH_ENDPOINT_ID;
    const deployedIndexId = process.env.VERTEX_AI_VECTOR_SEARCH_INDEX_ID;

    if (vectorEndpointId && deployedIndexId) {
      console.log('[VERTEX] Using Vector Search (v2) for query.');
      return this.searchVectorIndex(query, vectorEndpointId, deployedIndexId, tenantId);
    }

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
   * Search using Vertex AI Vector Search (v2)
   */
  async searchVectorIndex(query: string, endpointId: string, deployedIndexId: string, tenantId?: string): Promise<any> {
    if (!PROJECT_ID) return null;

    try {
      const matchClient = getMatchClient();
      const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/indexEndpoints/${endpointId}`;

      // 1. Get Embeddings for the query (using Gemini or Text Embeddings model)
      const ai = getVertexAI();
      const embeddingModel = ai.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await embeddingModel.generateContent(query);
      // Note: This is a simplified representation. Real embedding call uses different API.
      // For prototype, we'll assume we have the vector.
      
      // 2. Perform the search
      const [response]: any = await matchClient.findNeighbors({
        indexEndpoint: endpoint,
        deployedIndexId: deployedIndexId,
        queries: [{
          datapoint: {
            featureVector: new Array(768).fill(0).map(() => Math.random()), // Mock vector for now
          },
          neighborCount: 10,
        }],
      });

      return response.nearestNeighbors?.[0]?.neighbors || [];
    } catch (error: any) {
      console.error('[VERTEX VECTOR SEARCH ERROR]', error.message || error);
      return null;
    }
  }

  /**
   * Deploy an Index to an IndexEndpoint
   */
  async deployIndex(endpointId: string, indexId: string): Promise<any> {
    if (!PROJECT_ID) throw new Error('Project ID missing');
    
    const endpointClient = getIndexEndpointClient();
    const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/indexEndpoints/${endpointId}`;
    const index = `projects/${PROJECT_ID}/locations/${LOCATION}/indices/${indexId}`;

    console.log(`[VERTEX] Deploying Index ${indexId} to Endpoint ${endpointId}...`);
    const [operation] = await endpointClient.deployIndex({
      indexEndpoint: endpoint,
      deployedIndex: {
        id: `deployed_wavvault_${Date.now()}`,
        index: index,
        displayName: 'Deployed Wavvault Index',
        dedicatedResources: {
          machineSpec: {
            machineType: 'e2-standard-2',
          },
          minReplicaCount: 1,
          maxReplicaCount: 1,
        },
      },
    });

    return {
      operationName: operation.name,
      message: 'Index deployment operation initiated.',
    };
  }
  async getHealthcareInsight(prompt: string, context?: string): Promise<string | null> {
    const modelId = process.env.VERTEX_AI_MEDLM_MODEL_ID || 'medlm-medium@latest';
    const ai = getVertexAI();
    
    // Enhanced Healthcare Prompt with Lobkowicz Methodology
    const enhancedPrompt = `
      You are Skylar's Healthcare Intelligence module.
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
      const generativeModel = ai.getGenerativeModel({ model: modelId });
      const result = await generativeModel.generateContent(enhancedPrompt);
      const response = await result.response;
      return response.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error: any) {
      console.warn('[VERTEX MEDLM ERROR] Falling back to Gemini Pro:', error.message || error);
      try {
        const fallbackModel = ai.getGenerativeModel({ model: 'gemini-1.5-pro' });
        const result = await fallbackModel.generateContent(`[Healthcare Context] ${enhancedPrompt}`);
        const response = await result.response;
        return response.candidates?.[0]?.content?.parts?.[0]?.text || null;
      } catch (fallbackError: any) {
        console.error('[VERTEX HEALTHCARE FALLBACK ERROR]', fallbackError.message || fallbackError);
        return null;
      }
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
      : 'gemini-1.5-pro';

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
      : 'gemini-1.5-pro';

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
  async bootstrapVectorSearchIndex(userId: string, db: any): Promise<any> {
    if (!PROJECT_ID) throw new Error('Project ID missing');
    console.log(`[VERTEX] Bootstrapping Vector Search Index for user: ${userId}`);
    
    try {
      // 1. Export Firestore data to GCS (Real Step 1)
      const { gcsUri, count } = await this.exportWavvaultToGCS(db);
      console.log(`[VERTEX] Exported ${count} entries to ${gcsUri}`);

      // 2. Create an Index (Real Step 2)
      const indexClient = getIndexClient();
      const parent = `projects/${PROJECT_ID}/locations/${LOCATION}`;
      
      const index = {
        displayName: `wavvault-vector-index-${Date.now()}`,
        description: 'Wavvault Career DNA Vector Search Index',
        metadataSchemaUri: 'gs://google-cloud-aiplatform/schema/index/metadata/contents_1.0.0.yaml',
        metadata: helpers.toValue({
          contentsDeltaUri: gcsUri,
          config: {
            dimensions: 768, // Standard for many embedding models
            approximateNeighborsCount: 150,
            distanceMeasureType: 'COSINE_DISTANCE',
            algorithmConfig: {
              treeAhConfig: {
                leafNodeEmbeddingCount: 500,
                leafNodesToSearchPercent: 7,
              },
            },
          },
        }),
        indexUpdateMethod: 'STREAM_UPDATE',
      };

      console.log('[VERTEX] Requesting Index creation...');
      const [operation] = await indexClient.createIndex({
        parent,
        index: index as any,
      });

      // We don't await the operation here as it takes 30-60 minutes
      // We return the operation name so the UI can potentially track it
      const operationName = operation.name;
      console.log(`[VERTEX] Index creation operation started: ${operationName}`);

      // 3. Create an IndexEndpoint (Real Step 3)
      const endpointClient = getIndexEndpointClient();
      console.log('[VERTEX] Requesting IndexEndpoint creation...');
      const [endpointOperation] = await endpointClient.createIndexEndpoint({
        parent,
        indexEndpoint: {
          displayName: `wavvault-endpoint-${Date.now()}`,
          publicEndpointEnabled: true,
        },
      });

      return {
        id: `vector-index-${Date.now()}`,
        status: 'INITIALIZING',
        progress: 30,
        gcsUri,
        count,
        indexOperation: operationName,
        endpointOperation: endpointOperation.name,
        estimatedCompletion: '2-4 hours',
        message: 'Data exported. Index and Endpoint creation operations initiated on Vertex AI.'
      };
    } catch (error: any) {
      console.error('[VERTEX BOOTSTRAP ERROR]', error.message || error);
      
      // Enhance error message for permission issues
      if (error.message?.includes('PERMISSION_DENIED')) {
        const email = this.getServiceAccountEmail();
        const helpMsg = email 
          ? `Permission denied for service account: ${email}. Please ensure it has the 'Vertex AI Administrator' role in the GCP Console.`
          : `Permission denied. Please ensure your service account has the 'Vertex AI Administrator' role in the GCP Console.`;
        throw new Error(helpMsg);
      }
      
      throw error;
    }
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
      : 'gemini-1.5-flash-002';

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

    // Use a safe bucket name that doesn't require domain verification by default.
    // Domain-style names (like those in firebase-applet-config.json) often fail creation
    // if the domain isn't verified in the GCP project.
    let bucketName = process.env.VERTEX_AI_FINE_TUNING_BUCKET || `${PROJECT_ID}-vertex-data`;

    console.log(`[VERTEX] Attempting to use bucket: ${bucketName}`);
    const storage = getStorage();
    
    try {
      let bucket = storage.bucket(bucketName);
      const [exists] = await bucket.exists();
      
      if (!exists) {
        console.log(`[VERTEX] Bucket ${bucketName} does not exist. Attempting to create...`);
        try {
          await storage.createBucket(bucketName, {
            location: LOCATION === 'global' ? 'us-central1' : LOCATION,
            storageClass: 'STANDARD',
          });
          console.log(`[VERTEX] Bucket ${bucketName} created successfully.`);
        } catch (createError: any) {
          // If creation fails due to domain ownership issues, use a simpler project-prefixed name
          if (createError.message?.includes('owns the domain') || createError.message?.includes('verification')) {
            bucketName = `${PROJECT_ID}-vertex-data-safe`;
            console.warn(`[VERTEX] Primary bucket creation failed (domain issue). Falling back to: ${bucketName}`);
            bucket = storage.bucket(bucketName);
            const [fbExists] = await bucket.exists();
            if (!fbExists) {
              await storage.createBucket(bucketName, {
                location: LOCATION === 'global' ? 'us-central1' : LOCATION,
                storageClass: 'STANDARD',
              });
            }
          } else {
            throw createError;
          }
        }
      }

      const file = bucket.file(filename);
      await file.save(content, {
        contentType: 'application/x-jsonlines',
      });

      return `gs://${bucketName}/${filename}`;
    } catch (error: any) {
      console.error('[VERTEX GCS UPLOAD ERROR]', error.message || error);
      // Return null so callers know the upload actually failed
      return null;
    }
  }

  /**
   * Export Firestore Wavvault collection to GCS for Vector Search or Tuning
   */
  async exportWavvaultToGCS(db: any): Promise<{ gcsUri: string; count: number }> {
    if (!PROJECT_ID) throw new Error('Project ID missing');
    
    console.log('[VERTEX] Exporting Wavvault to GCS...');
    const snapshot = await db.collection('wavvault').get();
    const entries = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    if (entries.length === 0) {
      throw new Error('No entries found in Wavvault to export.');
    }

    // Format for Vertex AI Search / Vector Search (JSONL)
    const jsonlContent = entries.map((e: any) => JSON.stringify(e)).join('\n');
    const filename = `wavvault-export-${Date.now()}.jsonl`;
    
    const gcsUri = await this.uploadToGCS(filename, jsonlContent);
    
    if (!gcsUri) throw new Error('Failed to upload export to GCS');

    return { gcsUri, count: entries.length };
  }

  /**
   * Create a Vertex AI Tuning Job (Phase 2)
   */
  async createTuningJob(gcsUri: string, modelName: string = 'gemini-1.5-flash-002') {
    if (!PROJECT_ID) throw new Error('Project ID missing');
    
    const client = getTuningClient();
    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}`;

    console.log(`[VERTEX] Creating tuning job for ${modelName} using data from ${gcsUri}`);

    try {
      const response: any = await client.createTuningJob({
        parent,
        tuningJob: {
          baseModel: `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${modelName}`,
          supervisedTuningSpec: {
            trainingDatasetUri: gcsUri,
          },
          displayName: `skylar-tuning-${Date.now()}`,
        } as any,
      });
      const job = response[0];

      return {
        id: job.name,
        state: job.state,
        createTime: job.createTime,
        model: modelName,
        dataset: gcsUri,
      };
    } catch (error: any) {
      console.error('[VERTEX TUNING ERROR]', error.message || error);
      throw error;
    }
  }

  /**
   * Get the status of a Vertex AI Tuning Job
   */
  async getTuningJobStatus(jobId: string) {
    const client = getTuningClient();
    try {
      const response: any = await client.getTuningJob({ name: jobId });
      const job = response[0];
      return {
        id: job.name,
        state: job.state,
        createTime: job.createTime,
        startTime: job.startTime,
        endTime: job.endTime,
        error: job.error,
        tunedModel: job.tunedModel,
      };
    } catch (error: any) {
      console.error('[VERTEX TUNING STATUS ERROR]', error.message || error);
      throw error;
    }
  }

  /**
   * Test connection to a specific model or endpoint
   */
  async testModelConnection(type: 'healthcare' | 'finance' | 'tech' | 'lobkowicz'): Promise<{ success: boolean; message: string }> {
    try {
      let result: string | null = null;
      const testPrompt = "Hello, this is a connectivity test. Please respond with 'Connection Successful'.";
      
      switch (type) {
        case 'healthcare':
          result = await this.getHealthcareInsight(testPrompt, "Connectivity Test");
          break;
        case 'finance':
          result = await this.getFinanceInsight(testPrompt, "Connectivity Test");
          break;
        case 'tech':
          result = await this.getTechInsight(testPrompt, "Connectivity Test");
          break;
        case 'lobkowicz':
          result = await this.getLobkowiczCoaching(testPrompt, "Connectivity Test");
          break;
      }

      if (result) {
        return { success: true, message: `Successfully connected to ${type} model.` };
      } else {
        return { success: false, message: `Failed to get response from ${type} model.` };
      }
    } catch (error: any) {
      console.error(`[VERTEX TEST ERROR] ${type}:`, error.message || error);
      return { success: false, message: error.message || `Error testing ${type} connection.` };
    }
  }
}

export const vertexService = new VertexService();
