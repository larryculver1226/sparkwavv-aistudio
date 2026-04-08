import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { JourneyStageDefinition } from '../types/skylar';
import { JOURNEY_STAGES } from '../config/journeyStages';

const COLLECTION_NAME = 'agent_configs';

export const agentOpsService = {
  /**
   * Fetch all agent configurations from Firestore.
   * If the collection is empty, it will seed it with the hardcoded JOURNEY_STAGES.
   */
  async getAllConfigs(): Promise<Record<string, JourneyStageDefinition>> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      
      if (querySnapshot.empty) {
        console.log('Agent configs not found in Firestore. Seeding from hardcoded config...');
        await this.seedConfigs();
        return JOURNEY_STAGES;
      }

      const configs: Record<string, JourneyStageDefinition> = {};
      querySnapshot.forEach((doc) => {
        configs[doc.id] = doc.data() as JourneyStageDefinition;
      });
      return configs;
    } catch (error) {
      console.error('Error fetching agent configs:', error);
      // Fallback to hardcoded if Firestore fails (e.g., permissions issue)
      return JOURNEY_STAGES;
    }
  },

  /**
   * Fetch a specific agent configuration by stageId.
   */
  async getConfig(stageId: string): Promise<JourneyStageDefinition> {
    try {
      const docRef = doc(db, COLLECTION_NAME, stageId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as JourneyStageDefinition;
      } else {
        console.warn(`Agent config for ${stageId} not found in Firestore. Falling back to hardcoded.`);
        return JOURNEY_STAGES[stageId];
      }
    } catch (error) {
      console.error(`Error fetching agent config for ${stageId}:`, error);
      return JOURNEY_STAGES[stageId];
    }
  },

  /**
   * Save or update a specific agent configuration.
   */
  async saveConfig(stageId: string, config: JourneyStageDefinition): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, stageId);
      await setDoc(docRef, config);
      console.log(`Successfully saved agent config for ${stageId}`);
    } catch (error) {
      console.error(`Error saving agent config for ${stageId}:`, error);
      throw error;
    }
  },

  /**
   * Seed the Firestore collection with the hardcoded JOURNEY_STAGES.
   */
  async seedConfigs(): Promise<void> {
    try {
      const promises = Object.entries(JOURNEY_STAGES).map(([stageId, config]) => {
        const docRef = doc(db, COLLECTION_NAME, stageId);
        return setDoc(docRef, config);
      });
      await Promise.all(promises);
      console.log('Successfully seeded agent configs to Firestore.');
    } catch (error) {
      console.error('Error seeding agent configs:', error);
    }
  }
};
