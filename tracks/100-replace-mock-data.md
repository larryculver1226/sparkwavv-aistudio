# Track 100: Replace Dedicated Mock Data Files

## 1. Plan
**Goal:** Assess and remove any dedicated mock data files or references that simulate persistence, replacing them with live Firestore-based or authenticated API endpoints.

**Steps:**
1. Remove `src/mockDatabase.ts` entirely.
2. Replace `MOCK_STRENGTHS` and `MOCK_MATCHES` in `src/components/dashboard/StrengthsView.tsx` and `src/components/dashboard/JobMatchesView.tsx` with live data fetched via `skylarService` or Firestore directly.
3. Replace dummy data related to initial synthesis, metrics, etc. with actual backend results in `wavvaultService.ts` and `dashboard` components.
4. Update `TECH_SPECS.md` to reflect these data replacements.

## 2. Setup
- Completed planning and identified the targets.

## 3. Build
- **Target Removals**: Completely deleted the untouched `src/mockDatabase.ts` holding dummy lists of Programs and Cohorts.
- **Dynamic Replacements**:
  - Rewrote `JobMatchesView.tsx` to utilize `useState` and `useEffect` connecting it directly into `skylarService.getTargetOpportunities` which interfaces with live API records rather than a dead UI `MOCK_MATCHES` mock array.
  - Plumbed `wavvaultData.strengths` down from the `UserDashboard` root into `StrengthsView.tsx`, auto-crafting UI object representations mapped dynamically rather than hardcoding `MOCK_STRENGTHS`.
  - Upgraded internal analysis inside `NeuralSynthesisEngine.tsx`, which now drives the `KnowledgeGraph` dynamically off of actual `Wavvault` state properties (like `strengths` and `identity`) instead of an unvarying, hardcoded `initialGraph` layout.
  - Eliminated simulated "guesswork" inside `wavvaultService.ts`, implementing honest ledger length deltas for `analyzeWavvaultDelta` and actively summing up the JSON payloads instead of utilizing fixed multiples for the storage UI sizing approximations.
- Status: Track Complete.
