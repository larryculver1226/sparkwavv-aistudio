import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { IdentityProvider } from './contexts/IdentityContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <IdentityProvider>
        <App />
      </IdentityProvider>
    </ErrorBoundary>
  </StrictMode>,
);
