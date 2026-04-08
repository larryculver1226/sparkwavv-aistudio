# Track 021: Implement User Profile Image Upload

## Goal
Allow users to upload a profile picture. The image will be uploaded to Firebase Storage, and the resulting download URL will be saved to the user's document in Firestore (and potentially updated in their Firebase Auth profile).

## Approach (Plan)

### 1. Firebase Storage Configuration
- Check `src/firebase.ts` to ensure Firebase Storage is initialized and exported (`getStorage`).
- Ensure Firebase Security Rules for Storage (if applicable/accessible) allow authenticated users to upload images to their specific path (e.g., `users/{userId}/profile_images/{fileName}`). *Note: If we don't have direct access to storage rules via the agent, we will assume standard authenticated access or handle errors gracefully.*

### 2. Upload Service Logic
- Create or update a service (e.g., `src/services/userService.ts` or `src/services/storageService.ts`).
- Implement an `uploadProfileImage(userId: string, file: File)` function that:
  1. Creates a storage reference: `users/${userId}/profile.jpg` (or keeps the original extension).
  2. Uploads the file using `uploadBytes` or `uploadBytesResumable`.
  3. Retrieves the download URL using `getDownloadURL`.
  4. Updates the user's Firestore document (e.g., `users/${userId}`) with the new `photoURL`.
  5. (Optional) Updates the Firebase Auth profile via `updateProfile(auth.currentUser, { photoURL })`.

### 3. UI Implementation
- Create a reusable `ProfileImageUpload` component.
- The component should support both drag-and-drop and click-to-select file upload (as per our design guidelines).
- Display a loading state (spinner or progress bar) during the upload.
- Show the current profile picture as a fallback or the newly uploaded image upon success.
- Integrate this component into the user's profile settings or dashboard header.

### 4. Documentation & History
- Update `TECH_SPECS.md` to document the new Storage path and the `photoURL` field in the User data model.
- Update `CHANGELOG.md` upon completion.

## Status
- [x] Plan
- [x] Setup
- [x] Build
- [x] QA & Testing
