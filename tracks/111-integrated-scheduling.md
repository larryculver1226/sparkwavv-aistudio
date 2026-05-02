# Track 111: Integrated Scheduling & Temporal Awareness (Calendar Skill)

## Overview
This architectural upgrade transitions Skylar from generating static textual schedules to actively interacting with the user's temporal boundaries and enforcing their "Energy Protocol". 

## Implementation Details
1. **Tool (`manageCalendar`)**:
   - Developed `manageCalendar` inside `genkitService.ts`.
   - Allows Skylar to autonomously `check_availability`, `schedule_event`, or `enforce_energy_protocol` (e.g., blocking out "Deep Work" time if the agent senses burnout or context switching).
2. **Calendar Integration Architecture**:
   - Skylar acts as a temporal guardian. By routing requests through this tool, Skylar can read available time slots and write specific blocks (networking, applying, simulated interviews).
   - *Note on OAuth*: Full Google Calendar integration requires users to grant specific calendar scopes (`https://www.googleapis.com/auth/calendar.events`). This tool is scaffolded to interface with those tokens when available, gracefully falling back to simulating the block in the user's localized database if live OAuth tokens are missing during preview.
3. **Prompt Augmentation**:
   - Modified `backend/prompts/skylarBase.prompt` to explicitly mention "Temporal Awareness: Use 'manageCalendar' to check availability and block out time for deep work..."

## UI Usage
When users state, "I need to do 3 hours of networking this week but I'm feeling burned out," Skylar will trigger `manageCalendar`, analyze their current load, and proactively respond: "I've blocked out two 90-minute Deep Work periods on Tuesday and Thursday to protect your energy protocol. I'll reserve Friday morning for networking."
