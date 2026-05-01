# Track 106: Discovery Bento Design and Algorithms

## Overview
This track identifies the design used for the "Discovery Bento" on the user dashboard and uncovers the algorithms behind Primary Resonance, Market Velocity, Head of Innovation, DNA Gap Analysis, and Local Intelligence.

## Discovery Bento Design
The "Discovery Bento" is rendered within `UserDashboard.tsx` when `activePhaseView === 'discovery'`. It utilizes a responsive CSS Grid architecture (`grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6`). It acts as a dashboard composed of several interconnected widgets tracking market signals, historical trends, and targeted opportunities:
- **Primary Resonance**: A large 2x2 widget displaying top DNA matches to job roles.
- **Market Velocity**: A medium 1x2 widget tracking industry momentum and demand.
- **DNA Gap Analysis**: A medium 2x2 widget tracking capability gaps versus market needs.
- **Local Intelligence**: A 1x2 widget pinpointing nearby real-world networking events.
- **Resonance History**: A full-width widget showing historical tracking of resonance scores over time.

### Current Implementation & necessary changes
Currently, `DiscoveryBento.tsx` and `marketSignalService` are fully integrated with GenKit via a backend REST API.

**Completed changes**:
1. **Firestore Integration**: Created a `/api/user/discovery-bento` endpoint in `server.ts` that safely retrieves the user's `users` record and `wavvaults` record.
2. **Dynamic Generation**: Removed the hardcoded mock arrays from the `marketSignalService`. The backend endpoint uses Genkit's `ai.generate` with `googleai/gemini-2.5-flash` to evaluate the user's WavVault constraints and profile status, outputting a highly structured `BentoDataSchema` for `signals`, `gaps`, and `history`.
3. **Prop Drilling**: The `VelocityWidget` was updated to accept `history` array from the parent `DiscoveryBento`. The widget now calculates the macro momentum (+/- % differential) dynamically by computing the distance between the two most recent data points for top surfacing industries.

## Algorithms

### Primary Resonance
**Algorithm / Implementation**: Currently orchestrated via `marketSignalService.fetchSignals()`. It acts as the "Signal Ingestor" correlating external job roles to the user's predefined "Spark" and DNA. It attributes a `resonanceScore` (e.g., 94) derived from a weighted sub-alignment consisting of `values`, `capabilities` and `trajectory` metrics.

### Market Velocity
**Algorithm / Implementation**: Captured in the `VelocityWidget.tsx`. It statically visualizes macro industry momentum, quantifying the acceleration of global demand. For instance, it highlights that **AI Strategy** has a "+24% global demand" velocity, alerting the user to surges indicating an optimal time to pivot or engage.

### Head of Innovation
**Algorithm / Implementation**: "Head of Innovation" is a specific high-fidelity role surfaced inside the Primary Resonance signal array (`sig-2`). It identifies a tier of roles matching the user's Systems Thinking and Leadership attributes. It projects a `$200k+` salary, 88% aggregate resonance, and evaluates whether the user's current trajectory can sustain the leap.

### DNA Gap Analysis
**Algorithm / Implementation**: Handled by `GapAnalysisWidget.tsx` and `marketSignalService.getDNAGaps()`. It identifies missing capabilities by comparing a user's `currentLevel` (e.g., 65%) to a role's required `targetLevel` (90%). It ranks the importance (`critical`, `high`, `medium`) and algorithmically defines a curated "Learning Path" (e.g., specific courses to bridge the gap).

### Local Intelligence
**Algorithm / Implementation**: Operating inside `LocalIntelligenceWidget.tsx`, this is the only currently connected live intelligence tool. 
- It accesses the browser's `navigator.geolocation` API to capture precise coordinates (`latitude`, `longitude`). 
- It queries the `gemini-2.5-flash` model, injecting Google Search/Maps grounding (`googleMaps: {}` tool config) alongside a dynamic radius. 
- It actively isolates live networking events, industry meetups, and conferences (parsing Grounding Metadata Chunks while stripping out static corporate HQ addresses), sorting and presenting actionable in-person engagements directly localized to the user.

## Bug Fixes
- **onAuthStateChanged Timeout**: Modified `src/main.tsx`'s Authentication load checking to store the fallback `setTimeout` reference as `timeoutId` and explicitly clearing the timeout when the auth resolves (either true or false). This prevents the "onAuthStateChanged timed out after 5s" log if it successfully resolves within the timeframe.
- **Genkit Parameter Parsing Issue**: In tools containing arbitrary arrays of objects (like `generateNarrativeStoriesTool`), the `z.array(z.any())` declaration was translating to a schema without an `items` field in `ai.generate`, which crashed Gemini 2.5 Flash with `[400 Bad Request] * ... missing field`. Stripped the array wrapper and mapped the schema to just `z.any()` directly, relying on the schema `.describe()` context to convey it as a list to the tool output logic.