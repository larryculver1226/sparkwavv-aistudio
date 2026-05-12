
import * as dotenv from 'dotenv';
dotenv.config();

console.log('--- Firebase Environment Diagnostics ---');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('VITE_FIREBASE_PROJECT_ID:', process.env.VITE_FIREBASE_PROJECT_ID);
console.log('FIREBASE_DATABASE_ID:', process.env.FIREBASE_DATABASE_ID);
console.log('VITE_FIREBASE_DATABASE_ID:', process.env.VITE_FIREBASE_DATABASE_ID);

const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (saJson) {
  try {
    const sa = JSON.parse(saJson);
    console.log('SERVICE_ACCOUNT.project_id:', sa.project_id);
    console.log('SERVICE_ACCOUNT.client_email:', sa.client_email);
  } catch (e) {
    console.log('SERVICE_ACCOUNT_JSON is present but failed to parse as JSON.');
  }
} else {
  console.log('FIREBASE_SERVICE_ACCOUNT_JSON is NOT present.');
}

const saJsonProd = process.env.PROD_FIREBASE_SERVICE_ACCOUNT_JSON;
if (saJsonProd) {
    try {
      const sa = JSON.parse(saJsonProd);
      console.log('SERVICE_ACCOUNT_PROD.project_id:', sa.project_id);
      console.log('SERVICE_ACCOUNT_PROD.client_email:', sa.client_email);
    } catch (e) {
      console.log('PROD_FIREBASE_SERVICE_ACCOUNT_JSON is present but failed to parse as JSON.');
    }
} else {
    console.log('PROD_FIREBASE_SERVICE_ACCOUNT_JSON is NOT present.');
}
console.log('---------------------------------------');
