# Track 010: Identity Platform Names Fix

**Status**: Completed
**Date**: 2026-04-07
**Objective**: Fix the issue where some users show their UID instead of their name in the Identity Platform Management table, and add the Dashboard ID to the table.

## 1. Problem Identification
The strings `9pxva24gkQMSjqj7qwlVuSg2isd2` and `nDQgmXWxfsUrqW3aD1r2Vk0LIB22` are **Firebase Auth UIDs**, not Dashboard IDs. 

This happens because of the user merging logic in `/api/admin/users-v2` (in `server.ts`). 
1. The API fetches users from Firebase Auth. If a user lacks a display name, it falls back to their email prefix (e.g., `lculver123`).
2. The API then fetches users from the Firestore `users` collection. If a Firestore document lacks `displayName`, `firstName`, and `email`, the fallback logic assigns `doc.id` (which is the UID) as the `displayName`.
3. During the merge step, the Firestore user's `displayName` (which is now the UID string) overwrites the Auth user's `displayName` (which was the email prefix) because the UID is a valid, non-empty string.

## 2. Technical Plan

### Step 1: Fix the Display Name Merge Logic
- **File**: `server.ts` (Endpoint: `/api/admin/users-v2`)
- **Action**: Update the merge logic to prevent a UID from overwriting a valid display name or email prefix. If the Firestore `displayName` equals the `uid`, we should prefer the Auth `displayName`.

### Step 2: Extract Dashboard ID (`sparkwavvId`)
- **File**: `server.ts` (Endpoint: `/api/admin/users-v2`)
- **Action**: Ensure `sparkwavvId` is extracted from the Firestore document and included in the returned user object.

### Step 3: Update the Identity Platform Table
- **File**: `src/pages/AdminDashboard.tsx` (`IdentityManagementPanel` component)
- **Action**: Add a new column for "Dashboard ID" and display `u.sparkwavvId` (with a fallback like 'N/A' if not present).

## 3. Progress
- [x] Track Initialized & Problem Identified
- [x] Technical Plan Approved
- [x] Display Name Merge Logic Fixed
- [x] Dashboard ID Added to API
- [x] Dashboard ID Added to UI
- [x] Verification complete
