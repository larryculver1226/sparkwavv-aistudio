import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Sparkwavv Project (Project 1) - End Users
const sparkwavvApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(sparkwavvApp);
export const db = getFirestore(sparkwavvApp, (firebaseConfig as any).firestoreDatabaseId); 

// Admin Database (Project 1, Database 2)
export const adminDb = getFirestore(sparkwavvApp, 'admindb');
export const adminAuth = auth; // Same auth instance for single project

export const googleProvider = new GoogleAuthProvider();
export const linkedinProvider = new OAuthProvider('linkedin.com');

export const isFirebaseConfigured = !!firebaseConfig.apiKey;
export const isAdminFirebaseConfigured = isFirebaseConfigured; // In single project mode, if one is configured, both are
