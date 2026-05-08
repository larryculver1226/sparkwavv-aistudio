import { initializeApp, cert, getApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

/**
 * Sparkwavv Production Migration Script
 */

async function migrate() {
  console.log('🚀 Starting Sparkwavv Production Migration...');

  // 1. Initialize Source (AI Studio Sandbox)
  const sandboxConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const sandboxConfig = JSON.parse(fs.readFileSync(sandboxConfigPath, 'utf8'));
  
  console.log(`📡 Connecting to Source Sandbox: ${sandboxConfig.projectId} (DB: ${sandboxConfig.firestoreDatabaseId})`);
  
  // Temporarily clear production key from environment to prevent it from overriding sandbox auth
  const backupKey = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const sourceApp = initializeApp({
    projectId: sandboxConfig.projectId,
  }, 'source-sandbox');

  if (backupKey) process.env.FIREBASE_SERVICE_ACCOUNT_JSON = backupKey;

  // 2. Initialize Destination (sparkwavv-prod)
  const destKeyRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!destKeyRaw || destKeyRaw.includes('placeholder')) {
    console.error('❌ ERROR: FIREBASE_SERVICE_ACCOUNT_JSON is missing or invalid.');
    process.exit(1);
  }

  const destKey = JSON.parse(destKeyRaw);
  console.log(`📡 Connecting to Destination Project: ${destKey.project_id}`);
  
  const destApp = initializeApp({
    credential: cert(destKey),
    projectId: destKey.project_id,
  }, 'dest-prod');

  const sourceDb = getFirestore(sourceApp, sandboxConfig.firestoreDatabaseId);
  const destDb = getFirestore(destApp); // Destination uses (default)

  const collections = [
    'users',
    'dashboards',
    'wavvault',
    'wavvault_artifacts',
    'journeyPhaseConfigs',
    'metadata',
    'feedback_issues',
    'user_activities'
  ];

  for (const collectionName of collections) {
    console.log(`\n📦 Migrating Collection: ${collectionName}...`);
    try {
      console.log(`   Reading from source...`);
      const snapshot = await sourceDb.collection(collectionName).get();
      if (snapshot.empty) {
        console.log(`   (Source collection empty, skipping)`);
        continue;
      }

      console.log(`   Found ${snapshot.size} documents. Writing to destination...`);
      
      const batch = destDb.batch();
      let count = 0;

      for (const doc of snapshot.docs) {
        const docRef = destDb.collection(collectionName).doc(doc.id);
        batch.set(docRef, doc.data(), { merge: true });
        count++;
        
        // Write in chunks of 500
        if (count % 400 === 0) {
          await batch.commit();
          console.log(`   Migrated ${count} logs...`);
        }
      }

      if (count % 400 !== 0) {
        await batch.commit();
      }
      
      console.log(`   ✅ Successfully migrated ${count} documents to ${collectionName}.`);
    } catch (err: any) {
      console.error(`   ❌ Error processing ${collectionName}: ${err.message}`);
      if (err.stack) console.error(err.stack);
    }
  }

  console.log('\n🎉 Production Migration Complete.');
  console.log('Next: Verify your collections in the sparkwavv-prod Google Cloud Console.');
}

migrate().catch(err => {
  console.error('💥 Fatal Migration Error:', err);
  process.exit(1);
});
