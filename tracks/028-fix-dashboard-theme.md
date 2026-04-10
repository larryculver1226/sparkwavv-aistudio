# Track 028: Fix User Dashboard UI Scheme/Colors

## Objective
Fix the User Dashboard UI scheme and colors to be consistent with the Home Page dark theme, removing the light (yin) theme overrides that caused inconsistent backgrounds (e.g., on the JourneyTimeline).

## Plan
1. Remove `data-theme` override logic in `UserDashboard.tsx`.
2. Remove 'yin' theme CSS overrides from `index.css`.
3. Update specific components (like `EvolutionVisualizer`) that had hardcoded light backgrounds to use dark theme classes.

## Status
- [x] Plan
- [x] Setup
- [x] Build
- [x] QA & Testing
