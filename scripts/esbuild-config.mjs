import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outfile: 'dist/public/bundle.js',
  minify: process.env.NODE_ENV === 'production',
  sourcemap: process.env.NODE_ENV !== 'production',
  format: 'esm',
  loader: {
    '.svg': 'file',
    '.png': 'file',
    '.jpg': 'file',
    '.woff2': 'file',
    '.woff': 'file',
  },
  publicPath: '/', // for the loader
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    ...(() => {
      const viteVars = Object.keys(process.env).filter(key => key.startsWith('VITE_'));
      console.log(`[BUILD] Found ${viteVars.length} VITE_ environment variables:`, viteVars.map(k => `${k}=${process.env[k] ? 'PRESENT' : 'MISSING'}`));
      return viteVars.reduce((acc, key) => {
        acc[`process.env.${key}`] = JSON.stringify(process.env[key]);
        acc[`import.meta.env.${key}`] = JSON.stringify(process.env[key]);
        return acc;
      }, {});
    })(),
    'process.env': JSON.stringify(
      Object.keys(process.env)
        .filter(key => key.startsWith('VITE_') || key === 'NODE_ENV')
        .reduce((acc, key) => ({ ...acc, [key]: process.env[key] }), {})
    ),
    'import.meta.env': JSON.stringify(
      Object.keys(process.env)
        .filter(key => key.startsWith('VITE_') || key === 'NODE_ENV')
        .reduce((acc, key) => ({ ...acc, [key]: process.env[key], MODE: process.env.NODE_ENV || 'production', PROD: process.env.NODE_ENV === 'production', DEV: process.env.NODE_ENV !== 'production' }), {})
    ),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV || 'production'),
    'import.meta.env.PROD': JSON.stringify(process.env.NODE_ENV === 'production'),
    'import.meta.env.DEV': JSON.stringify(process.env.NODE_ENV !== 'production'),
    // some react packages expect `global`
    'global': 'window'
  },
  external: ['pdfjs-dist', 'mammoth'],
  alias: {
    '@': path.resolve(process.cwd(), '.'),
  }
};
