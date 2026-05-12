import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Sparkwavv Production Migration Script (Precise Version)
 */

async function migrate() {
  console.log('🚀 Starting Sparkwavv Production Migration...');

  // 1. Source (Sandbox)
  const sourceSaJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!sourceSaJson) {
      console.error('❌ Missing FIREBASE_SERVICE_ACCOUNT_JSON for source (sandbox).');
      return;
  }
  const sourceSa = JSON.parse(sourceSaJson);
  const sourceDbId = 'ai-studio-1a3eb665-2cd9-4e84-a599-413bb4ee52e0';
  
  console.log(`📡 Connecting to Source Sandbox: ${sourceSa.project_id} (DB: ${sourceDbId})`);
  const sourceApp = initializeApp({
    credential: cert(sourceSa),
    projectId: sourceSa.project_id,
  }, 'source-sandbox');

  // 2. Destination (Prod)
  const destSaJson = process.env.PROD_FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!destSaJson) {
    console.error('❌ Missing PROD_FIREBASE_SERVICE_ACCOUNT_JSON for destination.');
    return;
  }
  const destSa = JSON.parse(destSaJson);
  console.log(`📡 Connecting to Destination Project: ${destSa.project_id} (DB: default)`);
  
  const destApp = initializeApp({
    credential: cert(destSa),
    projectId: destSa.project_id,
  }, 'dest-prod');

  const sourceDb = getFirestore(sourceApp, sourceDbId);
  const destDb = getFirestore(destApp); 

  const collections = [
    'users',
    'dashboards',
    'wavvault',
    'wavvault_artifacts',
    'journeyPhaseConfigs',
    'metadata',
    'feedback_issues',
    'user_activities',
    'agent_configs',
    'cohorts',
    'health',
    'journeys',
    'programs',
    'security_logs',
    'system_logs',
    'tenants',
    'user_insights'
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
      
      let batch = destDb.batch();
      let count = 0;

      for (const doc of snapshot.docs) {
        const docRef = destDb.collection(collectionName).doc(doc.id);
        batch.set(docRef, doc.data(), { merge: true });
        count++;
        
        // Write in chunks of 500
        if (count % 400 === 0) {
          await batch.commit();
          console.log(`   Committing batch at ${count}...`);
          batch = destDb.batch();
        }
      }

      if (count % 400 !== 0) {
        await batch.commit();
      }
      
      console.log(`   ✅ Successfully migrated ${count} documents to ${collectionName}.`);
    } catch (err: any) {
      console.error(`   ❌ Error processing ${collectionName}: ${err.message}`);
    }
  }

  console.log('\n🎉 Production Migration Complete.');
}

migrate().catch(err => {
  console.error('💥 Fatal Migration Error:', err);
  process.exit(1);
});
