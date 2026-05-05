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
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    ...Object.keys(process.env).filter(key => key.startsWith('VITE_') && !/PRIVATE_KEY|SECRET|CREDENTIAL|SERVICE_ACCOUNT/i.test(key)).reduce((acc, key) => {
      acc[`process.env.${key}`] = JSON.stringify(process.env[key]);
      return acc;
    }, {}),
    // some react packages expect `global`
    'global': 'window'
  },
  external: ['pdfjs-dist', 'mammoth'],
  alias: {
    '@': path.resolve(process.cwd(), '.'),
  }
};
