# Track 096 - Remove SendGrid Dependency

## 1. Plan
**Goal:** Completely eliminate SendGrid from the application architecture to reduce external dependencies and simplify operations. All email distributions will be refactored into simulated console checkpoints.

**Assessment & Impact:**
After auditing the codebase, SendGrid (`@sendgrid/mail`) is deeply embedded within `server.ts` across 5 primary communication workflows:
1.  **Soft Coach Check-in** (`sendSoftCoachEmail`): Sent via the Sparkwavv cron checker when a user's momentum slows.
2.  **Global App Boot Configuration**: Validates the `SENDGRID_API_KEY` during Express startup.
3.  **RPP (Relational Power Partner) Invitations**: Sent to user contacts who accept mentorship roles.
4.  **Major Shift Alerts**: Sent to RPPs when Skylar detects a major career shift.
5.  **Admin / Partner Notifications**: Sent upon receiving a Partner Application or when a Partner proposes a new journey element.

Additionally, `src/config.ts`, `.env.example`, `package.json`, and `Application Environment Variables.md` carry SendGrid environment metadata (`SENDGRID_API_KEY` and `SKYLAR_FROM_EMAIL`).

**Execution Steps:**
1.  `package.json`: Remove `@sendgrid/mail` from dependencies and run `npm install`.
2.  `server.ts`:
    *   Remove `import sgMail from '@sendgrid/mail'`.
    *   Remove the SendGrid startup configuration block.
    *   Replace `sendSoftCoachEmail` execution with a pure `console.log('[SIMULATED EMAIL] Soft Coach')` print.
    *   Replace RPP Invitation email `sgMail.send()` blocks with `console.log('[SIMULATED EMAIL] RPP Invitation')` prints.
    *   Replace RPP alert emails and Partner application/suggestion emails with console simulations.
3.  `src/config.ts`: Strip `sendgridApiKey` and `skylarFromEmail` references.
4.  `.env.example` & `Application Environment Variables.md`: Purge the references to `SENDGRID_API_KEY` and `SKYLAR_FROM_EMAIL`.
5.  `cloudbuild.yaml`: Remove the secrets maps pertaining to Sendgrid.

## 2. Setup
*(Pending Plan Approval)*

## 3. Build
*(Pending Setup Completion)*
