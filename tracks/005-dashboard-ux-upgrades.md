# Track 005: User Dashboard UX & Architecture Upgrades

**Status**: Planning
**Date**: 2026-04-04
**Objective**: Assess and upgrade the User Dashboard UX to better align with the Sparkwavv career journey (Dive-In -> Ignition -> Discovery -> Branding -> Outreach), focusing on contextual metrics, actionable gaps, and code maintainability.

## 1. Assessment of Current State
**The Good:**
- The dashboard is incredibly feature-rich, integrating AI (Skylar), real-time data, and complex components (Neural Synthesis, Sector Intelligence).
- The `JourneyTimeline` visually represents the 5 stages well.
- The concept of "Validation Gates" between phases is excellent for gamifying and structuring the career journey.

**The Challenges (UX & Technical):**
- **Monolithic Architecture:** `UserDashboard.tsx` is over 1,800 lines long. It handles layout, state, data fetching, and renders multiple complex inline components. This makes it hard to maintain and scale.
- **Phase Contextualization:** Currently, the `activePhaseView` state only toggles between `'ignition'` and `'discovery'`. The dashboard doesn't fully adapt its layout and metrics for all 5 distinct phases.
- **Information Overload:** Users see a lot of metrics (Happiness Meter, Alignment Matrix, Job Matches) all at once. Metrics and actions should be progressively disclosed based on the user's current phase.
- **Actionability:** While there are "Required Actions" and "Milestones", the immediate "Next Steps" to bridge the gap to the next phase aren't the central focus of the UX.

## 2. Proposed UX Upgrades

### A. Phase-Specific Dashboard Views (Progressive Disclosure)
Instead of one massive view, the dashboard content should dynamically swap based on the user's current timeline stage.
- **Phase 1: Dive-In (Weeks 1-2):** Focus on baseline assessments, initial Skylar chats, and gathering raw DNA data. Hide job matches and outreach tools.
- **Phase 2: Ignition (Weeks 3-4):** Focus on the "Alignment Matrix" (Identity, Strengths, Market). Show the Synthesis Narrative.
- **Phase 3: Discovery (Weeks 5-6):** Unlock Sector Intelligence and Job Matches. Focus on market exploration metrics.
- **Phase 4: Branding (Weeks 7-9):** Unlock the High-Fidelity Synthesis Lab (Resume/Portfolio building). Focus on narrative strength metrics.
- **Phase 5: Outreach (Weeks 10-12):** Unlock the Outreach Forge. Focus on application tracking, interview prep, and network engagement metrics.

### B. The "Action Center" (Bridging the Gaps)
Create a prominent, sticky section on the dashboard called the "Action Center".
- Clearly lists the *exact* activities required to unlock the next Validation Gate.
- Highlights "Gaps" (e.g., "Your Market Resonance is low. Complete the Sector Analysis module to boost it.").

### C. Persistent "Career DNA" Sidebar
Move the core metrics (Happiness Meter, Alignment Matrix) into a collapsible right-hand or left-hand sidebar that persists across all phases, acting as the user's evolving "Character Sheet".

## 3. Technical Plan (Refactoring)
1. **Component Extraction:** Move `JourneyTimeline`, `GaugeChart`, `MiniGauge`, and `MentorNote` into separate files in `src/components/dashboard/`.
2. **View Routing/Swapping:** Create dedicated view components (`DiveInView.tsx`, `IgnitionView.tsx`, `DiscoveryView.tsx`, `BrandingView.tsx`, `OutreachView.tsx`).
3. **Dashboard Layout:** Refactor `UserDashboard.tsx` to act purely as a layout wrapper and state provider that renders the correct View component based on the `timelineStage`.

## 4. Progress
- [x] Track Initialized & Assessment Complete
- [ ] Component Extraction (Timeline, Gauges)
- [ ] Create Phase-Specific View Components
- [ ] Refactor UserDashboard Layout
- [ ] Implement Action Center UX
- [ ] Verification complete
