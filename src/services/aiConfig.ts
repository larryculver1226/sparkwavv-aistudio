export const getGeminiApiKey = () => {
  // Check process.env (Server-side)
  // In the browser, process.env will be undefined or restricted to non-sensitive keys.
  let env: any = {};
  try {
    env = typeof process !== 'undefined' ? process.env : {};
  } catch (e) {
    // process.env might not be available
  }

  const keysToTry = ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_GENAI_API_KEY', 'VITE_GEMINI_API_KEY', 'API_KEY'];
  let key = '';
  let foundSource = 'NONE';
  let firebaseKey = env.VITE_FIREBASE_API_KEY || '';

  // Try to identify the Firebase key to avoid using it for GenAI on the server
  if (!firebaseKey && typeof process !== 'undefined') {
    try {
      // Use synchronous require if available (CommonJS) or just skip if we can't get it easily
      // In this environment, we might be in ESM. Let's try to get it from a common env var.
      // But we can also check the config file if we are on the server.
    } catch (e) {}
  }

  for (const name of keysToTry) {
    const val = env[name];
    if (val && typeof val === 'string') {
      const trimmed = val.trim().replace(/^["']|["']$/g, '');
      if (trimmed && (trimmed.startsWith('AIza') || trimmed.length > 20)) {
        // Skip keys that are known placeholders
        if (trimmed.includes('PLACEHOLDER')) continue;
        
        // Skip the Firebase key if we are on the server (it's usually restricted to referer)
        if (firebaseKey && trimmed === firebaseKey && typeof window === 'undefined') {
          console.log(`[AIConfig] Skipping ${name} because it matches the restricted Firebase API Key.`);
          continue;
        }
        
        key = trimmed;
        foundSource = name;
        break;
      }
    }
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
