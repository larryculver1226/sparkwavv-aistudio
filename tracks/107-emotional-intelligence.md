# Track 107: Emotional Intelligence Link to WavVault

## Overview
This track addresses how the Emotional Intelligence, Sentiment, and Motivation Analysis design in the User Dashboard connects to a specific user's WavVault and Journey Phase. The previous implementation solely relied on chat history. We've enhanced it to tap into the actual strengths, constraints, and current stage of the specific user.

## Design

### Architecture & Fetch Strategy
- **Trigger**: When the user clicks the "Emotional Intelligence" button in the `UserDashboard`, it calls `skylar.getEmotionalIntelligence(userId, history)`.
- **API Intermediary**: The UI makes an authenticated request to `/api/skylar/emotional-intelligence`, explicitly passing the `userId`.
- **Genkit Flow Modification**: In `backend/services/genkitService.ts`, the `getEmotionalIntelligenceFlow` has been expanded. It now receives `userId` and directly fetches the authoritative state from Firestore (`wavvaults/{userId}` and `users/{userId}`).
- **Contextual Injection**: The prompt sent to `gemini-2.5-flash` is now securely populated with:
  - User's `timelineStage` (e.g., "Narrative Synthesis", "Role Alignment", etc.)
  - User's `WavVault` context containing defined strengths, skills, career DNA, sparks, and parameters (Extinguishers, effort tiers).
  - The previous slice of `history` to capture immediate tonal state.

### Results
Because we pass the explicit `WavVault` and "Journey Phase", the analysis is no longer generic to the session's chat. It specifically answers how motivated or what anxieties the user feels *in relation to their established goals and constraints*. For instance, if a user's WavVault has an "Executive Function burnout" extinguisher, the AI factors this specific trait when rating their motivation and extracting their anxieties from the recent dialogue.
