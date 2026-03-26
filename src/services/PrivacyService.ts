import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

export interface PrivacySettings {
  userId: string;
  encryptionEnabled: boolean;
  publicKey?: string;
  lastUpdated: any;
  version: number;
}

export const PrivacyService = {
  async getSettings(userId: string): Promise<PrivacySettings | null> {
    try {
      const docRef = doc(db, 'privacy_settings', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as PrivacySettings;
      }
      return null;
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      return null;
    }
  },

  async updateSettings(userId: string, settings: Partial<PrivacySettings>): Promise<void> {
    try {
      const docRef = doc(db, 'privacy_settings', userId);
      await setDoc(docRef, {
        ...settings,
        userId,
        lastUpdated: serverTimestamp(),
        version: (settings.version || 0) + 1
      }, { merge: true });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  },

  async initializePrivacy(userId: string): Promise<PrivacySettings> {
    const existing = await this.getSettings(userId);
    if (existing) return existing;

    const initial: PrivacySettings = {
      userId,
      encryptionEnabled: false,
      lastUpdated: serverTimestamp(),
      version: 1
    };

    await this.updateSettings(userId, initial);
    return initial;
  }
};
