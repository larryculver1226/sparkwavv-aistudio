# Track 032: Ignition Dashboard Completion

## Objective
Analyze the Ignition dashboard to identify what needs to be completed (not mocked up) so that a user can actually complete the Ignition phase. Implement the missing functionality to save data to the Wavvault and complete the Ignition phase.

## Status
- [ ] Plan
- [ ] Setup
- [ ] Build
- [ ] QA & Testing

## Analysis of Ignition Dashboard
Currently, the Ignition phase in the User Dashboard has several mocked or incomplete features:
1. **Synthesis Lab (HighFidelitySynthesisLab.tsx)**:
   - Users can generate a portrait, but there is no explicit "Save to Wavvault" button to add it to their Wavvault artifacts.
   - The generated portrait is saved to `user_assets` but not explicitly linked to the Wavvault's `artifacts` array.
2. **Action Center (ActionCenter.tsx)**:
   - The "Complete Strengths Assessment" action does nothing when clicked.
   - The "Finalize Identity Clarity" action does nothing when clicked.
   - These actions are hardcoded as `status: 'pending'` and cannot be completed.
3. **Wavvault Integration**:
   - Need to ensure that when these actions are completed, the data is actually saved to the Wavvault (`WavvaultData` in Firestore) and the Action Center reflects the completed status.

## Proposed Implementation Plan
1. **Action Center Interactivity**:
   - Update `ActionCenter.tsx` to accept dynamic status for actions based on the user's actual Wavvault data.
   - In `UserDashboard.tsx`, handle `onActionClick` for `strengths` and `identity`.
2. **Strengths Assessment**:
   - Create a modal or view for the user to input their top Gallup strengths.
   - Save these strengths to the Wavvault (`strengths` array in `WavvaultData`).
3. **Identity Clarity**:
   - Create a modal or view for the user to define their Identity Clarity (e.g., a short bio or mission statement).
   - Save this to the Wavvault (`identity` string in `WavvaultData`).
4. **Synthesis Lab Wavvault Integration**:
   - In `HighFidelitySynthesisLab.tsx`, add a "Save to Wavvault" button for generated portraits, resumes, and portfolios.
   - When clicked, save the asset as a `DistilledArtifact` in the Wavvault.
5. **Phase Completion**:
   - Ensure that completing these actions updates the Ignition phase progress and allows the user to unlock the next gate.
