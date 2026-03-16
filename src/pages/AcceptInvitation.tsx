import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldCheck, ShieldAlert, Loader2, ArrowRight, UserPlus } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const { user, status } = useAuthContext();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAccept = async () => {
    if (!user) {
      if (auth) {
        signInWithPopup(auth, googleProvider);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ invitationId: token })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/partner-dashboard');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && token && !success && !loading && !error) {
      // Auto-accept if already logged in? 
      // Maybe better to let them click a button to confirm.
    }
  }, [status, token]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,159,0.05),transparent_70%)]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 text-center shadow-2xl"
      >
        {success ? (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-neon-lime/20 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-10 h-10 text-neon-lime" />
            </div>
            <h1 className="text-3xl font-display font-bold">Partnership Active!</h1>
            <p className="text-zinc-400">
              You now have access to view this user's journey. Redirecting to your dashboard...
            </p>
            <Loader2 className="w-6 h-6 text-neon-lime animate-spin mx-auto" />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="w-20 h-20 bg-neon-cyan/10 rounded-full flex items-center justify-center mx-auto">
              <UserPlus className="w-10 h-10 text-neon-cyan" />
            </div>
            
            <div>
              <h1 className="text-3xl font-display font-bold mb-3">RPP Invitation</h1>
              <p className="text-zinc-400">
                You've been invited to become a Relational Power Partner. 
                {email && <span className="block mt-2 text-neon-lime font-medium">{email}</span>}
              </p>
            </div>

            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-zinc-700/50 text-left">
              <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-neon-lime" />
                Partner Privileges
              </h4>
              <ul className="text-xs text-zinc-500 space-y-2">
                <li>• View journey progress and milestones</li>
                <li>• Access strengths profile and DNA</li>
                <li>• Provide guidance and support</li>
              </ul>
            </div>

            {error && (
              <div className="p-4 bg-neon-magenta/10 border border-neon-magenta/20 rounded-2xl text-neon-magenta text-sm flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <p className="text-left">{error}</p>
              </div>
            )}

            <Button
              onClick={handleAccept}
              disabled={loading}
              className="w-full bg-neon-lime hover:bg-neon-lime/90 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {user ? 'Accept Invitation' : 'Sign in to Accept'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
            
            {!user && (
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                Google Account Required
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
