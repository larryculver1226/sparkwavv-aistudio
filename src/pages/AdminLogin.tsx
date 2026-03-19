import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { useIdentity } from '../contexts/IdentityContext';

export const AdminLogin: React.FC<{ 
  onLogin: () => void;
  vibe?: 'technical' | 'vibrant';
}> = ({ onLogin, vibe = 'technical' }) => {
  const { loginWithGoogle, loading: identityLoading, error: identityError } = useIdentity();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🚀 [AdminLogin] Starting Google Login...');
      const result = await loginWithGoogle();
      
      if (result.success) {
        console.log('✅ [AdminLogin] Login successful, redirecting...');
        onLogin();
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err: any) {
      console.error('❌ [AdminLogin] Login error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-1000 ${
      vibe === 'technical' ? 'bg-[#050505]' : 'bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#001a1a]'
    }`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {vibe === 'technical' ? (
          <>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-magenta/5 blur-[120px] rounded-full" />
          </>
        ) : (
          <>
            <div className="absolute top-0 left-0 w-full h-full opacity-20 atmosphere" />
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neon-cyan/10 blur-[150px] rounded-full animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-neon-magenta/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
          </>
        )}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center space-y-4 mb-12">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl border mb-4 transition-all duration-500 ${
            vibe === 'technical' 
              ? 'bg-neon-cyan/10 border-neon-cyan/20' 
              : 'bg-neon-cyan/20 border-neon-cyan/40 shadow-[0_0_30px_rgba(0,243,255,0.2)]'
          }`}>
            <ShieldCheck className={`w-10 h-10 ${vibe === 'technical' ? 'text-neon-cyan' : 'text-white'}`} />
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight">
            {vibe === 'technical' ? 'Admin Portal' : 'Operations Control'}
          </h1>
          <p className="text-white/40 uppercase tracking-[0.2em] text-xs font-bold">
            {vibe === 'technical' ? 'SPARKWavv Environment Control' : 'Igniting Human Potential'}
          </p>
        </div>

        <div className={`glass-panel p-8 rounded-3xl border backdrop-blur-xl transition-all duration-500 ${
          vibe === 'technical' 
            ? 'border-white/10 bg-black/40' 
            : 'border-neon-cyan/20 bg-dark-surface/60 shadow-2xl'
        }`}>
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <p className="text-sm text-white/60">
                Please authenticate using your authorized Google account to access the {vibe === 'technical' ? 'Admin Portal' : 'Operations Control'}.
              </p>
            </div>

            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className={`w-full py-5 rounded-2xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 font-bold text-lg ${
                vibe === 'technical' 
                  ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.1)]' 
                  : 'bg-gradient-to-r from-neon-cyan to-neon-magenta text-white shadow-[0_0_40px_rgba(0,243,255,0.3)]'
              }`}
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                  Sign in with Google
                </>
              )}
            </button>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] text-center text-white/20 uppercase tracking-[0.2em]">
                Secure Stateless Identity Engine v2.0
              </p>
            </div>
          </div>
        </div>

        <p className="text-center mt-8 text-white/20 text-xs uppercase tracking-widest">
          {vibe === 'technical' ? 'Authorized Personnel Only' : 'Sparkwavv Operations Environment'}
        </p>
      </motion.div>
    </div>
  );
};
