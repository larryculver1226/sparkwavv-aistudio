import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Mail, 
  Briefcase, 
  MapPin, 
  Globe, 
  Save, 
  Loader2, 
  ArrowLeft,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useIdentity } from '../contexts/IdentityContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { ProfilePhotoUpload } from '../components/profile/ProfilePhotoUpload';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const ProfilePage: React.FC = () => {
  const { user, profile, status, updateProfile } = useIdentity();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    jobTitle: '',
    location: '',
    website: '',
    bio: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        jobTitle: profile.jobTitle || '',
        location: profile.location || '',
        website: profile.website || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  if (status === 'initializing') {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-neon-cyan animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    navigate('/');
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSaving(true);
      await updateProfile(formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoSave = async (blob: Blob) => {
    if (!user) return;

    try {
      // In a real app, you'd upload this blob to Firebase Storage
      // For this demo, we'll convert to base64 and store in Firestore (not ideal for real apps but works for demo)
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        await updateProfile({ photoURL: base64data });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      };
    } catch (error) {
      console.error('Error updating photo:', error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate(-1)}
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-4xl font-display font-bold tracking-tight">Profile Settings</h1>
              <p className="text-white/40 text-sm uppercase tracking-widest font-bold mt-1">Manage your career identity</p>
            </div>
          </div>
          
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-neon-lime/10 border border-neon-lime/20 text-neon-lime text-sm font-bold"
            >
              <Check className="w-4 h-4" /> Profile Updated
            </motion.div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Photo & Quick Info */}
          <div className="lg:col-span-4 space-y-8">
            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-black/40 flex flex-col items-center text-center space-y-6">
              <ProfilePhotoUpload 
                currentPhotoURL={profile?.photoURL || user?.photoURL} 
                onSave={handlePhotoSave} 
              />
              <div>
                <h3 className="text-xl font-bold">{formData.displayName || 'User'}</h3>
                <p className="text-neon-cyan text-xs uppercase tracking-widest font-bold mt-1">{formData.jobTitle || 'Member'}</p>
              </div>
              <div className="w-full pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-3 text-white/40 text-sm">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{user?.email}</span>
                </div>
                {formData.location && (
                  <div className="flex items-center gap-3 text-white/40 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{formData.location}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-black/40 space-y-4">
              <div className="flex items-center gap-3 text-neon-lime">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-widest">Verified Account</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">Your profile is secured and verified by Sparkwavv's career engine.</p>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSave} className="glass-panel p-10 rounded-[2.5rem] border border-white/5 bg-black/40 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold ml-1">Display Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-neon-cyan/50 focus:bg-white/10 outline-none transition-all font-medium"
                      placeholder="Your name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold ml-1">Current Role</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-neon-cyan/50 focus:bg-white/10 outline-none transition-all font-medium"
                      placeholder="e.g. Product Designer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold ml-1">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-neon-cyan/50 focus:bg-white/10 outline-none transition-all font-medium"
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold ml-1">Website / Portfolio</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-neon-cyan/50 focus:bg-white/10 outline-none transition-all font-medium"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold ml-1">Professional Bio</label>
                <textarea 
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 focus:border-neon-cyan/50 focus:bg-white/10 outline-none transition-all font-medium resize-none"
                  placeholder="Tell us about your career journey..."
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit"
                  variant="neon" 
                  className="w-full py-5 text-lg"
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5" /> Save Changes</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
