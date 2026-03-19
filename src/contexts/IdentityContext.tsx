import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User, getIdTokenResult, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile, UserRole } from '../types/user';
import { ROLES } from '../constants';

export type IdentityStatus = 'initializing' | 'unauthenticated' | 'authenticated' | 'ready' | 'error';

interface IdentityContextType {
  user: User | null;
  profile: UserProfile | null;
  role: string | null;
  status: IdentityStatus;
  loading: boolean;
  isAdmin: boolean;
  isOperator: boolean;
  isSuperAdmin: boolean;
  isConfirmed: boolean;
  hasWavvault: boolean;
  error: string | null;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  refreshIdentity: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [hasWavvault, setHasWavvault] = useState(false);
  const [status, setStatus] = useState<IdentityStatus>('initializing');
  const [error, setError] = useState<string | null>(null);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
      setRole(null);
      setHasWavvault(false);
      setStatus('unauthenticated');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await fetchIdentity(result.user);
        return { success: true };
      }
      return { success: false, error: 'No user returned' };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: err.message };
    }
  };

  const fetchIdentity = useCallback(async (firebaseUser: User, forceRefresh = false) => {
    console.group('🆔 Identity Initialization');
    try {
      // 1. Get ID Token Result for Custom Claims (Roles)
      // We try without force refresh first to avoid unnecessary network requests that might fail in restricted environments
      let tokenResult = await getIdTokenResult(firebaseUser, forceRefresh);
      
      // If we don't have a role claim and we haven't forced a refresh yet, try once with force refresh
      if (!tokenResult.claims.role && !forceRefresh) {
        console.log('🎫 No role claim found, forcing token refresh...');
        tokenResult = await getIdTokenResult(firebaseUser, true);
      }

      const claimRole = tokenResult.claims.role as string;
      console.log('🎫 Claims Role:', claimRole);
      setRole(claimRole || ROLES.USER);

      // 2. Fetch Profile and Wavvault Status (using Bearer token)
      const idToken = tokenResult.token;
      
      const fetchWithRetry = async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
        try {
          const res = await fetch(url, options);
          if (!res.ok && retries > 0) throw new Error(`Status ${res.status}`);
          return res;
        } catch (err) {
          if (retries > 0) {
            console.warn(`Retrying fetch to ${url}... (${retries} left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchWithRetry(url, options, retries - 1);
          }
          throw err;
        }
      };

      const [profileRes, wavvaultRes] = await Promise.all([
        fetchWithRetry('/api/user/profile', { headers: { 'Authorization': `Bearer ${idToken}` } }),
        fetchWithRetry('/api/user/wavvault-status', { headers: { 'Authorization': `Bearer ${idToken}` } })
      ]);

      if (profileRes.ok) {
        const pData = await profileRes.json();
        setProfile(pData);
        if (pData.role && !claimRole) {
          setRole(pData.role);
        }
        console.log('✅ Profile loaded:', pData.role);
      }

      if (wavvaultRes.ok) {
        const { exists } = await wavvaultRes.json();
        setHasWavvault(exists);
        console.log('✅ Wavvault status:', exists);
      }

      setStatus('ready');
    } catch (err: any) {
      console.error('❌ Identity fetch error:', err);
      // If it's a network error, we might still be "authenticated" but just can't get the profile yet
      // We'll set status to 'authenticated' instead of 'error' to allow the app to keep trying or show a retry button
      setError(err.message);
      if (err.message?.includes('network-request-failed')) {
        setStatus('authenticated'); // Stay in authenticated state, maybe show a "Retry" UI
      } else {
        setStatus('error');
      }
    } finally {
      console.groupEnd();
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchIdentity(firebaseUser);
      } else {
        setProfile(null);
        setRole(null);
        setStatus('unauthenticated');
      }
    });

    return () => unsubscribe();
  }, [fetchIdentity]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const idToken = await user.getIdToken();
    const response = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (response.ok) {
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
    } else {
      throw new Error('Failed to update profile');
    }
  };

  const value = {
    user,
    profile,
    role,
    status,
    loading: status === 'initializing',
    isAdmin: role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN,
    isOperator: role === ROLES.OPERATOR,
    isSuperAdmin: role === ROLES.SUPER_ADMIN,
    isConfirmed: profile?.onboardingComplete === true,
    hasWavvault,
    error,
    logout,
    loginWithGoogle,
    refreshIdentity: () => user ? fetchIdentity(user) : Promise.resolve(),
    refreshProfile: () => user ? fetchIdentity(user) : Promise.resolve(),
    updateProfile
  };

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const context = useContext(IdentityContext);
  if (context === undefined) {
    throw new Error('useIdentity must be used within an IdentityProvider');
  }
  return context;
}
