import React from 'react';
import { ShieldAlert, LogOut, Home } from 'lucide-react';
import { useIdentity } from '../contexts/IdentityContext';
import { motion } from 'motion/react';

export const AccessDenied: React.FC<{ requiredRole?: string }> = ({ requiredRole }) => {
  const { logout, role } = useIdentity();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-8 text-center bg-gray-900/50 p-12 rounded-3xl border border-white/10 backdrop-blur-xl"
      >
        <div className="relative inline-block">
          <ShieldAlert className="w-20 h-20 text-red-500 mx-auto" />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full -z-10"
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
          <p className="text-gray-400">
            You do not have the required permissions to access this area.
          </p>
          {role && (
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-4">
              Current Role:{' '}
              <span className="text-red-400 font-mono">
                {typeof role === 'string' ? role : (role as any)?.role || 'Unknown'}
              </span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 pt-8">
          <button
            onClick={() => (window.location.href = '/')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>

          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all border border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            Logout & Switch Account
          </button>
        </div>
      </motion.div>
    </div>
  );
};
