import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, initializeFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

async function test() {
  const app = initializeApp(firebaseConfig);
  const db = initializeFirestore(app, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId);

  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 10000));
  
  try {
    await Promise.race([
      getDocFromServer(doc(db, '_system_', 'connectivity_test')),
      timeout
    ]);
    console.log("SUCCESS named db");
  } catch (e) {
    console.error("FAILED named db", e.message);
  }

  const dbDefault = initializeFirestore(app, { experimentalForceLongPolling: true }, '(default)');
  try {
    await Promise.race([
      getDocFromServer(doc(dbDefault, '_system_', 'connectivity_test')),
      timeout
    ]);
    console.log("SUCCESS default db");
  } catch (e) {
    console.error("FAILED default db", e.message);
  }
  
  process.exit(0);
}

test();


