import esbuild from 'esbuild';
import { config } from './esbuild-config.mjs';

async function watch() {
    console.log('[esbuild] Starting watch mode...');
    const ctx = await esbuild.context(config);
    await ctx.watch();
    console.log('[esbuild] Watching for changes...');
}

watch().catch(() => process.exit(1));
