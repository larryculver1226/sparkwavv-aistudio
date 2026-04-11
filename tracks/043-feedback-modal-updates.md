# Track 043: Update to Feedback Modal with Admin & Ops Logging

## Objective
Update the Feedback modal to allow users to attach a file and log/record the feedback. Create a Feedback modal in the Admin and Operations dashboard to view/update the feedback items.

## Plan
1. **Storage Service**: Add `uploadFeedbackAttachment` to `storageService.ts` to handle file uploads for feedback.
2. **Feedback Modal (User)**: Update `FeedbackModal` in `NavBar.tsx` to include a file input for attachments. Upload the file and include the URL in the feedback submission.
3. **Backend API**: 
   - Update `POST /api/feedback` to accept `attachmentUrl`.
   - Add `PUT /api/admin/feedback/:id` to allow updating feedback status and adding admin notes.
4. **Admin Dashboard**: 
   - Create `AdminFeedbackModal` in `AdminDashboard.tsx` to view feedback details (including attachment) and update status/notes.
   - Update `UserFeedbackPanel` to use `AdminFeedbackModal`.
   - Export `UserFeedbackPanel`.
5. **Operations Dashboard**: 
   - Add a "Feedback" tab to `OperationsDashboard.tsx`.
   - Render `UserFeedbackPanel` when the "Feedback" tab is active.

## Status
- [x] Plan Approved
- [x] Setup Complete
- [x] Build Complete
