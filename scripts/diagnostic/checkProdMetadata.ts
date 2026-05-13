
import { initializeApp, cert, deleteApp, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

function isPlaceholder(val: string | undefined): boolean {
  if (!val) return true;
  const v = val.toLowerCase();
  return v.includes('placeholder') || v.includes('$$') || v.includes('your-');
}

async function checkMetadata(type: 'PROD' | 'SANDBOX') {
  const saVar = type === 'PROD' ? 'PROD_FIREBASE_SERVICE_ACCOUNT_JSON' : 'FIREBASE_SERVICE_ACCOUNT_JSON';
  const saJson = process.env[saVar];
  
  if (!saJson || isPlaceholder(saJson)) {
    console.log(`[${type}] Service account NOT configured.`);
    return;
  }

  const sa = JSON.parse(saJson);
  
  // Try to find databaseId from config file
  let databaseId = '(default)';
  try {
    const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
    if (config.projectId === sa.project_id) {
       databaseId = config.firestoreDatabaseId || '(default)';
    }
  } catch (e) {}

  console.log(`[${type}] Target Project: ${sa.project_id}, DB: ${databaseId}`);

  const appName = `app-${type.toLowerCase()}`;
  const app = initializeApp({
    credential: cert(sa),
    projectId: sa.project_id,
    databaseId: databaseId === '(default)' ? undefined : databaseId
  }, appName);

  const db = getFirestore(app);
  // Manual database ID override if not (default)
  if (databaseId !== '(default)' && databaseId !== '') {
    // Only available in certain SDK versions, we might need to use a dedicated getFirestore call if supported
    // But for simplicity, we'll try to use the default first.
  }

  try {
    const collections = await db.listCollections();
    console.log(`[${type}] --- Collections in root ---`);
    collections.forEach(col => console.log(`- ${col.id}`));

    const metadataRef = db.collection('metadata');
    const metaDocs = await metadataRef.get();
    console.log(`[${type}] --- Metadata documents ---`);
    metaDocs.forEach(doc => {
        console.log(`- ${doc.id}`);
        if (doc.id === 'skylar_global') {
            console.log(JSON.stringify(doc.data(), null, 2));
        }
    });

    const agentConfigsRef = db.collection('agent_configs');
    const agentDocs = await agentConfigsRef.get();
    console.log(`[${type}] --- Agent Configs (with avatar check) ---`);
    agentDocs.forEach(doc => {
        const data = doc.data();
        console.log(`- ${doc.id}: Avatar: ${data.avatar || data.avatarUrl || 'NONE'}`);
    });

  } catch (error: any) {
    console.error(`[${type}] Error:`, error.message);
  } finally {
    await deleteApp(app);
  }
}

async function run() {
    await checkMetadata('SANDBOX');
    console.log('\n');
    await checkMetadata('PROD');
}

run();
