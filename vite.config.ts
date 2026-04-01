import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  console.log('BUILD ENV:', {
    VITE_AUTH0_AUDIENCE: env.VITE_AUTH0_AUDIENCE,
    VITE_AUTH0_DOMAIN: env.VITE_AUTH0_DOMAIN,
    VITE_AUTH0_CLIENT_ID: env.VITE_AUTH0_CLIENT_ID,
  });
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'import.meta.env.VITE_AUTH0_AUDIENCE': JSON.stringify('https://api.sparkwavv.ai'),
      'import.meta.env.VITE_AUTH0_DOMAIN': JSON.stringify('sparkwavv.us.auth0.com'),
      'import.meta.env.VITE_AUTH0_CLIENT_ID': JSON.stringify('P5JTIBryXi4NJ6ZFOurh4BPUzbJMPI6z'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false,
    },
  };
});
