# Track 144: Skylar Guest Security & Error Resolution

## Objective
The primary objective is to resolve the "network or proxy restriction" error encountered by unauthenticated users in the Skylar chat and to implement security measures to prevent unrestricted/abusive use of the AI by guest users.

## Scope
- **Rate Limiting**: Implement `express-rate-limit` for the `/api/skylar/chat-journey` endpoint, with stricter limits for `ROLES.GUEST`.
- **Response Validation**: Improve logging and error handling in `skylarService.ts` and `server.ts` to identify and communicate the root cause of non-JSON responses.
- **Guest Restrictions**: Ensure guest users are restricted to specific non-sensitive phases (e.g., 'dive-in') and have a maximum interaction quota.
- **CORS/Security Review**: Briefly review CORS and Helmet settings for any potential conflicts with current AI Studio preview environments.

## Technical Tasks
1. [x] Install `express-rate-limit` and `express-slow-down`.
2. [x] Define a `guestRateLimiter` middleware in `server.ts`.
3. [x] Apply `guestRateLimiter` to the `/api/skylar/chat-journey` endpoint.
4. [x] Enhance `chatWithVertex` in `src/services/skylarService.ts` with detailed logging for non-JSON responses.
5. [x] Update the `/api/skylar/chat-journey` route in `server.ts` to log specific failures before sending responses.
6. [x] Implement a usage cap for anonymous users stored in memory or a lightweight store.

## Success Criteria
- Unauthenticated users can access the 'dive-in' chat without encountering "network or proxy restriction" errors (unless they exceed quota).
- Guest users are prevented from making excessive requests to the AI.
- The system provides clear feedback if a backend startup or authentication issue is occurring.
