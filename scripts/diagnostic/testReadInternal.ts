
import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('--- Testing Read from Internal Sandbox ---');
  
  // We'll use the SERVICE_ACCOUNT_JSON if present, as it currently points to the sandbox
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!saJson) {
      console.log('No FIREBASE_SERVICE_ACCOUNT_JSON found.');
      return;
  }
  
  const sa = JSON.parse(saJson);
  console.log('Initializing admin with project:', sa.project_id);
  
  const app = admin.initializeApp({
      credential: admin.credential.cert(sa),
      projectId: sa.project_id
  }, 'sandbox-test');
  
  const db = app.firestore();
  // The specific database ID from config
  const databaseId = 'ai-studio-1a3eb665-2cd9-4e84-a599-413bb4ee52e0';
  
  try {
      console.log(`Attempting to list users from database: ${databaseId}...`);
      const snapshot = await app.firestore(databaseId).collection('users').limit(5).get();
      console.log(`Found ${snapshot.size} users.`);
      snapshot.forEach(doc => {
          console.log(`- User: ${doc.id} (${doc.data().email || 'no email'})`);
      });
  } catch (e: any) {
      console.error('Failed to read from internal database:', e.message);
  } finally {
      await app.delete();
  }
}

test();
