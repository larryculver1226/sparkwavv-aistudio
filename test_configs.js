import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// Load config
const firebaseAppletConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

if (!admin.apps.length) {
  const credentialConfig = {
    projectId: firebaseAppletConfig.projectId,
  };
  admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      ...credentialConfig
    });
}
const db = getFirestore(admin.app(), firebaseAppletConfig.firestoreDatabaseId);

async function checkConfigs() {
  const docRef = db.collection('agent_configs').doc('ignition');
  
  await docRef.set({
    stageId: 'ignition',
    stageTitle: 'Ignition',
    description: 'Fuel your engine...',
    systemPromptTemplate: 'Template...',
    requiredArtifacts: ['A'],
    allowedModalities: { text: true },
    uiConfig: {
      theme: 'neon',
      layout: 'sidebar',
      widgets: [
        { id: 'w-1', type: 'CustomMarkdown', position: 'main', order: 1 }
      ]
    }
  }, { merge: true });

  const snapshot = await db.collection('agent_configs').get();
  console.log("Docs found:", snapshot.size);
  snapshot.forEach(doc => {
    console.log(`\n================ ID: ${doc.id} ================`);
    console.log(JSON.stringify(doc.data(), null, 2));
  });
}

checkConfigs().catch(console.error);
