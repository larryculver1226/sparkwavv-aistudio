# Track 045: Feedback Modal Fixes (Z-Index)

## Objective
Fix the Feedback modal so it appears above the navigation bar and is fully clickable/accessible.

## Plan
1. **Identify the Issue**: The `FeedbackModal` and `UserProfileModal` were being rendered *before* the `<nav>` element in `NavBar.tsx`. Since `<nav>` had a `z-index` of `100` and the modals also had `100`, the `<nav>` was stacking on top of the modals. Additionally, the `pointer-events-none` class on the modal wrapper was preventing clicks.
2. **Fix Z-Index**: Increase the `z-index` of both `FeedbackModal` and `UserProfileModal` wrappers to `z-[200]` so they sit above the `NavBar`.
3. **Fix Pointer Events**: Remove `pointer-events-none` from the modal wrapper and `pointer-events-auto` from the inner `motion.div` so the backdrop correctly captures clicks (preventing interaction with the page behind it) and the modal contents are fully interactive.
4. **Compile Applet**: Verify the changes build successfully.

## Status
- [x] Plan Approved
- [x] Setup Complete
- [x] Build Complete
