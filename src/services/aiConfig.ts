export const getGeminiApiKey = () => {
  // Check process.env (Server-side)
  // In the browser, process.env will be undefined or restricted to non-sensitive keys.
  let env: any = {};
  try {
    env = typeof process !== 'undefined' ? process.env : {};
  } catch (e) {
    // process.env might not be available
  }

  const keysToTry = ['API_KEY', 'VITE_GEMINI_API_KEY', 'GOOGLE_AI_API_KEY', 'GOOGLE_GENAI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_API_KEY'];
  let key = '';
  let foundSource = 'NONE';
  let firebaseKey = (env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY || '').trim().replace(/^["']|["']$/g, '');

  // Try to identify the Firebase key
  if (!firebaseKey && typeof process !== 'undefined') {
     firebaseKey = (env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  }

  for (const name of keysToTry) {
    const val = env[name];
    if (val && typeof val === 'string') {
      const trimmed = val.trim().replace(/^["']|["']$/g, '');
      if (trimmed && (trimmed.startsWith('AIza') || trimmed.length > 20)) {
        // Skip keys that are known placeholders
        if (trimmed.includes('PLACEHOLDER')) continue;
        
        // We no longer skip the Firebase key because patchFetch.ts handles Referer injection
        // This allows using the project's primary key for Gemini if no other key is provided.
        
        key = trimmed;
        foundSource = name;
        break;
      }
    }
  }

  // Fallback to Firebase key if no dedicated Gemini key was found
  if (!key && firebaseKey && (firebaseKey.startsWith('AIza') || firebaseKey.length > 20)) {
    key = firebaseKey;
    foundSource = 'FIREBASE_API_KEY_FALLBACK';
  }

  if (key) {
    // Ensure the key is propagated to standard env vars used by Genkit and other SDKs if we are on the server
    if (typeof process !== 'undefined' && process.env) {
      process.env.GEMINI_API_KEY = key;
      // Also set these to ensure maximum compatibility with different SDKs
      if (!process.env.GOOGLE_API_KEY) process.env.GOOGLE_API_KEY = key;
      if (!process.env.GOOGLE_GENAI_API_KEY) process.env.GOOGLE_GENAI_API_KEY = key;
    }
    
    if (typeof window === 'undefined') {
      console.log(`[AIConfig] Using Gemini API Key from ${foundSource} (Masked: ${key.substring(0, 4)}...${key.substring(key.length - 4)})`);
    }
    return key;
  }

  // Do not log the missing key error in the browser to avoid revealing implementation details
  if (typeof window === 'undefined') {
    const source = env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : (env.API_KEY ? 'API_KEY' : 'NONE');
    console.warn(`[AIConfig] WARNING: No valid Gemini API key found in server environment (Source: ${source}). Some AI features may be disabled.`);
  }
  return '';
};
