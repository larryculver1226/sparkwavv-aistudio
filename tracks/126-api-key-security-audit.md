# Track 126: API Key Security Audit

**Status**: Completed
**Date**: 2026-05-05

## 1. Specification

The goal is to analyze the codebase to ensure NO Gemini API Keys (and other sensitive keys) are accidentally exposed to the client-side environment. 

### Current Implementation & Vulnerability Analysis
- **Vulnerability**: Currently, `scripts/esbuild-config.mjs` explicitly embeds `process.env.GEMINI_API_KEY` into the client-side JavaScript bundle using the `define` property. It also embeds any environment variables starting with `VITE_`.
- **Impact**: Any user inspecting the `dist/public/bundle.js` source code or network traffic can see the plain text Gemini API Key.
- **Client-Side SDK Usage**: `src/services/skylarService.ts` contains several methods that initialize the `@google/genai` SDK directly in the browser. While core chat functions like `chatWithVertex` correctly use the backend Express server, the following functions bypass the backend and thus *rely* on the exposed client-side key:
  1. `generateSpeech()` (TTS - used in `EveningSpark.tsx`)
  2. `connectLive()` (Live API WebSocket - used in `InterviewSimulator.tsx`)
  3. `generateBrandPortrait()`
  4. `analyzeJobUrl()`

### Security Architecture Goal
The design principle for third-party keys must always be **Server-Side Only**. All AI calls must be proxied through the Express backend in `server.ts`.

## 2. Technical Plan

To secure the Gemini API Key, we must implement the following changes:

1. **Clean `esbuild-config.mjs`**: Remove the manual injection of `process.env.GEMINI_API_KEY` into the client bundle variables.
2. **Refactor Client-Side SDK Calls to Backend Endpoints**:
   - `generateSpeech()`: Create a new `/api/skylar/tts` Express endpoint in `server.ts`. Update `skylarService.generateSpeech` to use `fetch()`.
   - `generateBrandPortrait()`: Create `/api/skylar/generate-portrait`. Update the service to call it.
   - `analyzeJobUrl()`: Create `/api/skylar/analyze-job`. Update the service.
3. **Live API Proxying (Complex)**: The `connectLive()` WebSocket cannot easily be proxied via standard REST. To keep the key secure, the Express backend needs a proxy WebSocket endpoint, or we must temporarily disable the Live Interview Simulator until a secure Vertex AI authentication mechanism is set up.

*Awaiting approval to execute the "Build" phase to secure these endpoints and remove the key from the client bundle.*

## 3. Progress
- [x] Analyze codebase
- [x] Identify client-side leakage points
- [x] Implement backend proxy endpoints
- [x] Remove hardcoded keys from build script
- [x] Cleaned config and .env.example
- [x] Disabled client-side WebSocket Live API until backend proxy is available
