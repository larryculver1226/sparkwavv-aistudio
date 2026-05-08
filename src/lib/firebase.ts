import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Sparkwavv Project (Project 1) - End Users
const getViteEnv = (key: string) => {
  try {
    // Check import.meta.env (Vite/Client-side)
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env[key];
    }
  } catch (e) {
    // import.meta.env might not be available in Node.js
  }

  try {
    // Check process.env (Node.js/Server-side)
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {
    // process.env might not be available in some environments
  }

  return undefined;
};
const isPlaceholder = (val: any) =>
  !val || (typeof val === 'string' && (val.startsWith('PLACEHOLDER') || val === ''));

const config = {
  apiKey: !isPlaceholder(firebaseConfig.apiKey)
    ? firebaseConfig.apiKey
    : getViteEnv('VITE_FIREBASE_API_KEY'),
  authDomain: !isPlaceholder(firebaseConfig.authDomain)
    ? firebaseConfig.authDomain
    : getViteEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: !isPlaceholder(firebaseConfig.projectId)
    ? firebaseConfig.projectId
    : getViteEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: !isPlaceholder(firebaseConfig.storageBucket)
    ? firebaseConfig.storageBucket
    : getViteEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: !isPlaceholder(firebaseConfig.messagingSenderId)
    ? firebaseConfig.messagingSenderId
    : getViteEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: !isPlaceholder(firebaseConfig.appId)
    ? firebaseConfig.appId
    : getViteEnv('VITE_FIREBASE_APP_ID'),
  measurementId: !isPlaceholder(firebaseConfig.measurementId)
    ? firebaseConfig.measurementId
    : getViteEnv('VITE_FIREBASE_MEASUREMENT_ID'),
};

console.log('🛡️ [Firebase] Initializing with Project ID:', config.projectId);

if (config.apiKey) {
  const keySource = getViteEnv('VITE_FIREBASE_API_KEY') ? 'Environment Variable' : 'Config File';
  console.log(`🛡️ [Firebase] API Key Source: ${keySource}`);
  console.log(
    '🛡️ [Firebase] API Key:',
    `${config.apiKey.substring(0, 6)}...${config.apiKey.substring(config.apiKey.length - 4)}`
  );
} else {
  console.warn('🛡️ [Firebase] API Key is MISSING!');
}

let sparkwavvApp: any;
let authInstance: any;
let dbInstance: any;
let dbDefaultInstance: any;
let storageInstance: any;

try {
  // We initialize even with placeholders to get valid SDK instances 
  // that won't crash when passed to firebase/auth or firebase/firestore functions.
  sparkwavvApp = getApps().length === 0 ? initializeApp(config) : getApp();
  authInstance = getAuth(sparkwavvApp);
  storageInstance = getStorage(sparkwavvApp);
  
  const rawDatabaseId = getViteEnv('VITE_FIREBASE_DATABASE_ID') || firebaseConfig.firestoreDatabaseId;
  let databaseId = rawDatabaseId && !rawDatabaseId.startsWith('PLACEHOLDER') ? rawDatabaseId : '(default)';
  
  // Robust normalization for 'default' -> '(default)'
  if (typeof databaseId === 'string') {
    databaseId = databaseId.trim().replace(/^["']|["']$/g, '');
    if (databaseId === 'default' || databaseId === '') {
      databaseId = '(default)';
    }
  }

  console.log('🛡️ [Firebase] Selected Database ID:', databaseId);
  console.log('🛡️ [Firebase] Target Project ID:', config.projectId);
  console.log('🛡️ [Firebase] Auth Domain:', config.authDomain);
  
  const firestoreSettings = { experimentalForceLongPolling: true };
  
  dbInstance = initializeFirestore(sparkwavvApp, firestoreSettings, databaseId);
  // Add databaseId property for debugging if needed (internal but helps my logs in main.tsx)
  (dbInstance as any).databaseId = databaseId;

  dbDefaultInstance = databaseId === '(default)' ? dbInstance : initializeFirestore(sparkwavvApp, firestoreSettings, '(default)');
  (dbDefaultInstance as any).databaseId = '(default)';
} catch (e) {
  console.error('🛡️ [Firebase] Boot Critical Failure:', e);
  // Last resort safe stubs
  sparkwavvApp = { options: {}, name: '[SANATIZED]' } as any;
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
    toJSON: () => ({})
  } as any;
  dbDefaultInstance = dbInstance;
  storageInstance = {} as any;
}

export const auth = authInstance;
export const db = dbInstance;
export const dbDefault = dbDefaultInstance;
export const storage = storageInstance;
export const adminDb = dbInstance; // Fallback to main db in sanitized mode
export const adminAuth = authInstance;

export const googleProvider = new GoogleAuthProvider();

/**
 * Sets the tenant ID for the Auth instance.
 * This is required for Google Identity Platform multi-tenancy.
 */
export const setTenantId = (tenantId: string | null) => {
  auth.tenantId = tenantId;
  console.log(`🛡️ [Firebase] Tenant ID set to: ${tenantId}`);
};

export const isFirebaseConfigured = !!config.apiKey && (typeof config.apiKey === 'string') && !config.apiKey.startsWith('PLACEHOLDER');
export const isAdminFirebaseConfigured = isFirebaseConfigured; // In single project mode, if one is configured, both are
