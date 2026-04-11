# Track 042: Bug Fix - Feedback Submission

## Objective
Fix a bug where unauthenticated users could not submit feedback, resulting in a "Failed to submit feedback" error and a `[AUTH] Token verification failed` backend error.

## Plan
1. **Update `NavBar.tsx`**: Only include the `Authorization` header if `idToken` is truthy (not `undefined`).
2. **Update `server.ts`**: 
   - Modify the `/api/feedback` endpoint to allow unauthenticated requests by removing `requireRole`.
   - Update `verifyToken` to handle the string `'undefined'` gracefully.
   - Save feedback as 'anonymous' if no valid token is provided.
3. **Restart Dev Server**: Apply the backend changes.

## Status
- [x] Plan Approved
- [x] Setup Complete
- [x] Build Complete
