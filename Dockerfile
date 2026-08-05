
ARG DHI_IMAGE_DEV=dhi.io/node:24.12.0-debian12-dev
ARG DHI_IMAGE_RUNTIME=dhi.io/node:24.12.0-debian12

# Stage 1: Build Frontend
# FROM node:24.12.0-slim AS frontend-builder
# WORKDIR /app/frontend
# COPY frontend/package*.json ./
# COPY frontend/copy-assets.js ./
# RUN npm i && npm cache clean --force
# COPY frontend/ .
# RUN npm run build
FROM ${DHI_IMAGE_DEV} AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
COPY frontend/copy-assets.js ./
RUN npm i && npm cache clean --force
COPY frontend/ .
RUN npm run build

# Stage 2: Build Backend
# FROM node:24.12.0-slim AS backend-builder
# WORKDIR /app/backend
# COPY backend/package*.json ./
# RUN npm i && npm cache clean --force
# COPY backend/ .
# ARG COMMIT_HASH
# RUN node -e 'if (!process.env.COMMIT_HASH) { console.error("COMMIT_HASH is required"); process.exit(1); } const pkg = require("./package.json"); pkg.buildHash = process.env.COMMIT_HASH; require("fs").writeFileSync("./package.json", JSON.stringify(pkg, null, 2));'
# RUN npm run build
FROM ${DHI_IMAGE_DEV} AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm i && npm cache clean --force
COPY backend/ .
ARG COMMIT_HASH
RUN node -e 'if (!process.env.COMMIT_HASH) { console.error("COMMIT_HASH is required"); process.exit(1); } const pkg = require("./package.json"); pkg.buildHash = process.env.COMMIT_HASH; require("fs").writeFileSync("./package.json", JSON.stringify(pkg, null, 2));'
RUN npm run build

# Stage 3: Install production-only dependencies (needs a shell, stays on the dev tag)
FROM ${DHI_IMAGE_DEV} AS prod-deps
WORKDIR /app
COPY --from=backend-builder /app/backend/package*.json ./
RUN npm i --only=production && npm cache clean --force

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

# # Copy package files and install production dependencies only
# COPY --from=backend-builder /app/backend/package*.json ./
# RUN npm i --only=production && npm cache clean --force

# # Copy built backend
# COPY --from=backend-builder /app/backend/dist ./dist

# # Copy built frontend to public directory
# COPY --from=frontend-builder /app/frontend/dist ./dist/public

# # Set environment to production
# ENV NODE_ENV=production

# EXPOSE 3000

# # Run as non-root user for security
# USER node

# CMD ["node", "dist/server.js"]
