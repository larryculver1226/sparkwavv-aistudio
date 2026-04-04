# AI Agent Workflow Rules

You MUST follow the "Plan, Setup, Build" methodology for all tasks.

## 1. Plan, Setup, Build Workflow
1. **Plan**: Iteratively develop a step-by-step plan and prompt the user for review and approval prior to any coding. Prompt for clarifying questions until the user approves the implementation plan.
2. **Setup**: Ensure the environment setup is complete before coding. Update `docs/TECH_SPECS.md` with complete technical specifications (environment, API, endpoints, etc.) and propose implementation, asking questions prior to proceeding.
3. **Build**: Execute the plan.

## 2. Approval Gate
- You MUST wait for the user to explicitly say "Proceed" or "Approved" before executing the Build phase.

## 3. History & Tracking
- **Tracks**: Every Plan/Setup/Build task is a "track". Create a sequentially numbered markdown file in the `/tracks` folder (e.g., `/tracks/004-feature-name.md`) following the template in `/tracks/002-home-page-redesign.md`.
- **Changelog**: Maintain a complete history of all coding changes in `CHANGELOG.md` in the root directory. Update this file at the end of every track.

## 4. Testing & QA
- **Unit/Component Testing**: Use `vitest` and `@testing-library/react`. Always write tests for new utility functions or components.
- **E2E Testing**: Use `@playwright/test`.
- **QA**: Before completing a task, run `npm run qa` (which runs `eslint` and `prettier --check`) to ensure linting and formatting pass.
- **Code Generation**: Use `@google/gemini-cli` via `npm run generate` when boilerplate generation is needed.
