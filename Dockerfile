
ARG DHI_IMAGE_DEV=dhi.io/node:24.12.0-debian12-dev
ARG DHI_IMAGE_RUNTIME=dhi.io/node:24.12.0-debian12

# Run npm ci with the same npm that resolves the lockfile in CI (Node 24.12.0
# bundles 11.6.2). The base image ships its own npm, and a different npm builds
# a different ideal tree for the @emnapi/* packages, so `npm ci` rejects the
# committed lockfile with "Missing: @emnapi/core@... from lock file".
# Installed under /tmp rather than -g so it works on non-root base images.
ARG NPM_VERSION=11.6.2

FROM ${DHI_IMAGE_DEV} AS frontend-builder
ARG NPM_VERSION
WORKDIR /app/frontend
COPY frontend/package*.json ./
COPY frontend/copy-assets.js ./
RUN npm install --no-save --prefix /tmp/npm npm@${NPM_VERSION} \
 && node /tmp/npm/node_modules/npm/bin/npm-cli.js ci --ignore-scripts \
 && rm -rf /tmp/npm && npm cache clean --force
COPY frontend/ .
# --ignore-scripts skips the postinstall hook, so run the (trusted, first-party) asset copy explicitly
RUN node copy-assets.js
RUN npm run build

FROM ${DHI_IMAGE_DEV} AS backend-builder
ARG NPM_VERSION
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --no-save --prefix /tmp/npm npm@${NPM_VERSION} \
 && node /tmp/npm/node_modules/npm/bin/npm-cli.js ci --ignore-scripts \
 && rm -rf /tmp/npm && npm cache clean --force
COPY backend/ .
ARG COMMIT_HASH
RUN node -e 'if (!process.env.COMMIT_HASH) { console.error("COMMIT_HASH is required"); process.exit(1); } const pkg = require("./package.json"); pkg.buildHash = process.env.COMMIT_HASH; require("fs").writeFileSync("./package.json", JSON.stringify(pkg, null, 2));'
RUN npm run build

# Stage 3: Install production-only dependencies (needs a shell, stays on the dev tag)
FROM ${DHI_IMAGE_DEV} AS prod-deps
ARG NPM_VERSION
WORKDIR /app
COPY --from=backend-builder /app/backend/package*.json ./
RUN npm install --no-save --prefix /tmp/npm npm@${NPM_VERSION} \
 && node /tmp/npm/node_modules/npm/bin/npm-cli.js ci --omit=dev --ignore-scripts \
 && rm -rf /tmp/npm && npm cache clean --force

# Stage 4: Final Production Image
FROM ${DHI_IMAGE_RUNTIME} AS production
# FROM node:24.12.0-slim
WORKDIR /app

# Copy production node_modules (already installed in the prod-deps stage)
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package*.json ./

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./dist

# Copy built frontend to public directory
COPY --from=frontend-builder /app/frontend/dist ./dist/public

# Set environment to production
ENV NODE_ENV=production

EXPOSE 3000

# Run as non-root user for security
USER node

CMD ["node", "dist/server.js"]
