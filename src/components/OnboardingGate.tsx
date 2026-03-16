import React from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import Onboarding from '../pages/Onboarding';

interface OnboardingGateProps {
  children: React.ReactNode;
}

export default function OnboardingGate({ children }: OnboardingGateProps) {
  const { user, profile, hasWavvault, status } = useAuthContext();

  if (status === 'initializing') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not logged in, we don't handle it here (App.tsx should handle routing)
  if (status === 'unauthenticated' || !user || !profile) {
    return <>{children}</>;
  }

  // If user is admin, skip onboarding gate (optional, but usually admins don't need wavvault)
  if (profile.role === 'admin') {
    return <>{children}</>;
  }

  if (!hasWavvault) {
    return <Onboarding />;
  }

  return <>{children}</>;
}
