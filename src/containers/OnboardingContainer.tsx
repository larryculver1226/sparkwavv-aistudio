import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthActions } from '../hooks/useAuthActions';
import { SocialAuth } from '../components/auth/SocialAuth';
import { SignupForm } from '../components/auth/SignupForm';

interface OnboardingContainerProps {
  onBackToHome: () => void;
  onSuccess: (message: string) => void;
}

export function OnboardingContainer({ onBackToHome, onSuccess }: OnboardingContainerProps) {
  const navigate = useNavigate();
  const { loading, error, loginWithPopup, signUp } = useAuthActions();
  const [showEmailSignup, setShowEmailSignup] = useState(false);

  const handleSignup = async (email: string, pass: string, name: string) => {
    try {
      await signUp(email, pass, name);
      onSuccess('Account created! Please check your email for verification.');
    } catch (err) {
      // Error is handled by useAuthActions
    }
  };

  return (
    <motion.div
      key="onboarding"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-xl mx-auto px-6 space-y-12 pb-24"
    >
      <header className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center mx-auto mb-6">
          <Rocket className="w-8 h-8 text-neon-cyan" />
        </div>
        <h2 className="text-4xl font-bold">Ready to Dive-In?</h2>
        <p className="text-white/60">
          Join SPARKWavv and start building your cinematic career identity.
        </p>
      </header>

      <div className="glass-panel p-8 space-y-6 text-center">
        {!showEmailSignup ? (
          <SocialAuth
            onGoogleLogin={async () => {
              try {
                await loginWithPopup();
              } catch (err) {
                // Caught to prevent unhandled promise rejection
              }
            }}
            onEmailSignup={() => setShowEmailSignup(true)}
            loading={loading}
            error={error}
          />
        ) : (
          <SignupForm
            onSubmit={handleSignup}
            onCancel={() => setShowEmailSignup(false)}
            loading={loading}
            error={error}
          />
        )}

        {!showEmailSignup && (
          <p className="text-white/40 text-xs mt-6">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-neon-cyan hover:underline font-bold"
            >
              Sign In
            </button>
          </p>
        )}

        <button
          onClick={onBackToHome}
          className="mt-4 text-white/40 hover:text-white transition-colors text-sm uppercase tracking-widest font-bold"
        >
          Back to Home
        </button>
      </div>
    </motion.div>
  );
}
