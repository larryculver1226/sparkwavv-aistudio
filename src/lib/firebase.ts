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

const sparkwavvApp = getApps().length === 0 ? initializeApp(config) : getApp();
export const auth = getAuth(sparkwavvApp);
export const db = getFirestore(sparkwavvApp, (firebaseConfig as any).firestoreDatabaseId || config.projectId); 

// Admin Database (Project 1, Database 2)
export const adminDb = getFirestore(sparkwavvApp, 'admindb');
export const adminAuth = auth; // Same auth instance for single project

export const googleProvider = new GoogleAuthProvider();
export const linkedinProvider = new OAuthProvider('linkedin.com');

export const isFirebaseConfigured = !!firebaseConfig.apiKey;
export const isAdminFirebaseConfigured = isFirebaseConfigured; // In single project mode, if one is configured, both are
