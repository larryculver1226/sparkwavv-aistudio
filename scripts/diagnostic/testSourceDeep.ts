
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!saJson) return;
  
  const sa = JSON.parse(saJson);
  const app = admin.initializeApp({
      credential: admin.credential.cert(sa),
      projectId: sa.project_id
  }, 'sandbox-final');
  
  const dbId = 'ai-studio-1a3eb665-2cd9-4e84-a599-413bb4ee52e0';
  try {
      console.log(`Connecting to ${sa.project_id} database ${dbId}...`);
      const db = getFirestore(app, dbId);
      const collections = await db.listCollections();
      console.log('Collections found:', collections.map(c => c.id).join(', '));
      
      const userCount = (await db.collection('users').get()).size;
      console.log('User count in users collection:', userCount);
  } catch (e: any) {
      console.error('Error:', e.message);
  } finally {
      await app.delete();
  }
}
test();
