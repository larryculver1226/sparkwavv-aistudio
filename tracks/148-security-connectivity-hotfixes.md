# Track 148: Security & Connectivity Hotfixes

## Status: Completed
**Owner**: Skylar Engine
**Date**: 2026-05-08

## Results
- **Rate Limiter Warning**: Resolved by standardizing and normalizing the `keyGenerator` in `server.ts`. Suppression of IPv6 bypass warning confirmed.
- **Firestore Permission Denied**: Resolved by explicit rule promotion. Unauthenticated bootstrap data (`metadata`, `journeyPhaseConfigs`) is now explicitly handled at the top level of the security ruleset with absolute public read permissions.
- **Connectivity Mapping**: Enhanced `server.ts` initialization logs to specifically probe the `metadata/skylar_global` document rather than a generic test path.
- **Resilience**: Improved browser-side `configService.ts` to gracefully fallback to default JSON configurations when hit with "insufficient permissions" or other transient errors.
