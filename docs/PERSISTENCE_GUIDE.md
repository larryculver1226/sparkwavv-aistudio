# Persistence Guide: State of the App

This document tracks the "Last Known Good State" of data structures and persistence logic to prevent agent amnesia across sessions.

## 1. Global UI State (Zustand)
- **Store**: `src/store/useStore.ts` (Planned)
- **Keys**:
    - `user`: Current auth profile.
    - `config`: Global Skylar config.
    - `stage`: Current journey stage metadata.
    - `isSidebarOpen`: UI toggle state.

## 2. Firestore Schema (Persistence)
*See `firebase-blueprint.json` for full JSON Schema.*

### Core Collections
- `users`: Profile and roles.
- `dashboards`: User progress metrics.
- `wavvault`: The "Brain" - vector searchable career data.
- `journey_stages`: Config for Skylar behavior.

### Interaction Collections (High Frequency)
- `user_activities`: Real-time feed events.
- `feedback_issues`: User-submitted bugs.

## 3. Security Checkpoint
- **Last Hardened**: 2026-05-17 (Track 171)
- **Invariant**: Every list query MUST be filtered by `userId` or `tenantId`.
- **Admin**: `larry.culver1226@gmail.com` is the root bootstrap admin.
