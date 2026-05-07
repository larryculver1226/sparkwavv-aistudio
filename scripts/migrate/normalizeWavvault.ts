
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * normalizeWavvault.ts
 * 
 * This script migrates data from the legacy 'wavvaults' (plural) collection
 * to the standardized 'wavvault' (singular) collection within the same project.
 * 
 * Usage:
 * tsx scripts/migrate/normalizeWavvault.ts
 */

async function normalize() {
  console.log('🛡️  Initializng Firestore Admin...');
  
  // Initialize Firebase Admin (Assumes environment is already authenticated via ADC or Service Account)
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }
  
  const db = admin.firestore();
  const sourceColl = 'wavvaults';
  const destColl = 'wavvault';

  console.log(`🔍 Checking for legacy records in "${sourceColl}"...`);
  
  const snapshot = await db.collection(sourceColl).get();
  
  if (snapshot.empty) {
    console.log('✅ No legacy records found to normalize.');
    return;
  }

  console.log(`📦 Found ${snapshot.size} records. Starting migration...`);

  const batchSize = 100;
  let processed = 0;

  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    const chunk = snapshot.docs.slice(i, i + batchSize);
    const batch = db.batch();

    chunk.forEach(doc => {
      const data = doc.data();
      const destRef = db.collection(destColl).doc(doc.id);
      
      // Copy data to new collection
      batch.set(destRef, data, { merge: true });
      
      // Optional: Delete from old collection after successful copy
      // batch.delete(doc.ref);
    });

    await batch.commit();
    processed += chunk.length;
    console.log(`⏳ Progress: ${processed}/${snapshot.size} records migrated.`);
  }

  console.log('🎉 Normalization complete! All data now resides in the singular "wavvault" collection.');
}

normalize().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
