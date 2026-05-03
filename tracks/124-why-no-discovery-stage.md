# Track: Why No Discovery Stage in Firestore

## 1. Plan

### The Cause
The `discovery` custom configuration document does not automatically appear in the Firestore `journeyPhaseConfigs` collection because of how the seeding logic was implemented.
In `src/services/configService.ts` (`getJourneyStages`) and `src/services/agentOpsService.ts` (`getAllConfigs`), the automatic seeding mechanism uses the condition `if (snapshot.empty)`. 
This means it will only seed default documents from `defaultJourneyStages.json` if the complete collection is empty. Since earlier stages like `dive-in` and `ignition` have already been pushed to the database in prior visits, the collection is not empty. Therefore, any newly added stages (like `discovery`) are bypassed and not written to the database automatically.

Even though `getJourneyStage("discovery")` successfully falls back to using the JSON in-memory and keeps the app functioning via a fallback, it only reads from the JSON and does not write the document back to Firestore.

### The Fix
There are two parts to resolving this properly to ensure continuous scaling and robustness:
1. **Immediate Resolution (Admin Action):** Admins can open the **Agent Ops** panel (`/admin/agent-ops`), navigate to **Phase Management**, and click the **"Seed Defaults"** button. This will force an upload of all JSON defaults to Firestore, safely writing the `discovery` stage.
2. **Programmatic Resolution (Code Change):** We need to update `configService.getJourneyStages()` so that instead of treating the Firestore snapshot as the *only* source of truth when not empty, it eagerly merges `defaultJourneyStages.json` base configuration with any Firestore document overrides. This guarantees newly hardcoded stages automatically appear across the application UI without requiring a manual database seed.

## 2. Setup
- Modify `src/services/configService.ts` to ensure memory cache dynamically stitches missing definitions against Firestore snapshots.
- (Optional) Modify `agentOpsService.ts` to implement identical fallback merging.

## 3. Build
- Pending user approval to implement the programmatic modification outlined in this track.
