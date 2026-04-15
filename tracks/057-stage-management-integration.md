# Track 057: Stage Management Integration

## 1. Plan
- Integrate Skylar's interaction capabilities across all journey stages (Dive-In, Ignition, Discovery, Branding, Outreach).
- Create a reusable `SkylarStageWrapper` to handle dynamic configuration fetching and layout.
- Refactor `DiveInPage.tsx` to use the wrapper and support resume-based context.
- Refactor `PhaseViews.tsx` to integrate Skylar as a sidebar in all dashboard stages.
- Update `JOURNEY_STAGES` with robust default content and system prompts.
- Enhance `AgentOps.tsx` (Admin Panel) with guidance for updating system prompts and other stage items.

## 2. Setup
- Ensure `JourneyStageDefinition` and `SkylarStageConfig` types are aligned.
- Consolidate Firestore collections to `agent_configs` for all stage management.
- Verify `agentOpsService` and `configService` are using the correct collection.

## 3. Build
- [x] Created `src/components/skylar/SkylarStageWrapper.tsx`.
- [x] Created `src/config/defaultStageContent.ts` with guidance and defaults.
- [x] Refactored `src/pages/DiveInPage.tsx` to use the wrapper.
- [x] Refactored `src/components/dashboard/PhaseViews.tsx` to integrate Skylar into all dashboard phases.
- [x] Updated `src/config/journeyStages.ts` with comprehensive default content.
- [x] Updated `src/services/configService.ts` to use `agent_configs` collection.
- [x] Updated `src/types/skylar-config.ts` and `src/types/skylar.ts` for consistency.
- [x] Enhanced `src/pages/admin/AgentOps.tsx` with guidance sidebars and improved UI.
- [x] Verified with `npm run lint`.
