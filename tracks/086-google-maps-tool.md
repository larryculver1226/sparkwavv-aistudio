# Track 086: Google Maps Tool

## Plan
1. Introduce a custom `search_google_maps` tool within `backend/services/genkitService.ts`.
2. Given no native Google Maps Grounding API directly integrates with Genkit models yet, we will create a manual tool for the agent to call when the user requests Geographic or mapping data.
3. The tool will be implemented with a mock response pending a formal `GOOGLE_MAPS_API_KEY`.
4. Register the tool in `allTools`.
5. Update `CHANGELOG.md`.

## Setup
- Approved

## Build
- Added custom `search_google_maps` tool to `backend/services/genkitService.ts`.
- Implemented mock functionality pending a valid `GOOGLE_MAPS_API_KEY`.
- Registered `searchGoogleMapsTool` within `allTools`.
- Updated `.env.example` and `CHANGELOG.md` with instructions for usage.
