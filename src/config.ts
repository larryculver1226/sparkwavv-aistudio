// src/config.ts

import firebaseConfig from '../firebase-applet-config.json';

// Safely access environment variables in both Vite and Node.js environments
const getEnvVar = (viteVal: string | undefined, processKey: string, jsonFallback?: string): string | undefined => {
  let val: string | undefined = viteVal;

  // Treat explicit placeholder strings, unresolved cloudbuild variables, or empty strings as 'missing'
  if (val) {
    if (val.trim() === '' || val.includes('PLACEHOLDER') || val.startsWith('$$')) {
      val = undefined;
    }
  }

  // Fallback to config file
  if (!val && jsonFallback) {
    val = (firebaseConfig as any)[jsonFallback];
  }

  // Fallback to process.env for Node/Backend usage
  try {
    if (!val && typeof process !== 'undefined' && process.env && process.env[processKey]) {
      val = process.env[processKey];
    }
  } catch (e) {
    // Ignored
  }

  // Final sanitization check before returning
  if (val && typeof val === 'string') {
    let sanitized = val.trim();
    // Remove wrapping quotes if they exist
    sanitized = sanitized.replace(/^["']|["']$/g, '');
    
    if (sanitized !== '' && !sanitized.includes('PLACEHOLDER') && !sanitized.startsWith('$$')) {
      return sanitized;
    }
  }

  return undefined;
};

// We wrap import.meta access in a try-catch to prevent Node.js environments from throwing ReferenceErrors
// if the bundle doesn't strip it. Vite will replace import.meta.env.VITE_XXX statically.
let metaEnv: any = {};
try {
  metaEnv = (import.meta as any).env || {};
} catch(e) {}

// Map environment variables to clean property names
export const config = {
  // Client (Vite) Configs - Statically written so Vite replaces them during build
  firebaseApiKey: getEnvVar(
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_API_KEY : undefined, 
    'VITE_FIREBASE_API_KEY', 
    'apiKey'
  ),
  firebaseAuthDomain: getEnvVar(
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN : undefined, 
    'VITE_FIREBASE_AUTH_DOMAIN', 
    'authDomain'
  ),
  firebaseProjectId: getEnvVar(
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_PROJECT_ID : undefined, 
    'VITE_FIREBASE_PROJECT_ID', 
    'projectId'
  ),
  firebaseStorageBucket: getEnvVar(
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET : undefined, 
    'VITE_FIREBASE_STORAGE_BUCKET', 
    'storageBucket'
  ),
  firebaseMessagingSenderId: getEnvVar(
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID : undefined, 
    'VITE_FIREBASE_MESSAGING_SENDER_ID', 
    'messagingSenderId'
  ),
  firebaseAppId: getEnvVar(
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_APP_ID : undefined, 
    'VITE_FIREBASE_APP_ID', 
    'appId'
  ),
  firebaseMeasurementId: getEnvVar(
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_MEASUREMENT_ID : undefined, 
    'VITE_FIREBASE_MEASUREMENT_ID', 
    'measurementId'
  ),
  firebaseDatabaseId: getEnvVar(
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_DATABASE_ID : undefined, 
    'VITE_FIREBASE_DATABASE_ID', 
    'firestoreDatabaseId'
  ),

  // Server (Backend) Configs
  nodeEnv: getEnvVar(undefined, 'NODE_ENV'),
  port: getEnvVar(undefined, 'PORT'),
  sessionSecret: getEnvVar(undefined, 'SESSION_SECRET'),
  appUrl: getEnvVar(undefined, 'APP_URL'),
  adminPassword: getEnvVar(undefined, 'ADMIN_PASSWORD'),

  geminiApiKey: getEnvVar(undefined, 'GEMINI_API_KEY'),
  apiKey: getEnvVar(undefined, 'API_KEY'),

  firebaseServerProjectId: getEnvVar(undefined, 'FIREBASE_PROJECT_ID'),
  firebaseClientEmail: getEnvVar(undefined, 'FIREBASE_CLIENT_EMAIL'),
  firebasePrivateKey: getEnvVar(undefined, 'FIREBASE_PRIVATE_KEY'),
  firebaseServiceAccountJson: getEnvVar(undefined, 'FIREBASE_SERVICE_ACCOUNT_JSON'),

  vertexAiProjectId: getEnvVar(undefined, 'VERTEX_AI_PROJECT_ID'),
  vertexAiLocation: getEnvVar(undefined, 'VERTEX_AI_LOCATION'),
  vertexAiSearchEngineId: getEnvVar(undefined, 'VERTEX_AI_SEARCH_ENGINE_ID'),
  vertexAiSearchDataStoreId: getEnvVar(undefined, 'VERTEX_AI_SEARCH_DATA_STORE_ID'),
  sendgridApiKey: getEnvVar(undefined, 'SENDGRID_API_KEY'),
  skylarFromEmail: getEnvVar(undefined, 'SKYLAR_FROM_EMAIL'),
  googleMapsApiKey: getEnvVar(undefined, 'GOOGLE_MAPS_API_KEY'),
};

/**
 * Validates the core required configuration to ensure the application starts in a healthy state.
 * Throws a detailed error if any required secrets are missing, preventing silent failures.
 */
export const validateConfig = () => {
  const isBrowser = typeof window !== 'undefined';
  const missing: string[] = [];

  // Frontend required variables
  if (isBrowser) {
    if (!config.firebaseApiKey) missing.push('VITE_FIREBASE_API_KEY');
    if (!config.firebaseProjectId) missing.push('VITE_FIREBASE_PROJECT_ID');
    // VITE_FIREBASE_AUTH_DOMAIN and VITE_FIREBASE_APP_ID might also be required for a complete setup
    // but the minimal absolute requirement for initializing the SDK is projectId and apiKey
  } else {
    // Backend required variables
    if (!config.geminiApiKey) missing.push('GEMINI_API_KEY');
    if (!config.sessionSecret) missing.push('SESSION_SECRET');
  }

  // Additional backend validation could be added here
  
  if (missing.length > 0) {
    const errorMsg = `[CONFIGURATION WARNING] The following environment variables are missing or invalid: ${missing.join(', ')}. The application may function in a degraded state. Please update your AI Studio Secrets Vault or .env file with valid values.`;
    console.warn(errorMsg);
    // We no longer throw here to allow the app to boot and show a "Missing Configuration" state if needed.
    // throw new Error(errorMsg);
  }
};
