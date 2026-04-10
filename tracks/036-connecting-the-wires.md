# Track 036: Connecting the Wires

## Objective
Create `src/utils/interpolation.ts` to replace `{{variable}}` tags in system prompts with real user/session data. Update `skylarGraph.ts` to call this function to sanitize the System Prompt before starting a chat session.

## Plan
1. **Create Utility**: Create `src/utils/interpolation.ts` with the provided `interpolatePrompt` function and `InterpolationData` interface.
2. **Update Graph**: Update `src/services/skylarGraph.ts` to import `interpolatePrompt`.
3. **Sanitize Prompt**: Modify the `agentNode` in `skylarGraph.ts` to use `interpolatePrompt` on the `stageConfig.systemPromptTemplate` before passing it to the LLM.
4. **Update Service**: Update `src/services/skylarService.ts` to accept `SkylarStageConfig` in `chatWithVertex`.

## Status
- [x] Plan Approved
- [x] Setup Complete
- [x] Build Complete
