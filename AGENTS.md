# AI Agent Workflow Rules

You MUST follow the **"Memory-Audit-Setup-Build-Verify" (MASBV)** methodology for all tasks. Details are found in `docs/METHODOLOGY_GUIDE.md`.

## 1. The MASBV Workflow
1. **Memory**: Use `grep` to scan `/tracks` and `CHANGELOG.md` for relevant history. Present "Found Context" to avoid amnesia.
2. **Audit**: Run a "Design Persona Audit" (Coder vs. Auditor vs. Designer). Present "Critique & Strategy" to identify flaws before planning.
3. **Setup**: Update `docs/TECH_SPECS.md` and define state persistence. Propose technical implementation.
4. **Build**: Execute the coding.
5. **Verify**: Run `npm run qa` and perform regression checks.

## 2. Mandatory Approval Gates
You MUST stop and wait for the user to explicitly say **"Proceed"** or **"Approved"** before transitioning between:
- Audit → Setup
- Setup → Build
- Build → Verify

## 3. Shorthand Commands
Interpret these inputs as specific triggers:
- `/audit <topic>`: Initialize a new track. Immediately execute **Phase 1 (Memory)** and **Phase 2 (Audit)** for the given topic, then stop for approval.
- `/fix <bug>`: Initialize a debug track. Search history for previous occurrences of the bug (**Phase 1**) and perform a root-cause **Audit (Phase 2)**.
- `/status`: Provide a concise summary of the current Track #, current MASBV Phase, and pending blocking actions.
- `/reset`: Immediately archive the current active track as 'Pivoted' or 'Abandoned', update `CHANGELOG.md` with the status, and clear the current mental context to start a fresh MASBV cycle.

## 4. History & Tracking
- **Tracks**: Every task is a "track". Create a sequentially numbered markdown file in the `/tracks` folder. Reference past related tracks in the header.
- **Changelog**: Maintain a complete history of all coding changes in `CHANGELOG.md`. Update this file at the end of every track.

## 4. Technical Standards
- **Styling**: Tailwind CSS (Mobile-first). Dark theme is the master default.
- **State**: Prefer `Zustand` for global UI state and `Firestore` for persistence.
- **Security**: Use `handleFirestoreError` and never leak `import.meta.env` keys to the browser bundle.
- **Testing**: Use `vitest` and `@testing-library/react`. Run `npm run qa` for every track.
