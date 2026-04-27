import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'debug-resolve',
        resolveId(id, importer) {
          if (id.includes('pdfjs') || id.includes('mammoth') || id.includes('lucide')) {
            console.log(`[DEBUG RESOLVE] ${id} imported by ${importer}`);
          }
          return null;
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      conditions: ['browser', 'module', 'import', 'default'],
      mainFields: ['browser', 'module', 'jsnext:main', 'jsnext', 'main'],
    },
    build: {
      reportCompressedSize: false,
      minify: false,
      sourcemap: false,
      rollupOptions: {
        external: ['pdfjs-dist', 'mammoth']
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false,
      allowedHosts: ['sparkwavv-aistudio-56128254195.us-east1.run.app'],
    },
  };
});
