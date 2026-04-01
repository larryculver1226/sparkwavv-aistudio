import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';

// Firebase Configuration Checks
const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
const firebaseProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();
const isFirebasePlaceholder = (val?: string) => !val || val.includes('PLACEHOLDER');

// We also check the config file via dynamic import later, but for the initial screen 
// we check the environment variables which are the primary source of truth in AI Studio.
if (isFirebasePlaceholder(firebaseProjectId) || isFirebasePlaceholder(firebaseApiKey)) {
  createRoot(document.getElementById('root')!).render(
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white/5 border border-white/10 rounded-2xl p-10 text-center backdrop-blur-xl space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white">Application Configuration Missing</h1>
          <p className="text-white/60">
            Please configure your Firebase environment variables in the AI Studio Settings to enable core services:
          </p>
        </div>

        <div className="p-6 bg-white/5 rounded-xl border border-white/10 text-left">
          <h2 className="text-lg font-bold text-neon-lime mb-4">Firebase (Database & Identity)</h2>
          <ul className="text-xs text-white/40 space-y-2 font-mono">
            <li>• VITE_FIREBASE_API_KEY: {firebaseApiKey ? '✅' : '❌'}</li>
            <li>• VITE_FIREBASE_PROJECT_ID: {!isFirebasePlaceholder(firebaseProjectId) ? '✅' : '❌'}</li>
          </ul>
        </div>

        <div className="p-4 bg-neon-cyan/10 rounded-xl border border-neon-cyan/20">
          <p className="text-xs text-neon-cyan italic leading-relaxed">
            Once configured, the application will be able to handle secure authentication and real-time data persistence via Google Identity Platform.
          </p>
        </div>
      </div>
    </div>
  );
} else {
  // Run connection test
  const testFirestore = async () => {
    try {
      const { db, isFirebaseConfigured } = await import('./lib/firebase');
      const { doc, getDocFromServer } = await import('firebase/firestore');
      
      if (!isFirebaseConfigured) return;
      
      console.log('🛡️ [Main] Testing Firestore connection...');
      // Try to get a non-existent doc just to test connectivity
      await getDocFromServer(doc(db, '_system_', 'connectivity_test'));
      console.log('🛡️ [Main] Firestore connection successful.');
    } catch (error: any) {
      console.error('❌ [Main] Firestore connection failed:', error.message);
      if (error.message?.includes('permission-denied')) {
        console.warn('⚠️ [Main] Firestore permission denied. This is expected if rules are set, but connection is OK.');
      } else if (error.message?.includes('not-found') || error.message?.includes('invalid-argument')) {
        console.error('❌ [Main] Firestore database not found or invalid. Check your database ID.');
      }
    }
  };
  
  testFirestore();
  
  // Dynamically import components to prevent top-level Firebase initialization
  Promise.all([
    import('./App'),
    import('./contexts/IdentityContext'),
    import('./components/ErrorBoundary')
  ]).then(([{ default: App }, { IdentityProvider }, { ErrorBoundary }]) => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <ErrorBoundary>
          <Router>
            <IdentityProvider>
              <App />
            </IdentityProvider>
          </Router>
        </ErrorBoundary>
      </StrictMode>,
    );
  });
}
