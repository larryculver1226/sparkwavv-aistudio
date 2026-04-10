import { doc, getDoc, collection, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SkylarGlobalConfig, SkylarStageConfig } from '../types/skylar-config';
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
      const stagesRef = collection(db, 'journey_stages');
      const snapshot = await getDocs(stagesRef);
      
      const stages: Record<string, SkylarStageConfig> = {};
      snapshot.forEach((doc) => {
        stages[doc.id] = doc.data() as SkylarStageConfig;
      });

      journeyStagesCache = stages;
      return stages;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'journey_stages');
      throw error;
    }
  },

  /**
   * Fetches a specific journey stage configuration by ID.
   */
  async getJourneyStage(stageId: string, forceRefresh = false): Promise<SkylarStageConfig | null> {
    if (!forceRefresh && journeyStagesCache && journeyStagesCache[stageId]) {
      return journeyStagesCache[stageId];
    }

    try {
      const docRef = doc(db, 'journey_stages', stageId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as SkylarStageConfig;
        
        // Update cache
        if (!journeyStagesCache) {
          journeyStagesCache = {};
        }
        journeyStagesCache[stageId] = data;
        
        return data;
      } else {
        console.warn(`Journey stage ${stageId} not found.`);
        return null;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `journey_stages/${stageId}`);
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
