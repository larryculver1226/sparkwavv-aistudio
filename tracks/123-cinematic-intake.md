# Track 123: Cinematic Intake

## Goal
Implement a Cinematic Intake teaser sequence inside the Dive-In Phase to serve as a high-friction visual hook that builds anticipation when new users onboard. Consider utilizing existing Skylar logic and `genkitService` tools.

## Execution
- Analyzed `DiveInPage.tsx` and created a functional gap for a pre-commit cinematic hook.
- Added `generateCinematicTeaserTool` to `genkitService.ts` mapping to `uiAction = 'play_cinematic_teaser'`.
- Configured a new `CinematicTeaserOverlay.tsx` component that accepts multiple parameterized scenes (`title`, `subtitle`, `visual_theme`) and triggers sequentially, overlaying the Dive In Checklist dynamically.
- Hooked `CinematicTeaserOverlay.tsx` to `audioService` to play `fusionFlare` on entry and `chime` during scene transitions.
- Adjusted `DiveInPage.tsx` state mapping `handleSkylarAction` to parse `play_cinematic_teaser` and pass it to the overlay.
- Updated `skylarBase.prompt` explicitly instructing the agent to drop this trailer immediately following resume injection or early story context.

## Complete
This completes Track 123.
