# Track 014: GCS Authentication Error with Synthetic Vertex AI Data

**Status**: Completed
**Date**: 2026-04-07
**Objective**: Fix the GCS Authentication Error when uploading synthetic data to Vertex AI.

## 1. Problem Identification
When attempting to upload synthetic data to GCS from the Admin Dashboard, the following error occurs:
`Permission denied: The service account lacks 'storage.buckets.create' access. Please manually create a bucket named 'gen-lang-client-0883822731.firebasestorage.app' in the Google Cloud Console, or set the VERTEX_AI_FINE_TUNING_BUCKET environment variable to an existing bucket you have access to.`

The issue is that the application is trying to check if the bucket exists using `bucket.exists()`, which likely returns false due to lacking `storage.buckets.get` permissions, and then attempts to create the bucket using `bucket.create()`, which fails because the service account lacks `storage.buckets.create` permissions. The bucket (`gen-lang-client-0883822731.firebasestorage.app`) is the default Firebase Storage bucket and already exists.

## 2. Technical Plan
- Modify `src/services/vertexService.ts` in the `uploadToGCS` method.
- Remove the `bucket.exists()` check and the `bucket.create()` logic.
- Directly attempt to save the file to the bucket using `file.save()`.
- If `file.save()` fails, catch the error and throw a meaningful message. This avoids needing bucket-level permissions (`storage.buckets.get` and `storage.buckets.create`) and only requires object-level permissions (`storage.objects.create`), which the service account already has for the Firebase Storage bucket.

## 3. Progress
- [x] Track Initialized
- [x] Code updated in `src/services/vertexService.ts`
- [x] Verified fix
