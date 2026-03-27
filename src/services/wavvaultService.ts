import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { logEvent } from './loggingService.js';
import { getGeminiApiKey } from './aiConfig.js';

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
  
  // Ensure admin is initialized
  let app;
  try {
    app = admin.app();
  } catch (e) {
    // If not initialized, try to initialize with default options if possible, 
    // but usually server.ts handles this. For now, just throw a clearer error.
    console.error("WavvaultService: Firebase Admin not initialized. admin.initializeApp() must be called before getDb().");
    throw new Error("Firebase Admin not initialized");
  }

  if (databaseId) {
    return getFirestore(app, databaseId);
  }
  return getFirestore(app);
};

/**
 * Wavvault Data Access Service
 * Handles hybrid data storage for SPARKWavv:
 * 1. Firestore Vector Search (NoSQL)
 * 2. Cloud Storage Artifact Mapping
 */

// Lazy initialization of Gemini
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = getGeminiApiKey();
    
    if (!apiKey) {
      console.error("WavvaultService: Gemini API key is missing.");
      throw new Error("GEMINI_API_KEY is not configured in the environment variables. Please check your AI Studio settings.");
    }

    // Mask the key for logging
    const maskedKey = apiKey.length > 8 ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : "****";
    console.log(`WavvaultService: Initializing GoogleGenAI with key: ${maskedKey} (length: ${apiKey.length})`);
    
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export interface UserWavvaultData {
  userId: string;
  tenantId: string; // Added for tenant isolation
  identity: string;
  strengths: string[];
  careerStories: string[];
  isCommit?: boolean; // If true, create a permanent snapshot
}

export interface ArtifactData {
  userId: string;
  filename: string;
  type: string;
  description?: string;
  content?: string | Buffer; // For hashing
}

const STORAGE_BUCKET_BASE = firebaseAppletConfig.storageBucket 
  ? `gs://${firebaseAppletConfig.storageBucket}` 
  : (firebaseAppletConfig.projectId 
      ? `gs://${firebaseAppletConfig.projectId}.appspot.com` 
      : "gs://gen-lang-client-0883822731.appspot.com");
const MAX_STORAGE_QUOTA = 100 * 1024 * 1024; // 100MB in bytes
const MAX_SNAPSHOTS = 5;

/**
 * Generates a SHA-256 hash of the content
 */
export const generateHash = (content: string | Buffer): string => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

/**
 * Verifies the integrity of a Wavvault document
 */
export const verifyWavvaultIntegrity = async (userId: string, data: any): Promise<{ valid: boolean; expectedHash: string; actualHash: string }> => {
  const combinedText = `
    Identity: ${data.identity}
    Strengths: ${data.strengths.join(', ')}
    Career Stories: ${data.careerStories.join('\n')}
  `.trim();
  
  const expectedHash = generateHash(combinedText);
  const actualHash = data.contentHash;
  
  return {
    valid: expectedHash === actualHash,
    expectedHash,
    actualHash
  };
};

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
export const purgeOldArtifacts = async (userId?: string) => {
  const db = getDb();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  try {
    let query: any = db.collection('artifacts');
    
    if (userId) {
      query = query.where('userId', '==', userId);
    } else {
      query = query.where('createdAt', '<', admin.firestore.Timestamp.fromDate(thirtyDaysAgo));
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      await logEvent('INFO', 'STORAGE', userId ? `Cleanup task: No artifacts found for user ${userId}.` : 'Cleanup task: No old artifacts found to purge.');
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
 * Performs a physical purge of a user's Wavvault data for GDPR compliance.
 * This deletes the main document and all snapshots, breaking the chain.
 */
export const purgeUserWavvault = async (userId: string): Promise<{ success: boolean }> => {
  const db = getDb();
  try {
    const wavvaultRef = db.collection('wavvault').doc(userId);
    const snapshotsRef = wavvaultRef.collection('snapshots');

    // Delete all snapshots
    const snapshots = await snapshotsRef.get();
    const batch = db.batch();
    snapshots.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete main document
    batch.delete(wavvaultRef);
    
    await batch.commit();

    // Also purge artifacts
    await purgeOldArtifacts(userId);

    await logEvent('INFO', 'SYSTEM', `Physical purge completed for user: ${userId}`, { userId });

    return { success: true };
  } catch (error: any) {
    console.error("Error purging user Wavvault:", error.message || error);
    await logEvent('ERROR', 'SYSTEM', `Purge failed for user: ${userId}: ${error.message}`);
    throw error;
  }
};

/**
 * Gets the latest snapshot for a user
 */
export const getLatestSnapshot = async (userId: string) => {
  const db = getDb();
  const snapshots = await db.collection('wavvault').doc(userId).collection('snapshots')
    .orderBy('committedAt', 'desc')
    .limit(1)
    .get();
  
  if (snapshots.empty) return null;
  return snapshots.docs[0].data();
};

/**
 * Analyzes the delta between current data and the latest snapshot
 * to suggest if a new commit is needed.
 */
export const analyzeWavvaultDelta = async (userId: string, currentData: UserWavvaultData) => {
  const latestSnapshot = await getLatestSnapshot(userId);
  if (!latestSnapshot) return { suggestCommit: true, reason: "First version of your Career DNA." };

  const currentText = `
    Identity: ${currentData.identity}
    Strengths: ${currentData.strengths.join(', ')}
    Career Stories: ${currentData.careerStories.join('\n')}
  `.trim();

  const snapshotText = `
    Identity: ${latestSnapshot.identity}
    Strengths: ${latestSnapshot.strengths.join(', ')}
    Career Stories: ${latestSnapshot.careerStories.join('\n')}
  `.trim();

  // If hashes match, no change
  if (generateHash(currentText) === latestSnapshot.contentHash) {
    return { suggestCommit: false };
  }

  try {
    const ai = getAI();
    const prompt = `
      Compare these two versions of a professional's Career DNA.
      Version A (Latest Snapshot):
      ${snapshotText}

      Version B (Current Updates):
      ${currentText}

      Has there been a significant evolution or addition that warrants a new version commit?
      Significant changes include:
      - New major achievements or career stories.
      - Shift in professional identity or brand persona.
      - Addition of new core strengths.

      Respond in JSON format:
      {
        "suggestCommit": boolean,
        "reason": "Short explanation of why a commit is suggested or not",
        "deltaSummary": "Brief summary of what changed"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing delta:", error);
    return { suggestCommit: true, reason: "Significant updates detected." };
  }
};

/**
 * Writes user identity and career data to Firestore with vector embeddings
 * and cryptographic snapshots for immutable storage.
 */
export const writeUserWavvault = async (data: UserWavvaultData) => {
  const db = getDb();
  
  // Combine text for embedding and hashing
  const combinedText = `
    Identity: ${data.identity}
    Strengths: ${data.strengths.join(', ')}
    Career Stories: ${data.careerStories.join('\n')}
  `.trim();
  
  const contentHash = generateHash(combinedText);
  
  try {
    const ai = getAI();
    // Generate vector embedding using Gemini
    const result = await ai.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: { parts: [{ text: combinedText }] },
      config: { outputDimensionality: 768 }
    });
    const embeddingValues = result.embeddings[0].values;
    
    const docRef = db.collection('wavvault').doc(data.userId);
    const existingDoc = await docRef.get();
    const previousHash = existingDoc.exists ? existingDoc.data()?.contentHash : null;

    const updatePayload = {
      userId: data.userId,
      tenantId: data.tenantId, // Added for tenant isolation
      identity: data.identity,
      strengths: data.strengths,
      careerStories: data.careerStories,
      contentHash: contentHash,
      previousHash: previousHash,
      embedding: admin.firestore.FieldValue.vector(embeddingValues),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // 1. Update the "Current" state
    await docRef.set(updatePayload);

    // 2. If this is an explicit commit, create a snapshot
    if (data.isCommit) {
      const snapshotRef = docRef.collection('snapshots').doc(contentHash);
      await snapshotRef.set({
        ...updatePayload,
        committedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 3. Manage retention (keep only latest 5 snapshots)
      const snapshots = await docRef.collection('snapshots')
        .orderBy('committedAt', 'desc')
        .get();
      
      if (snapshots.size > MAX_SNAPSHOTS) {
        const batch = db.batch();
        snapshots.docs.slice(MAX_SNAPSHOTS).forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        await logEvent('INFO', 'FIRESTORE', `Pruned ${snapshots.size - MAX_SNAPSHOTS} old snapshots for user ${data.userId}`);
      }

      await logEvent('INFO', 'FIRESTORE', `New snapshot committed: ${contentHash.substring(0, 8)}`, { userId: data.userId });
    }
    
    return { success: true, userId: data.userId, contentHash };
  } catch (error: any) {
    console.error("Error writing to Wavvault:", error.message || error);
    throw error;
  }
};

/**
 * Writes artifact metadata to Firestore with hardcoded Cloud Storage mapping
 * and content integrity hashing.
 */
export const writeArtifact = async (data: ArtifactData) => {
  const db = getDb();
  
  // Check quota first
  const metrics = await getStorageMetrics();
  // Assume 1MB per new artifact for this simulation if content not provided
  const estimatedNewSize = data.content ? (typeof data.content === 'string' ? Buffer.byteLength(data.content) : data.content.length) : 1024 * 1024; 
  
  if ((metrics.totalSize as number) + estimatedNewSize > MAX_STORAGE_QUOTA) {
    await logEvent('ERROR', 'STORAGE', 'Failed to upload artifact: bucket_quota_exceeded', { 
      currentSize: metrics.totalSize, 
      quota: MAX_STORAGE_QUOTA 
    });
    throw new Error('bucket_quota_exceeded');
  }

  // Generate content hash for integrity
  const contentHash = data.content ? generateHash(data.content) : generateHash(data.filename + Date.now());

  // Generate a unique ID for the artifact
  const artifactId = db.collection('artifacts').doc().id;
  
  // Hardcoded Cloud Storage reference as per requirements
  const storagePath = `${STORAGE_BUCKET_BASE}/users/${data.userId}/artifacts/${data.filename}`;
  
  try {
    const docRef = db.collection('artifacts').doc(artifactId);
    
    // Check if an artifact with this filename already exists for this user (Latest version only)
    const existing = await db.collection('artifacts')
      .where('userId', '==', data.userId)
      .where('filename', '==', data.filename)
      .get();
    
    if (!existing.empty) {
      // Delete old version metadata (Latest version only policy)
      const batch = db.batch();
      existing.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    await docRef.set({
      id: artifactId,
      userId: data.userId,
      filename: data.filename,
      type: data.type,
      description: data.description || '',
      storagePath: storagePath, // GS URI for artifact mapping
      contentHash: contentHash,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update metrics
    await updateStorageMetrics(estimatedNewSize, 1);
    await logEvent('INFO', 'STORAGE', `Artifact uploaded: ${data.filename} (Hash: ${contentHash.substring(0, 8)})`, { userId: data.userId });
    
    return { success: true, id: artifactId, storagePath, contentHash };
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
 * Performs a vector similarity search in Firestore with tenant isolation
 */
export const searchSimilarWavvaults = async (queryText: string, tenantId: string, limit: number = 5) => {
  const db = getDb();
  
  try {
    const ai = getAI();
    // Generate embedding for the query
    const result = await ai.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: { parts: [{ text: queryText }] },
      config: { outputDimensionality: 768 }
    });
    const queryVector = result.embeddings[0].values;
    
    // Perform vector search with tenant filter
    const snapshot = await db.collection('wavvault')
      .where('tenantId', '==', tenantId) // Tenant Isolation
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
