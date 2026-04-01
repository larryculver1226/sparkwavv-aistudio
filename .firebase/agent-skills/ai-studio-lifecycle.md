# AI Studio Lifecycle Skill

This module defines the dev/test/publish/GitHub patterns for compatibility with AI Studio.

## Development
- Use `npm run dev` to start the local server.
- Use `.env.example` for environment variable templates.
- **NEVER** commit actual secrets to `.env`.
- Use `import.meta.env.VITE_*` for client-side variables.

## Testing with Jest
- Use **Jest** for React component and logic testing.
- Mock Firebase services to ensure tests are fast and reliable.
- Run `npm test` to execute the test suite.

```typescript
// Example: src/services/userService.test.ts
import { userService } from './userService';
import { getDoc } from 'firebase/firestore';

jest.mock('firebase/firestore');

describe('userService', () => {
  it('should fetch user profile', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({ name: 'John Doe' })
    });
    const profile = await userService.getUserProfile('123');
    expect(profile.name).toBe('John Doe');
  });
});
```

## Publishing to Cloud Run
- Region: `us-central1` (to minimize latency with AI Studio).
- Port: `3000` (mandatory for AI Studio preview).
- Ensure `firebase-applet-config.json` is included in the build.
- Use the **Shared App URL** for external access.

## GitHub Integration
- Export code to GitHub via the settings menu.
- Maintain environment variable security by using the AI Studio secrets manager.
- Keep agent skills local to the container for now.
- Use `.gitignore` to exclude `node_modules`, `dist`, and `.env`.
