# Track 084: Assess Genkit and Vertex AI implementation

## Plan
1. **Analyze Current Implementation & Error**
   - The screenshot shows a `403 Forbidden` error with the message: `Permission 'aiplatform.endpoints.predict' denied on resource '//aiplatform.googleapis.com/projects/gen-lang-client-0883822731/locations/us-central1/publishers/google/models/gemini-1.5-flash'`.
   - **Root Cause**: The application gracefully falls back to `vertexAI` when the standard `googleAI` (Gemini API) key throws an error or is missing. Without an explicit `VERTEX_AI_PROJECT_ID` set, Genkit inherits the Google Application Default Credentials (ADC) from the container. In this AI Studio environment, that default project is `gen-lang-client-0883822731`. That managed project does not have the Vertex AI APIs (AI Platform) enabled, leading to the 403 error.
2. **Setup & Environmental Assessment**
   - **Genkit Practices**: Using multiple plugins (`googleAI` and `vertexAI`) is a valid standard practice to implement failovers. However, Vertex AI strictly requires an active GCP project with billing and the AI Platform API enabled. 
   - **Environment Variables**: We currently check for `VERTEX_AI_PROJECT_ID`, but if it's absent, we incorrectly allow the `vertexAI` plugin to boot with the default container project. This is an anti-pattern.
3. **Build & Refactor Proposals**
   - **Step 1: Fail Fast on Vertex AI**: Modify `backend/services/genkitService.ts` to only include the `vertexAI()` plugin in the Genkit array *if* `process.env.VERTEX_AI_PROJECT_ID` is explicitly provided.
   - **Step 2: Graceful Error Handling**: In the catch block around line 377, instead of blindly falling back to `targetModelFallback = 'vertexai/gemini-1.5-flash'`, dynamically check if Vertex AI is configured. If it's not, we should surface a clean 500 error to the client ("Vertex AI fallback is not configured. Please supply a VERTEX_AI_PROJECT_ID") rather than allowing the unauth endpoint to be executed and trigger a 403.
   - **Step 3: Update Environments**: Update `.env.example` and `TECH_SPECS.md` to cleanly document exactly what is required for the Vertex AI fallback.

## Clarifying Questions and Answers

**User Question 1: How can I get the values for all of these .env.example variables?**

*   **GEMINI_API_KEY**: You generate this for free at [Google AI Studio](https://aistudio.google.com/app/apikey).
*   **SENDGRID_API_KEY & SKYLAR_FROM_EMAIL**: You get these by creating an account at [Twilio SendGrid](https://sendgrid.com/), authenticating a sender email address, and generating an API key in their console.
*   **Vertex AI Variables (VERTEX_AI_PROJECT_ID, etc.)**: You **cannot** use `gen-lang-client-0883822731` (that is an internal, restricted AI Studio project). To use Vertex AI, you must:
    1. Create your own Google Cloud Platform (GCP) account at [console.cloud.google.com](https://console.cloud.google.com/).
    2. Enable Billing on the project.
    3. Enable the Vertex AI API.
    4. Provide your custom Project ID.
    5. *(For the search and endpoint IDs)*: You would use Google Cloud Agent Builder and custom Model Deployment features to train and deploy specific endpoints, which generate those unique IDs.

**User Question 2: I would like to resolve all of the mismatched keys between development and production, so we don't have to simplify/refactor the code again.**

To unify everything and fix the mismatches permanently:
*   We will refactor `backend/services/genkitService.ts` and `src/services/aiConfig.js`. 
*   We will implement a single, unified key resolver that checks `VITE_GEMINI_API_KEY` first, then `GEMINI_API_KEY`.
*   We will **remove Vertex AI as the silent automatic fallback**. The application will strictly use `googleAI()` (Gemini API) for both dev and production.
*   We will only register/fallback to `vertexAI()` if you explicitly provide a valid `VERTEX_AI_PROJECT_ID` that does *not* include `gen-lang-client`.

This ensures the app will immediately tell you if an API key is wrong, rather than silently falling back to a hidden Google Cloud project, crashing with a cryptic `403 Forbidden` error.

## Next Step
Wait for user approval to proceed with the Build phase.
