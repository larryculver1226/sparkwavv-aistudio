# Application Environment Variables ("Vault" Reference)

This document serves as a master reference for all environment variables used across the application. These variables should be securely managed in Google Cloud Secret Manager (or your preferred vault) to ensure smooth operations in Production.

## Client-Side Variables (Vite)
*These variables are embedded into the client bundle at build time. They must be prefixed with `VITE_`.*

| Variable Name | Purpose | Current Extracted Value / Fallback |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Connects the web client to the Firebase project. | `AIzaSyC3RRARtzTtMHn6eZA99L8n_sACVder8dU` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Authentication domain. | `gen-lang-client-0883822731.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | The globally unique identifier for the Firebase project. | `gen-lang-client-0883822731` |
| `VITE_FIREBASE_STORAGE_BUCKET` | The default Cloud Storage bucket URL. | `gen-lang-client-0883822731.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Identifies the sender for Firebase Cloud Messaging. | `56128254195` |
| `VITE_FIREBASE_APP_ID` | The specific App ID registered within Firebase. | `1:56128254195:web:e29d9b0be2a00844060786` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics measurement ID (optional). | *[Empty/Not Set]* |
| `VITE_FIREBASE_DATABASE_ID` | The database ID for Firestore operations. | `ai-studio-1a3eb665-2cd9-4e84-a599-413bb4ee52e0` |
| `VITE_GEMINI_API_KEY` | Public access key for Gemini API (if calling directly from the browser; ideally keep empty and funnel through backend). | *[To be securely provided]* |

## Server-Side Variables (Backend/Node.js)
*These variables dictate backend security and integration behavior. They are never exposed to the browser.*

### General Application Config
| Variable Name | Purpose | Current Extracted Value / Fallback |
|---|---|---|
| `NODE_ENV` | Sets execution context (development, production). | `production` (in deployed environments) |
| `PORT` | Local service port (injected automatically in Cloud Run). | `3000` (Default) |
| `SESSION_SECRET` | Cryptographic secret used to sign secure session cookies. | `sparkwavv-session-secret-key` |
| `APP_URL` | The public base URL used for OAuth redirects and email hyperlinks. | *[Your Cloud Run URL]* |
| `ADMIN_PASSWORD` | Password for accessing the backend Admin/AgentOps UI. | `sparkwavv-admin-secure-2026` |

### Core AI & Integrations
| Variable Name | Purpose | Current Extracted Value / Fallback |
|---|---|---|
| `GEMINI_API_KEY` | Default authentication key for Google Gemini Generative AI operations. | *[To be securely provided]* |
| `API_KEY` | Fallback alias reference to Gemini API Key. | *[To be securely provided]* |

### Firebase Admin Credentials
| Variable Name | Purpose | Current Extracted Value / Fallback |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Target backend project ID for Admin SDK. | `gen-lang-client-0883822731` |
| `FIREBASE_CLIENT_EMAIL` | Service Account email associated with backend operations. | *[To be securely provided]* |
| `FIREBASE_PRIVATE_KEY` | Secure private key for backend Admin identity validation. | *[To be securely provided]* |
| `FIREBASE_SERVICE_ACCOUNT_JSON`| Standalone alternative JSON blob config for older library initializations. | *[To be securely provided]* |

### Vertex AI (Enterprise Ecosystem)
| Variable Name | Purpose | Current Extracted Value / Fallback |
|---|---|---|
| `VERTEX_AI_PROJECT_ID` | GCP Project ID dedicated to Vertex enterprise engines. | *[Falls back to FIREBASE_PROJECT_ID]* |
| `VERTEX_AI_LOCATION` | Regional cluster location for Vertex AI models/endpoints. | `us-central1` |
| `VERTEX_AI_SEARCH_ENGINE_ID` | Global Data Store Search Engine UUID. | *[To be securely provided]* |
| `VERTEX_AI_SEARCH_DATA_STORE_ID` | Explicit underlying Data Store ID for document chunking. | *[To be securely provided]* |
| `VERTEX_AI_VECTOR_SEARCH_ENDPOINT_ID`| Endpoint for the deployed vector similarity index. | *[To be securely provided]* |
| `VERTEX_AI_VECTOR_SEARCH_INDEX_ID`| Deployed target index ID for the vector endpoint. | *[To be securely provided]* |
| `VERTEX_AI_MEDLM_MODEL_ID` | MedLM target model reference. | `medlm-medium@latest` |
| `VERTEX_AI_FINE_TUNING_BUCKET` | Google Cloud Storage bucket path for tuning datasets. | *[gen-lang-client-0883822731-vertex-data]* |
| `VERTEX_AI_LOBKOWICZ_ENDPOINT_ID`| Dedicated endpoint for Lobcowicz inference. | *[To be securely provided]* |
| `VERTEX_AI_FINANCE_ENDPOINT_ID` | Dedicated endpoint for Finance insights inference. | *[To be securely provided]* |
| `VERTEX_AI_TECH_ENDPOINT_ID` | Dedicated endpoint for Tech sector inference. | *[To be securely provided]* |

### External APIS & Communications
| Variable Name | Purpose | Current Extracted Value / Fallback |
|---|---|---|
| `SENDGRID_API_KEY` | Connects transactional email distributions (Twilio SendGrid). | *[To be securely provided]* |
| `SKYLAR_FROM_EMAIL` | Origin sender email for Skylar's automated notifications. | `skylar@sparkwavv.com` |
| `GOOGLE_MAPS_API_KEY` | Retrieves location or place metadata for geo-centric features. | *[To be securely provided]* |

---
**Deployment Instructions:**
1. Log into the [Google Cloud Console](https://console.cloud.google.com).
2. Navigate to **Security > Secret Manager**.
3. Create new secrets using the exact **Variable Name** entries listed above.
4. When deploying via Cloud Run, attach these secrets to the container execution environment using the matching variable aliases.
