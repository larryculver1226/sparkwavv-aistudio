# Track 039: Phase 4 - Admin Dashboard - Stage Management (Step 2)

## Objective
Complete the `AgentOps` component by adding the Stage Management Section right below the Global Settings.

## Plan
1. **Update `configService.ts`**: Add `updateStageConfig` method to save stage configurations to Firestore.
2. **Update `AgentOps.tsx`**:
   - Add state for `stages`, `selectedStageId`, `editStage`, and `isStageSaving`.
   - Fetch stages on mount using `configService.getJourneyStages()`.
   - Create a Stage Selector dropdown.
   - Add Stage Editor Fields for `stageTitle`, `description`, `systemPromptTemplate`, and `requiredArtifacts`.
   - Add Modality Toggles for `text`, `audio`, `image`, and `video`.
   - Implement `handleStageSave` to save changes via `configService.updateStageConfig`.
   - Ensure styling matches the dark, cyber-aesthetic (slate/cyan) used in the Global Settings section.

## Status
- [x] Plan Approved
- [x] Setup Complete
- [x] Build Complete
