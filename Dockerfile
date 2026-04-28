FROM node:20-alpine AS builder

# Install build tools for native extensions like better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
# We use npm run build which compiles both vite assets and server.ts to dist/
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install build tools for production installation as well
RUN apk add --no-cache python3 make g++

# In production, we need the standard node modules for the server to run.
# However, esbuild bundles the server.ts but sets --packages=external 
# meaning we STILL NEED node_modules for production backend execution.
COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firebase-applet-config.json ./

EXPOSE 3000
# Cloud Run sets the PORT env variable. We updated the server to use process.env.PORT.
CMD ["node", "dist/server.js"]
