import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { useAuthActions } from '../hooks/useAuthActions';
import { LoginForm } from '../components/auth/LoginForm';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithPopup, loading, error } = useAuthActions();

  const handleEmailLogin = async (email: string, pass: string) => {
    try {
      await login(email, pass);
      navigate('/');
    } catch (err) {
      // Error is handled by useAuthActions
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithPopup();
      navigate('/');
    } catch (err) {
      // Error is handled by useAuthActions
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-neon-cyan/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Rocket className="w-8 h-8 text-neon-cyan" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight mb-2">
            Dashboard Login
          </h1>
          <p className="text-white/60">
            Welcome back to SPARKWavv.
          </p>
        </div>

        <LoginForm 
          onEmailLogin={handleEmailLogin}
          onGoogleLogin={handleGoogleLogin}
          loading={loading}
          error={error}
        />

        <div className="text-center">
          <button 
            onClick={() => navigate('/')}
            className="text-white/40 hover:text-white transition-colors text-sm uppercase tracking-widest font-bold"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
