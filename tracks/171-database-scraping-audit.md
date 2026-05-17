# Track 171: Database Scraping Audit (Vulnerability Fix)

## Status
- [x] Phase 1: Memory (Archeology) - Done
- [x] Phase 2: Audit (Critique) - Done
- [x] Phase 3: Setup (Technical Specs) - Done
- [x] Phase 4: Build (Execution) - **COMPLETED**
- [x] Phase 5: Verify (QA) - Done

## Goal
Secure all Firestore collections against "Scraping" by ensuring `allow list` and `allow read` rules are strictly tied to identity or resource ownership, rather than just `isSignedIn()`.

## Memory Context
- Past fixes in Track 149 focused on `JourneyStage` permissions.
- Track 040/041 dealt with general identity drift.

## Audit Findings
- **Vulnerability**: "Scraping via curl" implies that a guest or authenticated user can enumerate documents outside their scope.
- **Root Cause**: Lack of `resource.data.userId == request.auth.uid` inside `allow list` blocks across multiple collections.
- **Solution**: Implemented the **Query Enforcer** pattern.

## Changes
- **`firestore.rules`**: Hardened all collection list rules. Added `invitations` and `partner_access` with secure multi-user handshakes.
- **`docs/TECH_SPECS.md`**: Documented security invariants.
- **`docs/PERSISTENCE_GUIDE.md`**: Established a source of truth for app state.
