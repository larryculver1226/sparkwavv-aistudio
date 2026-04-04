import React, { useState } from 'react';
import { Button } from '../Button';
import { Loader2 } from 'lucide-react';

interface SignupFormProps {
  onSubmit: (email: string, pass: string, name: string) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}

export function SignupForm({ onSubmit, onCancel, loading, error }: SignupFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password, name);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="space-y-2">
        <label className="text-xs font-medium text-white/40 uppercase tracking-widest">
          Full Name
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
          placeholder="John Doe"
        />
      </div>
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
        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Account'}
      </Button>
      <button
        type="button"
        onClick={onCancel}
        className="w-full text-white/40 hover:text-white transition-colors text-xs uppercase tracking-widest font-bold mt-4"
      >
        Back to Google Sign-in
      </button>
    </form>
  );
}
