# Track 069: Initialization of User Journey Phase from Wavvault

## Objective
When an authenticated user logs in and navigates to their current Journey Phase (e.g., Ignition), their Wavvault Phase metadata should be loaded, checked against the current Stage Gate requirements, and rendered dynamically into a dashboard banner. Skylar must automatically greet the user proactively offering to help with any missing artifacts.

## Architecture
1. **PhaseGateBanner Component**: Embedded inside `src/components/dashboard/DynamicPhaseView.tsx`. Reads the `currentStageId` and `wavvaultData`, comparing completed artifacts with `stageConfig.requiredArtifacts`. Renders a checklist of required artifacts.
2. **Missing Artifacts Prop**: `missingArtifacts` array is aggregated in `DynamicPhaseView` and passed implicitly down through `SkylarStageWrapper` to `SkylarInteractionPanel`.
3. **[SYSTEM_INIT] Trigger**: In `SkylarInteractionPanel.tsx`'s `useEffect`, if initial messages are empty, we call Genkit silently with `[SYSTEM_INIT]` passing the `missingArtifacts`.
4. **Genkit Context Hydration (`genkitService.ts`)**: We intercept `[SYSTEM_INIT]` inside the `userContent` array. If triggered, we synthesize a hidden system event reading: *"System Event: The user has just logged in... They are missing the following required artifacts... Greet them proactively..."*. Genkit reads this event and automatically generates Skylar's first conversational output without the user typing anything.

## Files Modified
- `src/components/dashboard/PhaseGateBanner.tsx` [NEW]
- `src/components/dashboard/DynamicPhaseView.tsx`
- `src/components/skylar/SkylarStageWrapper.tsx`
- `src/components/skylar/SkylarInteractionPanel.tsx`
- `src/services/skylarService.ts`
- `src/services/genkitService.ts`

## Status
Completed
