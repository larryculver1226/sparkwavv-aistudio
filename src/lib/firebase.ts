import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
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

const sparkwavvApp = getApps().length === 0 ? initializeApp(config) : getApp();
export const auth = getAuth(sparkwavvApp);

// Database 1: Sparkwavv (User Data)
const rawDatabaseId = getViteEnv('VITE_FIREBASE_DATABASE_ID') || firebaseConfig.firestoreDatabaseId;
const databaseId =
  rawDatabaseId && !rawDatabaseId.startsWith('PLACEHOLDER') ? rawDatabaseId : '(default)';
console.log('🛡️ [Firebase] Using Firestore Database ID:', databaseId);

// Force long polling to bypass potential WebSocket issues in some environments
const firestoreSettings = {
  experimentalForceLongPolling: true,
};

export const db = initializeFirestore(sparkwavvApp, firestoreSettings, databaseId);

// Only initialize dbDefault if it's different from db
export const dbDefault =
  databaseId === '(default)'
    ? db
    : initializeFirestore(sparkwavvApp, firestoreSettings, '(default)');

// Admin Database (Project 1, Database 2)
// In some environments, 'admindb' might not exist, so we fallback to the default database
let adminDbInstance;
try {
  adminDbInstance = initializeFirestore(
    sparkwavvApp,
    {
      experimentalForceLongPolling: true,
    },
    'admindb'
  );
} catch (e) {
  console.warn('🛡️ [Firebase] Could not initialize admindb, falling back to default database');
  adminDbInstance = db;
}
export const adminDb = adminDbInstance;
export const adminAuth = auth; // Same auth instance for single project

export const googleProvider = new GoogleAuthProvider();

/**
 * Sets the tenant ID for the Auth instance.
 * This is required for Google Identity Platform multi-tenancy.
 */
export const setTenantId = (tenantId: string | null) => {
  auth.tenantId = tenantId;
  console.log(`🛡️ [Firebase] Tenant ID set to: ${tenantId}`);
};

export const isFirebaseConfigured = !!config.apiKey && !config.apiKey.startsWith('PLACEHOLDER');
export const isAdminFirebaseConfigured = isFirebaseConfigured; // In single project mode, if one is configured, both are
