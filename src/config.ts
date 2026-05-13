// src/config.ts

// Safely access environment variables in both Vite and Node.js environments
const getEnvVar = (viteVal: string | undefined, processKey: string): string | undefined => {
  let val: string | undefined = viteVal;
  let source = 'Vite Environment';

  // Helper to check if a value is actually a placeholder or unresolved variable
  const isInvalid = (v: any) => 
    !v || 
    (typeof v === 'string' && (
      v.trim() === '' || 
      v.toLowerCase().includes('placeholder') || 
      v.toLowerCase().includes('unset') ||
      v.startsWith('$$') // Cloud Build unreplaced var
    ));

  const logDecision = (decision: string, finalVal: string | undefined, finalSource: string) => {
    if (typeof window !== 'undefined' && (processKey.includes('API_KEY') || processKey.includes('SECRET'))) {
      const masked = finalVal && finalVal.length > 8 
        ? `${finalVal.substring(0, 4)}...${finalVal.substring(finalVal.length - 4)}` 
        : '****';
      console.log(`[Config] ${processKey} decision: ${decision} -> Source: ${finalSource} (${finalVal ? masked : 'MISSING'})`);
    }
  };

  if (isInvalid(val)) {
    val = undefined;
  } else {
    logDecision('Value found in Vite env', val, source);
  }

  // Fallback to process.env for Node/Backend usage
  if (!val) {
    try {
      if (typeof process !== 'undefined' && process.env) {
        // Try common variations if the primary one is missing
        val = process.env[processKey] || 
              process.env[processKey.replace('VITE_', '')] || 
              process.env['FIREBASE_API_KEY'];
        
        if (val && !isInvalid(val)) {
          source = 'Process Environment (Fallback)';
          logDecision('Value found in Process env', val, source);
        } else {
          val = undefined;
        }
      }
    } catch (e) { /* Ignored */ }
  }

  if (!val) {
    logDecision('FAILED to resolve value', undefined, 'NONE');
  }

  // Final sanitization check before returning
  if (val && typeof val === 'string') {
    let sanitized = val.trim();
    // Remove wrapping quotes if they exist
    sanitized = sanitized.replace(/^["']|["']$/g, '');
    return sanitized;
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
    'VITE_FIREBASE_API_KEY'
  ),
  firebaseAuthDomain: getEnvVar(
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN : undefined, 
    'VITE_FIREBASE_AUTH_DOMAIN'
  ),
  firebaseProjectId: getEnvVar(
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_PROJECT_ID : undefined, 
    'VITE_FIREBASE_PROJECT_ID'
  ) || 'sparkwavv-prod',
  firebaseStorageBucket: getEnvVar(
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET : undefined, 
    'VITE_FIREBASE_STORAGE_BUCKET'
  ),
  firebaseMessagingSenderId: getEnvVar(
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID : undefined, 
    'VITE_FIREBASE_MESSAGING_SENDER_ID'
  ),
  firebaseAppId: getEnvVar(
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_APP_ID : undefined, 
    'VITE_FIREBASE_APP_ID'
  ),
  firebaseMeasurementId: getEnvVar(
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_MEASUREMENT_ID : undefined, 
    'VITE_FIREBASE_MEASUREMENT_ID'
  ),
  firebaseDatabaseId: getEnvVar(
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_DATABASE_ID : undefined, 
    'VITE_FIREBASE_DATABASE_ID'
  ),

  // Server (Backend) Configs
  nodeEnv: getEnvVar(undefined, 'NODE_ENV'),
  port: getEnvVar(undefined, 'PORT'),
  sessionSecret: getEnvVar(undefined, 'SESSION_SECRET'),
  appUrl: getEnvVar(undefined, 'APP_URL'),
  adminPassword: getEnvVar(undefined, 'ADMIN_PASSWORD'),

  geminiApiKey: getEnvVar(undefined, 'GEMINI_API_KEY'),
  apiKey: getEnvVar(undefined, 'API_KEY'),

  firebaseServerProjectId: getEnvVar(undefined, 'FIREBASE_PROJECT_ID') || 'sparkwavv-prod',
  firebaseClientEmail: getEnvVar(undefined, 'FIREBASE_CLIENT_EMAIL'),
  firebasePrivateKey: getEnvVar(undefined, 'FIREBASE_PRIVATE_KEY'),
  firebaseServiceAccountJson: getEnvVar(undefined, 'FIREBASE_SERVICE_ACCOUNT_JSON'),
  
  vertexAiProjectId: getEnvVar(undefined, 'VERTEX_AI_PROJECT_ID') || 'sparkwavv-prod',
  vertexAiLocation: getEnvVar(undefined, 'VERTEX_AI_LOCATION'),
  vertexAiSearchEngineId: getEnvVar(undefined, 'VERTEX_AI_SEARCH_ENGINE_ID'),
  vertexAiSearchDataStoreId: getEnvVar(undefined, 'VERTEX_AI_SEARCH_DATA_STORE_ID'),
  sendgridApiKey: getEnvVar(undefined, 'SENDGRID_API_KEY'),
  skylarFromEmail: getEnvVar(undefined, 'SKYLAR_FROM_EMAIL'),
  googleMapsApiKey: getEnvVar(undefined, 'GOOGLE_MAPS_API_KEY'),

  // Validation Flags
  get isFirebaseConfigured() {
    return !!(this.firebaseApiKey && this.firebaseProjectId === 'sparkwavv-prod' && !this.firebaseApiKey.includes('placeholder'));
  }
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
  } else {
    // Backend required variables
    if (!config.geminiApiKey && !config.apiKey) missing.push('GEMINI_API_KEY');
    if (!config.sessionSecret) missing.push('SESSION_SECRET');
  }
  
  if (missing.length > 0) {
    const errorMsg = `[CONFIGURATION ERROR] The following environment variables are missing or invalid: ${missing.join(', ')}. The application will function in a degraded state or fail to start.`;
    
    if (isBrowser) {
      console.warn(errorMsg);
      console.log('[CONFIGURATION DEBUG] Current Config Keys:', Object.keys(config).filter(k => !!(config as any)[k]));
    } else {
      // On server, we fail loudly if in production or if explicitly requested
      const isProd = process.env.NODE_ENV === 'production';
      const isStrict = process.env.STRICT_CONFIG === 'true';
      
      if (isProd || isStrict) {
        console.error('❌ ' + errorMsg);
        throw new Error(errorMsg);
      } else {
        console.warn('⚠️ ' + errorMsg);
      }
    }
  } else {
    if (typeof window !== 'undefined') {
       console.log('✅ [Configuration] All required variables are present and valid.');
    }
  }
};
