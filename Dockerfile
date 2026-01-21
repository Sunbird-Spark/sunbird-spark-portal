# Stage 1: Build Frontend
FROM node:22 AS builder-frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Build Backend
FROM node:22 AS builder-backend
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm install
COPY backend/ .
RUN npm run build

# Stage 3: Final Image
FROM node:22
WORKDIR /app

# Install production dependencies
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev

# Copy backend compiled files
COPY --from=builder-backend /app/backend/dist ./dist

# Copy frontend build to public folder in dist
COPY --from=builder-frontend /app/frontend/dist ./dist/public

# Expose port (default 3000 as per envConfig)
EXPOSE 3000

# Start the server
CMD ["node", "dist/server.js"]
