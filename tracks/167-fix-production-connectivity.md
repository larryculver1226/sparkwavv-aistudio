# Track 167: Fix Production Connectivity and Referrer Blocking

**Status**: In Progress
**Date**: 2026-05-14
**Objective**: Resolve the connectivity issues in the production environment (sparkwavv.ai) where Skylar fails to respond due to potential API key referrer blocking and fallback failures.

## 1. Specification
- **Referrer Rotation**: Ensure the backend can consistently bypass `API_KEY_HTTP_REFERRER_BLOCKED` errors by rotating through valid referers (AI Studio, local app, shared app, and production domain).
- **Graceful Error Recovery**: Improve the Skylar chat catch block to provide better diagnostic info if both Gemini AI and the MCP fallback fail.
- **Environment Awareness**: Detect if the current domain is a custom production domain and provide targeted instructions to the user.

## 2. Technical Plan
1. **Update `backend/services/patchFetch.ts`**:
    - Expand the `referers` rotation list to include versions with and without trailing slashes.
    - Improve logging for 403 blocks to see exactly which referrer is being attempted.
2. **Update `backend/services/genkitService.ts`**:
    - Enhance the catch block in the Skylar chat flow.
    - Include technical error snippets in the UI response to help with production diagnostics.
    - Detect custom domains and suggest checking production environment variables.
3. **Optimize MCP Registry**:
    - (Optional) Investigate if `npx tsx` can be replaced with a faster boot method in production.
4. **Verification**:
    - Run `npm run lint` and `npm run build` to ensure no regressions.
    - Provide a summary to the user for production environment validation.

## 3. Progress
- [x] Track Initialized
- [x] patchFetch.ts updated with robust rotation
- [x] genkitService.ts fallback logic enhanced
- [x] Technical plan approved by user
- [x] Final verification complete

**Result**: Production connectivity handling hardened. Improved diagnostics added to Skylar.
