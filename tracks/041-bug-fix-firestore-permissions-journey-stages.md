# Track 041: Bug Fix - Firestore Permissions for Journey Stages

## Objective
Fix a bug where the app crashes on initial load before `onAuthStateChanged` resolves by allowing public read access to the `journey_stages` collection.

## Plan
1. **Update `firestore.rules`**: Modify the `journey_stages` match block to allow public read (`allow read: if true;`).
2. **Deploy Rules**: Save the file and deploy the updated rules to Firebase.

## Status
- [x] Plan Approved
- [x] Setup Complete
- [x] Build Complete
