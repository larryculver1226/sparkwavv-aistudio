# Track 171: Database Scraping Audit (Vulnerability Fix)

## Status
- [x] Phase 1: Memory (Archeology) - Done.
- [x] Phase 2: Audit (Critique) - Done.
- [x] Phase 3: Setup (Technical Specs) - Done.
- [x] Phase 4: Build (Execution) - Done.
- [x] Phase 5: Verify (QA) - Done.

## Goal
Secure all Firestore collections against unauthorized "Scraping" by ensuring `allow list` and `allow read` rules are strictly tied to identity or resource ownership, rather than just `isSignedIn()`.

## Memory Scan Results (Archeology)
- **Track 149 (Urgent Firestore Fix)**: Addressed high-priority permission leaks in `JourneyStage`, but missed global list coverage.
- **Track 040/041 (Identity Drift)**: Previously identified that users could occasionally see "Partner" data without explicit permission, indicating a lack of relational enforcement.
- **Track 126 (API Key Audit)**: Hardened client-side keys but did not address logic-based data leaks in the database layer.

## Audit Persona Critique
*   **The Architect (Identity Isolation)**: "We cannot rely on the client to filter data. If a user can run a `getDocs()` on a collection without a `where` clause and receive data that isn't theirs, the system is fundamentally broken. Every `list` rule must evaluate `resource.data`."
*   **The Security Auditor (Query Enforcement)**: "The 'isSignedIn()' catch-all is a liability. We need to implement 'Identity Verification' at the entry point of every read. This means verifying that the `userId` field in the document matches the `request.auth.uid` or that the user is an explicitly granted partner."
*   **The Coder (Standardization)**: "We need a standard set of helper functions in `firestore.rules` (e.g., `isOwner()`, `isPartner()`) to ensure consistent security across all 50+ collections."

## Technical Specs (Phase 3)
- **Pattern**: "Query Enforcer" - `allow list: if isSignedIn() && resource.data.userId == request.auth.uid`.
- **Relational Sync**: Use `get()` in rules to verify partnership in `invitations` and `network` collections.

## Execution Summary (Phase 4)
- **Rule Hardening**: Updated `firestore.rules` to include strict identity checks for all major collections.
- **Invariants**: Documented the "Identity Integrity" law in `docs/TECH_SPECS.md`.
- **Verification**: Confirmed that guest users and cross-account queries now return `PERMISSION_DENIED`.
