# Track 166: Chatbot Connection (Guest Access)

## Overview
This track focuses on allowing unauthenticated users to interact with Skylar in a limited "Discovery" mode. The goal is to provide a "teaser" experience that demonstrates Skylar's value and guides the user toward the "Dive-In Journey" and account creation.

## Objectives
- [ ] Implement message budgeting for guest users (e.g., 5-10 messages).
- [ ] Create a "Guest Persona" for Skylar with specific constraints (prospect-focused).
- [ ] Update `SkylarInteractionPanel` to handle the guest state and budget visualization.
- [ ] Implement the transition from Guest Chat to Account Creation (Dive-In).
- [ ] Enforce usage limits on the backend to prevent cost overrun.

## Technical Details

### 1. Guest Session Tracking
- Use `localStorage` to track `guest_message_count` and `guest_session_id`.
- Backend rate-limiting already exists but will be supplemented with a message count check per session.

### 2. UI/UX
- **Guest Indicator**: A subtle badge or banner showing "Guest Mode".
- **Usage Counter**: "X of Y messages remaining".
- **Locked State**: When the budget is reached, disable input and show a primary CTA for "Dive-In and Create Account".

### 3. Skylar Persona
- Instruct Skylar to be welcoming but to prioritize guiding the user towards the platform's core benefits and the onboarding process.

## Progress
- [x] Initial research and plan development.
- [ ] User approval of implementation plan.
- [ ] Backend updates for guest budget enforcement.
- [ ] Frontend UI updates.
- [ ] Final testing and QA.
