# Track 048: Fix Feedback Attachment Upload

## Objective
Fix the `Upload timed out after 30 seconds` and `Firebase Storage: User canceled the upload/download` errors when submitting feedback with an attachment.

## Plan
1. **Identify the Issue**: The Firebase Storage bucket `gen-lang-client-0883822731.firebasestorage.app` does not exist or is not fully provisioned in the AI Studio environment. This causes `uploadBytesResumable` to hang indefinitely, which triggers the 30-second timeout cancellation.
2. **Fixes**:
   - Modified `uploadFeedbackAttachment` in `src/services/storageService.ts` to bypass Firebase Storage completely.
   - Instead, the file is now converted to a base64 string using `FileReader`.
   - Added an 800KB size limit to ensure the base64 string fits within Firestore's 1MB document limit.
3. **Compile Applet**: Verify the changes build successfully.

## Status
- [x] Plan Approved
- [x] Setup Complete
- [x] Build Complete
