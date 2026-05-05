import firebaseConfig from '../../firebase-applet-config.json';

export interface ProbeResult {
  isVulnerable: boolean;
  status: 'secure' | 'vulnerable' | 'error';
  message: string;
}

/**
 * Attempts to call the Gemini API using the Firebase API Key.
 * If successful, the key is "over-privileged" and vulnerable.
 */
export async function probeFirebaseKeyForGeminiAccess(): Promise<ProbeResult> {
  const firebaseApiKey = firebaseConfig.apiKey;
  const probeModel = 'gemini-1.5-flash';
  // Using countTokens as a harmless, low-latency probe
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${probeModel}:countTokens?key=${firebaseApiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Security Probe' }] }]
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.totalTokens !== undefined) {
        return {
          isVulnerable: true,
          status: 'vulnerable',
          message: 'Firebase API key successfully accessed Gemini. This key is OVER-PRIVILEGED.'
        };
      }
    }

    const errorData = await response.json().catch(() => ({}));
    const errorReason = errorData?.error?.message || response.statusText;

    if (response.status === 403 || response.status === 400 || errorReason.includes('API_KEY_INVALID') || errorReason.includes('not found')) {
      return {
        isVulnerable: false,
        status: 'secure',
        message: 'Gemini request denied. Firebase key appears correctly restricted.'
      };
    }

    return {
      isVulnerable: false,
      status: 'error',
      message: `Probe ambiguous: ${errorReason}`
    };
  } catch (error: any) {
    return {
      isVulnerable: false,
      status: 'error',
      message: `Failed to execute probe: ${error.message}`
    };
  }
}
