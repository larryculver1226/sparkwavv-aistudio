# Track 018: Fix Login Hang

## Goal
Investigate and fix the issue where the screen hangs and requires a browser restart when a user logs in. Also, ensure the "Your email is not verified" message is removed.

## Approach
1.  **Investigate the Hang**: The hang was caused by an infinite loop in `UserDashboard.tsx`. The `fetchInsights` function called `seedInitialDNA` when no insights were found. `seedInitialDNA` made a POST request with an incorrectly formatted body, which the server rejected with a 400 Bad Request. Because the insights were never created, the subsequent call to `fetchInsights` found 0 insights again, triggering `seedInitialDNA` in an endless loop of rapid network requests.
2.  **Fix the Loop**: 
    - Corrected the payload structure in `seedInitialDNA` to match the server's expected format (`{ insight: { ...insight, userId } }`).
    - Added a `sessionStorage` flag to ensure `seedInitialDNA` is only called once per session, preventing the loop even if the network request fails.
3.  **Remove Verification Message**: The `VerificationBanner` component has already been removed from `App.tsx`.

## Status
- [x] Plan
- [x] Setup
- [x] Build
- [x] QA & Testing
