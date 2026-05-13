
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// This script syncs the PROD configuration to the SANDBOX environment 
// so that the Dev experience matches the Prod experience exactly.

async function syncEnvironments() {
  const sandboxJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const prodJson = process.env.PROD_FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!sandboxJson || !prodJson) {
    console.error('Service account environment variables missing.');
    return;
  }

  const sandboxKey = JSON.parse(sandboxJson);
  const prodKey = JSON.parse(prodJson);

  // Initialize Prod App
  const prodApp = admin.initializeApp({
    credential: admin.credential.cert(prodKey),
    projectId: prodKey.project_id
  }, 'prod');

  // Initialize Sandbox App
  const sandboxApp = admin.initializeApp({
    credential: admin.credential.cert(sandboxKey),
    projectId: sandboxKey.project_id
  }, 'sandbox');

  // Read config to get databaseId
  let databaseId: any = undefined;
  try {
    const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
    if (config.firestoreDatabaseId && config.firestoreDatabaseId !== 'PLACEHOLDER') {
      databaseId = config.firestoreDatabaseId;
    }
  } catch (e) {}

  if (databaseId === 'default') databaseId = '(default)';

  const prodDb = getFirestore(prodApp);
  const sandboxDbInstance = (databaseId && databaseId !== '(default)') 
    ? getFirestore(sandboxApp, databaseId)
    : getFirestore(sandboxApp);

  const collectionsToSync = ['metadata', 'agent_configs', 'journeyPhaseConfigs'];

  for (const collectionName of collectionsToSync) {
    console.log(`Syncing collection: ${collectionName} to DB: ${databaseId}...`);
    const snapshot = await prodDb.collection(collectionName).get();
    
    const batch = sandboxDbInstance.batch();
    snapshot.forEach(doc => {
      const docRef = sandboxDbInstance.collection(collectionName).doc(doc.id);
      batch.set(docRef, doc.data());
    });

    await batch.commit();
    console.log(`Successfully synced ${snapshot.size} documents in ${collectionName}.`);
  }

  console.log('Environment sync complete.');
}

syncEnvironments().catch(console.error);
