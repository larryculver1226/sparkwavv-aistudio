# Track 007: Wavvault and Dashboard Design Analysis

**Status**: Planning
**Date**: 2026-04-04
**Objective**: Analyze the current design and implementation of the Wavvault database and User Dashboard to determine remaining changes/improvements needed to support the entire Sparkwavv Journey.

## 1. Current State Analysis

Based on the `firebase-blueprint.json` schema, the current architecture consists of several related entities:

### Wavvault Ecosystem
- **Wavvault (`/wavvault/{userId}`)**: Currently acts as a vector-searchable profile containing `identity`, `strengths`, `careerStories`, and an `embedding`. It is a flat structure representing the user's *current* synthesized state.
- **UserInsight (`/user_insights/{insightId}`)**: Stores atomic insights (pivots, core values, primary goals, strengths) with a status (`pending`, `confirmed`, `superseded`).
- **DistilledArtifact (`/wavvault_artifacts/{artifactId}`)**: Stores structured outputs from specific exercises (e.g., "spark", "pie-of-life", "perfect-day", "five-stories", "brand-pillar", "manifesto").
- **UserAsset (`/user_assets/{assetId}`)**: Stores high-fidelity generated assets like portraits and outreach sequences.
- **ValidationGateEvent (`/wavvault_events/{eventId}`)**: Tracks the user passing through different phases of the journey.

### Dashboard & Journey Ecosystem
- **Dashboard (`/dashboards/{userId}`)**: Tracks high-level metrics like `careerHappiness`, `discoveryProgress`, and `validationGateMode`.
- **Journey (`/journeys/{journeyId}`)**: Tracks progress through specific programs, with a `currentStep` and an array of `steps` (with statuses).
- **User (`/users/{uid}`)**: Contains a `journeyStage` enum ("Dive-In", "Ignition", "Discovery", "Branding", "Outreach", "NONE").

## 2. Assessment of Current Design

The current design is highly normalized and captures the necessary data points, but it lacks a cohesive aggregation layer that makes it easy to render a comprehensive "Journey Dashboard" or a unified "Wavvault View".

### Strengths
1. **Event-Sourced Insights**: `UserInsight` and `ValidationGateEvent` allow for a history of how the user's profile evolved over time.
2. **Separation of Concerns**: Raw files (`Artifact`), structured data (`DistilledArtifact`), and high-fidelity outputs (`UserAsset`) are kept separate.
3. **Vector Readiness**: The `Wavvault` entity is explicitly designed for embeddings, making AI synthesis easier.

### Weaknesses & Gaps
1. **Dashboard Progress Tracking is Fragmented**: Progress is split between `User.journeyStage`, `Dashboard.discoveryProgress`, and `Journey.steps`. The dashboard needs a unified way to query "Where is the user in the overall Sparkwavv Journey?"
2. **Wavvault Aggregation**: The `Wavvault` entity itself is just a summary. The actual "Vault" UI will need to query `DistilledArtifact`, `UserInsight`, and `UserAsset`. There is no clear grouping by journey phase in the schema.
3. **Missing Phase Linkage**: `DistilledArtifact` and `UserInsight` do not explicitly link to the `journeyStage` they were generated in. This makes it hard to build a UI that says "Here are your artifacts from the Discovery phase."
4. **Dashboard Activity Feed**: There is no dedicated entity for a user-facing activity feed. We would have to query `ValidationGateEvent`, `UserInsight`, and `DistilledArtifact` and merge them client-side, which is inefficient.

## 3. Proposed Design Changes & Improvements

To support the entire Sparkwavv Journey (Dive-In -> Ignition -> Discovery -> Branding -> Outreach), I propose the following changes:

### A. Schema Updates (firebase-blueprint.json & firestore.rules)

1. **Unify Journey Tracking in Dashboard**:
   - Update the `Dashboard` schema to include a comprehensive `journeyProgress` object that tracks completion percentage and status for *each* phase, rather than just `discoveryProgress`.
   - *Proposed Addition to Dashboard*:
     ```json
     "phaseProgress": {
       "type": "object",
       "properties": {
         "diveIn": { "type": "integer" },
         "ignition": { "type": "integer" },
         "discovery": { "type": "integer" },
         "branding": { "type": "integer" },
         "outreach": { "type": "integer" }
       }
     }
     ```

2. **Add Phase Metadata to Vault Items**:
   - Add a `journeyPhase` field to `DistilledArtifact`, `UserInsight`, and `UserAsset`. This will allow the Wavvault UI to easily filter and group items by the phase they belong to.

3. **Create an `ActivityFeed` Collection (Optional but Recommended)**:
   - Create a `/user_activities/{activityId}` collection that acts as a materialized view of important events (e.g., "Completed Pie of Life", "Unlocked Branding Phase", "Generated New Portrait"). This makes rendering the Dashboard's recent activity section much faster and simpler.

### B. UI/UX Dashboard & Wavvault Implementation

1. **The Sparkwavv Journey Map (Dashboard)**:
   - Build a visual "subway map" or stepped progress UI on the Dashboard that reads from `User.journeyStage` and `Dashboard.phaseProgress`.
   - Each node on the map should be clickable, taking the user to the specific exercises for that phase.

2. **The Unified Wavvault UI**:
   - The Wavvault should not just be a list of files. It should be categorized by:
     - **Raw Materials**: (From `Artifact` - uploaded resumes, transcripts)
     - **Distilled Truths**: (From `DistilledArtifact` and `UserInsight` - Pie of Life, Core Values)
     - **Brand Assets**: (From `UserAsset` - Portraits, Outreach sequences)
   - Implement filtering by `journeyPhase`.

3. **Validation Gate UI**:
   - The transition between phases (e.g., Discovery -> Branding) requires a "Validation Gate". The UI needs a dedicated component that reads the latest `ValidationGateEvent` to show the user if they are "passed", "warning", or "failed" before they can proceed.

## 4. Next Steps for Implementation

1. **Update Schema**: Modify `firebase-blueprint.json` and `firestore.rules` to include `journeyPhase` on artifacts/insights and `phaseProgress` on the Dashboard.
2. **Update Types**: Update frontend TypeScript interfaces to match the new schema.
3. **Build Journey Map Component**: Create the visual progress tracker for the Dashboard.
4. **Refactor Wavvault Component**: Update the Wavvault UI to fetch and categorize `DistilledArtifact`, `UserInsight`, and `UserAsset` based on the new schema.
