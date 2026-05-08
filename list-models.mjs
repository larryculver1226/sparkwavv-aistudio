
import axios from 'axios';

const keys = [
    process.env.GEMINI_API_KEY,
    process.env.API_KEY,
    process.env.VITE_GEMINI_API_KEY,
].filter(Boolean);

async function listModels(key) {
  const masked = `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  console.log(`Listing models for key: ${masked}`);
  
  const sharedUrl = "https://ais-pre-6de5lrtpnvciah3xwxmagf-232918548667.us-east1.run.app";

  try {
    const res = await axios.get(`https://generativelanguage.googleapis.com/v1/models?key=${key}`, {
      headers: {
        'Referer': sharedUrl,
        'Origin': sharedUrl
      }
    });
    console.log(`✅ Success. Found ${res.data.models?.length} models.`);
  } catch (e) {
    console.error(`❌ Failed:`, e.response?.data?.error?.message || e.message);
  }
}

async function run() {
  for (const key of [...new Set(keys)]) {
    await listModels(key);
  }
}

run();
