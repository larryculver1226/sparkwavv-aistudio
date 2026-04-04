# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
### Added
- Automated tooling setup (Vitest, Playwright, Prettier, Gemini CLI).
- AGENTS.md to enforce "Plan, Setup, Build" workflow.
- TECH_SPECS.md for technical documentation.
- Standardized track templates in `/tracks`.
- `npm run qa`, `npm run format`, `npm run test`, and `npm run generate` scripts.

### Fixed
- Fixed `NavBar.test.tsx` to correctly assert the `navigate('/login')` call instead of the `onNavigate` prop.
- Fixed `UserDashboard.test.tsx` to correctly map the `getTimelineStage` utility tests to the actual implementation logic.
