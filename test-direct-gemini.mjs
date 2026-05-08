
import axios from 'axios';

const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

const sharedUrl = "https://ais-pre-6de5lrtpnvciah3xwxmagf-232918548667.us-east1.run.app";
const appUrl = "https://ais-dev-6de5lrtpnvciah3xwxmagf-232918548667.us-east1.run.app";

async function test(referer, model = 'gemini-1.5-flash', version = 'v1beta') {
  const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${key}`;
  console.log(`Testing MODEL: ${model}, VERSION: ${version}, REFERER: ${referer || '<empty>'}`);
  try {
    const res = await axios.post(url, {
      contents: [{ parts: [{ text: "Hello" }] }]
    }, {
      headers: referer ? { 
        'Referer': referer,
        'Origin': referer
      } : {}
    });
    console.log(`✅ Success`);
  } catch (e) {
    console.error(`❌ Failed:`, e.response?.data?.error?.message || e.message);
  }
}

async function run() {
  const models = ['gemini-1.5-flash', 'gemini-2.0-flash'];
  const versions = ['v1', 'v1beta'];
  
  for (const model of models) {
    for (const version of versions) {
      await test(null, model, version);
      await test(sharedUrl, model, version);
    }
  }
}

run();
