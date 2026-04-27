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
      // Updated for Cloud Run Production
      hmr: false,
      host: true, 
      port: 8080, // Matches Cloud Run default port
      strictPort: true,
      allowedHosts: [
        'sparkwavv-aistudio-56128254195.us-east1.run.app'
      ],
    },
    // Adding preview config as well, in case your start command uses 'vite preview'
    preview: {
      host: true,
      port: 8080,
      strictPort: true,
      allowedHosts: [
        'sparkwavv-aistudio-56128254195.us-east1.run.app'
      ],
    }
  };
});
