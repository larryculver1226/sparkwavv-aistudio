# React Clean Architecture Skill

This module defines the clean architecture patterns for React within this project.

## Core Principles
1. **Separation of Concerns:** Keep UI, business logic, and data access separate.
2. **Services Layer:** All Firebase/API logic should reside in `src/services/`.
3. **Custom Hooks:** Use hooks to bridge services and components.
4. **Presentational vs. Container:** Components should focus on UI, while containers handle state and logic.

## Directory Structure
- `src/components/`: UI-only components (Stateless, Presentational).
- `src/containers/`: Logic-heavy components (Stateful, Data-fetching).
- `src/services/`: Firebase/API interaction (The "Data" layer).
- `src/hooks/`: Custom React hooks (The "Controller" layer).
- `src/types/`: TypeScript definitions.

## Implementation Patterns

### 1. The Service Pattern (Data Access)
Keep Firestore logic out of components. Use a service class or set of functions.

```typescript
// src/services/userService.ts
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const userService = {
  async getUserProfile(uid: string) {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  },
  // ... other methods
};
```

### 2. The Hook Pattern (State Management)
Use custom hooks to manage real-time subscriptions and loading states.

```typescript
// src/hooks/useUserProfile.ts
import { useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useUserProfile(uid: string | undefined) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = onSnapshot(doc(db, 'users', uid), (doc) => {
      setProfile(doc.data());
      setLoading(false);
    });
    return unsubscribe;
  }, [uid]);

  return { profile, loading };
}
```

### 3. The Container Pattern (Logic Separation)
Containers handle the "how" (data fetching), Components handle the "what" (UI).

```tsx
// src/containers/ProfileContainer.tsx
import { useUserProfile } from '../hooks/useUserProfile';
import { ProfileView } from '../components/ProfileView';

export function ProfileContainer({ uid }: { uid: string }) {
  const { profile, loading } = useUserProfile(uid);
  if (loading) return <Spinner />;
  return <ProfileView profile={profile} />;
}
```
