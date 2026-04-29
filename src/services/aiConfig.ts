export const getGeminiApiKey = () => {
  // Check process.env (Server-side)
  let serverEnv: any = {};
  try {
    serverEnv = process.env || {};
  } catch (e) {
    // process.env might not be available in some environments
  }

  // Check import.meta.env (Client-side/Vite)
  let clientEnv: any = {};
  try {
    clientEnv = (import.meta as any).env || {};
  } catch (e) {
    // import.meta.env might not be available
  }

  const keys: { name: string; value: any }[] = [
    { name: 'process.env.VITE_GEMINI_API_KEY', value: serverEnv.VITE_GEMINI_API_KEY },
    { name: 'import.meta.env.VITE_GEMINI_API_KEY', value: clientEnv.VITE_GEMINI_API_KEY },
    { name: 'process.env.GEMINI_API_KEY', value: serverEnv.GEMINI_API_KEY },
    { name: 'process.env.API_KEY', value: serverEnv.API_KEY },
    { name: 'import.meta.env.GEMINI_API_KEY', value: clientEnv.GEMINI_API_KEY },
  ];

  console.log(`[AIConfig] Checking ${keys.length} potential locations for Gemini API key...`);
  console.log(`[AIConfig] Available process.env keys: ${Object.keys(serverEnv).join(', ')}`);
  console.log(`[AIConfig] Available import.meta.env keys: ${Object.keys(clientEnv).join(', ')}`);

  for (const { name, value } of keys) {
    if (value && typeof value === 'string') {
      const trimmed = value.trim().replace(/^["']|["']$/g, '');
      if (trimmed && trimmed.startsWith('AIza')) {
        const masked = `${trimmed.substring(0, 4)}...${trimmed.substring(trimmed.length - 4)}`;
        console.log(
          `[AIConfig] SUCCESS: Found valid key in ${name}: ${masked} (length: ${trimmed.length})`
        );
        // Force set the standard environment variable so Genkit and @google/genai can implicitly use it
        // even if not explicitly passed during instantiation correctly.
        if (!process.env.GEMINI_API_KEY) {
          process.env.GEMINI_API_KEY = trimmed;
        }
        return trimmed;
      } else if (trimmed) {
        console.warn(
          `[AIConfig] WARNING: Found value in ${name} but it doesn't start with AIza: ${trimmed.substring(0, 10)}...`
        );
      }
    }
  }

  console.error('[AIConfig] ERROR: No valid Gemini API key found in any environment variable.');
  return '';
};
