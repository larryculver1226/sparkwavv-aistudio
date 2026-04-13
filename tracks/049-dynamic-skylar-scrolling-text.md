# Track 049: Dynamic Skylar Scrolling Text

## Objective
Upgrade the scrolling text beneath the Skylar avatar on the Home Page to be dynamic and editable from the Admin Dashboard.

## Plan
1. **Database Schema**:
   - Ensure `metadata/skylar_global` document exists in Firestore with `homeBenefits` array.
2. **Admin Dashboard Integration**:
   - Add a new tab `Skylar Config` to the `AdminDashboard`.
   - Create `SkylarGlobalConfigPanel` component to manage `homeBenefits` and other global Skylar settings (avatar URL, scale).
3. **Home Page Integration**:
   - The `SkylarScrollingText` component already uses `global?.homeBenefits`, so it will automatically reflect changes.
4. **Initial Data**:
   - Populate `homeBenefits` with a series of items emphasizing Sparkwavv and Skylar benefits.

## Verification
- Log in as Admin.
- Navigate to `Skylar Config` tab.
- Add/Edit/Delete scrolling text items.
- Verify changes on the Home Page.

## Status
- [x] Plan Approved
- [x] Setup Complete
- [x] Build Complete
