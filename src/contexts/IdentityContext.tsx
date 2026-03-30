import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User, getIdTokenResult, signOut as firebaseSignOut, signInWithCustomToken } from 'firebase/auth';
import { useAuth0 } from '@auth0/auth0-react';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types/user';
import { ROLES } from '../constants';

export type IdentityStatus = 'initializing' | 'unauthenticated' | 'authenticated' | 'ready' | 'error';

interface IdentityContextType {
  user: User | null;
  auth0User: any;
  isAuthenticated: boolean;
  profile: UserProfile | null;
  role: string | null;
  status: IdentityStatus;
  loading: boolean;
  isAdmin: boolean;
  isOperator: boolean;
  isSuperAdmin: boolean;
  emailVerified: boolean;
  onboardingComplete: boolean;
  hasWavvault: boolean;
  error: string | null;
  logout: () => Promise<void>;
  login: (options?: any) => Promise<void>;
  loginWithPopup: (options?: any) => Promise<void>;
  refreshIdentity: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  reloadUser: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const { 
    isAuthenticated, 
    user: auth0User, 
    getAccessTokenSilently, 
    loginWithRedirect, 
    loginWithPopup: auth0LoginWithPopup,
    logout: auth0Logout,
    isLoading: auth0Loading,
    error: auth0Error
  } = useAuth0();

  useEffect(() => {
    if (auth0Error) {
      console.error('🛡️ [Auth0] SDK Error:', auth0Error);
      setError(auth0Error.message);
    }
  }, [auth0Error]);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [hasWavvault, setHasWavvault] = useState(false);
  const [status, setStatus] = useState<IdentityStatus>('initializing');
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      auth0Logout({ logoutParams: { returnTo: window.location.origin } });
      setUser(null);
      setProfile(null);
      setRole(null);
      setHasWavvault(false);
      setStatus('unauthenticated');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  }, [auth0Logout]);

  const login = useCallback(async (options?: any) => {
    await loginWithRedirect(options);
  }, [loginWithRedirect]);

  const loginWithPopup = useCallback(async (options?: any) => {
    try {
      setStatus('initializing');
      await auth0LoginWithPopup(options);
      console.log('🌉 [Identity] Popup Login Success!');
    } catch (err: any) {
      console.error('❌ [Identity] Popup Login Error:', err);
      setError(err.message);
      setStatus('error');
      throw err;
    }
  }, [auth0LoginWithPopup]);

  const fetchIdentity = useCallback(async (firebaseUser: User, forceRefresh = false) => {
    console.group('🆔 Identity Initialization');
    console.log('👤 [Identity] Fetching for:', firebaseUser.email, { forceRefresh });
    try {
      // 1. Get ID Token Result for Custom Claims (Roles)
      // We try without force refresh first to avoid unnecessary network requests that might fail in restricted environments
      console.log('🎫 [Identity] Fetching ID token result...');
      const tokenPromise = getIdTokenResult(firebaseUser, forceRefresh);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('ID Token fetch timed out')), 10000)
      );
      
      let tokenResult = await Promise.race([tokenPromise, timeoutPromise]);
      console.log('🎫 [Identity] Token Result Claims:', tokenResult.claims);
      
      // If we don't have a role claim and we haven't forced a refresh yet, try once with force refresh
      if (!tokenResult.claims.role && !forceRefresh) {
        console.log('🎫 [Identity] No role claim found, forcing token refresh...');
        const forceRefreshPromise = getIdTokenResult(firebaseUser, true);
        tokenResult = await Promise.race([forceRefreshPromise, timeoutPromise]);
      }

      const rawRole = tokenResult.claims.role;
      const claimRole = typeof rawRole === 'string' ? rawRole : (rawRole as any)?.role;
      console.log('🎫 [Identity] Claims Role:', claimRole, 'for Email:', firebaseUser.email);
      
      // Safety net for Larry Culver
      let finalRole = claimRole || ROLES.USER;
      const userEmail = firebaseUser.email?.toLowerCase()?.trim();
      if (userEmail === 'larry.culver1226@gmail.com') {
        console.log('🛡️ [Identity] Safety Net: Identified Larry Culver as Super Admin', userEmail);
        finalRole = ROLES.SUPER_ADMIN;
      }
      
      console.log('🎫 [Identity] Final Role determined:', finalRole);
      // Set initial role from claims or default to user
      setRole(String(finalRole));

      // 2. Fetch Profile and Wavvault Status (using Bearer token)
      const idToken = tokenResult.token;
      
      const fetchWithRetry = async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
          const res = await fetch(url, { ...options, signal: controller.signal });
          clearTimeout(timeoutId);
          
          // Only retry on 5xx or network errors, not 4xx
          if (!res.ok && res.status >= 500 && retries > 0) {
            console.warn(`Retrying fetch to ${url} due to status ${res.status}... (${retries} left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchWithRetry(url, options, retries - 1);
          }
          return res;
        } catch (err: any) {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
            console.error(`Fetch to ${url} timed out`);
            if (retries > 0) {
              console.warn(`Retrying fetch to ${url} due to timeout... (${retries} left)`);
              return fetchWithRetry(url, options, retries - 1);
            }
          }
          if (retries > 0) {
            console.warn(`Retrying fetch to ${url} due to network error: ${err.message}... (${retries} left)`);
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
        
        // Prioritize profile role if it exists and differs from claim role
        if (pData.role) {
          const actualRole = typeof pData.role === 'string' ? pData.role : (pData.role as any)?.role;
          
          // Only update role from profile if claimRole is missing or if the profile role is an admin role
          // while the claimRole is not. This prevents downgrading bootstrapped admins.
          const isAdminRole = (r: string) => [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.EDITOR, ROLES.MENTOR].includes(r as any);
          
          if (actualRole !== finalRole) {
            const isAdminRoleCheck = (r: any) => {
              const roleStr = typeof r === 'string' ? r : (r?.role || '');
              return [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.EDITOR, ROLES.MENTOR].includes(roleStr as any);
            };
            
            if (!isAdminRoleCheck(finalRole) || isAdminRoleCheck(actualRole)) {
              setRole(String(actualRole));
            }
          }
        }
      } else if (profileRes.status === 404) {
        setProfile(null);
      } else {
        throw new Error(`Profile fetch failed: ${profileRes.status}`);
      }

      if (wavvaultRes.ok) {
        const { exists } = await wavvaultRes.json();
        setHasWavvault(exists);
      } else {
        console.warn('⚠️ Wavvault status fetch failed:', wavvaultRes.status);
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
    const bridgeAuth = async () => {
      if (isAuthenticated && auth0User && !user) {
        console.log('🌉 [Identity] Auth0 Authenticated, starting bridge...', { email: auth0User.email });
        setStatus('authenticated');
        try {
          console.log('🌉 [Identity] Calling Auth0 getAccessTokenSilently...');
          const token = await getAccessTokenSilently();
          console.log('🌉 [Identity] Got Auth0 Access Token, calling bridge API...');
          
          // Add a timeout to the bridge request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

          const response = await fetch('/api/auth/bridge', {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          clearTimeout(timeoutId);
          console.log('🌉 [Identity] Bridge API Response Status:', response.status);

          if (response.ok) {
            const { firebaseToken, user: bridgeUser } = await response.json();
            console.log('🌉 [Identity] Bridge Success! Firebase Token received.', { role: bridgeUser?.role });
            
            // Set initial identity from bridge response to avoid flicker
            if (bridgeUser) {
              console.log('🌉 [Identity] Pre-setting role from bridge:', bridgeUser.role);
              setRole(bridgeUser.role);
              setProfile(bridgeUser);
            }
            
          console.log('🌉 [Identity] Signing in with Firebase Custom Token...');
          
          // Add retry logic for signInWithCustomToken due to potential network-request-failed errors
          const signInWithRetry = async (retries = 5): Promise<void> => {
            try {
              await signInWithCustomToken(auth, firebaseToken);
            } catch (err: any) {
              const isNetworkError = err.code === 'auth/network-request-failed' || err.message?.includes('network-request-failed');
              if (isNetworkError && retries > 0) {
                const delay = (6 - retries) * 2000; // Exponential-ish backoff
                console.warn(`⚠️ [Identity] Firebase sign-in failed (network error), retrying in ${delay/1000}s... (${retries} left)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return signInWithRetry(retries - 1);
              }
              throw err;
            }
          };

          await signInWithRetry();
          console.log('🌉 [Identity] Firebase Sign-in complete.');
          
          // Force a quick identity fetch to ensure role is in sync with claims
          if (auth.currentUser) {
            await fetchIdentity(auth.currentUser, true);
          }
          
          setStatus('ready');
        } else {
          const errData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('❌ [Identity] Bridge failed with status:', response.status, 'Error:', errData.error);
          setError(errData.error);
          setStatus('error');
        }
      } catch (err: any) {
        console.error('❌ [Identity] Bridge error:', err);
        setError(err.message);
        
        // If it's a network error, don't set status to 'error' immediately
        // This allows the user to see the app (maybe with a retry button) instead of a full error screen
        if (err.code === 'auth/network-request-failed' || err.message?.includes('network-request-failed')) {
          console.warn('⚠️ [Identity] Bridge failed due to network error. Setting status to authenticated for retry.');
          setStatus('authenticated');
        } else {
          setStatus('error');
        }
      }
      } else if (!auth0Loading && !isAuthenticated) {
        if (auth0Error) {
          console.log('🌉 [Identity] Auth0 has error, setting status to error.');
          setStatus('error');
        } else {
          console.log('🌉 [Identity] Auth0 not authenticated.');
          setStatus('unauthenticated');
        }
      }
    };

    bridgeAuth();
  }, [isAuthenticated, auth0User, getAccessTokenSilently, auth0Loading, user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchIdentity(firebaseUser);
      } else if (!auth0Loading && !isAuthenticated) {
        setProfile(null);
        setRole(null);
        if (auth0Error) {
          setStatus('error');
        } else {
          setStatus('unauthenticated');
        }
      }
    });

    return () => unsubscribe();
  }, [fetchIdentity, auth0Loading, isAuthenticated]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
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
  }, [user]);

  const reloadUser = useCallback(async () => {
    if (user) {
      await user.reload();
      setUser({ ...user }); // Trigger re-render
    }
  }, [user]);

  const refreshIdentity = useCallback(async () => {
    if (user) {
      await user.reload();
      await fetchIdentity(user);
    }
  }, [user, fetchIdentity]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await user.reload();
      await fetchIdentity(user);
    }
  }, [user, fetchIdentity]);

  const value = React.useMemo(() => ({
    user,
    auth0User,
    isAuthenticated,
    profile,
    role,
    status,
    loading: status === 'initializing' || status === 'authenticated' || auth0Loading,
    isAdmin: role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN,
    isOperator: role === ROLES.OPERATOR,
    isSuperAdmin: role === ROLES.SUPER_ADMIN,
    emailVerified: auth0User?.email_verified || false,
    onboardingComplete: profile?.onboardingComplete === true,
    hasWavvault,
    error,
    logout,
    login,
    loginWithPopup,
    refreshIdentity,
    refreshProfile,
    reloadUser,
    updateProfile
  }), [
    user, 
    auth0User,
    isAuthenticated,
    profile, 
    role, 
    status, 
    auth0Loading,
    hasWavvault, 
    error, 
    logout, 
    login, 
    loginWithPopup,
    refreshIdentity, 
    refreshProfile, 
    reloadUser, 
    updateProfile
  ]);

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
