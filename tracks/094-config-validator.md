# Track 094 - Implement the Config Validator

## 1. Plan
**Goal:** Ensure the app crashes immediately if a secret is missing, preventing silent failures in Production.
**Steps:**
1. Create `src/config.ts`.
2. Map all known variables into a centralized exported `config` object, reading from `import.meta.env` statics first, then gracefully falling back to `process.env`.
3. Create a `validateConfig()` method that assesses the presence of core mandatory configurations.
4. If checking fails contextually (e.g. failing on client-side requires like `VITE_FIREBASE_API_KEY` or backend like `SESSION_SECRET`/`GEMINI_API_KEY`), throw a critical error.
5. Ingest and call `validateConfig()` at the very top of `src/main.tsx` (the SPA entry) and `server.ts` (the Node runtime entry).

## 2. Setup
- Replaced manual process matching inside configurations to source out of the unified file.
- Used conditional typing and compilation fallbacks to support both esbuild/tsc and Vite replacements gracefully.

## 3. Build
**Status:** Completed
- Built `src/config.ts`.
- Injected `validateConfig()` immediately after dependencies in `src/main.tsx` and `server.ts` execution points.
- Compilation and restarts successfully tested.
