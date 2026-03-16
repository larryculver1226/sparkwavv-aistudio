import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ShieldAlert, Database, Key, Server, RefreshCw } from 'lucide-react';
import { isFirebaseConfigured } from '../lib/firebase';

export const AuthDiagnostics: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Failed to fetch auth status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="text-white space-y-8">
      <div className="max-w-4xl space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-display font-bold">Connectivity Diagnostics</h1>
            <p className="text-white/40 mt-2">Evaluate SPARKWavv & Firebase integration status</p>
          </div>
          <button 
            onClick={checkStatus}
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Side Status */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-8 space-y-6"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isFirebaseConfigured ? 'bg-neon-lime/10 text-neon-lime' : 'bg-neon-magenta/10 text-neon-magenta'}`}>
                {isFirebaseConfigured ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-xl font-bold">Client-Side Firebase</h3>
                <p className="text-sm text-white/40">Frontend SDK Configuration</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-white/40" />
                  <span className="text-sm">API Key Status</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${isFirebaseConfigured ? 'bg-neon-lime/20 text-neon-lime' : 'bg-neon-magenta/20 text-neon-magenta'}`}>
                  {isFirebaseConfigured ? 'CONFIGURED' : 'MISSING'}
                </span>
              </div>
              
              {!isFirebaseConfigured && (
                <div className="p-4 rounded-xl bg-neon-magenta/10 border border-neon-magenta/20 text-xs text-neon-magenta leading-relaxed">
                  <strong>Error:</strong> auth/invalid-api-key. Please ensure VITE_FIREBASE_API_KEY is set in your environment variables.
                </div>
              )}
            </div>
          </motion.div>

          {/* Backend Status */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-8 space-y-6"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${status?.admin ? 'bg-neon-lime/10 text-neon-lime' : 'bg-neon-cyan/10 text-neon-cyan'}`}>
                {status?.admin ? <Server className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-xl font-bold">SPARKWavv Backend</h3>
                <p className="text-sm text-white/40">Firebase Admin SDK Status</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <Server className="w-4 h-4 text-white/40" />
                  <span className="text-sm">Admin Credentials</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${status?.admin ? 'bg-neon-lime/20 text-neon-lime' : 'bg-neon-cyan/20 text-neon-cyan'}`}>
                  {status?.admin ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-white/40" />
                  <span className="text-sm">Firestore Status</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${status?.firestore === 'connected' ? 'bg-neon-lime/20 text-neon-lime' : 'bg-neon-magenta/20 text-neon-magenta'}`}>
                  {status?.firestore?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-white/40" />
                  <span className="text-sm">Project ID</span>
                </div>
                <span className="text-xs font-mono text-white/60">
                  {status?.projectId || '...'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="glass-panel p-8">
          <h3 className="text-xl font-bold mb-4">Troubleshooting Logs</h3>
          <div className="bg-black/40 rounded-xl p-6 font-mono text-sm text-white/60 space-y-2 overflow-x-auto">
            <p className="text-white/40"># AI Studio Console Logs (Backend)</p>
            <p>{status?.admin ? '[INFO] Firebase Admin initialized successfully.' : '[WARN] Firebase Admin credentials missing.'}</p>
            <p className="text-white/40 mt-4"># Browser Console Logs (Frontend)</p>
            <p>{isFirebaseConfigured ? '[INFO] Firebase Client initialized.' : '[ERROR] Uncaught FirebaseError: Firebase: Error (auth/invalid-api-key).'}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
          <p className="text-sm text-white/40">
            Need help? Check the <a href="https://firebase.google.com/docs/auth" target="_blank" rel="noreferrer" className="text-neon-cyan hover:underline">Firebase Documentation</a> or your <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-neon-cyan hover:underline">Firebase Console</a>.
          </p>
        </div>
      </div>
    </div>
  );
};
