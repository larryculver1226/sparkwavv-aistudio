
import { getGeminiApiKey } from './src/services/aiConfig.js';
import dotenv from 'dotenv';
dotenv.config();

console.log('--- Environment Diagnostic ---');
console.log('APP_URL:', process.env.APP_URL || 'NOT SET');
console.log('VITE_APP_URL:', process.env.VITE_APP_URL || 'NOT SET');
console.log('SHARED_APP_URL:', process.env.SHARED_APP_URL || 'NOT SET');
console.log('VITE_SHARED_APP_URL:', process.env.VITE_SHARED_APP_URL || 'NOT SET');
console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
console.log('API_KEY present:', !!process.env.API_KEY);
console.log('VITE_FIREBASE_API_KEY present:', !!process.env.VITE_FIREBASE_API_KEY);

const key = getGeminiApiKey();
if (key) {
  console.log('Final Key Prefix:', key.substring(0, 4));
  console.log('Final Key Length:', key.length);
} else {
  console.log('No final key found.');
}

console.log('--- End Diagnostic ---');
