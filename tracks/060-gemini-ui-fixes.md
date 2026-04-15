# Track 060: Gemini API & UI Fixes

## 1. Plan
- Investigate `400 INVALID_ARGUMENT` errors in Gemini API calls.
- Investigate React "duplicate key" warnings in `SkylarInteractionPanel`.
- Switch from `gemini-3.1-pro-preview` to `gemini-3-flash-preview` across all service files.
- Improve message ID generation in `SkylarInteractionPanel` using `crypto.randomUUID()`.

## 2. Setup
- Ensure Gemini API key is correctly configured (verified in logs).
- Verify `crypto.randomUUID()` availability in the browser environment.

## 3. Build
- Modified `src/services/skylarGraph.ts` to use `gemini-3-flash-preview`.
- Modified `src/services/skylarService.ts` to use `gemini-3-flash-preview`.
- Modified `src/utils/methodologyGenerator.ts` to use `gemini-3-flash-preview`.
- Modified `src/services/vertexService.ts` to use `gemini-3-flash-preview`.
- Modified `src/components/skylar/SkylarInteractionPanel.tsx` to use `crypto.randomUUID()` for user messages and unique IDs for initial greetings.

## 4. Testing & QA
- Ran `npm run lint` (via `lint_applet`) - Passed.
- Verified model name replacements via `grep`.
- Verified ID generation logic in `SkylarInteractionPanel.tsx`.

## 5. Status
- **Status**: Completed
- **Completion Date**: 2026-04-14
