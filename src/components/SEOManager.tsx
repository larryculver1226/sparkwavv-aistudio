import React from 'react';
import { useLocation } from 'react-router-dom';
import { SEO } from './SEO';

interface SEOManagerProps {
  step?: string;
}

export const SEOManager: React.FC<SEOManagerProps> = ({ step }) => {
  const location = useLocation();
  const path = location.pathname;

  // Global Defaults
  let routeTitle = 'SPARKWavv | AI-Powered Career Branding & Identity';
  let routeDescription = 'Transform your professional history into a high-impact identity with Skylar, your AI career guide.';
  let routeKeywords = 'career branding, AI career guide, job search, professional identity, resume builder, career wellness';

  // Specific Route overrides
  if (path.includes('/admin') || path.includes('/operations')) {
    routeTitle = 'Admin Operations | SPARKWavv';
  } else if (path.includes('/dashboard')) {
    routeTitle = 'Dashboard | SPARKWavv';
    routeDescription = 'Manage your career trajectory, access Wavvault artifacts, and view your dynamic pie of life.';
  } else if (path.includes('/profile')) {
    routeTitle = 'Profile | SPARKWavv';
  } else if (path.includes('/vault')) {
    routeTitle = 'Wavvault | SPARKWavv';
    routeDescription = 'Your cinematic timeline and secure artifact vault.';
  } else if (path.includes('/community')) {
    routeTitle = 'Community | SPARKWavv';
    routeDescription = 'Connect, share, and rise higher with the SPARKWavv network.';
  } else if (path.includes('/privacy')) {
    routeTitle = 'Privacy Policy | SPARKWavv';
  } else if (path.includes('/terms')) {
    routeTitle = 'Terms of Service | SPARKWavv';
  }

  // Step-based overrides (if on the main SPA container)
  if (path === '/') {
    switch (step) {
      case 'product-skylar':
        routeTitle = 'Meet Skylar - Your AI Guide | SPARKWavv';
        routeDescription = 'Your cinematic AI companion shaping your professional narrative.';
        routeKeywords = 'skylar ai, career ai guide, professional narrative ai, smart career coach';
        break;
      case 'product-features':
        routeTitle = 'Platform Features | SPARKWavv';
        routeDescription = 'Discover how the SPARKWavv engine unifies generative strategy, identity reconciliation, and market positioning.';
        break;
      case 'product-technology':
        routeTitle = 'Core Technology | SPARKWavv';
        routeDescription = 'Powered by Google Genkit, Firestore, and multimodal intelligence to reinvent professional identity.';
        break;
      case 'product-wavvault':
        routeTitle = 'Wavvault Technology | SPARKWavv';
        routeDescription = 'Securely store the essence of your professional journey in an AI-verified vault.';
        break;
      case 'company-vision':
        routeTitle = 'Our Vision | SPARKWavv';
        routeDescription = 'Redefining the mechanics of professional trajectory with zero-knowledge, emotional intelligence.';
        break;
      case 'company-about':
        routeTitle = 'About Us | SPARKWavv';
        routeDescription = 'Meet the visionary team behind the cinematic intelligence and platform.';
        break;
      case 'company-investors':
        routeTitle = 'Investor Relations | SPARKWavv';
        routeDescription = 'Partnering for the future. Scaling the next generation of professional identity.';
        break;
      case 'documentation':
        routeTitle = 'Documentation | SPARKWavv';
        break;
      case 'help-center':
        routeTitle = 'Help Center | SPARKWavv';
        break;
      case 'login':
        routeTitle = 'Login | SPARKWavv';
        break;
      case 'onboarding':
      case 'ignition':
      case 'module1':
      case 'module2':
      case 'module3':
      case 'module4':
      case 'module5':
      case 'processing':
      case 'synthesis':
      case 'results':
        routeTitle = 'Transformation Sequence | SPARKWavv';
        routeDescription = 'Guiding you through your professional narrative building loop.';
        break;
    }
  }

  return (
    <SEO 
      title={routeTitle} 
      description={routeDescription}
      keywords={routeKeywords}
    />
  );
};
