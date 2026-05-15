# Track 168: Production Prompt Parity & Resilience

## Status
- **Phase**: Build
- **Status**: Completed
- **Created**: 2026-05-15
- **Updated**: 2026-05-15

## Context
The production environment at sparkwavv.ai was reporting `NOT_FOUND: Prompt skylarBase not found`. This was caused by the build process not including the `backend/prompts` directory in the `dist` folder, which is the root for the production server.

## Objective
Ensure Genkit Dotprompts are correctly resolved and available in both dev and production environments.

## Implementation
1. **Build Script Update**: Modified `package.json` to copy `backend/prompts` to `dist/backend/prompts` during `npm run build`.
2. **Robust Path Resolution**: Updated `genkitService.ts` to check both development and production path locations for prompts.

## Verification Results
- `package.json` build script verified.
- `genkitService.ts` initialization logic updated to handle `dist` folder fallback.
- Confirmed `skylarBase.prompt` exists at the source location.
