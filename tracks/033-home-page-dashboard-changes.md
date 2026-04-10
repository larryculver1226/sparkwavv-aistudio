# Track 033: Home Page and User Dashboard Changes

## Plan
1. **Dashboard Login Requirement**: Update `NavBar` to show "Dashboard Login" button for returning users when they are not on the dashboard.
2. **Vault Visibility**: Hide the "Vault" button on the Home page and only show it on the User Dashboard.
3. **User Profile Modal**: Consolidate user settings and logout into a "User Profile" modal accessible from the dashboard `NavBar`.
4. **Feedback Button**: Ensure the "Feedback" button remains visible on all pages.
5. **Dive-In Section**: Add a "Begin Your Dive-In" section before the "Preliminary DNA Analysis" section in `App.tsx` with a descriptive paragraph.
6. **Dive-In Auth Flow**: Update the "Start Free Dive-In" button to trigger `loginWithPopup` for unauthenticated users, or navigate to the dashboard for authenticated users.

## Setup
- Modified `src/components/NavBar.tsx` to use `useLocation` to determine if the user is on the dashboard (`isDashboard`).
- Created `UserProfileModal` component in `NavBar.tsx`.
- Updated `src/App.tsx` to include the new "Begin Your Dive-In" section before `QuickScan`.

## Build
- Implemented conditional rendering in `NavBar` desktop and mobile menus based on `isDashboard`.
- Replaced individual Settings/Logout buttons with the `UserProfileModal` trigger on the dashboard.
- Updated `QuickScan`'s `onDiveIn` prop and the new "Start Free Dive-In" button to use `loginWithPopup()` for unauthenticated users.
