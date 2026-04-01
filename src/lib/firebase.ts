import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Sparkwavv Project (Project 1) - End Users
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId,
};

console.log('🛡️ [Firebase] Initializing with Project ID:', config.projectId);
if (config.apiKey) {
  console.log('🛡️ [Firebase] API Key present:', `${config.apiKey.substring(0, 6)}...${config.apiKey.substring(config.apiKey.length - 4)}`);
} else {
  console.warn('🛡️ [Firebase] API Key is MISSING!');
}

const sparkwavvApp = getApps().length === 0 ? initializeApp(config) : getApp();
export const auth = getAuth(sparkwavvApp);

// Database 1: Sparkwavv (User Data)
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || config.projectId;
export const db = getFirestore(sparkwavvApp, databaseId); 

// Admin Database (Project 1, Database 2)
// In some environments, 'admindb' might not exist, so we fallback to the default database
let adminDbInstance;
try {
  adminDbInstance = getFirestore(sparkwavvApp, 'admindb');
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
