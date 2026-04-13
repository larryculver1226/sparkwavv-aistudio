# Track 046: Feedback Modal Fixes (Infinite Spinning)

## Objective
Fix the issue where the Feedback Modal spins indefinitely after clicking "Submit" and never shows a success message. Also ensure the Admin and Operations dashboards correctly display the feedback.

## Plan
1. **Identify the Issue**: 
   - The `alert()` function is blocked in the sandboxed iframe, which throws a `SecurityError`.
   - If `fetch` or `db.collection.add` hangs, it will never resolve.
   - If Firebase Storage upload hangs, it will never resolve.
2. **Fixes**:
   - Replaced `alert()` in `NavBar.tsx` with a custom `errorMsg` state to display errors directly in the UI.
   - Added a 30-second timeout to `uploadFeedbackAttachment` in `storageService.ts` to prevent infinite hanging if the upload fails or the network drops.
   - Added `withTimeout` (10 seconds) to `db.collection('feedback_issues').add()` in `server.ts` to prevent the backend from hanging indefinitely.
   - Replaced `alert()` in `AdminDashboard.tsx` (`UserFeedbackPanel`) with `console.error` to prevent `SecurityError` crashes when updating feedback status.
3. **Compile Applet**: Verify the changes build successfully.

## Status
- [x] Plan Approved
- [x] Setup Complete
- [x] Build Complete
