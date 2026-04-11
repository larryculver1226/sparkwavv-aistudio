# Track 040: Bug Fix - Firestore Permissions

## Objective
Fix a bug where the app crashes on initial load before `onAuthStateChanged` resolves by allowing public read access to the `metadata` collection.

## Plan
1. **Update `firestore.rules`**: Modify the `metadata` match block to allow public read (`allow read: if true;`) and authenticated write (`allow write: if request.auth != null;`).
2. **Deploy Rules**: Save the file and deploy the updated rules to Firebase.

## Status
- [x] Plan Approved
- [x] Setup Complete
- [x] Build Complete
