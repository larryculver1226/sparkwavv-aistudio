import { useState } from 'react';
import { useIdentity } from '../contexts/IdentityContext';

export function useAuthActions() {
  const { login, loginWithPopup, signUpWithEmail, logout } = useIdentity();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await action();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    setError,
    login: (email: string, pass: string) => handleAction(() => login(email, pass)),
    loginWithPopup: () => handleAction(() => loginWithPopup()),
    signUp: (email: string, pass: string, name: string) =>
      handleAction(() => signUpWithEmail(email, pass, name)),
    logout: () => handleAction(() => logout()),
  };
}
