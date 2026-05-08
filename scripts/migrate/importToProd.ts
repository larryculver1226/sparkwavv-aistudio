import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

async function importToProd() {
  console.log('📥 Importing JSON Data to Production (sparkwavv-prod)...');
  
  const dumpPath = path.join(process.cwd(), 'migration_dump.json');
  if (!fs.existsSync(dumpPath)) {
    console.error('❌ ERROR: migration_dump.json NOT FOUND.');
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

  const destKeyRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!destKeyRaw || destKeyRaw.includes('placeholder')) {
    console.error('❌ ERROR: FIREBASE_SERVICE_ACCOUNT_JSON is missing.');
    process.exit(1);
  }

  const destKey = JSON.parse(destKeyRaw);
  console.log(`📡 Connecting to Destination Project: ${destKey.project_id}`);
  
  const destApp = initializeApp({
    credential: cert(destKey),
    projectId: destKey.project_id,
  }, 'dest-prod');

  const destDb = getFirestore(destApp);

  for (const [collectionName, docs] of Object.entries(data)) {
    console.log(`   Writing to ${collectionName}...`);
    const typedDocs = docs as { id: string; data: any }[];
    
    // Use batches for efficiency
    const batchSize = 500;
    for (let i = 0; i < typedDocs.length; i += batchSize) {
      const chunk = typedDocs.slice(i, i + batchSize);
      const batch = destDb.batch();
      
      for (const docObj of chunk) {
        const docRef = destDb.collection(collectionName).doc(docObj.id);
        batch.set(docRef, docObj.data);
      }
      
      await batch.commit();
      console.log(`   ✅ Committed batch ${i / batchSize + 1} (${chunk.length} docs).`);
    }
  }

  console.log('🎉 Production Import Complete!');
}

importToProd().catch(console.error);
