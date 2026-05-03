import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { JourneyStageDefinition } from '../types/skylar';
import defaultJourneyStages from '../config/defaultJourneyStages.json';

const COLLECTION_NAME = 'journeyPhaseConfigs';

export type GenkitTraceListener = (traces: any[]) => void;

class GenkitTracer {
  private traces: any[] = [];
  private listeners: GenkitTraceListener[] = [];

  addTrace(trace: any) {
    this.traces = [trace, ...this.traces].slice(0, 50); // Keep last 50 traces in memory
    this.notify();
  }

  getTraces() {
    return this.traces;
  }

  subscribe(listener: GenkitTraceListener) {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  clearTraces() {
    this.traces = [];
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l(this.traces));
  }
}

export const genkitTracer = new GenkitTracer();

export const agentOpsService = {
  /**
   * Fetch all agent configurations from Firestore.
   * If the collection is empty, it will seed it with the hardcoded DEFAULT_JOURNEY_STAGES.
   */
  async getAllConfigs(): Promise<Record<string, JourneyStageDefinition>> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      
      if (querySnapshot.empty) {
        console.log('Agent configs not found in Firestore. Seeding from hardcoded config...');
        await this.seedConfigs();
        return defaultJourneyStages as any;
      }

      const configs: Record<string, JourneyStageDefinition> = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        configs[doc.id] = {
          ...data,
          title: data.title || data.stageTitle || doc.id
        } as JourneyStageDefinition;
      });
      return configs;
    } catch (error) {
      console.error('Error fetching agent configs:', error);
      // Fallback to hardcoded if Firestore fails (e.g., permissions issue)
      return defaultJourneyStages as any;
    }
  },

  /**
   * Fetch a specific agent configuration by stageId.
   */
  async getConfig(stageId: string): Promise<JourneyStageDefinition> {
    try {
      let docRef = doc(db, COLLECTION_NAME, stageId);
      let docSnap = await getDoc(docRef);

      if (!docSnap.exists() && stageId !== stageId.toLowerCase()) {
        const normalizedId = stageId.toLowerCase();
        docRef = doc(db, COLLECTION_NAME, normalizedId);
        docSnap = await getDoc(docRef);
      }

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          title: data.title || data.stageTitle || docSnap.id
        } as JourneyStageDefinition;
      } else {
        // Fallback to hardcoded default if it exists
        const normalizedId = stageId.toLowerCase();
        const fallback = (defaultJourneyStages as any)[normalizedId];
        if (fallback) {
          return fallback;
        }
        throw new Error(`Journey Phase Config not found for ${stageId}`);
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Save or update a specific agent configuration.
   */
  async saveConfig(stageId: string, config: JourneyStageDefinition): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, stageId);
      await setDoc(docRef, config, { merge: true });
      console.log(`Successfully saved agent config for ${stageId}`);
    } catch (error) {
      console.error(`Error saving agent config for ${stageId}:`, error);
      throw error;
    }
  },

  /**
   * Seed the Firestore collection with the hardcoded defaultJourneyStages.
   */
  async seedConfigs(): Promise<void> {
    try {
      const promises = Object.entries(defaultJourneyStages).map(([stageId, config]) => {
        const docRef = doc(db, COLLECTION_NAME, stageId);
        return setDoc(docRef, config as any, { merge: true });
      });
      await Promise.all(promises);
      console.log('Successfully seeded agent configs to Firestore.');
    } catch (error) {
      console.error('Error seeding agent configs:', error);
    }
  }
};
