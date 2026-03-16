import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types/user';

export type AuthStatus = 'initializing' | 'unauthenticated' | 'authenticated' | 'onboarding' | 'ready' | 'error';

export interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  isMock: true;
}

interface AuthContextType {
  user: User | null;
  mockUser: MockUser | null;
  profile: UserProfile | null;
  status: AuthStatus;
  loading: boolean; // Keep for backward compatibility
  isConfirmed: boolean;
  hasWavvault: boolean;
  refreshProfile: () => Promise<void>;
  loginAsMockUser: (mockData: any) => void;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mockUser, setMockUser] = useState<MockUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasWavvault, setHasWavvault] = useState(false);
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [error, setError] = useState<string | null>(null);

  const loginAsMockUser = (mockData: any) => {
    console.log('🎭 Logging in as mock user:', mockData.userId);
    const mUser: MockUser = {
      uid: mockData.userId,
      email: mockData.email,
      displayName: `${mockData.firstName} ${mockData.lastName}`,
      isMock: true
    };
    
    const mProfile: UserProfile = {
      uid: mockData.userId,
      email: mockData.email,
      displayName: `${mockData.firstName} ${mockData.lastName}`,
      role: 'user',
      tenantId: mockData.tenantId || 'sparkwavv',
      generationalPersona: mockData.generationalPersona,
      careerStageRole: mockData.careerStageRole,
      hierarchicalRole: mockData.hierarchicalRole,
      brandPersona: mockData.brandPersona,
      brandDNAAttributes: mockData.brandDNAAttributes,
      journeyStage: mockData.journeyStage || 'Dive-In',
      onboardingComplete: true
    };

    setMockUser(mUser);
    setProfile(mProfile);
    setHasWavvault(true);
    setStatus('ready');
  };

  const logout = async () => {
    if (mockUser) {
      setMockUser(null);
      setProfile(null);
      setHasWavvault(false);
      setStatus('unauthenticated');
    } else if (auth) {
      await auth.signOut();
    }
  };

  const fetchProfile = async (firebaseUser: User) => {
    console.group('🔐 Auth Initialization');
    const idToken = await firebaseUser.getIdToken();
    
    try {
      // Fetch Profile with 5s timeout
      const profilePromise = fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });

      // Fetch Wavvault Status with 5s timeout
      const wavvaultPromise = fetch('/api/user/wavvault-status', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });

      const [pRes, wRes] = await Promise.all([profilePromise, wavvaultPromise]);

      let profileLoaded = false;
      if (pRes.ok) {
        const pData = await pRes.json();
        setProfile(pData);
        profileLoaded = true;
        console.log('✅ Profile loaded:', pData.journeyStage);
      } else {
        console.warn('⚠️ Profile not found, using default');
      }

      if (wRes.ok) {
        const { exists } = await wRes.json();
        setHasWavvault(exists);
        console.log('✅ Wavvault status:', exists ? 'Exists' : 'Missing');
      }

      setStatus(profileLoaded ? 'ready' : 'authenticated');
    } catch (err: any) {
      console.error('❌ Initialization error:', err);
      setError(err.message);
      // Even on error, we set status to authenticated so the UI can attempt to render
      setStatus('authenticated');
    } finally {
      console.groupEnd();
    }
  };

  useEffect(() => {
    if (!auth) {
      setStatus('unauthenticated');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser);
      } else {
        setProfile(null);
        setHasWavvault(false);
        setStatus('unauthenticated');
      }
    });

    // Global Safety Timeout: If still initializing after 10s, force a state change
    const safetyTimeout = setTimeout(() => {
      setStatus(prev => prev === 'initializing' ? 'error' : prev);
    }, 10000);

    return () => {
      unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const value = {
    user,
    mockUser,
    profile,
    status,
    loading: status === 'initializing',
    isConfirmed: (user || mockUser) ? true : false,
    hasWavvault,
    refreshProfile: async () => {
      if (mockUser) return;
      user && await fetchProfile(user);
    },
    loginAsMockUser,
    logout,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
