# Track 019: Model Garden Models Setup

## Goal
Replace the hardcoded placeholders and fallbacks to standard Gemini models in `vertexService.ts` with configurable environment variables pointing to actual custom fine-tuned endpoints in Vertex AI Model Garden.

## Approach (Plan)
1.  **Environment Configuration**: Define new environment variables in `.env.example` for the specific fine-tuned model endpoints:
    *   `VERTEX_AI_LOBKOWICZ_ENDPOINT_ID`
    *   `VERTEX_AI_FINANCE_ENDPOINT_ID`
    *   `VERTEX_AI_TECH_ENDPOINT_ID`
2.  **Service Update (`vertexService.ts`)**: 
    *   Update `getLobkowiczCoaching`, `getFinanceInsight`, and `getTechInsight` to read from these environment variables.
    *   Format the model string correctly for Vertex AI endpoints (e.g., `projects/${PROJECT_ID}/locations/${LOCATION}/endpoints/${ENDPOINT_ID}`).
    *   Maintain the `gemini-3.1-pro-preview` as a safe fallback *only* if the environment variable is not provided, ensuring the app doesn't crash in local development where endpoints might not be deployed yet.
3.  **Documentation**: Update `TECH_SPECS.md` to document the new environment variables and the routing logic for fine-tuned models.

## Status
- [x] Plan
- [x] Setup
- [x] Build
- [x] QA & Testing
