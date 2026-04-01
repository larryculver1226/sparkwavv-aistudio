import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  getIdTokenResult, 
  signOut as firebaseSignOut, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as firebaseUpdateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { auth, setTenantId } from '../lib/firebase';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { UserProfile } from '../types/user';
import { ROLES } from '../constants';

export type IdentityStatus = 'initializing' | 'unauthenticated' | 'authenticated' | 'ready' | 'error';

interface IdentityContextType {
  user: User | null;
  isAuthenticated: boolean;
  profile: UserProfile | null;
  role: string | null;
  tenantId: string | null;
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
  loginWithPopup: (tenantId?: string) => Promise<void>;
  login: (email?: string, pass?: string, tenantId?: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, tenantId?: string) => Promise<void>;
  refreshIdentity: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  reloadUser: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [tenantId, setLocalTenantId] = useState<string | null>(null);
  const [hasWavvault, setHasWavvault] = useState(false);
  const [status, setStatus] = useState<IdentityStatus>('initializing');
  const [error, setError] = useState<string | null>(null);

  // Helper to get tenant from URL or provided ID
  const getEffectiveTenant = (providedId?: string) => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlTenant = urlParams.get('org');
    return providedId || urlTenant || null;
  };

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setUser(null);
      setProfile(null);
      setRole(null);
      setHasWavvault(false);
      setStatus('unauthenticated');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  }, []);

  const loginWithPopup = useCallback(async (providedTenantId?: string) => {
    try {
      setStatus('initializing');
      const effectiveTenant = getEffectiveTenant(providedTenantId);
      setLocalTenantId(effectiveTenant);
      
      await authService.loginWithGoogle(effectiveTenant);
      console.log('🛡️ [Identity] Google Login Success!');
    } catch (err: any) {
      console.error('❌ [Identity] Google Login Error:', err);
      setError(err.message);
      setStatus('error');
      throw err;
    }
  }, []);

  const login = useCallback(async (email?: string, pass?: string, providedTenantId?: string) => {
    try {
      setStatus('initializing');
      const effectiveTenant = getEffectiveTenant(providedTenantId);
      setLocalTenantId(effectiveTenant);

      if (!email || !pass) {
        console.log('🛡️ [Identity] No credentials provided, falling back to Google Login');
        return loginWithPopup(providedTenantId);
      }

      await authService.loginWithEmail(email, pass, effectiveTenant);
      console.log('🛡️ [Identity] Email Login Success!');
    } catch (err: any) {
      console.error('❌ [Identity] Login Error:', err);
      setError(err.message);
      setStatus('error');
      throw err;
    }
  }, [loginWithPopup]);

  const signUpWithEmail = useCallback(async (email: string, pass: string, name: string, providedTenantId?: string) => {
    try {
      setStatus('initializing');
      const effectiveTenant = getEffectiveTenant(providedTenantId);
      setLocalTenantId(effectiveTenant);

      await authService.signUpWithEmail(email, pass, name, effectiveTenant);
      console.log('🛡️ [Identity] Email Sign-up Success!');
    } catch (err: any) {
      console.error('❌ [Identity] Email Sign-up Error:', err);
      setError(err.message);
      setStatus('error');
      throw err;
    }
  }, []);

  const fetchIdentity = useCallback(async (firebaseUser: User, forceRefresh = false) => {
    console.group('🆔 Identity Initialization');
    console.log('👤 [Identity] Fetching for:', firebaseUser.email, { forceRefresh });
    try {
      // 1. Get ID Token Result for Custom Claims (Roles)
      const { token: idToken, claims } = await authService.getIdentityInfo(firebaseUser, forceRefresh);
      console.log('🎫 [Identity] Token Result Claims:', claims);
      
      const rawRole = claims.role;
      const claimRole = typeof rawRole === 'string' ? rawRole : (rawRole as any)?.role;
      const claimTenant = claims.tenantId as string;
      
      // Safety net for Larry Culver
      let finalRole = claimRole || ROLES.USER;
      const userEmail = firebaseUser.email?.toLowerCase()?.trim();
      if (userEmail === 'larry.culver1226@gmail.com') {
        console.log('🛡️ [Identity] Safety Net: Identified Larry Culver as Super Admin', userEmail);
        finalRole = ROLES.SUPER_ADMIN;
      }
      
      setRole(String(finalRole));
      setLocalTenantId(claimTenant || null);

      // 2. Fetch Profile and Wavvault Status
      const [pData, exists] = await Promise.all([
        userService.fetchProfile(idToken),
        userService.fetchWavvaultStatus(idToken)
      ]);

      if (pData) {
        setProfile(pData);
        
        if (pData.role && pData.role !== finalRole) {
          const isAdminRole = (r: any) => [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.EDITOR, ROLES.MENTOR].includes(r as any);
          if (!isAdminRole(finalRole) || isAdminRole(pData.role)) {
            setRole(String(pData.role));
          }
        }
      } else {
        setProfile(null);
      }

      setHasWavvault(exists);
      setStatus('ready');
    } catch (err: any) {
      console.error('❌ Identity fetch error:', err);
      let msg = err.message;
      if (msg.includes('auth/unauthorized-domain')) {
        msg = 'Unauthorized Domain: Please add this URL to your Firebase Authorized Domains in the console.';
      } else if (msg.includes('auth/popup-blocked')) {
        msg = 'Popup Blocked: Please allow popups for this site to sign in.';
      }
      setError(msg);
      setStatus('error');
    } finally {
      console.groupEnd();
    }
  }, []);

  useEffect(() => {
    // Initial tenant setup from URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlTenant = urlParams.get('org');
    if (urlTenant) {
      setTenantId(urlTenant);
      setLocalTenantId(urlTenant);
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setStatus('authenticated');
        await fetchIdentity(firebaseUser);
      } else {
        setProfile(null);
        setRole(null);
        setLocalTenantId(null);
        setStatus('unauthenticated');
      }
    });

    return () => unsubscribe();
  }, [fetchIdentity]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const idToken = await user.getIdToken();
    const updatedProfile = await userService.updateProfile(idToken, updates);
    setProfile(updatedProfile);
  }, [user]);

  const reloadUser = useCallback(async () => {
    if (user) {
      await user.reload();
      setUser({ ...user });
    }
  }, [user]);

  const refreshIdentity = useCallback(async () => {
    if (user) {
      await user.reload();
      await fetchIdentity(user, true);
    }
  }, [user, fetchIdentity]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchIdentity(user);
    }
  }, [user, fetchIdentity]);

  const value = React.useMemo(() => ({
    user,
    isAuthenticated: !!user,
    profile,
    role,
    tenantId,
    status,
    loading: status === 'initializing' || status === 'authenticated',
    isAdmin: role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN,
    isOperator: role === ROLES.OPERATOR,
    isSuperAdmin: role === ROLES.SUPER_ADMIN,
    emailVerified: user?.emailVerified || false,
    onboardingComplete: profile?.onboardingComplete === true,
    hasWavvault,
    error,
    logout,
    loginWithPopup,
    login,
    signUpWithEmail,
    refreshIdentity,
    refreshProfile,
    reloadUser,
    updateProfile
  }), [
    user, 
    profile, 
    role, 
    tenantId,
    status, 
    hasWavvault, 
    error, 
    logout, 
    loginWithPopup, 
    login,
    signUpWithEmail,
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
