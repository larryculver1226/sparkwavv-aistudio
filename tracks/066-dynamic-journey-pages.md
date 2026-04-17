# Track 066: Dynamic Journey Page Contents

## 1. Objective
Migrate the hard-coded React component layouts for Journey Phases (Dive-In, Ignition, Discovery, Branding, Outreach) to a dynamic, configuration-driven approach. This will allow administrators to update the "page" contents (widgets, layout, and data sources) without any coding changes via the Admin Dashboard.

## 2. Current State Analysis
Currently, the Journey phase pages are hard-coded in `src/components/dashboard/PhaseViews.tsx`. 
For example, the `IgnitionView` explicitly renders:
- `ActionCenter`
- `NeuralSynthesisEngine`
- `ActivityFeed`
- A hard-coded "My Strengths Profile (Gallup)" widget.

The `DiscoveryView` explicitly renders:
- `ActionCenter`
- `NeuralSynthesisEngine`
- `ActivityFeed`
- `SectorIntelligence` (conditionally)
- A hard-coded "Job Matches Preview" widget.

All of these are wrapped in `SkylarStageWrapper`, which handles the layout (e.g., `sidebar` or `split`) and the Skylar chat interface.

**Limitations:**
- Adding a new widget to a phase requires a code deployment.
- Changing the order of widgets requires a code deployment.
- The Admin Dashboard can currently only update Skylar's prompt, required artifacts, and basic layout (e.g., split vs sidebar), but not the actual React components rendered on the page.

## 3. Proposed Approach/Solution

To achieve true "no-code" page content management, we need to implement a **Widget-Based Dynamic Rendering Engine**.

### Step 3.1: Extend the Configuration Schema
We will extend the `JourneyStageDefinition` (in `src/types/skylar.ts`) to include a `widgets` array within `uiConfig`.

```typescript
export type WidgetType = 
  | 'ActionCenter' 
  | 'NeuralSynthesisEngine' 
  | 'ActivityFeed' 
  | 'SectorIntelligence' 
  | 'WavvaultHighlights' 
  | 'StrengthsProfile' 
  | 'JobMatchesPreview'
  | 'CustomMarkdown'; // For generic text/instructions

export interface StageWidgetConfig {
  id: string;
  type: WidgetType;
  position: 'main' | 'sidebar' | 'header';
  order: number;
  props?: Record<string, any>; // Custom configuration for the widget (e.g., title, limitCount)
}

// In JourneyStageDefinition:
// uiConfig: { ... existing props ..., widgets: StageWidgetConfig[] }
```

### Step 3.2: Create a Dynamic Phase Renderer
We will replace the hard-coded views (`IgnitionView`, `DiscoveryView`, etc.) in `PhaseViews.tsx` with a single, dynamic component: `DynamicPhaseView`.

This component will:
1. Receive the `stageConfig` (fetched from Firestore via `useJourneyStage`).
2. Read the `uiConfig.widgets` array.
3. Map each `WidgetType` to its corresponding React component using a Component Registry.
4. Render the widgets in the correct layout zones (`main`, `sidebar`, `header`) based on their `position` and `order`.

### Step 3.3: Update the Admin Dashboard
We will enhance the `AgentOps.tsx` Admin Dashboard to include a "Page Builder" section for each stage.
- Admins will see a list of available widgets.
- They can add, remove, and reorder widgets for the selected stage.
- They can configure widget-specific properties (e.g., changing the title of the "Strengths Profile" widget).

### Step 3.4: Genkit Integration (Optional but Powerful)
Since the user mentioned Genkit, we can use Genkit to dynamically generate the *content* or *configuration* of these widgets.
- **Dynamic Content:** A widget could be a `GenkitArtifactWidget` that calls a Genkit flow to generate its content on the fly (e.g., a personalized daily summary).
- **Dynamic Layout Generation:** We could create an admin tool where an admin types "Add a sector intelligence widget and a job matches widget to the Discovery phase", and a Genkit flow automatically updates the Firestore JSON configuration.

## 4. Implementation Steps (Build Phase)
1. **Types:** Update `src/types/skylar.ts` and `src/types/skylar-config.ts` with the new `StageWidgetConfig` schema.
2. **Registry:** Create a `WidgetRegistry.tsx` that maps string names (e.g., `'ActivityFeed'`) to the actual React components.
3. **Renderer:** Build `DynamicPhaseView.tsx` to parse the config and render the registered components.
4. **Refactor:** Replace the hard-coded views in `PhaseViews.tsx` and `Journey.tsx` with `DynamicPhaseView`.
5. **Admin UI:** Update `AgentOps.tsx` to allow editing the `widgets` array (adding/removing/reordering).
6. **Seed Data:** Update `defaultStageContent.ts` to include the default widget layouts for Dive-In, Ignition, etc., so the app looks exactly as it does now, but driven by data.

## 5. Review Request
Please review this proposed approach. Let me know if you approve of the Widget-Based Dynamic Rendering Engine, or if you have specific Genkit-driven content generation features you'd like to prioritize in this track.
