import { doc, getDoc, collection, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { SkylarGlobalConfig, SkylarStageConfig, DEFAULT_MODALITIES } from '../types/skylar-config';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

// Helper for fetching via server-side proxy when Firestore rules block direct public access
async function fetchFromProxy<T>(colName: string, docId?: string): Promise<T | null> {
  try {
    const url = docId
      ? `/api/bootstrap/config/${colName}/${docId}`
      : `/api/bootstrap/config/${colName}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[Config Proxy] HTTP error ${response.status} for ${url}`);
      return null;
    }
    const data = await response.json();
    console.log(`[Config Proxy] Successfully fetched ${colName}${docId ? '/' + docId : ''}`);
    return data as T;
  } catch (error: any) {
    console.warn(
      `[Config Proxy] Request failed for ${colName}${docId ? '/' + docId : ''}:`,
      error?.message || error
    );
    return null;
  }
}

// In-memory cache
let globalConfigCache: SkylarGlobalConfig | null = null;
let journeyStagesCache: Record<string, SkylarStageConfig> | null = null;

export const configService = {
  /**
   * Updates the global Skylar configuration in Firestore.
   */
  async updateGlobalConfig(config: SkylarGlobalConfig): Promise<void> {
    if (!isFirebaseConfigured) {
      console.warn('[Config Service] updateGlobalConfig skipped: Firebase not configured.');
      globalConfigCache = config;
      return;
    }
    try {
      const docRef = doc(db, 'metadata', 'skylar_global');
      await setDoc(docRef, config, { merge: true });
      globalConfigCache = config;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'metadata/skylar_global');
      throw error;
    }
  },

  /**
   * Fetches the global Skylar configuration from Firestore.
   * Uses in-memory caching after the first fetch.
   */
  async getSkylarGlobalConfig(forceRefresh = false): Promise<SkylarGlobalConfig | null> {
    if (!forceRefresh && globalConfigCache) {
      return globalConfigCache;
    }

    if (!isFirebaseConfigured) {
      console.info('[Config Service] Using default global config (Firebase not configured).');
      return null;
    }

    try {
      const docRef = doc(db, 'metadata', 'skylar_global');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as SkylarGlobalConfig;
        globalConfigCache = data;
        return data;
      } else {
        console.warn('[Config Service] skylar_global document not found. Attempting Proxy fallback...');
        const proxyData = await fetchFromProxy<SkylarGlobalConfig>('metadata', 'skylar_global');
        if (proxyData) {
          globalConfigCache = proxyData;
          return proxyData;
        }
        return null;
      }
    } catch (error: any) {
      console.warn('[Config Service] Firestore read failed for skylar_global. Attempting Proxy fallback...', error?.message || error);
      const proxyData = await fetchFromProxy<SkylarGlobalConfig>('metadata', 'skylar_global');
      if (proxyData) {
        globalConfigCache = proxyData;
        return proxyData;
      }
      return null;
    }
  },

  /**
   * Subscribes to the global Skylar configuration in Firestore.
   */
  subscribeToSkylarGlobalConfig(callback: (config: SkylarGlobalConfig | null) => void): () => void {
    if (!isFirebaseConfigured) {
      callback(null);
      return () => {};
    }
    const docRef = doc(db, 'metadata', 'skylar_global');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SkylarGlobalConfig;
          globalConfigCache = data;
          callback(data);
        } else {
          console.warn('skylar_global document not found in metadata collection.');
          callback(null);
        }
      },
      (error: any) => {
        console.warn('[Config Service] Firestore subscription failed for skylar_global. Using null callback.', error?.message || error);
        callback(null);
      }
    );
  },

  /**
   * Fetches all journey stages from Firestore.
   * Uses in-memory caching after the first fetch.
   */
  async getJourneyStages(forceRefresh = false): Promise<Record<string, SkylarStageConfig>> {
    if (!forceRefresh && journeyStagesCache) {
      return journeyStagesCache;
    }

    if (!isFirebaseConfigured) {
      return this.fallbackToDefaultStages();
    }

    try {
      const stagesRef = collection(db, 'journeyPhaseConfigs');
      const snapshot = await getDocs(stagesRef);
      
      if (snapshot.empty) {
        throw new Error('Empty snapshot, handling via fallback');
      }

      const stages: Record<string, SkylarStageConfig> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        stages[doc.id] = {
          stageId: doc.id,
          stageTitle: data.title || data.stageTitle || doc.id,
          description: data.description || '',
          systemPromptTemplate: data.systemPromptTemplate || '',
          requiredArtifacts: data.requiredArtifacts || [],
          allowedModalities: Array.isArray(data.allowedModalities) 
            ? {
                text: data.allowedModalities.includes('text'),
                audio: data.allowedModalities.includes('audio'),
                image: data.allowedModalities.includes('image'),
                video: data.allowedModalities.includes('video'),
              }
            : data.allowedModalities || DEFAULT_MODALITIES,
          uiConfig: data.uiConfig || { theme: 'dark', layout: 'split' }
        } as SkylarStageConfig;
      });

      // Merge missing stages from defaults so they are available without a manual seed
      const module = await import('../config/defaultJourneyStages.json');
      const defaultStages = module.default as Record<string, any>;
      for (const [sId, defaultData] of Object.entries(defaultStages)) {
        if (!stages[sId]) {
          stages[sId] = {
            stageId: sId,
            stageTitle: defaultData.title || sId,
            description: defaultData.description || '',
            systemPromptTemplate: defaultData.systemPromptTemplate || '',
            requiredArtifacts: defaultData.requiredArtifacts || [],
            allowedModalities: Array.isArray(defaultData.allowedModalities) 
              ? {
                  text: defaultData.allowedModalities.includes('text'),
                  audio: defaultData.allowedModalities.includes('audio'),
                  image: defaultData.allowedModalities.includes('image'),
                  video: defaultData.allowedModalities.includes('video'),
                }
              : defaultData.allowedModalities || DEFAULT_MODALITIES,
            uiConfig: defaultData.uiConfig || { theme: 'dark', layout: 'split' }
          } as SkylarStageConfig;
        }
      }

      journeyStagesCache = stages;
      return stages;
    } catch (error: any) {
      console.warn('[Config Service] Failed to load journey stages from DB. Attempting Proxy fallback...', error?.message || error);
      const proxyData = await fetchFromProxy<any[]>('journeyPhaseConfigs');
      if (proxyData && Array.isArray(proxyData)) {
        const stages: Record<string, SkylarStageConfig> = {};
        proxyData.forEach((item) => {
          const id = item.id || item.stageId;
          stages[id] = {
            stageId: id,
            stageTitle: item.title || item.stageTitle || id,
            description: item.description || '',
            systemPromptTemplate: item.systemPromptTemplate || '',
            requiredArtifacts: item.requiredArtifacts || [],
            allowedModalities: Array.isArray(item.allowedModalities) 
              ? {
                  text: item.allowedModalities.includes('text'),
                  audio: item.allowedModalities.includes('audio'),
                  image: item.allowedModalities.includes('image'),
                  video: item.allowedModalities.includes('video'),
                }
              : item.allowedModalities || DEFAULT_MODALITIES,
            uiConfig: item.uiConfig || { theme: 'dark', layout: 'split' }
          } as SkylarStageConfig;
        });
        journeyStagesCache = stages;
        return stages;
      }

      console.warn('[Config Service] Proxy failed or returned invalid data. Falling back to default JSON.');
      const module = await import('../config/defaultJourneyStages.json');
      const defaultStages = module.default as Record<string, any>;
      const stages: Record<string, SkylarStageConfig> = {};
      for (const [sId, defaultData] of Object.entries(defaultStages)) {
        stages[sId] = {
          stageId: sId,
          stageTitle: defaultData.title || sId,
          description: defaultData.description || '',
          systemPromptTemplate: defaultData.systemPromptTemplate || '',
          requiredArtifacts: defaultData.requiredArtifacts || [],
          allowedModalities: Array.isArray(defaultData.allowedModalities) 
            ? {
                text: defaultData.allowedModalities.includes('text'),
                audio: defaultData.allowedModalities.includes('audio'),
                image: defaultData.allowedModalities.includes('image'),
                video: defaultData.allowedModalities.includes('video'),
              }
            : defaultData.allowedModalities || DEFAULT_MODALITIES,
          uiConfig: defaultData.uiConfig || { theme: 'dark', layout: 'split' }
        } as SkylarStageConfig;
      }
      journeyStagesCache = stages;
      return stages;
    }
  },

  /**
   * Fetches a specific journey stage configuration by ID.
   */
  async getJourneyStage(stageId: string, forceRefresh = false): Promise<SkylarStageConfig | null> {
    const normalizedStageId = stageId.toLowerCase();
    if (!forceRefresh && journeyStagesCache && journeyStagesCache[normalizedStageId]) {
      return journeyStagesCache[normalizedStageId];
    }

    if (!isFirebaseConfigured) {
      console.warn('[Config Service] Firebase is NOT configured. Falling back to internal manifest for stage:', normalizedStageId);
      return this.fallbackToSingleDefaultStage(normalizedStageId);
    }

    try {
      const docRef = doc(db, 'journeyPhaseConfigs', normalizedStageId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const config = {
          stageId: docSnap.id,
          stageTitle: data.title || data.stageTitle || docSnap.id,
          description: data.description || '',
          systemPromptTemplate: data.systemPromptTemplate || '',
          requiredArtifacts: data.requiredArtifacts || [],
          allowedModalities: Array.isArray(data.allowedModalities) 
            ? {
                text: data.allowedModalities.includes('text'),
                audio: data.allowedModalities.includes('audio'),
                image: data.allowedModalities.includes('image'),
                video: data.allowedModalities.includes('video'),
              }
            : data.allowedModalities || DEFAULT_MODALITIES,
          uiConfig: data.uiConfig || { theme: 'dark', layout: 'split' }
        } as SkylarStageConfig;
        
        // Update cache
        if (!journeyStagesCache) {
          journeyStagesCache = {};
        }
        journeyStagesCache[normalizedStageId] = config;
        
        return config;
      }
    } catch (error: any) {
      console.warn(`[Config Service] Firestore read failed for "${normalizedStageId}". Attempting Proxy fallback...`, error?.message || error);
      const proxyData = await fetchFromProxy<any>('journeyPhaseConfigs', normalizedStageId);
      if (proxyData) {
        const config = {
          stageId: normalizedStageId,
          stageTitle: proxyData.title || proxyData.stageTitle || normalizedStageId,
          description: proxyData.description || '',
          systemPromptTemplate: proxyData.systemPromptTemplate || '',
          requiredArtifacts: proxyData.requiredArtifacts || [],
          allowedModalities: Array.isArray(proxyData.allowedModalities) 
            ? {
                text: proxyData.allowedModalities.includes('text'),
                audio: proxyData.allowedModalities.includes('audio'),
                image: proxyData.allowedModalities.includes('image'),
                video: proxyData.allowedModalities.includes('video'),
              }
            : proxyData.allowedModalities || DEFAULT_MODALITIES,
          uiConfig: proxyData.uiConfig || { theme: 'dark', layout: 'split' }
        } as SkylarStageConfig;
        
        if (!journeyStagesCache) journeyStagesCache = {};
        journeyStagesCache[normalizedStageId] = config;
        return config;
      }
      console.warn('[Config Service] Proxy fallback failed. Using internal default.');
    }

    // Fallback logic for missing document or offline/permission error
    console.info(`[Config Service] Using default internal config for "${normalizedStageId}".`);
    const module = await import('../config/defaultJourneyStages.json');
    const defaultStages = module.default as Record<string, any>;
    const defaultData = defaultStages[normalizedStageId] || defaultStages['dive-in'];
    if (defaultData) {
      const config = {
        stageId: normalizedStageId,
        stageTitle: defaultData.title || normalizedStageId,
        description: defaultData.description || '',
        systemPromptTemplate: defaultData.systemPromptTemplate || '',
        requiredArtifacts: defaultData.requiredArtifacts || [],
        allowedModalities: Array.isArray(defaultData.allowedModalities) 
          ? {
              text: defaultData.allowedModalities.includes('text'),
              audio: defaultData.allowedModalities.includes('audio'),
              image: defaultData.allowedModalities.includes('image'),
              video: defaultData.allowedModalities.includes('video'),
            }
          : defaultData.allowedModalities || DEFAULT_MODALITIES,
        uiConfig: defaultData.uiConfig || { theme: 'dark', layout: 'split' }
      } as SkylarStageConfig;
      
      return config;
    }
    return null;
  },

  /**
   * Updates a specific journey stage configuration in Firestore.
   */
  async updateStageConfig(stageId: string, config: SkylarStageConfig): Promise<void> {
    if (!isFirebaseConfigured) {
      console.warn(`[Config Service] updateStageConfig skipped for ${stageId}: Firebase not configured.`);
      return;
    }
    try {
      const docRef = doc(db, 'journeyPhaseConfigs', stageId);
      // Save the exact format we use internally, so fields like widgets aren't lost
      const saveFormat = {
        stageId: config.stageId,
        stageTitle: config.stageTitle,
        title: config.stageTitle, // Explicitly save title too
        description: config.description,
        systemPromptTemplate: config.systemPromptTemplate,
        requiredArtifacts: config.requiredArtifacts,
        allowedModalities: config.allowedModalities,
        uiConfig: config.uiConfig
      };
      await setDoc(docRef, saveFormat, { merge: true });
      
      // Update cache
      if (!journeyStagesCache) {
        journeyStagesCache = {};
      }
      journeyStagesCache[stageId] = config;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `journeyPhaseConfigs/${stageId}`);
      throw error;
    }
  },

  /**
   * Internal helper to load default stages when Firebase is offline/not configured.
   */
  async fallbackToDefaultStages(): Promise<Record<string, SkylarStageConfig>> {
    console.info('[Config Service] Loading default journey stages from internal manifest.');
    const module = await import('../config/defaultJourneyStages.json');
    const defaultStages = module.default as Record<string, any>;
    const stages: Record<string, SkylarStageConfig> = {};
    for (const [sId, defaultData] of Object.entries(defaultStages)) {
      stages[sId] = {
        stageId: sId,
        stageTitle: defaultData.title || sId,
        description: defaultData.description || '',
        systemPromptTemplate: defaultData.systemPromptTemplate || '',
        requiredArtifacts: defaultData.requiredArtifacts || [],
        allowedModalities: Array.isArray(defaultData.allowedModalities) 
          ? {
              text: defaultData.allowedModalities.includes('text'),
              audio: defaultData.allowedModalities.includes('audio'),
              image: defaultData.allowedModalities.includes('image'),
              video: defaultData.allowedModalities.includes('video'),
            }
          : defaultData.allowedModalities || DEFAULT_MODALITIES,
        uiConfig: defaultData.uiConfig || { theme: 'dark', layout: 'split' }
      } as SkylarStageConfig;
    }
    journeyStagesCache = stages;
    return stages;
  },

  async fallbackToSingleDefaultStage(normalizedStageId: string): Promise<SkylarStageConfig | null> {
    console.info(`[Config Service] Loading fallback for "${normalizedStageId}" from internal manifest.`);
    const module = await import('../config/defaultJourneyStages.json');
    const defaultStages = module.default as Record<string, any>;
    const defaultData = defaultStages[normalizedStageId] || defaultStages['dive-in'];
    if (defaultData) {
      const config = {
        stageId: normalizedStageId,
        stageTitle: defaultData.title || normalizedStageId,
        description: defaultData.description || '',
        systemPromptTemplate: defaultData.systemPromptTemplate || '',
        requiredArtifacts: defaultData.requiredArtifacts || [],
        allowedModalities: Array.isArray(defaultData.allowedModalities) 
          ? {
              text: defaultData.allowedModalities.includes('text'),
              audio: defaultData.allowedModalities.includes('audio'),
              image: defaultData.allowedModalities.includes('image'),
              video: defaultData.allowedModalities.includes('video'),
            }
          : defaultData.allowedModalities || DEFAULT_MODALITIES,
        uiConfig: defaultData.uiConfig || { theme: 'dark', layout: 'split' }
      } as SkylarStageConfig;
      
      return config;
    }
    return null;
  },

  /**
   * Clears the in-memory cache.
   */
  clearCache() {
    globalConfigCache = null;
    journeyStagesCache = null;
  }
};
