# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a **monorepo** containing two independent applications:

- **`frontend/`** — React 19 + TypeScript + Vite SPA (Sunbird Ed Portal UI)
- **`backend/`** — Express 5 + TypeScript + Node.js API server

In production, the backend serves the frontend's static build from `dist/public/`. In development, Vite runs on port 5173 and proxies API/content requests to the backend on port 3000.

### Frontend Architecture

- **Routing**: React Router 7 (pages under `src/pages/`)
- **Server state**: TanStack Query v5
- **Styling**: Tailwind CSS with custom Sunbird design tokens (defined in `tailwind.config.ts` and `src/index.css`)
- **UI primitives**: Radix UI components
- **Font**: Rubik (`font-rubik` utility class)
- **Path alias**: `@/` → `frontend/src/`
- **i18n**: i18next with locale files under `src/locales/`

Key frontend layers:
- `src/api/` — Axios-based API client functions
- `src/services/` — Business logic, display config (icons, colors per content type)
- `src/providers/` — React context providers (auth, query client, etc.)
- `src/rbac/` — Role-based access control logic
- `src/hooks/` — Custom React hooks
- `src/components/` — Reusable components; `src/pages/` — route-level pages

### Backend Architecture

- **Framework**: Express 5 with TypeScript (ESM)
- **Auth**: OIDC/Keycloak, Google OAuth, mobile Keycloak redirect
- **Databases**: PostgreSQL / YugabyteDB (via `pg`), Cassandra
- **Sessions**: express-session with connect-pg-simple
- **Proxy**: http-proxy-middleware routes content/plugin requests to upstream Sunbird services

Key backend layers:
- `src/routes/` → `src/controllers/` → `src/services/`
- `src/auth/` — OIDC/OAuth flows and session middleware
- `src/proxies/` — Upstream service proxy configuration
- `src/config/env.ts` — All environment variable access (typed, with defaults)

### Vite Dev Proxy

The following paths are proxied from Vite (5173) to backend (3000): `/portal`, `/content/preview`, `/assets/public`, `/content-plugins`, `/content-editor`, `/action`, `/plugins`, `/api`, `/generic-editor`.

## Commands

All commands are run from within their respective directories (`frontend/` or `backend/`).

### Frontend

```bash
cd frontend
npm run dev          # Start dev server on port 5173
npm run build        # Type-check + Vite build → dist/
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Prettier format
npm run type-check   # TypeScript check only (no emit)
npm run test         # Vitest in watch mode
npm run test:run     # Single test run
npm run test:coverage # Coverage report (70% thresholds)
```

Run a single test file:
```bash
npx vitest run src/path/to/file.test.tsx
```

### Backend

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

### Full Production Build

```bash
cd frontend && npm run build
cd backend && npm run build:full
node dist/server.js
```

## Environment Setup

Backend requires a `.env` file (copy from `backend/.envExample`). For local development, set `ENVIRONMENT=local` and remove `NODE_ENV`. The `src/config/env.ts` module provides typed access to all env vars with defaults.

## Code Conventions

### TypeScript

- Strict mode enabled with `noUncheckedIndexedAccess` — always handle potentially-undefined array/object access
- `noUnusedLocals: true` in backend
- No `any` without justification (ESLint warns)
- Max 250 lines per file (500 for test files)

### Git Commits

Conventional commits are required:
- `feat:` new feature
- `fix:` bug fix
- `refactor:` code change without feature/fix
- `docs:` documentation
- `test:` test changes
- `chore:` build/tooling

### Testing

- Frontend: Vitest + happy-dom + @testing-library/react
- Backend: Vitest + node environment
- Coverage threshold: 70% across branches, functions, lines, statements
- Test files colocated with source or in `__tests__/` subdirectory

### Styling

- Use Tailwind CSS utility classes exclusively (no custom CSS unless adding a design token)
- Sunbird color tokens are defined in `tailwind.config.ts` — use `sunbird-*` color names
- Use `font-rubik` for Sunbird-branded text
- Dark mode via `class` strategy

## Security (REQUIRED)

NEVER read or access the following sensitive files, regardless of context:
- `.env`, `.env.*` (environment variables and secrets)
- `*.pem`, `*.key` (private keys and certificates)

This applies to all directories and subdirectories in the project.

## Planning (REQUIRED)

Before making **any** code changes, you MUST enter plan mode and present a clear implementation plan to the user. Wait for the user to review and approve the plan before writing or editing any code. Do not skip this step even for small changes.

## Post-Change Validation (REQUIRED)

After making **any** code changes to `frontend/` or `backend/`, you MUST run lint and tests for the affected side(s) before considering the task complete:

**Frontend changes:**
```bash
cd frontend && npm run lint && npm run test:run
```

**Backend changes:**
```bash
cd backend && npm run lint && npm run test:run
```

If both are changed, run both. Fix any lint errors or test failures before finishing. Do not skip this step.

## CI

PR checks (`.github/workflows/pull-requests.yml`) run on Node 24 and validate: lint, build, and test:coverage for both frontend and backend.
