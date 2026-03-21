import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Cookie, ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CookieSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    essential: true,
    analytics: true,
    marketing: false,
    personalization: true
  });

  const handleSave = () => {
    // In a real app, this would save to localStorage or a cookie
    console.log('Saved settings:', settings);
    alert('Cookie preferences saved successfully.');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-neon-cyan/30">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
          <div className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-neon-cyan" />
            <span className="font-display font-bold tracking-tighter">SPARK<span className="text-neon-cyan italic">Wavv</span></span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-8 pt-32 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <header className="space-y-4">
            <h1 className="text-5xl font-display font-bold tracking-tight">Cookie Settings</h1>
            <p className="text-white/40 text-lg max-w-2xl">
              Manage your cookie preferences. We use cookies to enhance your experience and analyze our traffic.
            </p>
          </header>

          <div className="space-y-6">
            <div className="glass-panel p-8 space-y-8">
              <div className="flex items-start justify-between gap-8">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Essential Cookies</h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    These cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in or filling in forms.
                  </p>
                </div>
                <div className="flex items-center h-6">
                  <div className="w-12 h-6 bg-neon-cyan/20 border border-neon-cyan/40 rounded-full relative opacity-50 cursor-not-allowed">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-neon-cyan rounded-full" />
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              <div className="flex items-start justify-between gap-8">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Analytics Cookies</h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.
                  </p>
                </div>
                <button 
                  onClick={() => setSettings(s => ({ ...s, analytics: !s.analytics }))}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 border ${settings.analytics ? 'bg-neon-cyan/20 border-neon-cyan/40' : 'bg-white/5 border-white/10'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 ${settings.analytics ? 'right-1 bg-neon-cyan' : 'left-1 bg-white/40'}`} />
                </button>
              </div>

              <div className="h-px bg-white/5" />

              <div className="flex items-start justify-between gap-8">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Personalization Cookies</h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third party providers whose services we have added to our pages.
                  </p>
                </div>
                <button 
                  onClick={() => setSettings(s => ({ ...s, personalization: !s.personalization }))}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 border ${settings.personalization ? 'bg-neon-cyan/20 border-neon-cyan/40' : 'bg-white/5 border-white/10'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 ${settings.personalization ? 'right-1 bg-neon-cyan' : 'left-1 bg-white/40'}`} />
                </button>
              </div>

              <div className="h-px bg-white/5" />

              <div className="flex items-start justify-between gap-8">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Marketing Cookies</h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.
                  </p>
                </div>
                <button 
                  onClick={() => setSettings(s => ({ ...s, marketing: !s.marketing }))}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 border ${settings.marketing ? 'bg-neon-cyan/20 border-neon-cyan/40' : 'bg-white/5 border-white/10'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 ${settings.marketing ? 'right-1 bg-neon-cyan' : 'left-1 bg-white/40'}`} />
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-8">
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-8 py-4 bg-neon-cyan text-black font-bold rounded-xl hover:bg-white transition-all hover:scale-105 active:scale-95"
              >
                <Save className="w-5 h-5" />
                Save Preferences
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
