import React, { useState } from 'react';
import { Button } from '../Button';
import { ArrowRight, Loader2 } from 'lucide-react';

interface LoginFormProps {
  onEmailLogin: (email: string, pass: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function LoginForm({ onEmailLogin, onGoogleLogin, loading, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEmailLogin(email, password);
  };

  return (
    <div className="glass-panel p-8 space-y-6">
      <Button
        onClick={onGoogleLogin}
        disabled={loading}
        className="w-full py-4 text-lg bg-white text-black hover:bg-white/90"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        ) : (
          <>
            Sign in with Google <ArrowRight className="ml-2 w-5 h-5" />
          </>
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#050505] px-4 text-white/40 font-bold tracking-widest">Or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/40 uppercase tracking-widest">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/40 uppercase tracking-widest">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full py-4 mt-4">
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Sign In'}
        </Button>
      </form>
    </div>
  );
}
