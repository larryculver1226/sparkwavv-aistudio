# Track 050: Skylar Avatar and Text Sync

## Objective
1. Change Skylar's default avatar to a male professional.
2. Sync the chat sidebar avatar with the global configuration.
3. Ensure the home page scrolling text correctly reflects the global configuration.

## Plan
1. **Avatar Update**:
   - Update default avatar URL to a male professional in `SkylarConfigPanel.tsx` and `SkylarIntro.tsx`.
   - URL: `https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800`
2. **Chat Sidebar Sync**:
   - Modify `SkylarSidebar.tsx` to use `useSkylarConfig` context.
   - Replace hardcoded/persona-based avatars with the global config avatar.
3. **Scrolling Text Fix**:
   - Verify `SkylarScrollingText` reactivity.
   - Ensure `SkylarConfigPanel` correctly initializes and updates the `homeBenefits` field in Firestore.

## Status
- [x] Plan Approved
- [x] Setup Complete
- [x] Build Complete

## Details
- Changed default Skylar avatar to a male professional (`https://images.unsplash.com/photo-1560250097-0b93528c311a`).
- Synchronized chat sidebar and toggle button avatars with the global configuration.
- Fixed home page scrolling text reactivity by adding a reset effect when benefits change.
- Improved Admin Dashboard Skylar Config panel with "Reset to Defaults" and animated "Live Preview".
