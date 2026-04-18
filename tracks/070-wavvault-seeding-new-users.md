# Track 070: Seeding of Wavvault for New Users

**Status**: In Progress
**Date**: 2026-04-17
**Objective**: Implement an initial "seeding" of Wavvault data for new users in the Ignition Phase, strict Gateway completion validation, and a persistent Dashboard Wavvault panel.

## 1. Specification
- **Persistent Wavvault Panel:**
  - Create `WavvaultContentsWidget.tsx` to clearly depict what is in the Wavvault (skills, identities, DNA, artifacts).
  - Explicitly display missing/pending items based on the user's current phase requirements.
  - Integrate this directly into `UserDashboard.tsx` so it is *always visible* regardless of phase viewing limits.
- **WavVault Seeding:**
  - Create a new widget (`WavvaultSeedingWidget.tsx`) to handle new user onboarding for the Ignition phase.
  - Automatically detect if `wavvaultData` is missing or empty.
  - Include an upload zone for a Resume and inputs for contact information (LinkedIn, target roles).
  - Parse the resume using AI and persist the initial structural data into Firestore.
- **Gateway Validation:**
  - Enhance Phase Transition logic to explicitly require all `requiredArtifacts` for the current stage.
  - Prevent progression to a subsequent phase if validation fails, intercepting the request and rendering UI warnings indicating exactly what is missing.

## 2. Technical Plan
1. **Component Creation:**
   - `src/components/dashboard/widgets/WavvaultContentsWidget.tsx` using Tailwind CSS.
   - `src/components/dashboard/widgets/WavvaultSeedingWidget.tsx` using Tailwind CSS and Radix/Lucide icons.
2. **Dashboard Integration:**
   - Update `UserDashboard.tsx` to universally mount `WavvaultContentsWidget` near the top of the dashboard content area.
   - Update `src/components/dashboard/DynamicPhaseView.tsx` (or `UserDashboard.tsx`) to mount `WavvaultSeedingWidget` if the user is in `Ignition` phase and lacks fundamental WavVault data.
3. **Data Updating:**
   - Use `wavvaultService.ts` to push the seeded data to the backend.
   - Add parsing step during the upload to automatically populate `careerDnaHypothesis` and basic profile fields.
4. **Validation Logic:**
   - In `UserDashboard.tsx` or `PhaseGateBanner.tsx`, update the `onComplete` handler to first check the user's completed artifacts against `stageConfig.requiredArtifacts`.
   - Update `GateReviewModal` to handle "Blocked" states cleanly.

## 3. Progress
- [x] Track Initialized
- [x] Plan updated with Persistent Wavvault Panel
- [ ] WavvaultContentsWidget implemented
- [ ] WavvaultSeedingWidget implemented
- [ ] DynamicPhaseView / Dashboard integration added
- [ ] Phase Gateway strict validation logic implemented
- [ ] Verification complete
