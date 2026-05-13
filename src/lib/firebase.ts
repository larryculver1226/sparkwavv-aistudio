import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { config as appConfig } from '../config';

const firebaseConfig = {
  apiKey: appConfig.firebaseApiKey,
  authDomain: appConfig.firebaseAuthDomain,
  projectId: appConfig.firebaseProjectId,
  storageBucket: appConfig.firebaseStorageBucket,
  messagingSenderId: appConfig.firebaseMessagingSenderId,
  appId: appConfig.firebaseAppId,
  measurementId: appConfig.firebaseMeasurementId,
};

console.log('🛡️ [Firebase] Initializing with Project ID:', firebaseConfig.projectId);

let sparkwavvApp: any;
let authInstance: any;
let dbInstance: any;
let dbDefaultInstance: any;
let storageInstance: any;

// Flag to track if the SDK is actually connected to a valid project
export const isFirebaseConfigured = appConfig.isFirebaseConfigured;

try {
  if (!isFirebaseConfigured) {
    if (typeof window !== 'undefined') {
       console.warn('⚠️ [Firebase] Initialization skipped: Missing or invalid API Key.');
    }
    throw new Error('Firebase configuration is incomplete. Check environment variables.');
  }

  // initializeApp will throw if config is totally invalid
  sparkwavvApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  authInstance = getAuth(sparkwavvApp);
  storageInstance = getStorage(sparkwavvApp);
  
  let databaseId = appConfig.firebaseDatabaseId || '(default)';
  
  // Robust normalization for 'default' -> '(default)'
  if (typeof databaseId === 'string') {
    databaseId = databaseId.trim().replace(/^["']|["']$/g, '');
    if (databaseId === 'default' || databaseId === '') {
      databaseId = '(default)';
    }
  }

  console.log('🛡️ [Firebase] Selected Database ID:', databaseId);
  
  const firestoreSettings = { experimentalForceLongPolling: true };
  
  dbInstance = initializeFirestore(sparkwavvApp, firestoreSettings, databaseId);
  (dbInstance as any).databaseId = databaseId;

  dbDefaultInstance = databaseId === '(default)' ? dbInstance : initializeFirestore(sparkwavvApp, firestoreSettings, '(default)');
  (dbDefaultInstance as any).databaseId = '(default)';
} catch (e) {
  if (typeof window !== 'undefined') {
    console.error('🛡️ [Firebase] Boot Failure:', e);
  }
  
  // Last resort safe stubs to prevent downstream crashes
  sparkwavvApp = { options: {}, name: '[STUB]' } as any;
  authInstance = {
    onAuthStateChanged: (cb: any) => {
      cb(null);
      return () => {};
    },
    signOut: () => Promise.resolve(),
    currentUser: null,
  } as any;
  dbInstance = { 
    app: sparkwavvApp,
    type: 'firestore',
    databaseId: '(stub)',
    toJSON: () => ({})
  } as any;
  dbDefaultInstance = dbInstance;
  storageInstance = {} as any;
}

export const auth = authInstance;
export const db = dbInstance;
export const dbDefault = dbDefaultInstance;
export const storage = storageInstance;
export const adminDb = dbInstance; 
export const adminAuth = authInstance;

export const googleProvider = new GoogleAuthProvider();

export const setTenantId = (tenantId: string | null) => {
  if (auth && 'tenantId' in auth) {
    auth.tenantId = tenantId;
    console.log(`🛡️ [Firebase] Tenant ID set to: ${tenantId}`);
  }
};

export const isAdminFirebaseConfigured = isFirebaseConfigured;
