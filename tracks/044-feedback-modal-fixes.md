# Track 044: Feedback Modal Fixes

## Objective
Fix the Feedback modal so it can be moved around and its contents are fully scrollable/visible on smaller screens.

## Plan
1. **Update `NavBar.tsx`**: 
   - Import `useDragControls` from `motion/react`.
   - Add a drag handle to the top of the `FeedbackModal`.
   - Make the `motion.div` draggable using `dragControls`.
   - Add `max-h-[90vh]` and `overflow-y-auto` to the modal content area to ensure it fits on screen and the submit button is always accessible.
2. **Compile Applet**: Verify the changes build successfully.

## Status
- [x] Plan Approved
- [x] Setup Complete
- [x] Build Complete
