'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Sparkles,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  Database,
  MessageSquareWarning,
  ShieldCheck,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useIdentity } from '../contexts/IdentityContext';
import { auth } from '../lib/firebase';

interface NavItem {
  label: string;
  href: string;
  subItems?: { label: string; href: string }[];
}

const UserProfileModal: React.FC<{ isOpen: boolean; onClose: () => void; onNavigate: (href: string) => void; logout: () => void }> = ({ isOpen, onClose, onNavigate, logout }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-dark-surface border border-white/10 rounded-3xl p-8 relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-display font-bold mb-6">User Profile</h2>
        
        <div className="space-y-4">
          <button
            onClick={() => {
              onClose();
              onNavigate('settings');
            }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-neon-cyan/30 transition-all text-left"
          >
            <Settings className="w-5 h-5 text-neon-cyan" />
            <span className="font-medium text-white">Settings</span>
          </button>
          
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-neon-magenta/30 transition-all text-left"
          >
            <LogOut className="w-5 h-5 text-neon-magenta" />
            <span className="font-medium text-white">Sign Out</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const FeedbackModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [issueType, setIssueType] = useState('Bug');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let attachmentUrl = null;
      if (attachment) {
        const { storageService } = await import('../services/storageService');
        attachmentUrl = await storageService.uploadFeedbackAttachment(attachment);
      }

      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          issueType,
          description,
          stepsToReproduce,
          attachmentUrl,
          url: window.location.href,
          browserInfo: navigator.userAgent,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit feedback');
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setDescription('');
        setStepsToReproduce('');
        setAttachment(null);
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-dark-surface border border-white/10 rounded-3xl p-8 relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-display font-bold mb-6">Report an Issue</h2>
        
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-neon-lime/20 text-neon-lime flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <p className="text-xl font-bold text-neon-lime">Feedback Submitted!</p>
            <p className="text-white/60 mt-2">Thank you for helping us improve Sparkwavv.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-2">Issue Type</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-neon-cyan focus:outline-none transition-colors"
              >
                <option value="Bug">Bug Report</option>
                <option value="Feature Request">Feature Request</option>
                <option value="General Feedback">General Feedback</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-2">Description</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-neon-cyan focus:outline-none transition-colors"
                placeholder="Please describe the issue or feedback..."
              />
            </div>

            {issueType === 'Bug' && (
              <div>
                <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-2">Steps to Reproduce (Optional)</label>
                <textarea
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  rows={3}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-neon-cyan focus:outline-none transition-colors"
                  placeholder="1. Go to... 2. Click on..."
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-2">Attachment (Optional)</label>
              <input
                type="file"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-neon-cyan focus:outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neon-cyan/10 file:text-neon-cyan hover:file:bg-neon-cyan/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-neon-cyan text-black font-bold hover:bg-white transition-all disabled:opacity-50 mt-4"
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

const navItems: NavItem[] = [
  { label: 'Home', href: 'landing' },
  {
    label: 'Product',
    href: '#product',
    subItems: [
      { label: 'Skylar', href: 'product-skylar' },
      { label: 'Features', href: 'product-features' },
      { label: 'Technology', href: 'product-technology' },
      { label: 'Wavvault', href: 'product-wavvault' },
    ],
  },
  {
    label: 'Company',
    href: '#company',
    subItems: [
      { label: 'Vision', href: 'company-vision' },
      { label: 'About Us', href: 'company-about' },
      { label: 'Investors', href: 'company-investors' },
      { label: 'Give a Little', href: 'company-give' },
    ],
  },
  { label: 'Pricing', href: 'pricing' },
];

interface NavBarProps {
  onNavigate: (href: string) => void;
}

/**
 * NavBar Component
 *
 * A highly responsive, modern Top Navigation Bar for SPARKWavv.
 * Integrates with Firebase Auth for dynamic login/dashboard states.
 *
 * Note: Uses standard anchor tags for preview compatibility.
 * In a Next.js environment, replace <a> with <Link> from 'next/link'.
 */
export const NavBar: React.FC<NavBarProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const { user, profile, loading, status, login, loginWithPopup, logout } = useIdentity();
  const isConfirmed = status === 'authenticated' || status === 'ready';
  const isDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    if (href.startsWith('/')) {
      navigate(href);
    } else {
      onNavigate(href);
    }

    setIsOpen(false);
    setActiveDropdown(null);
  };

  return (
    <>
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <UserProfileModal isOpen={isUserProfileOpen} onClose={() => setIsUserProfileOpen(false)} onNavigate={onNavigate} logout={logout} />
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        scrolled
          ? 'py-4 bg-black/90 backdrop-blur-xl border-b border-white/10'
          : 'py-8 bg-transparent'
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-12 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-4 group cursor-pointer"
          onClick={() => onNavigate('landing')}
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center group-hover:bg-neon-cyan/20 transition-all duration-500 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-neon-cyan" />
          </div>
          <span className="text-xl md:text-2xl font-display font-bold tracking-tighter text-white">
            SPARK<span className="text-neon-cyan italic">Wavv</span>
          </span>
        </div>

        {/* Desktop Navigation & Auth */}
        <div className="hidden md:flex items-center gap-12">
          <div className="flex items-center gap-8 lg:gap-12">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative group"
                onMouseEnter={() => item.subItems && setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <a
                  href={item.href}
                  onClick={(e) => handleNavClick(item.href, e)}
                  className="text-lg font-medium text-white hover:text-neon-cyan transition-colors flex items-center gap-1.5 py-2"
                >
                  {item.label}
                  {item.subItems && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === item.label ? 'rotate-180' : ''}`}
                    />
                  )}
                </a>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {item.subItems && activeDropdown === item.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 w-56 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] mt-3"
                    >
                      <div className="py-3">
                        {item.subItems.map((sub) => (
                          <a
                            key={sub.label}
                            href={sub.href}
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavClick(sub.href, e);
                            }}
                            className="block px-6 py-3 text-base text-white/80 hover:text-neon-cyan hover:bg-white/5 transition-all"
                          >
                            {sub.label}
                          </a>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!item.subItems && (
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-neon-cyan transition-all duration-300 group-hover:w-full shadow-[0_0_10px_#00f3ff]" />
                )}
              </div>
            ))}
          </div>

          {/* Auth Button */}
          <div className="flex justify-end items-center gap-3">
            {!loading &&
              (user ? (
                isConfirmed ? (
                  <>
                    {!isDashboard && (
                      <button
                        onClick={() => navigate(`/dashboard/${profile?.uid || user.uid}`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-neon-cyan" />
                        <span>Dashboard Login</span>
                      </button>
                    )}
                    {isDashboard && (
                      <>
                        <button
                          onClick={() => navigate('/vault')}
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
                        >
                          <Database className="w-3.5 h-3.5 text-neon-magenta" />
                          <span>Vault</span>
                        </button>
                        <button
                          onClick={() => setIsUserProfileOpen(true)}
                          className="p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all duration-300"
                          title="User Profile"
                        >
                          <User className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setIsFeedbackOpen(true)}
                      className="p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all duration-300"
                      title="Report Issue / Feedback"
                    >
                      <MessageSquareWarning className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/40 italic">Awaiting Verification</span>
                    <button
                      onClick={logout}
                      className="p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-neon-magenta hover:border-neon-magenta/30 transition-all duration-300"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all duration-300"
                  >
                    Dashboard Login
                  </button>
                  <button
                    onClick={() => setIsFeedbackOpen(true)}
                    className="p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all duration-300"
                    title="Report Issue / Feedback"
                  >
                    <MessageSquareWarning className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex justify-end col-start-3">
          <button
            className="p-2 text-white hover:text-neon-cyan transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 top-[80px] md:hidden bg-black/98 backdrop-blur-3xl border-t border-white/5 overflow-y-auto"
          >
            <div className="px-8 py-12 flex flex-col gap-10">
              {navItems.map((item) => (
                <div key={item.label} className="space-y-6">
                  <a
                    href={item.href}
                    onClick={(e) => {
                      if (!item.subItems) handleNavClick(item.href, e);
                    }}
                    className="text-4xl font-display font-bold text-white hover:text-neon-cyan transition-colors block"
                  >
                    {item.label}
                  </a>
                  {item.subItems && (
                    <div className="pl-6 flex flex-col gap-6 border-l border-white/10">
                      {item.subItems.map((sub) => (
                        <a
                          key={sub.label}
                          href={sub.href}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavClick(sub.href, e);
                          }}
                          className="text-2xl font-medium text-white/60 hover:text-neon-cyan transition-colors"
                        >
                          {sub.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-8 border-t border-white/10">
                {!loading &&
                  (user ? (
                    isConfirmed ? (
                      <div className="flex flex-col gap-4">
                        {!isDashboard && (
                          <button
                            onClick={() => {
                              navigate(`/dashboard/${profile?.uid || user.uid}`);
                              setIsOpen(false);
                            }}
                            className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-2xl flex items-center justify-center gap-3"
                          >
                            <LayoutDashboard className="w-7 h-7 text-neon-cyan" />
                            Dashboard Login
                          </button>
                        )}
                        {isDashboard && (
                          <>
                            <button
                              onClick={() => {
                                navigate('/vault');
                                setIsOpen(false);
                              }}
                              className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-2xl flex items-center justify-center gap-3"
                            >
                              <Database className="w-7 h-7 text-neon-magenta" />
                              Vault
                            </button>
                            <button
                              onClick={() => {
                                setIsUserProfileOpen(true);
                                setIsOpen(false);
                              }}
                              className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-2xl flex items-center justify-center gap-3"
                            >
                              <User className="w-7 h-7 text-neon-cyan" />
                              User Profile
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setIsFeedbackOpen(true);
                            setIsOpen(false);
                          }}
                          className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-2xl flex items-center justify-center gap-3"
                        >
                          <MessageSquareWarning className="w-7 h-7 text-neon-cyan" />
                          Report Issue
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="text-center py-4 px-6 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20">
                          <p className="text-neon-cyan font-bold text-xl">Awaiting Verification</p>
                          <p className="text-white/40 text-sm mt-1">
                            Please check your email to activate your account.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            logout();
                            setIsOpen(false);
                          }}
                          className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-2xl flex items-center justify-center gap-3"
                        >
                          <LogOut className="w-7 h-7 text-neon-magenta" />
                          Sign Out
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col gap-4">
                      <button
                        onClick={() => {
                          navigate('/login');
                          setIsOpen(false);
                        }}
                        className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-2xl"
                      >
                        Dashboard Login
                      </button>
                      <button
                        onClick={() => {
                          setIsFeedbackOpen(true);
                          setIsOpen(false);
                        }}
                        className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-2xl flex items-center justify-center gap-3"
                      >
                        <MessageSquareWarning className="w-7 h-7 text-neon-cyan" />
                        Report Issue
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </>
  );
};

export default NavBar;
