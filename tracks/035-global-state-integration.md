# Track 035: Phase 2 - Global State Integration

## Objective
Implement the `SkylarConfigContext` to manage the global configuration state, fetching the `skylar_global` document on mount and setting up a real-time listener for instant updates. Also, fetch the metadata for the user's current journey stage and expose a `useSkylarConfig` hook.

## Plan
1. **Implement Context Provider**: Create `src/contexts/SkylarConfigContext.tsx` to manage the global configuration state.
2. **Real-time Listener**: Use `configService.ts` to fetch and subscribe to the `skylar_global` document using `onSnapshot`.
3. **Journey Stage Metadata**: Fetch the metadata for the user's current journey stage (defaulting to 'dive-in') from the `journey_stages` collection.
4. **Wrap the Application**: Update `src/App.tsx` to wrap the entire component tree (specifically the `Routes`) with the `SkylarConfigProvider`.
5. **Create Custom Hook**: Export a `useSkylarConfig()` hook from the context.
6. **Graceful Loading**: Handle the `isLoading` state to prevent components from rendering with null config values on the first load.

## Status
- [x] Plan Approved
- [x] Setup Complete
- [x] Build Complete
