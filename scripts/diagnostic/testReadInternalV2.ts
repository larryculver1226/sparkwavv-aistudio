
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('--- Testing Read from Internal Sandbox (Default DB) ---');
  
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!saJson) return;
  
  const sa = JSON.parse(saJson);
  const app = admin.initializeApp({
      credential: admin.credential.cert(sa),
      projectId: sa.project_id
  }, 'sandbox-default');
  
  try {
      console.log('Attempting to list users from (default) database...');
      const snapshot = await getFirestore(app).collection('users').get();
      console.log(`Found ${snapshot.size} users in (default).`);
      
      const dbId = 'ai-studio-1a3eb665-2cd9-4e84-a599-413bb4ee52e0';
      console.log(`Attempting to list users from (${dbId}) database...`);
      const snapshot2 = await getFirestore(app, dbId).collection('users').get();
      console.log(`Found ${snapshot2.size} users in (${dbId}).`);
      
  } catch (e: any) {
      console.error('Error:', e.message);
  } finally {
      await app.delete();
  }
}

test();
