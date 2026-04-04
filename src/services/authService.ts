import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  sendEmailVerification,
  getIdTokenResult,
  User,
} from 'firebase/auth';
import { auth, googleProvider, setTenantId } from '../lib/firebase';

export const authService = {
  async loginWithGoogle(tenantId: string | null = null) {
    if (tenantId) setTenantId(tenantId);
    return signInWithPopup(auth, googleProvider);
  },

  async loginWithEmail(email: string, pass: string, tenantId: string | null = null) {
    if (tenantId) setTenantId(tenantId);
    return signInWithEmailAndPassword(auth, email, pass);
  },

  async signUpWithEmail(email: string, pass: string, name: string, tenantId: string | null = null) {
    if (tenantId) setTenantId(tenantId);
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await firebaseUpdateProfile(userCredential.user, { displayName: name });
    await sendEmailVerification(userCredential.user);
    return userCredential;
  },

  async logout() {
    return firebaseSignOut(auth);
  },

  async updateDisplayName(user: User, name: string) {
    return firebaseUpdateProfile(user, { displayName: name });
  },

  async getIdentityInfo(user: User, forceRefresh = false) {
    const tokenResult = await getIdTokenResult(user, forceRefresh);
    return {
      token: tokenResult.token,
      claims: tokenResult.claims,
    };
  },
};
