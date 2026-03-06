import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, ArrowRight, Loader2, Mail, UserPlus } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export const AdminLogin: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPromote, setShowPromote] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setLoading(true);
    setError('');

    try {
      // 1. Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // 2. Verify admin role on server
      const response = await fetch('/api/admin/login-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (response.ok) {
        onLogin();
      } else if (response.status === 403) {
        setError('Your account does not have administrative privileges.');
        setShowPromote(true);
      } else {
        setError('Invalid administrative credentials');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async () => {
    if (!auth?.currentUser) return;
    setLoading(true);
    setError('');

    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch('/api/admin/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, password: adminPassword }),
      });

      if (response.ok) {
        onLogin();
      } else {
        const data = await response.json();
        setError(data.error || 'Promotion failed. Invalid admin password.');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-neon-cyan/10 border border-neon-cyan/20 mb-4">
            <ShieldCheck className="w-10 h-10 text-neon-cyan" />
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight">Admin Portal</h1>
          <p className="text-white/40 uppercase tracking-[0.2em] text-xs font-bold">Sparkwavv Environment Control</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl">
          <AnimatePresence mode="wait">
            {!showPromote ? (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Admin Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 focus:outline-none focus:border-neon-cyan transition-colors text-lg"
                      placeholder="admin@sparkwavv.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 focus:outline-none focus:border-neon-cyan transition-colors text-lg"
                      placeholder="••••••••••••"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-sm font-medium text-center">{error}</p>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-neon-cyan text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(0,243,255,0.2)] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Authenticate <ArrowRight className="w-5 h-5" /></>}
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="promote"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm">
                  Your account is authenticated but lacks admin privileges. Enter the master administrative key to promote this account.
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Master Admin Key</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                      type="password" 
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 focus:outline-none focus:border-neon-cyan transition-colors text-lg"
                      placeholder="••••••••••••"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-sm font-medium text-center">{error}</p>
                )}

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handlePromote}
                    disabled={loading}
                    className="w-full bg-purple-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(139,92,246,0.2)] disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Promote to Admin <UserPlus className="w-5 h-5" /></>}
                  </button>
                  <button 
                    onClick={() => setShowPromote(false)}
                    className="w-full bg-white/5 text-white/60 font-bold py-4 rounded-2xl hover:bg-white/10 transition-all"
                  >
                    Back to Login
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-8 text-white/20 text-xs uppercase tracking-widest">
          Authorized Personnel Only
        </p>
      </motion.div>
    </div>
  );
};
