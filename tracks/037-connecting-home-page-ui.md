# Track 037: Phase 3 - Connecting the Home Page UI

## Objective
Connect the Home Page to the database so we can control it remotely using the `SkylarConfigContext`. Update `src/components/landing/SkylarIntro.tsx` to use the global configuration for the scrolling ticker and Skylar's avatar.

## Plan
1. **Integrate Context**: Import and use the `useSkylarConfig()` hook in `src/components/landing/SkylarIntro.tsx`.
2. **Dynamic Ticker**: Replace the hardcoded benefits/messages array with `global?.homeBenefits`. Use a fallback array `["Loading SPARKWavv Experience..."]` if `global` is null.
3. **Dynamic Avatar**: Update the Skylar image `src` to use `global?.avatar.url`. Apply the scale multiplier from the database to the image using an inline style (`style={{ transform: \`scale(${global?.avatar.scale || 1})\` }}`).
4. **Clean Up**: Remove any old hardcoded configuration variables (e.g., `PERSONA_CONFIG`) from the file to ensure it relies purely on the Global State.

## Status
- [x] Plan Approved
- [x] Setup Complete
- [x] Build Complete
