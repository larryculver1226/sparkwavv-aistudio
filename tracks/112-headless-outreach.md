# Track 112: Headless Outreach Execution

## Overview
This feature introduces actionable agency during the Outreach Phase, enabling Skylar not just to draft communications but to autonomously queue or send these messages via integrated APIs (like Gmail or SendGrid).

## Implementation Details
1. **Tool (`executeOutreach`)**:
   - Developed `executeOutreachTool` inside `genkitService.ts`.
   - Allows Skylar to process drafted emails to recruiters or networking connections.
2. **Approval Flow Architecture**:
   - Skylar parses the recipient's details, the subject, and the body.
   - The tool supports an explicit `requireApproval` flag. When set to true, Skylar saves the outreach action into the `outreach_actions` collection with a `pending_approval` status, allowing the user to review and click "Approve" from their UI dashboard. Once approved, or if the flag is false, the payload is "sent" (simulated or wired up to real SMTP providers).
3. **Prompt Augmentation**:
   - Appended specific capabilities to `skylarBase.prompt` ensuring Skylar is aware of its outreach abilities: "Outreach Execution: Use 'executeOutreach' to queue or send drafted emails to recruiters on behalf of the user."

## UI Usage
When users state, "Draft a follow-up to the recruiter at Google and just send it if it sounds good," Skylar leverages the `executeOutreach` tool. Normally, it tees it up as `pending_approval` and tells the user: "I've drafted the message and queued it for your final sign-off." After user approval (or if explicitly told to bypass), Skylar transitions the email pipeline state to `sent`.
