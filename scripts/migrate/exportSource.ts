import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function exportSource() {
  console.log('📤 Exporting Sandbox Data to JSON (Client SDK)...');
  
  const sandboxConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const sandboxConfig = JSON.parse(fs.readFileSync(sandboxConfigPath, 'utf8'));
  
  const app = initializeApp(sandboxConfig);
  const db = getFirestore(app, sandboxConfig.firestoreDatabaseId);

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

  const data: Record<string, any[]> = {};

  for (const collectionName of collections) {
    console.log(`   Reading ${collectionName}...`);
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      data[collectionName] = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
      console.log(`   ✅ Read ${snapshot.docs.length} docs.`);
    } catch (e: any) {
      console.error(`   ❌ Failed: ${e.message}`);
    }
  }

  const outputPath = path.join(process.cwd(), 'migration_dump.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`🎉 Export complete: ${outputPath}`);
  process.exit(0);
}

exportSource().catch(console.error);
