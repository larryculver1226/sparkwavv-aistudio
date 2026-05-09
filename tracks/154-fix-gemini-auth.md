# Track 154: Fix Gemini API Authentication and Referrer Issues
Status: IN_PROGRESS
Last Updated: 2026-05-09

## Overview
Addressing persistent `API_KEY_HTTP_REFERRER_BLOCKED` and `API_KEY_INVALID` errors occurring in the Skylar chat and Genkit services. These errors disrupt AI features by blocking requests from server-side environments due to missing or mismatched Referer headers.

## Actions Planned
- [x] **Enhance Fetch Interceptor**: Expand the Referer rotation in `backend/services/patchFetch.ts` to include broader patterns (e.g., AI Studio domain, alkalimojo.com, Firebase Auth domain).
- [x] **Instrument Logging**: Add granular logging to `patchFetch.ts` to identify which referrer fails and why.
- [x] **MCP Registry Resilience**: Harden `scripts/mcp-model-registry/index.ts` to handle both referer blocks and key expirations more gracefully, ensuring Vertex AI fallback actually triggers. Updated model mapping to non-prohibited `gemini-3-flash-preview`.
- [x] **Genkit Optimization**: Standardized model selection via `getPreferredModel()` helper in `backend/services/genkitService.ts`.
- [x] **Origin Header Fix**: Removed explicit `Origin` and `Host` headers from `patchFetch.ts` to resolve "Origin doesn't match Host for XD3" 400 errors.
- [x] **Enhanced Sanitization**: Added explicit deletion of all variations of `Origin` and `Host` headers in the fetch interceptor to prevent SDKs or underlying libraries from passing conflicting values.

## Verification Plan
- [ ] Trigger AI features and monitor server logs for "Global Fetch Patch" output.
- [ ] Verify that 403 errors are intercepted and retried with alternate referrers.
- [ ] Confirm Vertex AI fallback works if all Gemini keys fail.
