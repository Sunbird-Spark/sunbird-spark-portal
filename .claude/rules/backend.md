---
paths:
  - "backend/**"
---

# Backend — Express 5 BFF

Express 5 + TypeScript + Node.js API server (BFF). Serves the frontend's static build from `dist/public/` in production; dev runs on port 3000.

## Architecture

- **Framework**: Express 5 with TypeScript (ESM)
- **Auth**: OIDC/Keycloak, Google OAuth, mobile Keycloak redirect
- **Databases**: PostgreSQL / YugabyteDB (via `pg`), Cassandra
- **Sessions**: express-session with connect-pg-simple
- **Proxy**: http-proxy-middleware routes content/plugin requests to upstream Sunbird services

Key layers:
- `src/routes/` → `src/controllers/` → `src/services/`
- `src/auth/` — OIDC/OAuth flows and session middleware
- `src/proxies/` — Upstream service proxy configuration
- `src/config/env.ts` — All environment variable access (typed, with defaults)

### Tenant-isolation caveat

This BFF sits behind the Kong gateway, which injects identity headers (`x-authenticated-userid`, `x-channel-id`, etc.) that downstream services trust. Any client-supplied `x-*` identity header this BFF forwards upstream is a privilege/tenant-isolation concern — never forward untrusted identity headers.

## Commands

```bash
cd backend
npm run dev          # tsx watch (hot reload) on port 3000
npm run build        # TypeScript compile → dist/
npm run build:full   # Build backend + copy frontend dist to dist/public/
npm run start        # Production: build:full + node dist/server.js
npm run lint         # ESLint check
npm run type-check   # TypeScript check only
npm run test         # Vitest watch (loads .envExample)
npm run test:run     # Single test run (loads .envExample)
npm run test:coverage # Coverage report
```

## Environment Setup

Backend requires a `.env` file (copy from `backend/.envExample`). For local development, set `ENVIRONMENT=local` and remove `NODE_ENV`. The `src/config/env.ts` module provides typed access to all env vars with defaults.

- `noUnusedLocals: true` is enabled in the backend.
