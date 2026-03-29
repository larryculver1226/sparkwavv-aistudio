import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import App from './App.tsx';
import { IdentityProvider } from './contexts/IdentityContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const rawDomain = import.meta.env.VITE_AUTH0_DOMAIN;
const domain = rawDomain ? rawDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '') : undefined;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID?.trim();
const audience = import.meta.env.VITE_AUTH0_AUDIENCE?.trim();

const Auth0ProviderWithHistory = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  
  const onRedirectCallback = (appState: any) => {
    const target = appState?.returnTo || window.location.pathname;
    
    // If we are at root and have no appState, but we were just at /admin/login,
    // we should probably go to /admin
    if (target === '/' && !appState?.returnTo) {
      const lastPath = sessionStorage.getItem('auth0_last_path');
      if (lastPath === '/admin/login' || lastPath === '/admin') {
        navigate('/admin');
        return;
      }
    }
    
    navigate(target);
  };

  return (
    <Auth0Provider
      domain={domain!}
      clientId={clientId!}
      onRedirectCallback={onRedirectCallback}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: audience,
        scope: "openid profile email",
      }}
    >
      {children}
    </Auth0Provider>
  );
};

if (!domain || !clientId) {
  createRoot(document.getElementById('root')!).render(
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-xl">
        <h1 className="text-2xl font-bold text-white mb-4">Auth0 Configuration Missing</h1>
        <p className="text-white/60 mb-6">
          Please configure your Auth0 environment variables in the AI Studio Settings:
        </p>
        <ul className="text-left text-sm text-white/40 space-y-2 mb-6 font-mono">
          <li>• VITE_AUTH0_DOMAIN: [{domain || 'MISSING'}]</li>
          <li>• VITE_AUTH0_CLIENT_ID: [{clientId || 'MISSING'}]</li>
          <li>• VITE_AUTH0_AUDIENCE: [{audience || 'MISSING'}]</li>
        </ul>
        <p className="text-xs text-neon-cyan italic">
          Once configured, the application will be able to handle secure authentication.
        </p>
      </div>
    </div>
  );
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <Router>
          <Auth0ProviderWithHistory>
            <IdentityProvider>
              <App />
            </IdentityProvider>
          </Auth0ProviderWithHistory>
        </Router>
      </ErrorBoundary>
    </StrictMode>,
  );
}
