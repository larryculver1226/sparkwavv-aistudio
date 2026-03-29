import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Loader2, AlertCircle, User, ShieldAlert, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIdentity } from '../contexts/IdentityContext';

export const AdminLogin: React.FC<{ 
  onLogin: () => void;
  vibe?: 'technical' | 'vibrant';
}> = ({ onLogin, vibe = 'technical' }) => {
  const { login, logout, user, role, status, loading: identityLoading, error: identityError } = useIdentity();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('👤 [AdminLogin] Current User:', user.email, 'Role:', role, 'Status:', status);
    }
  }, [user, role, status]);

  const navigate = useNavigate();

  useEffect(() => {
    if (status === 'ready' && user && (role === 'admin' || role === 'super_admin' || role === 'editor' || role === 'mentor')) {
      console.log('👤 [AdminLogin] Admin already logged in, redirecting to /admin');
      onLogin(); // Call the callback
      navigate('/admin', { replace: true });
    }
  }, [user, role, status, navigate, onLogin]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const returnTo = vibe === 'technical' ? '/admin' : '/operations';
      console.log('🚀 [AdminLogin] Starting Auth0 Login...', { vibe, returnTo });
      
      // Save current path to session storage to help recovery if appState is lost
      sessionStorage.setItem('auth0_last_path', window.location.pathname);
      
      await login({ 
        appState: { returnTo } 
      });
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

            {user && (
              <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-neon-cyan" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white truncate max-w-[150px]">{user.email}</p>
                      <p className="text-[10px] uppercase tracking-widest text-white/40">Current Identity</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${role === 'super_admin' || role === 'admin' ? 'text-neon-cyan' : 'text-neon-magenta'}`}>
                      {role || 'user'}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Role</p>
                  </div>
                </div>

                {role !== 'super_admin' && role !== 'admin' && (
                  <div className="p-3 rounded-xl bg-neon-magenta/10 border border-neon-magenta/20 flex items-start gap-3">
                    <ShieldAlert className="w-4 h-4 text-neon-magenta mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-neon-magenta leading-relaxed">
                      Your account does not have administrative privileges. Please use an authorized account or contact the system owner.
                    </p>
                  </div>
                )}

                <button 
                  onClick={() => logout()}
                  className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out & Try Another Account
                </button>
              </div>
            )}

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

            <div className="pt-4 border-t border-white/5 space-y-4">
              <p className="text-[10px] text-center text-white/20 uppercase tracking-[0.2em]">
                Secure Stateless Identity Engine v2.0
              </p>
                           <button 
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="w-full py-2 px-4 bg-white/5 border border-white/10 rounded-lg text-[10px] text-white/40 hover:text-white/80 hover:bg-white/10 uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                {showDiagnostics ? 'Hide System Diagnostics' : 'Show System Diagnostics'}
                <div className={`w-1.5 h-1.5 rounded-full ${status === 'ready' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
              </button>

              {showDiagnostics && (
                <div className="mt-4 p-4 bg-black/80 border border-white/10 rounded-xl text-[10px] font-mono text-white/60 space-y-3 overflow-y-auto max-h-[400px] backdrop-blur-xl">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-neon-cyan uppercase tracking-tighter">Auth0 Config</span>
                    <span className="text-[8px] opacity-40">v2.16.0</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="opacity-40 uppercase text-[8px]">Domain</p>
                      <p className="truncate">{import.meta.env.VITE_AUTH0_DOMAIN || 'Not Set'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="opacity-40 uppercase text-[8px]">Client ID</p>
                      <p className="truncate">{import.meta.env.VITE_AUTH0_CLIENT_ID || 'Not Set'}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="opacity-40 uppercase text-[8px]">Audience</p>
                    <p className="truncate">{import.meta.env.VITE_AUTH0_AUDIENCE || 'Not Set'}</p>
                  </div>

                  <div className="flex justify-between items-center border-b border-white/5 pb-2 pt-2">
                    <span className="text-neon-cyan uppercase tracking-tighter">Identity Status</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] ${status === 'ready' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="opacity-40 uppercase text-[8px]">User</p>
                      <p className="truncate">{user?.email || 'Guest'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="opacity-40 uppercase text-[8px]">Role</p>
                      <p className={`font-bold ${role === 'super_admin' ? 'text-purple-400' : 'text-white'}`}>
                        {role || 'None'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="opacity-40 uppercase text-[8px]">Is Admin</p>
                      <p className={role === 'admin' || role === 'super_admin' ? 'text-green-400' : 'text-red-400'}>
                        {role === 'admin' || role === 'super_admin' ? 'YES' : 'NO'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="opacity-40 uppercase text-[8px]">Auth0 Auth</p>
                      <p className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
                        {isAuthenticated ? 'YES' : 'NO'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button 
                      onClick={() => logout({ logoutParams: { returnTo: window.location.origin + '/admin/login' } })}
                      className="w-full py-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 hover:bg-red-500/20 transition-colors uppercase text-[9px] tracking-widest"
                    >
                      Sign Out & Reset
                    </button>
                  </div>
                </div>
              )}
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
