import { EngineServiceClient, DataStoreServiceClient } from '@google-cloud/discoveryengine';
import { EndpointServiceClient } from '@google-cloud/aiplatform';
import { Storage } from '@google-cloud/storage';

const PROJECT_ID = process.env.VERTEX_AI_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const LOCATION = process.env.VERTEX_AI_LOCATION || 'us-central1';

function getGoogleCredentials() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      return JSON.parse(serviceAccountJson);
    } catch (e) {
      console.error('[Discovery] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON');
    }
  }
  return null;
}

export interface DiscoveryResult {
  projectId: string | null;
  location: string;
  searchEngines: Array<{ id: string; displayName: string }>;
  dataStores: Array<{ id: string; displayName: string }>;
  endpoints: Array<{ id: string; displayName: string; matchingKey?: string }>;
  buckets: Array<{ name: string; matchingKey?: string }>;
  suggestions: Record<string, string>;
}

export class VertexDiscoveryService {
  private credentials = getGoogleCredentials();

  async discover(): Promise<DiscoveryResult> {
    const result: DiscoveryResult = {
      projectId: PROJECT_ID || null,
      location: LOCATION,
      searchEngines: [],
      dataStores: [],
      endpoints: [],
      buckets: [],
      suggestions: {},
    };

    if (!PROJECT_ID || !this.credentials) {
      console.error('[Discovery] Missing Project ID or Credentials');
      return result;
    }

    await Promise.all([
      this.discoverSearchEngines(result),
      this.discoverDataStores(result),
      this.discoverEndpoints(result),
      this.discoverBuckets(result),
    ]);

    this.generateSuggestions(result);

    return result;
  }

  private async discoverSearchEngines(result: DiscoveryResult) {
    try {
      const client = new EngineServiceClient({ credentials: this.credentials });
      const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/collections/default_collection`;
      const [engines] = await client.listEngines({ parent });
      
      result.searchEngines = engines.map(e => ({
        id: e.name?.split('/').pop() || '',
        displayName: e.displayName || '',
      }));
    } catch (e: any) {
      console.warn('[Discovery] Search Engine discovery failed:', e.message);
    }
  }

  private async discoverDataStores(result: DiscoveryResult) {
    try {
      const client = new DataStoreServiceClient({ credentials: this.credentials });
      const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/collections/default_collection`;
      const [stores] = await client.listDataStores({ parent });
      
      result.dataStores = stores.map(s => ({
        id: s.name?.split('/').pop() || '',
        displayName: s.displayName || '',
      }));
    } catch (e: any) {
      console.warn('[Discovery] Data Store discovery failed:', e.message);
    }
  }

  private async discoverEndpoints(result: DiscoveryResult) {
    try {
      const client = new EndpointServiceClient({ 
        credentials: this.credentials,
        apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`
      });
      const parent = `projects/${PROJECT_ID}/locations/${LOCATION}`;
      const [endpoints] = await client.listEndpoints({ parent });
      
      result.endpoints = endpoints.map(ep => {
        const id = ep.name?.split('/').pop() || '';
        const name = ep.displayName?.toLowerCase() || '';
        let matchingKey: string | undefined;

        if (name.includes('lobkowicz') || name.includes('coaching')) {
          matchingKey = 'VERTEX_AI_LOBKOWICZ_ENDPOINT_ID';
        } else if (name.includes('finance')) {
          matchingKey = 'VERTEX_AI_FINANCE_ENDPOINT_ID';
        } else if (name.includes('tech')) {
          matchingKey = 'VERTEX_AI_TECH_ENDPOINT_ID';
        }

        return { id, displayName: ep.displayName || '', matchingKey };
      });
    } catch (e: any) {
      console.warn('[Discovery] Endpoint discovery failed:', e.message);
    }
  }

  private async discoverBuckets(result: DiscoveryResult) {
    try {
      const storage = new Storage({ credentials: this.credentials, projectId: PROJECT_ID });
      const [buckets] = await storage.getBuckets();
      
      result.buckets = buckets.map(b => {
        const name = b.name.toLowerCase();
        let matchingKey: string | undefined;

        if (name.includes('fine-tuning') || name.includes('vertex') || name.includes('training')) {
          matchingKey = 'VERTEX_AI_FINE_TUNING_BUCKET';
        }

        return { name: b.name, matchingKey };
      });
    } catch (e: any) {
      console.warn('[Discovery] Bucket discovery failed:', e.message);
    }
  }

  private generateSuggestions(result: DiscoveryResult) {
    // 1. Project ID
    if (PROJECT_ID) result.suggestions['VERTEX_AI_PROJECT_ID'] = PROJECT_ID;

    // 2. Location
    result.suggestions['VERTEX_AI_LOCATION'] = LOCATION;

    // 3. Search Engine
    if (result.searchEngines.length > 0) {
      // Prefer one with "wavvault" or "search"
      const best = result.searchEngines.find(e => 
        e.displayName.toLowerCase().includes('wavvault') || 
        e.displayName.toLowerCase().includes('search')
      ) || result.searchEngines[0];
      result.suggestions['VERTEX_AI_SEARCH_ENGINE_ID'] = best.id;
    }

    // 4. Data Store
    if (result.dataStores.length > 0) {
      const best = result.dataStores.find(s => 
        s.displayName.toLowerCase().includes('wavvault') || 
        s.displayName.toLowerCase().includes('search')
      ) || result.dataStores[0];
      result.suggestions['VERTEX_AI_SEARCH_DATA_STORE_ID'] = best.id;
    }

    // 5. Endpoints
    result.endpoints.forEach(ep => {
      if (ep.matchingKey) {
        result.suggestions[ep.matchingKey] = ep.id;
      }
    });

    // 6. Buckets
    const tuningBucket = result.buckets.find(b => b.matchingKey === 'VERTEX_AI_FINE_TUNING_BUCKET');
    if (tuningBucket) {
      result.suggestions['VERTEX_AI_FINE_TUNING_BUCKET'] = tuningBucket.name;
    } else if (result.buckets.length > 0) {
      // Fallback to any bucket that looks like it's for the project
      const fallback = result.buckets.find(b => b.name.includes(PROJECT_ID!)) || result.buckets[0];
      result.suggestions['VERTEX_AI_FINE_TUNING_BUCKET'] = fallback.name;
    }

    // 7. MedLM (Fixed suggestion)
    result.suggestions['VERTEX_AI_MEDLM_MODEL_ID'] = 'medlm-medium@latest';
  }
}

export const vertexDiscoveryService = new VertexDiscoveryService();
