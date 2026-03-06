import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Key, 
  Database, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Copy,
  Terminal,
  Info
} from 'lucide-react';

interface EnvStatus {
  VITE_FIREBASE_API_KEY: string;
  VITE_FIREBASE_AUTH_DOMAIN: string;
  VITE_FIREBASE_PROJECT_ID: string;
  VITE_FIREBASE_STORAGE_BUCKET: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  VITE_FIREBASE_APP_ID: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
  USER_COUNT: number;
}

export const FirebaseSetup: React.FC = () => {
  const [status, setStatus] = useState<EnvStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [setupMode, setSetupMode] = useState<'new' | 'existing'>('new');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/admin/env-status');
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (error) {
        console.error("Error checking Firebase status:", error);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const steps = setupMode === 'new' ? [
    {
      title: "1. Create a Firebase Project",
      description: "Go to the Firebase Console and create a new project named 'Sparkwavv'.",
      link: "https://console.firebase.google.com/",
      icon: Cloud
    },
    {
      title: "2. Register a Web App",
      description: "In your project settings, add a new Web App. Copy the configuration object.",
      icon: Terminal
    },
    {
      title: "3. Enable Authentication",
      description: "Go to 'Authentication' and enable the 'Email/Password' provider.",
      icon: ShieldCheck
    },
    {
      title: "4. Create a Service Account",
      description: "Go to Project Settings > Service Accounts. Click 'Generate new private key'. This is for the backend Admin SDK.",
      icon: Key
    }
  ] : [
    {
      title: "1. Select Existing Project",
      description: "Open your existing project in the Firebase Console.",
      link: "https://console.firebase.google.com/",
      icon: Cloud
    },
    {
      title: "2. Get Web Config",
      description: "Go to Project Settings > General. Scroll down to your apps and copy the Firebase config object.",
      icon: Terminal
    },
    {
      title: "3. Verify Authentication",
      description: "Ensure Email/Password provider is enabled in the Authentication section.",
      icon: ShieldCheck
    },
    {
      title: "4. Generate Admin Key",
      description: "Go to Project Settings > Service Accounts. Click 'Generate new private key' to get the Admin SDK credentials.",
      icon: Key
    }
  ];

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      {/* Connection Status */}
      <section className="glass-panel p-8 rounded-3xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-display font-bold flex items-center gap-3">
            <Database className="w-6 h-6 text-neon-cyan" />
            Connection Status
          </h3>
          <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
            status?.VITE_FIREBASE_API_KEY && status?.FIREBASE_PRIVATE_KEY 
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full ${status?.VITE_FIREBASE_API_KEY && status?.FIREBASE_PRIVATE_KEY ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
            {status?.VITE_FIREBASE_API_KEY && status?.FIREBASE_PRIVATE_KEY ? 'Fully Configured' : 'Partial Setup'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest">Client SDK (Vite)</h4>
            <div className="space-y-3">
              {[
                { label: 'API Key', status: !!status?.VITE_FIREBASE_API_KEY },
                { label: 'Project ID', status: !!status?.VITE_FIREBASE_PROJECT_ID },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-sm text-white/60">{item.label}</span>
                  {item.status ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest">Admin SDK (Server)</h4>
            <div className="space-y-3">
              {[
                { label: 'Client Email', status: !!status?.FIREBASE_CLIENT_EMAIL },
                { label: 'Private Key', status: !!status?.FIREBASE_PRIVATE_KEY },
                { label: 'Project ID Match', status: status?.FIREBASE_PROJECT_ID === status?.VITE_FIREBASE_PROJECT_ID && !!status?.FIREBASE_PROJECT_ID },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-sm text-white/60">{item.label}</span>
                  {item.status ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Setup Guide */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Info className="w-6 h-6 text-neon-cyan" />
            <h3 className="text-2xl font-display font-bold">Setup Instructions</h3>
          </div>
          
          <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
            <button 
              onClick={() => setSetupMode('new')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                setupMode === 'new' ? 'bg-neon-cyan text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              New Project
            </button>
            <button 
              onClick={() => setSetupMode('existing')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                setupMode === 'existing' ? 'bg-neon-cyan text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              Existing Project
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <step.icon className="w-5 h-5 text-neon-cyan" />
                </div>
                <div className="space-y-2 flex-1">
                  <h4 className="font-bold text-white">{step.title}</h4>
                  <p className="text-sm text-white/40 leading-relaxed">{step.description}</p>
                  {step.link && (
                    <a 
                      href={step.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-neon-cyan font-bold hover:underline mt-2"
                    >
                      Open Console <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Environment Variables */}
      <section className="glass-panel p-8 rounded-3xl border border-white/10 bg-black/40">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-display font-bold">Environment Variables</h3>
          <p className="text-xs text-white/40 italic">Add these to your .env file</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-neon-cyan uppercase tracking-[0.2em]">Client-Side (Vite)</h4>
            <div className="grid grid-cols-1 gap-3">
              {[
                'VITE_FIREBASE_API_KEY',
                'VITE_FIREBASE_AUTH_DOMAIN',
                'VITE_FIREBASE_PROJECT_ID',
                'VITE_FIREBASE_STORAGE_BUCKET',
                'VITE_FIREBASE_MESSAGING_SENDER_ID',
                'VITE_FIREBASE_APP_ID'
              ].map((key) => {
                const value = (status as any)?.[key] || '';
                return (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-black border border-white/5 font-mono text-xs group">
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <span className="text-neon-cyan/60 text-[10px] uppercase tracking-widest">{key}</span>
                      <span className="text-white/80 truncate max-w-[400px]">{value || 'Not Set'}</span>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(value, key)}
                      disabled={!value}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-white/20 hover:text-white transition-all disabled:opacity-20 flex-shrink-0"
                    >
                      {copied === key ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h4 className="text-xs font-bold text-purple-500 uppercase tracking-[0.2em]">Server-Side (Admin)</h4>
            <div className="grid grid-cols-1 gap-3">
              {[
                'FIREBASE_PROJECT_ID',
                'FIREBASE_CLIENT_EMAIL',
                'FIREBASE_PRIVATE_KEY'
              ].map((key) => {
                const value = (status as any)?.[key] || '';
                return (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-black border border-white/5 font-mono text-xs group">
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <span className="text-purple-500/60 text-[10px] uppercase tracking-widest">{key}</span>
                      <span className="text-white/80 truncate max-w-[400px]">
                        {key === 'FIREBASE_PRIVATE_KEY' && value ? '••••••••••••••••' : (value || 'Not Set')}
                      </span>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(value, key)}
                      disabled={!value}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-white/20 hover:text-white transition-all disabled:opacity-20 flex-shrink-0"
                    >
                      {copied === key ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
