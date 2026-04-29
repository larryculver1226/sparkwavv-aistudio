# API Keys & Environment Configuration

To ensure perfectly synchronized behavior between your Development and Production environments—while maintaining Data Privacy—you must meticulously configure the following environment secrets in both your Google AI Studio deployment settings and your Cloud Run environment.

## 1. The Core AI Keys

### Gemini API Key (Required for Dev & Standard Fallbacks)
- **Key**: `GEMINI_API_KEY`
- **Purpose**: Powers Genkit's `@genkit-ai/googleai` plugin in environments lacking explicit Google Cloud infrastructure (like your local or development Preview environments). 
- **How to Get It**: Set up a free or paid API key at [Google AI Studio](https://aistudio.google.com/app/apikey).
- **Where to Place It**: In the AI Studio platform's "Environment Secrets" (or `.env` locally).

### Vertex AI Configuration (Required for Prod Data Privacy)
- **Keys**: 
  - `VERTEX_AI_PROJECT_ID` (Your literal GCP Project ID, e.g., `sparkwavv-prod-123`)
  - `VERTEX_AI_LOCATION` (e.g., `us-central1`)
- **Purpose**: Powers Genkit's `@genkit-ai/vertexai` plugin. By enabling this, Skylar respects enterprise data privacy laws (no data training) and bypasses the public endpoint in production.
- **How to Get It**: Create a project in the [Google Cloud Console](https://console.cloud.google.com/) and enable the Vertex AI API.
- **Where to Place It**: In AI Studio's "Environment Secrets" to match Dev, and in your Google Cloud Run production revision's environment variables. 
  - *Note: You MUST ensure your Cloud Run service account has the "Vertex AI User" IAM role in GCP for the Application Default Credentials (ADC) to work natively.*

### Google Maps API Key (Optional but Recommended)
- **Key**: `GOOGLE_MAPS_API_KEY`
- **Purpose**: Powers the `search_google_maps` tool. Without this, Skylar will return mocked location data.
- **How to Get It**: Enable the "Places API" in the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/api-list) and generate a restricted API key.
- **Where to Place It**: In AI Studio's "Environment Secrets" and production Cloud Run environment variables.

## 2. Synchronization Strategy (Harmonized Dev & Prod)
Instead of forcing Skylar to act like two different brains, both the Dev and Prod environments load the exact same toolsets, prompts, and config profiles. 

If you provide a `GEMINI_API_KEY`, Skylar prioritizes the public API for rapid iteration (Google AI). 
If you provide `VERTEX_AI_PROJECT_ID`, Skylar activates the Enterprise tier (Vertex AI).
By setting **BOTH**, you ensure that if Vertex encounters a permission issue or a missing IAM role during an infrastructure migration, Skylar gracefully handles the failure rather than crashing out.
