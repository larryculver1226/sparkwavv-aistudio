# Track 136: Data Migration (Firestore & Auth)

## Overview
Migration of production data from the previous deployment to the current environment. This includes Firebase Authentication (Users), Firestore Collections, and normalization of the `wavvaults` collection to `wavvault`.

## Status
- [ ] **Auth Migration**: Export users from source, import to destination.
- [ ] **Firestore Transfer**: Export/Import via GCS for `users`, `dashboards`, `wavvault`, `wavvault_artifacts`, `journeyPhaseConfigs`, `metadata`.
- [ ] **Normalization**: Run `normalizeWavvault.ts` script to merge/rename `wavvaults` -> `wavvault`.
- [ ] **Storage Sync**: Sync GCS buckets for user-uploaded assets.

## Implementation Details

### Firestore Normalization Script
The following logic (found in `scripts/migrate/normalizeWavvault.ts`) ensures that any data residing in the plural `wavvaults` collection is migrated to the singular `wavvault` collection, maintaining document IDs (User UIDs).

```typescript
import * as admin from 'firebase-admin';

// Initialize with Service Account
const sourceApp = admin.initializeApp({ /* config */ }, 'source');
const destApp = admin.initializeApp({ /* config */ }, 'destination');

const sourceDb = sourceApp.firestore();
const destDb = destApp.firestore();

async function migrateAndNormalize() {
  console.log('🚀 Starting Wavvault Normalization...');
  
  const snapshot = await sourceDb.collection('wavvaults').get();
  const total = snapshot.size;
  console.log(`Found ${total} legacy records.`);

  for (const doc of snapshot.docs) {
    const data = doc.data();
    // Move to singular collection in destination
    await destDb.collection('wavvault').doc(doc.id).set(data, { merge: true });
    console.log(`✅ Migrated User: ${doc.id}`);
  }

  console.log('🎉 Migration Complete.');
}
```
