export const getGeminiApiKey = () => {
  // Check process.env (Server-side)
  // In the browser, process.env will be undefined or restricted to non-sensitive keys.
  let env: any = {};
  try {
    env = typeof process !== 'undefined' ? process.env : {};
  } catch (e) {
    // process.env might not be available
  }

  const key = env.GEMINI_API_KEY || env.API_KEY;

  if (key && typeof key === 'string') {
    const trimmed = key.trim().replace(/^["']|["']$/g, '');
    if (trimmed && trimmed.startsWith('AIza')) {
      return trimmed;
    }
  }

  // Do not log the missing key error in the browser to avoid revealing implementation details
  if (typeof window === 'undefined') {
    console.error('[AIConfig] ERROR: No valid Gemini API key found in server environment.');
  }
  return '';
};
