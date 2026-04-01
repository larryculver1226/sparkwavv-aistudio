import React from 'react';
import { Button } from '../Button';
import { ArrowRight, Loader2 } from 'lucide-react';

interface SocialAuthProps {
  onGoogleLogin: () => void;
  onEmailSignup: () => void;
  loading: boolean;
}

export function SocialAuth({ onGoogleLogin, onEmailSignup, loading }: SocialAuthProps) {
  return (
    <div className="space-y-6">
      <p className="text-white/60 mb-8">
        We use Google Identity for secure, industry-standard authentication. You'll be redirected to our secure login page to create your account or sign in.
      </p>
      <Button 
        onClick={onGoogleLogin} 
        disabled={loading}
        className="w-full py-4 text-lg"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
          <>
            Get Started with Google <ArrowRight className="ml-2 w-5 h-5" />
          </>
        )}
      </Button>
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#050505] px-4 text-white/40 font-bold tracking-widest">Or</span>
        </div>
      </div>
      <Button 
        onClick={onEmailSignup}
        variant="outline"
        className="w-full py-4"
      >
        Sign up with Email & Password
      </Button>
    </div>
  );
}
