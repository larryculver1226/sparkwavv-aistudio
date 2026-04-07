# Technical Specifications

## Environment
- **Runtime**: Node.js v20.x
- **Framework**: React 18+ with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS

## Architecture
- Client-side SPA (Single Page Application) by default.
- Firebase for backend services (Auth, Firestore) if configured.

## APIs & Endpoints
- **Firestore Collections**:
  - `user_activities`: Stores user activity events.
  - `dashboards`: Stores user dashboard state, including `phaseProgress`.
  - `wavvault_artifacts`: Stores distilled artifacts.

## Data Models
- `Dashboard.phaseProgress`: Object containing percentage completion (0-100) for `diveIn`, `ignition`, `discovery`, `branding`, `outreach`.
- `UserActivity`: Includes `tags` array and `relatedEntityId` for linking to artifacts/milestones.
- `UserProfile` (or equivalent user data):
  - `ignitionExercises`: Object containing:
    - `pieOfLife`: `{ career: number, family: number, health: number, personalGrowth: number, community: number }`
    - `perfectDay`: `{ morning: string, afternoon: string, evening: string }`
  - `careerDnaHypothesis`: Array of strings representing core attributes.

## Track 009: User Dashboard Improvements
- **Dynamic Progress Calculation**:
  - Implement `calculatePhaseProgress(dashboardData, artifacts)` in a new `progressService.ts`.
  - Trigger progress recalculation when:
    - A milestone is toggled (`UserDashboard.tsx`).
    - An artifact is created (`wavvaultService.ts`).
  - Update `Dashboard.phaseProgress` in Firestore.
- **Interactive Activity Feed**:
  - Add `onClick` handler to `ActivityFeed` items.
  - Fetch artifact details via `relatedEntityId` when an `artifact_created` event is clicked.
  - Display artifact details in a modal (`ArtifactModal.tsx`).
- **Dedicated History View**:
  - Add `/history` route or a "History" tab in `UserDashboard.tsx`.
  - Create `HistoryView.tsx` component.
  - Implement filtering by `journeyPhase`, `type`, and `tags`.
