// src/config.ts

// Safely access environment variables in both Vite and Node.js environments
const getEnvVar = (viteVal: string | undefined, processKey: string): string | undefined => {
  let val: string | undefined = viteVal;

  // Helper to check if a value is actually a placeholder or unresolved variable
  const isInvalid = (v: any) => 
    !v || 
    (typeof v === 'string' && (
      v.trim() === '' || 
      v.toLowerCase().includes('placeholder') || 
      v.toLowerCase().includes('unset') ||
      v.startsWith('$$') // Cloud Build unreplaced var
    ));

  if (isInvalid(val)) {
    val = undefined;
  }

  // Fallback to process.env for Node/Backend usage
  if (!val) {
    try {
      if (typeof process !== 'undefined' && process.env) {
        val = process.env[processKey] || 
              process.env[processKey.replace('VITE_', '')];
        
        if (val && !isInvalid(val)) {
          // OK
        } else {
          val = undefined;
        }
      }
    } catch (e) { /* Ignored */ }
  }

  // Final sanitization check
  if (val && typeof val === 'string') {
    return val.trim().replace(/^["']|["']$/g, '');
  }

  return undefined;
};

// Define the Firebase config object as requested for production alignment
export const firebaseConfig = {
  apiKey: getEnvVar(
    import.meta.env?.VITE_FIREBASE_API_KEY, 
    'VITE_FIREBASE_API_KEY'
  ),
  authDomain: getEnvVar(
    import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN, 
    'VITE_FIREBASE_AUTH_DOMAIN'
  ),
  projectId: getEnvVar(
    import.meta.env?.VITE_FIREBASE_PROJECT_ID, 
    'VITE_FIREBASE_PROJECT_ID'
  ) || 'sparkwavv-prod',
  storageBucket: getEnvVar(
    import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET, 
    'VITE_FIREBASE_STORAGE_BUCKET'
  ),
  messagingSenderId: getEnvVar(
    import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID, 
    'VITE_FIREBASE_MESSAGING_SENDER_ID'
  ),
  appId: getEnvVar(
    import.meta.env?.VITE_FIREBASE_APP_ID, 
    'VITE_FIREBASE_APP_ID'
  ),
  measurementId: getEnvVar(
    import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID, 
    'VITE_FIREBASE_MEASUREMENT_ID'
  ),
  firestoreDatabaseId: getEnvVar(
    import.meta.env?.VITE_FIREBASE_DATABASE_ID, 
    'VITE_FIREBASE_DATABASE_ID'
  ) || '(default)'
};

// Main application config object
export const config = {
  ...firebaseConfig, // Spread for compatibility
  firebaseApiKey: firebaseConfig.apiKey,
  firebaseProjectId: firebaseConfig.projectId,
  firebaseAuthDomain: firebaseConfig.authDomain,
  firebaseStorageBucket: firebaseConfig.storageBucket,
  firebaseMessagingSenderId: firebaseConfig.messagingSenderId,
  firebaseAppId: firebaseConfig.appId,
  firebaseMeasurementId: firebaseConfig.measurementId,
  firebaseDatabaseId: firebaseConfig.firestoreDatabaseId,

  // Server (Backend) Configs
  nodeEnv: getEnvVar(undefined, 'NODE_ENV'),
  port: getEnvVar(undefined, 'PORT'),
  sessionSecret: getEnvVar(undefined, 'SESSION_SECRET'),
  appUrl: getEnvVar(undefined, 'APP_URL'),
  geminiApiKey: getEnvVar(undefined, 'GEMINI_API_KEY'),
  
  // Validation Flags
  get isFirebaseConfigured() {
    // If we have an API key and it's not a placeholder, we are mostly configured
    // We warn about project alignment but don't strictly block unless key is missing
    return !!(this.apiKey && !this.apiKey.toLowerCase().includes('placeholder'));
  }
};

export const validateConfig = () => {
  const isBrowser = typeof window !== 'undefined';
  const missing: string[] = [];

  // Core required variables for production
  if (!config.firebaseApiKey) missing.push('VITE_FIREBASE_API_KEY');
  if (!config.firebaseProjectId) missing.push('VITE_FIREBASE_PROJECT_ID');
  
  // Backend specific check
  if (!isBrowser) {
    if (!config.geminiApiKey) missing.push('GEMINI_API_KEY');
    if (!config.sessionSecret) missing.push('SESSION_SECRET');
  }
  
  if (missing.length > 0) {
    const errorMsg = `[CONFIGURATION ERROR] Missing required environment variables: ${missing.join(', ')}`;
    const isProd = process.env.NODE_ENV === 'production' || process.env.STRICT_CONFIG === 'true';
    
    if (isProd) {
      console.error('❌ ' + errorMsg);
      // In production/strict mode, we fail fast
      if (!isBrowser) throw new Error(errorMsg);
    } else {
      console.warn('⚠️ ' + errorMsg);
    }
  }
};
