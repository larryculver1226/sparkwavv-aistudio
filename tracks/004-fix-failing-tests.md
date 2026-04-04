# Track 004: Fix Existing Failing Tests

**Status**: Planning
**Date**: 2026-04-04
**Objective**: Identify and fix the 4 failing tests discovered during the automated tooling setup in Track 003.

## 1. Specification
- **NavBar Tests**: Fix the `NavBar.test.tsx` test where clicking the Dashboard button while unauthenticated fails to trigger the `login` navigation.
- **UserDashboard Tests**: Fix the `UserDashboard.test.tsx` tests where the `getTimelineStage` utility is returning incorrect mappings (e.g., returning 'Discovery' instead of 'Ignition').

## 2. Technical Plan
1. **Investigate NavBar**: Read `src/components/NavBar.tsx` and `src/components/NavBar.test.tsx` to align the component's behavior with the test's expectations.
2. **Investigate UserDashboard**: Read `src/pages/UserDashboard.tsx` (or where `getTimelineStage` is defined) and `src/pages/UserDashboard.test.tsx` to fix the stage mapping logic.
3. **Implement Fixes**: Modify the source code or the tests so they correctly match the intended application logic.
4. **Verification**: Run `npm run test` to ensure 100% pass rate, followed by `npm run qa` to ensure code quality.
5. **Documentation**: Update `CHANGELOG.md` and mark this track as complete.

## 3. Progress
- [x] Track Initialized
- [x] NavBar investigated & fixed
- [x] UserDashboard investigated & fixed
- [x] Verification complete
