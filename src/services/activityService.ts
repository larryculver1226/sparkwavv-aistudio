import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserActivity } from '../types/dashboard';

export async function logUserActivity(
  userId: string,
  tenantId: string,
  type: UserActivity['type'],
  title: string,
  description: string,
  journeyPhase: UserActivity['journeyPhase'],
  relatedEntityId?: string,
  tags?: string[]
) {
  try {
    const docRef = doc(collection(db, 'user_activities'));
    const activity: Omit<UserActivity, 'id'> = {
      userId,
      tenantId,
      type,
      title,
      description,
      timestamp: serverTimestamp() as any, // Will be replaced by Firestore
      journeyPhase,
      relatedEntityId,
      tags,
    };

    await setDoc(docRef, activity);
    return { success: true, activityId: docRef.id };
  } catch (error) {
    console.error('Error logging user activity:', error);
    return { success: false, error };
  }
}
