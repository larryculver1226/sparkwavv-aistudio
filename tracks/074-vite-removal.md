# Track 074: Vite Removal & Dev/Prod Unification

## 1. Goal
Replace Vite with a unified, predictable build pipeline using `esbuild` to ensure the Development (`dev`) environment behaves exactly like the Production (`start`/`build`) environment. This eliminates the divergence caused by Vite's Dev Middleware, which strictly enforces allowed hosts and intercepts requests differently than the production Express server.

## 2. Proposed Architecture
- **Bundler**: `esbuild` for fast, simple frontend bundling (React/TSX).
- **CSS Engine**: `@tailwindcss/cli` to compile the Tailwind CSS without relying on a Vite plugin.
- **Server**: `server.ts` (Express) will serve static files universally in *both* Dev and Prod. There will be no special "Dev Middleware" interacting with the frontend assets.

## 3. Step-by-Step Implementation Plan

### Step 1: Package Management
1. **Remove**: `vite`, `@vitejs/plugin-react` and any Vite-specific configuration files (`vite.config.ts`).
2. **Install**: 
   - `concurrently` (to run our build watchers and dev server simultaneously).
   - `@tailwindcss/cli` (to compile Tailwind v4).
   - `chokidar` or similar (if we need to write a custom watch script, though `esbuild` has native watch mode).

### Step 2: Build Scripts Configuration
Create two simple Node.js scripts in a `scripts/` folder:
- `scripts/build-client.js`: Uses the ESBuild API to bundle `src/main.tsx` into an output folder (e.g., `dist/public/bundle.js`).
- `scripts/watch-client.js`: Uses ESBuild's watch mode for continuous rebuilds during dev.

### Step 3: Tailwind CLI Integration
Update `package.json` scripts to run the Tailwind CLI to compile `src/index.css` into `dist/public/style.css`.

### Step 4: Refactor `server.ts`
1. **Remove** all Vite Dev Middleware logic (e.g., `createViteServer`, `vitePromise`, App SPA fallback via Vite).
2. **Unify** the Express app to always use `express.static('dist/public')` and a standard `*` catch-all route to serve `index.html` regardless of `NODE_ENV`.
3. The Express server becomes strictly an API handler and a standardized Static File Server.

### Step 5: Adjust `index.html`
1. Move `index.html` to a root template or copy it to `dist/public/` during the build.
2. Change the Vite module import (`<script type="module" src="/src/main.tsx"></script>`) to point directly to the compiled bundle (`<script src="/bundle.js"></script>`).
3. Explicitly link the compiled Tailwind stylesheet (`<link rel="stylesheet" href="/style.css">`).

### Step 6: Update `package.json` Scripts
We will structure the scripts so `dev` runs watchers and `build` runs one-off production bundlers:
```json
{
  "scripts": {
    "dev:css": "tailwindcss -i ./src/index.css -o ./dist/public/style.css --watch",
    "dev:js": "node scripts/watch-client.js",
    "dev:server": "tsx watch server.ts",
    "dev": "concurrently \"npm run dev:css\" \"npm run dev:js\" \"npm run dev:server\"",
    "build:css": "tailwindcss -i ./src/index.css -o ./dist/public/style.css --minify",
    "build:js": "node scripts/build-client.js",
    "build:server": "esbuild server.ts --bundle --platform=node --target=node20 --outfile=dist/server.js --format=esm --packages=external --minify",
    "build": "npm run build:css && npm run build:js && npm run build:server && cp index.html dist/public/ && cp firebase-applet-config.json dist/",
    "start": "node dist/server.js"
  }
}
```

## 5. Execution
1. Extracted and installed `@tailwindcss/cli` and `concurrently` natively.
2. Formatted a powerful set of unified `esbuild` configuration files (`scripts/esbuild-config.mjs`, `build-client.mjs`, `watch-client.mjs`) modeling Vite's loader hooks.
3. Completely stripped out the fragile `vitePromise` Dev Middleware and `appType: "spa"` fallback inside `server.ts`. Replaced it with one unified Express static intercept handler serving out of `dist/public`.
4. Extracted `@vitejs/plugin-react` and `vite` entirely representing a 100% decoupling from the Vite engine.
5. Successfully updated `CHANGELOG.md` and compiled seamlessly. Dev-Server and Prod-Server are now exactly 1:1 consistent.
