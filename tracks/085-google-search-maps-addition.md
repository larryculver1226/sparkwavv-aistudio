# Track 085: Google Search and Maps Addition

## Plan
1. Investigate the current `genkitService.ts` to see where `searchWebTool` is defined and how we can integrate Google Search Grounding.
2. Introduce a Maps Tool (possibly using Google Maps API or Genkit's/Gemini's google Maps feature if available) or use Gemini's built-in maps if available.
3. Determine if the user intends to use Gemini's built-in `googleSearch: {}` in Genkit's config.
4. Make the necessary code modifications and update `TECH_SPECS.md` and `CHANGELOG.md` upon user approval.

## Setup
1. Investigated `@genkit-ai/googleai` and `@genkit-ai/vertexai` configurations.
2. Verified `googleSearchRetrieval` exists and can be configured in the prompt configurations.
3. Removed `searchWebTool` from `backend/services/genkitService.ts`.

## Build
1. Replaced the mocked `searchWebTool` with native Genkit `googleSearchRetrieval: {}` in `backend/services/genkitService.ts`. 
2. Awaiting user guidance on Google Maps Grounding as it has no native equivalent in Genkit yet (typically requires a custom Maps API integration).
