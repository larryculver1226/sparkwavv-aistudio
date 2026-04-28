import esbuild from 'esbuild';
import { config } from './esbuild-config.mjs';

async function build() {
    console.log('[esbuild] Building client for production...');
    config.minify = true;
    config.sourcemap = false;
    await esbuild.build(config);
    console.log('[esbuild] Client build complete.');
}

build().catch(() => process.exit(1));
