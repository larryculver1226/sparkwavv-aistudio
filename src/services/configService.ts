import { doc, getDoc, collection, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SkylarGlobalConfig, SkylarStageConfig, DEFAULT_MODALITIES } from '../types/skylar-config';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

// In-memory cache
let globalConfigCache: SkylarGlobalConfig | null = null;
let journeyStagesCache: Record<string, SkylarStageConfig> | null = null;

export const configService = {
  /**
   * Updates the global Skylar configuration in Firestore.
   */
  async updateGlobalConfig(config: SkylarGlobalConfig): Promise<void> {
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

    try {
      const docRef = doc(db, 'metadata', 'skylar_global');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as SkylarGlobalConfig;
        globalConfigCache = data;
        return data;
      } else {
        console.warn('skylar_global document not found in metadata collection.');
        return null;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'metadata/skylar_global');
      throw error;
    }
  },

  /**
   * Subscribes to the global Skylar configuration in Firestore.
   */
  subscribeToSkylarGlobalConfig(callback: (config: SkylarGlobalConfig | null) => void): () => void {
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
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'metadata/skylar_global');
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

    try {
      const stagesRef = collection(db, 'agent_configs');
      const snapshot = await getDocs(stagesRef);
      
      const stages: Record<string, SkylarStageConfig> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Map JourneyStageDefinition to SkylarStageConfig if needed
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

      journeyStagesCache = stages;
      return stages;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'agent_configs');
      throw error;
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

    try {
      const docRef = doc(db, 'agent_configs', normalizedStageId);
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
      } else {
        console.warn(`Journey stage ${normalizedStageId} not found.`);
        return null;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `agent_configs/${normalizedStageId}`);
      throw error;
    }
  },

  /**
   * Updates a specific journey stage configuration in Firestore.
   */
  async updateStageConfig(stageId: string, config: SkylarStageConfig): Promise<void> {
    try {
      const docRef = doc(db, 'agent_configs', stageId);
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
      handleFirestoreError(error, OperationType.UPDATE, `agent_configs/${stageId}`);
      throw error;
    }
  },

  /**
   * Clears the in-memory cache.
   */
  clearCache() {
    globalConfigCache = null;
    journeyStagesCache = null;
  }
};
