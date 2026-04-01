import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  QuerySnapshot, 
  DocumentData,
  doc,
  setDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ValidationGateEvent, DistilledArtifact } from '../types/wavvault';

export const subscribeToEvents = (userId: string, onUpdate: (events: ValidationGateEvent[]) => void, onError: (error: Error) => void) => {
  const eventsQuery = query(
    collection(db, 'wavvault_events'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(eventsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const eventData = snapshot.docs.map(doc => doc.data() as ValidationGateEvent);
    onUpdate(eventData);
  }, (err) => {
    console.error("Error fetching events:", err);
    onError(err);
  });
};

export const subscribeToArtifacts = (userId: string, onUpdate: (artifacts: DistilledArtifact[]) => void, onError: (error: Error) => void) => {
  const artifactsQuery = query(
    collection(db, 'wavvault_artifacts'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(artifactsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const artifactData = snapshot.docs.map(doc => doc.data() as DistilledArtifact);
    onUpdate(artifactData);
  }, (err) => {
    console.error("Error fetching artifacts:", err);
    onError(err);
  });
};

export const wavvaultService = {
  subscribeToEvents,
  subscribeToArtifacts
};

export async function writeUserWavvault(data: any) {
  const { userId, ...rest } = data;
  if (!userId) throw new Error("userId is required for writeUserWavvault");
  const docRef = doc(db, 'wavvault', userId);
  await setDoc(docRef, { 
    ...rest, 
    userId,
    updatedAt: serverTimestamp() 
  }, { merge: true });
  return { success: true, userId };
}

export async function writeArtifact(data: any) {
  const { userId, ...artifact } = data;
  if (!userId) throw new Error("userId is required for writeArtifact");
  const docRef = doc(collection(db, 'wavvault_artifacts'));
  const artifactId = docRef.id;
  await setDoc(docRef, { 
    ...artifact, 
    id: artifactId, 
    userId, 
    timestamp: serverTimestamp() 
  });
  return { success: true, artifactId };
}

export async function searchSimilarWavvaults(queryStr: string, tenantId: string, limitCount: number = 5) {
  // Simple text search mock for now - in a real app this would use vector search
  const q = query(
    collection(db, 'wavvault'),
    where('tenantId', '==', tenantId),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function analyzeWavvaultDelta(userId: string, currentData: any) {
  // Mock analysis logic
  return {
    suggestCommit: true,
    reason: "Significant evolution in career narrative detected.",
    deltaSummary: "Updated core strengths and professional identity based on recent interactions."
  };
}

export async function verifyWavvaultIntegrity(userId: string, data: any) {
  // Mock integrity check
  return {
    isValid: true,
    hash: "v1-" + Math.random().toString(36).substring(7),
    timestamp: new Date().toISOString()
  };
}

export async function getStorageMetrics(userId?: string) {
  // Mock metrics
  let q;
  if (userId) {
    q = query(collection(db, 'wavvault_artifacts'), where('userId', '==', userId));
  } else {
    q = query(collection(db, 'wavvault_artifacts'));
  }
  const snapshot = await getDocs(q);
  
  return {
    usedBytes: snapshot.docs.length * 1024 * 50, // Mock 50KB per artifact
    limitBytes: 100 * 1024 * 1024, // 100MB limit
    artifactCount: snapshot.docs.length
  };
}

export async function purgeOldArtifacts(userId?: string, olderThanDays: number = 30) {
  // Mock purge
  return { success: true, purgedCount: 0 };
}

export async function getLatestSnapshot(userId: string) {
  const docRef = doc(db, 'wavvault_snapshots', userId);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}
