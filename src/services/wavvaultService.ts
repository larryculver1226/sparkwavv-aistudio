import admin from 'firebase-admin';
import { GoogleGenAI } from "@google/genai";

/**
 * Wavvault Data Access Service
 * Handles hybrid data storage for Sparkwavv:
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

/**
 * Writes user identity and career data to Firestore with vector embeddings
 * to support similarity search.
 */
export const writeUserWavvault = async (data: UserWavvaultData) => {
  const db = admin.firestore();
  
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
  } catch (error) {
    console.error("Error writing to Wavvault:", error);
    throw error;
  }
};

/**
 * Writes artifact metadata to Firestore with hardcoded Cloud Storage mapping.
 */
export const writeArtifact = async (data: ArtifactData) => {
  const db = admin.firestore();
  
  // Generate a unique ID for the artifact
  const artifactId = admin.firestore().collection('artifacts').doc().id;
  
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
    
    return { success: true, id: artifactId, storagePath };
  } catch (error) {
    console.error("Error writing artifact mapping:", error);
    throw error;
  }
};

/**
 * Performs a vector similarity search in Firestore
 */
export const searchSimilarWavvaults = async (queryText: string, limit: number = 5) => {
  const db = admin.firestore();
  
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
  } catch (error) {
    console.error("Error performing vector search:", error);
    throw error;
  }
};
