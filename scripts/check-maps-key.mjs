// scripts/check-maps-key.mjs
import { config } from 'dotenv';
config();

const apiKey = process.env.GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  console.log('No GOOGLE_MAPS_API_KEY found in environment.');
  process.exit(0);
}

async function probe() {
  console.log(`Probing Google Maps API Key: ${apiKey.substring(0, 8)}...`);
  const probeModel = 'gemini-2.0-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${probeModel}:countTokens?key=${apiKey}`;

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
      console.log('VULNERABLE: Google Maps API key has Gemini access!');
    } else {
      const data = await response.json().catch(() => ({}));
      console.log(`SECURE: Maps key blocked. Status: ${response.status}. Reason: ${data.error?.message || 'Unknown'}`);
    }
  } catch (error) {
    console.error('Probe failed:', error.message);
  }
}

probe();
