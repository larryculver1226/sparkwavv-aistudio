import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';

import firebaseConfig from '../firebase-applet-config.json';
import { validateConfig, config } from './config';

// Validate core configuration to prevent silent failures in Production
validateConfig();

// Firebase Configuration Checks
const firebaseApiKey = config.firebaseApiKey || firebaseConfig.apiKey;
const firebaseProjectId = config.firebaseProjectId || firebaseConfig.projectId;
const isFirebasePlaceholder = (val?: string) => !val || val.includes('PLACEHOLDER');

// We log the warning but proceed with rendering to enable "Degraded Mode"
if (isFirebasePlaceholder(firebaseProjectId) || isFirebasePlaceholder(firebaseApiKey)) {
  console.warn('⚠️ [Main] Configuration Missing: Proceeding in Degraded Mode. core services will be disabled.');
}

// Run connection test logic
const testFirestore = async () => {
    try {
      const { db, dbDefault, auth, isFirebaseConfigured } = await import('./lib/firebase');
      const { doc, getDocFromServer } = await import('firebase/firestore');
      const { onAuthStateChanged } = await import('firebase/auth');

      if (!isFirebaseConfigured) return;

      console.log('🛡️ [Main] Testing Firebase Auth connection...');
      console.log('🛡️ [Main] Current Hostname:', window.location.hostname);
      console.log('🛡️ [Main] Configured Project ID:', db.app.options.projectId);

      const authPromise = new Promise((resolve) => {
        console.log('🛡️ [Main] Waiting for onAuthStateChanged...');
        let timeoutId: any;
        const unsubscribe = onAuthStateChanged(
          auth,
          (user) => {
            console.log(
              '🛡️ [Main] onAuthStateChanged resolved:',
              user ? 'User logged in' : 'No user'
            );
            clearTimeout(timeoutId);
            unsubscribe();
            resolve(true);
          },
          (error) => {
            console.error('❌ [Main] onAuthStateChanged error:', error.message);
            clearTimeout(timeoutId);
            unsubscribe();
            resolve(false);
          }
        );
        // Timeout after 5s
        timeoutId = setTimeout(() => {
          console.warn('⚠️ [Main] onAuthStateChanged timed out after 5s');
          unsubscribe();
          resolve(false);
        }, 5000);
      });

      await authPromise;

      console.log('🛡️ [Main] Testing Firestore connection...');

      try {
        // Try named database first
        await getDocFromServer(doc(db, '_system_', 'connectivity_test'));
        console.log('🛡️ [Main] Firestore connection successful (Named Database).');
      } catch (namedError: any) {
        console.warn('⚠️ [Main] Named database failed:', namedError.message);

        if (
          namedError.message?.includes('offline') ||
          namedError.message?.includes('unavailable')
        ) {
          console.log('🛡️ [Main] Attempting fallback to (default) database...');
          try {
            await getDocFromServer(doc(dbDefault, '_system_', 'connectivity_test'));
            console.log('🛡️ [Main] Firestore connection successful (Default Database).');
          } catch (defaultError: any) {
            console.error('❌ [Main] Default database also failed:', defaultError.message);
            throw defaultError;
          }
        } else {
          throw namedError;
        }
      }
    } catch (error: any) {
      console.error('❌ [Main] Firestore connection failed:', error.message);
      console.error('❌ [Main] Error Code:', error.code);
      if (error.message?.includes('permission-denied')) {
        console.warn(
          '⚠️ [Main] Firestore permission denied. This is expected if rules are set, but connection is OK.'
        );
      } else if (
        error.message?.includes('not-found') ||
        error.message?.includes('invalid-argument')
      ) {
        console.error('❌ [Main] Firestore database not found or invalid. Check your database ID.');
      }
    }
  };

  testFirestore();

  // Dynamically import components to prevent top-level Firebase initialization
  Promise.all([
    import('./App'),
    import('./contexts/IdentityContext'),
    import('./components/ErrorBoundary'),
    import('react-helmet-async'),
  ]).then(([{ default: App }, { IdentityProvider }, { ErrorBoundary }, { HelmetProvider }]) => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <HelmetProvider>
          <ErrorBoundary>
            <Router>
              <IdentityProvider>
                <App />
              </IdentityProvider>
            </Router>
          </ErrorBoundary>
        </HelmetProvider>
      </StrictMode>
    );
  });