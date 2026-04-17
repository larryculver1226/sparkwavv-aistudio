import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        external: [
          'node:perf_hooks', 'worker_threads', 'crypto', 'node:crypto',
          'fs', 'node:fs', 'path', 'node:path', 'os', 'node:os',
          'stream', 'node:stream', 'util', 'node:util', 'url', 'node:url',
          'http', 'node:http', 'https', 'node:https', 'buffer', 'node:buffer',
          'net', 'node:net', 'tls', 'node:tls', 'zlib', 'node:zlib', 'events', 'node:events'
        ],
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false,
    },
  };
});
