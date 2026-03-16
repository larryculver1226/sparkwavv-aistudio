import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logEvent } from './loggingService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read config to get named database ID
let firebaseAppletConfig: any = {};
try {
  const configPath = path.resolve(__dirname, '../../firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseAppletConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (error) {
  console.warn("WavvaultService: Could not read firebase-applet-config.json", error);
}

const getDb = () => {
  const databaseId = firebaseAppletConfig.firestoreDatabaseId;
  if (databaseId) {
    return getFirestore(admin.app(), databaseId);
  }
  return getFirestore(admin.app());
};

/**
 * Wavvault Data Access Service
 * Handles hybrid data storage for SPARKWavv:
 * 1. Firestore Vector Search (NoSQL)
 * 2. Cloud Storage Artifact Mapping
 */

// Initialize Gemini for embeddings
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface UserWavvaultData {
  userId: string;
  identity: string;
  strengths: string[];
  careerStories: string[];
}

export interface ArtifactData {
  userId: string;
  filename: string;
  type: string;
  description?: string;
}

const STORAGE_BUCKET_BASE = "gs://gen-lang-client-0981029715.appspot.com";
const MAX_STORAGE_QUOTA = 100 * 1024 * 1024; // 100MB in bytes

/**
 * Updates global storage metrics
 */
const updateStorageMetrics = async (sizeDelta: number, countDelta: number) => {
  const db = getDb();
  const metricRef = db.collection('storage_metrics').doc('global');
  
  try {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(metricRef);
      if (!doc.exists) {
        transaction.set(metricRef, {
          id: 'global',
          totalSize: Math.max(0, sizeDelta),
          artifactCount: Math.max(0, countDelta),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        const data = doc.data()!;
        transaction.update(metricRef, {
          totalSize: Math.max(0, data.totalSize + sizeDelta),
          artifactCount: Math.max(0, data.artifactCount + countDelta),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });
  } catch (error) {
    console.error("Failed to update storage metrics:", error);
  }
};

/**
 * Gets current storage metrics
 */
export const getStorageMetrics = async () => {
  const db = getDb();
  const doc = await db.collection('storage_metrics').doc('global').get();
  if (!doc.exists) {
    return { totalSize: 0, artifactCount: 0, quota: MAX_STORAGE_QUOTA };
  }
  return { ...doc.data(), quota: MAX_STORAGE_QUOTA };
};

/**
 * Purges artifacts older than 30 days
 */
export const purgeOldArtifacts = async () => {
  const db = getDb();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  try {
    const snapshot = await db.collection('artifacts')
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .get();
    
    if (snapshot.empty) {
      await logEvent('INFO', 'STORAGE', 'Cleanup task: No old artifacts found to purge.');
      return { count: 0 };
    }

    const batch = db.batch();
    let totalSizeRemoved = 0;
    snapshot.docs.forEach(doc => {
      // In a real app, we'd delete from Cloud Storage here
      // For this demo, we assume each artifact is ~1MB for metric tracking
      totalSizeRemoved += 1024 * 1024; 
      batch.delete(doc.ref);
    });

    await batch.commit();
    await updateStorageMetrics(-totalSizeRemoved, -snapshot.size);
    await logEvent('INFO', 'STORAGE', `Cleanup task: Purged ${snapshot.size} old artifacts.`, { sizeRemoved: totalSizeRemoved });
    
    return { count: snapshot.size };
  } catch (error: any) {
    await logEvent('ERROR', 'STORAGE', `Cleanup task failed: ${error.message}`);
    throw error;
  }
};

/**
 * Writes user identity and career data to Firestore with vector embeddings
 * to support similarity search.
 */
export const writeUserWavvault = async (data: UserWavvaultData) => {
  const db = getDb();
  
  // Combine text for embedding generation
  const combinedText = `
    Identity: ${data.identity}
    Strengths: ${data.strengths.join(', ')}
    Career Stories: ${data.careerStories.join('\n')}
  `.trim();
  
  try {
    // Generate vector embedding using Gemini
    const result = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: { parts: [{ text: combinedText }] }
    });
    const embeddingValues = result.embeddings[0].values;
    
    // Store in Firestore using the vector type
    const docRef = db.collection('wavvault').doc(data.userId);
    await docRef.set({
      userId: data.userId,
      identity: data.identity,
      strengths: data.strengths,
      careerStories: data.careerStories,
      // Explicitly store as a vector for similarity search
      // Using FieldValue.vector if VectorValue is not directly accessible
      embedding: admin.firestore.FieldValue.vector(embeddingValues),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, userId: data.userId };
  } catch (error: any) {
    console.error("Error writing to Wavvault:", error.message || error);
    if (error.code === 5) {
      console.error("Firestore Error 5 (NOT_FOUND): Database not initialized.");
    }
    throw error;
  }
};

/**
 * Writes artifact metadata to Firestore with hardcoded Cloud Storage mapping.
 */
export const writeArtifact = async (data: ArtifactData) => {
  const db = getDb();
  
  // Check quota first
  const metrics = await getStorageMetrics();
  // Assume 1MB per new artifact for this simulation
  const estimatedNewSize = 1024 * 1024; 
  
  if ((metrics.totalSize as number) + estimatedNewSize > MAX_STORAGE_QUOTA) {
    await logEvent('ERROR', 'STORAGE', 'Failed to upload artifact: bucket_quota_exceeded', { 
      currentSize: metrics.totalSize, 
      quota: MAX_STORAGE_QUOTA 
    });
    throw new Error('bucket_quota_exceeded');
  }

  // Generate a unique ID for the artifact
  const artifactId = db.collection('artifacts').doc().id;
  
  // Hardcoded Cloud Storage reference as per requirements
  const storagePath = `${STORAGE_BUCKET_BASE}/users/${data.userId}/artifacts/${data.filename}`;
  
  try {
    const docRef = db.collection('artifacts').doc(artifactId);
    await docRef.set({
      id: artifactId,
      userId: data.userId,
      filename: data.filename,
      type: data.type,
      description: data.description || '',
      storagePath: storagePath, // GS URI for artifact mapping
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update metrics
    await updateStorageMetrics(estimatedNewSize, 1);
    await logEvent('INFO', 'STORAGE', `Artifact uploaded: ${data.filename}`, { userId: data.userId });
    
    return { success: true, id: artifactId, storagePath };
  } catch (error: any) {
    console.error("Error writing artifact mapping:", error.message || error);
    if (error.code === 5) {
      console.error("Firestore Error 5 (NOT_FOUND): Database not initialized.");
    }
    await logEvent('ERROR', 'STORAGE', `Upload failed: ${error.message}`);
    throw error;
  }
};

/**
 * Performs a vector similarity search in Firestore
 */
export const searchSimilarWavvaults = async (queryText: string, limit: number = 5) => {
  const db = getDb();
  
  try {
    // Generate embedding for the query
    const result = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: { parts: [{ text: queryText }] }
    });
    const queryVector = result.embeddings[0].values;
    
    // Perform vector search
    // Note: findNearest might require a specific version of the SDK
    const snapshot = await db.collection('wavvault')
      .findNearest('embedding', admin.firestore.FieldValue.vector(queryVector), {
        limit: limit,
        distanceMeasure: 'COSINE'
      })
      .get();
      
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      distance: (doc as any).distance // Distance is included in vector search results
    }));
  } catch (error: any) {
    console.error("Error performing vector search:", error.message || error);
    if (error.code === 5) {
      console.error("Firestore Error 5 (NOT_FOUND): Database not initialized.");
    }
    throw error;
  }
};
