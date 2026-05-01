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
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ValidationGateEvent, DistilledArtifact } from '../types/wavvault';
import { logUserActivity } from './activityService';

import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export const subscribeToEvents = (
  userId: string,
  onUpdate: (events: ValidationGateEvent[]) => void,
  onError: (error: Error) => void
) => {
  const eventsQuery = query(
    collection(db, 'wavvault_events'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(
    eventsQuery,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const eventData = snapshot.docs.map((doc) => doc.data() as ValidationGateEvent);
      onUpdate(eventData);
    },
    (err) => {
      console.error('Error fetching events:', err);
      handleFirestoreError(err, OperationType.LIST, 'wavvault_events');
      onError(err);
    }
  );
};

export const subscribeToArtifacts = (
  userId: string,
  onUpdate: (artifacts: DistilledArtifact[]) => void,
  onError: (error: Error) => void
) => {
  const artifactsQuery = query(
    collection(db, 'wavvault_artifacts'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(
    artifactsQuery,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const artifactData = snapshot.docs.map((doc) => doc.data() as DistilledArtifact);
      onUpdate(artifactData);
    },
    (err) => {
      console.error('Error fetching artifacts:', err);
      handleFirestoreError(err, OperationType.LIST, 'wavvault_artifacts');
      onError(err);
    }
  );
};

export const wavvaultService = {
  subscribeToEvents,
  subscribeToArtifacts,
};

const generateHash = (data: any) => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'v1-' + Math.abs(hash).toString(16);
};

export async function writeUserWavvault(data: any, isCommit: boolean = false) {
  const { userId, ...rest } = data;
  if (!userId) throw new Error('userId is required for writeUserWavvault');
  const docRef = doc(db, 'wavvault', userId);
  
  const hash = generateHash(rest);
  const updateData: any = {
    ...rest,
    userId,
    updatedAt: serverTimestamp(),
  };

  if (isCommit) {
    updateData.lastCommitHash = hash;
    updateData.lastCommitTimestamp = serverTimestamp();
    
    // Also save to snapshots collection
    const snapshotRef = doc(db, 'wavvault_snapshots', userId);
    await setDoc(snapshotRef, {
      data: rest,
      hash,
      userId,
      timestamp: serverTimestamp()
    });
  }

  await setDoc(docRef, updateData, { merge: true });
  return { success: true, userId, hash };
}

export async function writeArtifact(data: any) {
  const { userId, ...artifact } = data;
  if (!userId) throw new Error('userId is required for writeArtifact');
  const docRef = doc(collection(db, 'wavvault_artifacts'));
  const artifactId = docRef.id;
  await setDoc(docRef, {
    ...artifact,
    id: artifactId,
    userId,
    timestamp: serverTimestamp(),
  });

  // Log activity
  await logUserActivity(
    userId,
    artifact.tenantId || 'default',
    'artifact_created',
    `Created Artifact: ${artifact.title || 'Untitled'}`,
    `A new artifact was distilled in the ${artifact.journeyPhase || 'unknown'} phase.`,
    artifact.journeyPhase as any,
    artifactId
  );

  return { success: true, artifactId };
}

export async function searchSimilarWavvaults(
  queryStr: string,
  tenantId: string,
  limitCount: number = 5
) {
  // Simple text search mock for now - in a real app this would use vector search
  const q = query(collection(db, 'wavvault'), where('tenantId', '==', tenantId), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function analyzeWavvaultDelta(userId: string, currentData: any) {
  // basic logic to evaluate if we should commit
  const latestSnapshot = await getLatestSnapshot(userId);
  if (!latestSnapshot) {
    return {
      suggestCommit: true,
      reason: 'No baseline snapshot found. Initializing Wavvault.',
      deltaSummary: 'First commit of user data.',
    };
  }

  const artifactsLength = currentData?.artifacts?.length || 0;
  const lastArtifactsLength = latestSnapshot?.data?.artifacts?.length || 0;

  if (artifactsLength > lastArtifactsLength) {
    return {
      suggestCommit: true,
      reason: 'New artifacts have been distilled.',
      deltaSummary: `Added ${artifactsLength - lastArtifactsLength} new artifact(s) since last commit.`,
    };
  }

  return {
    suggestCommit: false,
    reason: 'No significant changes detected.',
    deltaSummary: 'No changes.',
  };
}

export async function verifyWavvaultIntegrity(userId: string, data: any) {
  const latestSnapshot = await getLatestSnapshot(userId);
  const actualHash = generateHash(data);
  const expectedHash = latestSnapshot?.hash || 'none';

  return {
    valid: latestSnapshot ? actualHash === expectedHash : true,
    actualHash,
    expectedHash,
    timestamp: new Date().toISOString(),
  };
}

export async function getStorageMetrics(userId?: string) {
  let q;
  if (userId) {
    q = query(collection(db, 'wavvault_artifacts'), where('userId', '==', userId));
  } else {
    q = query(collection(db, 'wavvault_artifacts'));
  }
  const snapshot = await getDocs(q);

  let usedBytes = 0;
  snapshot.forEach(doc => {
    // very basic approximation of JSON size in bytes
    usedBytes += JSON.stringify(doc.data()).length;
  });

  return {
    usedBytes,
    limitBytes: 100 * 1024 * 1024, // 100MB limit
    artifactCount: snapshot.docs.length,
  };
}

export async function purgeOldArtifacts(userId?: string, olderThanDays: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let q;
    if (userId) {
      q = query(
        collection(db, 'wavvault_artifacts'),
        where('userId', '==', userId),
        where('timestamp', '<', cutoffDate.toISOString())
      );
    } else {
      q = query(
        collection(db, 'wavvault_artifacts'),
        where('timestamp', '<', cutoffDate.toISOString())
      );
    }
    
    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, 'wavvault_artifacts', docSnap.id)));
    await Promise.all(deletePromises);
    
    return { success: true, purgedCount: snapshot.docs.length };
  } catch (err) {
    console.error('Failed to purge old artifacts:', err);
    return { success: false, purgedCount: 0 };
  }
}

export async function getLatestSnapshot(userId: string) {
  const docRef = doc(db, 'wavvault_snapshots', userId);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}
