# Security Specification: Sparkwavv Production

## Data Invariants
1. **User Isolation**: A user must never be able to read or write another user's private data (Dashboards, Wavvaults, Insights, Assets).
2. **Relational Integrity**: `dashboards/{userId}` must match the `userId` of the document ID and the `request.auth.uid`.
3. **Immutable UIDs**: Once a record is created (e.g., a User profile), the `uid` or `userId` field cannot be changed.
4. **Role Protection**: Standard users cannot promote themselves to `admin` or `super_admin`.
5. **System Immutability**: `metadata`, `journeyPhaseConfigs`, and `programs` are read-only for standard users.

## The "Dirty Dozen" Payloads (Denial Tests)
1. **Identity Theft**: Attempt to create `dashboards/victim_uid` with `request.auth.uid = attacker_uid`.
2. **Privilege Escalation**: Update `users/my_uid` with `{ role: 'super_admin' }`.
3. **Data Poisoning**: Update `users/my_uid` with a 1MB string in `displayName`.
4. **State Injection**: Update `Wavvault` with `isDiscoveryUnlocked: true` bypassing the Skylar validation gate.
5. **Orphaned Writes**: Create an `Artifact` without a valid `tenantId`.
6. **Cross-Tenant Leak**: Attempt to list `tenants` without a valid session (if restricted).
7. **Audit Log Erasure**: Attempt to `delete` a `security_logs` entry.
8. **Shadow Field Injection**: Add `isVerified: true` to a `User` profile update.
9. **ID Poisoning**: Request `get` on `users/..%2F..%2Fsys_config`.
10. **Query Scraping**: Attempt `allow list` on `users` without a `where(uid == my_uid)` clause.
11. **Timestamp Spoofing**: Set `updatedAt` to a future date instead of `request.time`.
12. **Metadata Tampering**: Attempt to `update` `metadata/skylar_global`.

## Rule Strategy
- **Master Gate**: All user-specific collections use `request.auth.uid == userId` logic.
- **Action-Based Updates**: Updates to critical fields (like `role`) are blocked.
- **Validation Blueprints**: Every entity has a schema check.
- **Global Deny**: `match /{document=**} { allow read, write: if false; }`
