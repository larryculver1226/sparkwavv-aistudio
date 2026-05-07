import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

async function test() {
  console.log('Project ID (env):', process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'Not set');
  console.log('Gemini API Key (env):', process.env.GEMINI_API_KEY ? 'Set' : 'Not set');
  console.log('API Key (env):', process.env.API_KEY ? 'Set' : 'Not set');
  
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('Config Project ID:', config.projectId);
    console.log('Config DB ID:', config.firestoreDatabaseId);
  } else {
    console.log('Config file not found');
  }
}

test();
