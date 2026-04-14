# Sunbird Portal

A modern, scalable educational platform built with React and Node.js, designed for national-scale deployment.Sunbird is a next-generation scalable open-source learning solution for teachers and tutors. Built for the 21st century with state-of-the-art technology, Sunbird runs natively in cloud/mobile environments. The open-source governance of Sunbird allows a massive community of nation-builders to co-create and extend the solution in novel ways.

## Architecture Overview

This is a **monorepo** containing two independent applications:

- **`frontend/`** — React 19 + TypeScript + Vite single-page application (Sunbird Ed Portal UI)
- **`backend/`** — Express 5 + TypeScript + Node.js API server

In **production**, the backend serves the frontend's static build from `dist/public/`. In **development**, Vite runs on port 5173 and proxies API/content requests to the backend on port 3000.

### Frontend Architecture

- **Routing**: React Router 7
- **Server state**: TanStack Query v5
- **Styling**: Tailwind CSS with custom Sunbird design tokens
- **UI primitives**: Radix UI components
- **i18n**: i18next + react-i18next
- **Path alias**: `@/` maps to `frontend/src/`

Key frontend layers:

| Directory | Purpose |
|---|---|
| `src/api/` | Axios-based API client functions |
| `src/auth/` | Authentication context (AuthContext) |
| `src/services/` | Business logic, display config (icons, colors per content type) |
| `src/providers/` | React context providers (i18n direction, telemetry) |
| `src/rbac/` | Role-based access control (ProtectedRoute, PermissionGate, OnboardingGuard) |
| `src/hooks/` | Custom React hooks |
| `src/components/` | Reusable UI components |
| `src/pages/` | Route-level page components |
| `src/utils/` | Shared utility functions |
| `src/types/` | TypeScript type definitions |
| `src/configs/` | App configuration (i18n, languages) |

### Backend Architecture

- **Framework**: Express 5 with TypeScript (ESM)
- **Auth**: OIDC/Keycloak (openid-client), Google OAuth, mobile Keycloak redirect
- **Databases**: YugabyteDB (via `pg`)
- **Sessions**: express-session with connect-pg-simple
- **Proxy**: http-proxy-middleware routes content/plugin requests to upstream Sunbird services
- **Logging**: winston
- **Security**: helmet
- **Validation**: ajv

Key backend layers:

| Directory | Purpose |
|---|---|
| `src/routes/` | Express route definitions |
| `src/controllers/` | Request handlers |
| `src/services/` | Business logic (user, org, tenant, telemetry, forms, auth) |
| `src/auth/` | OIDC provider and middleware |
| `src/middlewares/` | Express middleware (auth, session, validation) |
| `src/proxies/` | Upstream service proxy config (Kong, Knowlg, user) |
| `src/databases/` | Database access (forms, review comments) |
| `src/config/` | Typed environment variable access (`env.ts`) |
| `src/utils/` | Logger, session store, proxy utilities |
| `src/models/` | Data models |
| `src/types/` | TypeScript type definitions and declaration files |

### Vite Dev Proxy

In development, the following paths are proxied from Vite (port 5173) to the backend (port 3000):

`/portal`, `/content/preview`, `/assets/public`, `/content-plugins`, `/content-editor`, `/action`, `/plugins`, `/api`, `/generic-editor`

### Authentication & Authorization

**Backend** handles authentication via OIDC/Keycloak and Google OAuth. Once authenticated, user data is passed to the frontend.

**Frontend** manages auth state via React Context:

- `AuthContext` (`src/auth/AuthContext.tsx`) provides `user`, `isAuthenticated`, `login()`, `logout()`
- `useAuth()` hook — access auth state from any component
- User object contains `id`, `name`, and `roles`

**RBAC Roles** (defined in `AuthContext`):

`CONTENT_CREATOR` | `CONTENT_REVIEWER` | `BOOK_CREATOR` | `BOOK_REVIEWER` | `PUBLIC` | `ORG_ADMIN` | `COURSE_MENTOR`

**RBAC layer** (`src/rbac/`) provides route-level and component-level access control:

| Component | Purpose |
|---|---|
| `ProtectedRoute` | Wraps routes that require authentication |
| `PermissionGate` | Conditionally renders children based on user roles |
| `OnboardingGuard` | Ensures users complete onboarding before accessing the app |
| `AccessControl` | General-purpose access control wrapper |

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.1 | UI library |
| TypeScript | 5.9.3 | Type safety |
| Vite | 7.3.1 | Build tool & dev server |
| React Router | 7.x | Client-side routing |
| TanStack Query | 5.x | Server state management |
| Tailwind CSS | 3.4.x | Utility-first styling |
| Radix UI | Latest | Accessible UI primitives |
| Axios | 1.13.2 | HTTP client |
| i18next | 25.x | Internationalization |
| Recharts | 3.x | Charting |
| DayJS | 1.x | Date utilities |
| jsPDF | 4.x | PDF generation |
| DOMPurify | 3.x | HTML sanitization |

#### Sunbird Web Components

| Package | Version | Purpose |
|---|---|---|
| @project-sunbird/sunbird-pdf-player-web-component | 2.x | PDF content player |
| @project-sunbird/sunbird-video-player-web-component | 2.x | Video content player |
| @project-sunbird/sunbird-epub-player-web-component | 2.x | ePub content player |
| @project-sunbird/sunbird-quml-player-web-component | 6.x | QUML question player |
| @project-sunbird/sunbird-questionset-editor-web-component | 6.x | QuestionSet editor |
| @project-sunbird/sunbird-collection-editor-web-component | 2.x | Collection/course editor |
| @project-sunbird/telemetry-sdk | 2.x | Telemetry instrumentation |

> These web components require their static assets to be available at `public/assets/`. This is handled automatically by the `copy-assets.js` postinstall script (see [Frontend Setup](#2-frontend-setup)).

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 24.12.0 | Runtime |
| Express | 5.2.1 | Web framework |
| TypeScript | 5.9.3 | Type safety |
| openid-client | 6.x | OIDC/Keycloak authentication |
| google-auth-library | 10.x | Google OAuth |
| pg | 8.x | PostgreSQL client |
| @yugabytedb/pg | 8.x | YugabyteDB client |
| cassandra-driver | 4.x | Cassandra client |
| express-session | 1.x | Session management |
| connect-pg-simple | 10.x | PostgreSQL session store |
| http-proxy-middleware | 3.x | Upstream service proxying |
| helmet | 8.x | Security headers |
| winston | 3.x | Logging |
| ajv | 8.x | JSON schema validation |
| CORS | 2.8.5 | Cross-origin resource sharing |

### Development & Testing Tools

| Tool | Purpose |
|---|---|
| ESLint 9.x | Linting with TypeScript support |
| Prettier 3.x | Code formatting |
| Vitest 4.x | Unit & integration testing (frontend + backend) |
| @testing-library/react | React component testing |
| happy-dom | DOM environment for frontend tests |
| supertest | HTTP integration testing (backend) |
| tsx | TypeScript execution with hot reload (backend dev) |
| SonarQube | Code quality analysis |
| GitHub Actions | CI/CD pipeline |

## Prerequisites

- **Node.js**: 24.12.0
- **npm**: Latest version
- **Git**: For version control

### Using Node Version Manager (nvm)

```bash
# Install and use the correct Node.js version
nvm install 24.12.0
nvm use 24.12.0
```

## Project Structure

```
sunbird-portal/
├── .github/                        # CI/CD workflows & GitHub config
│   └── workflows/
│       ├── pull-requests.yml       # PR quality checks
│       └── image-push.yml          # Docker image build & push
├── frontend/                       # React application
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── api/                    # Axios API client & config
│   │   ├── assets/                 # Images, icons, static resources
│   │   ├── auth/                   # AuthContext provider
│   │   ├── components/             # Reusable UI components
│   │   │   ├── auth/               # Auth-related components
│   │   │   ├── collection/         # Collection/course components
│   │   │   ├── common/             # Shared components
│   │   │   ├── content/            # Content display components
│   │   │   ├── content-player/     # Content player wrapper
│   │   │   ├── editors/            # Content editors
│   │   │   ├── explore/            # Explore/search components
│   │   │   ├── home/               # Home page components
│   │   │   ├── landing/            # Landing page components
│   │   │   ├── layout/             # App layout (header, sidebar)
│   │   │   ├── players/            # Media players
│   │   │   ├── profile/            # User profile components
│   │   │   ├── reports/            # Report components
│   │   │   ├── signup/             # Signup flow components
│   │   │   ├── telemetry/          # Telemetry components
│   │   │   ├── ui/                 # Base UI primitives (Radix wrappers)
│   │   │   └── workspace/          # Workspace/content management
│   │   ├── configs/                # App config (i18n, languages)
│   │   ├── data/                   # Static/mock data
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Shared libraries & HTTP client
│   │   ├── locales/                # i18n translation files (en, fr, pt, ar)
│   │   ├── pages/                  # Route-level page components
│   │   ├── providers/              # Context providers (i18n, telemetry)
│   │   ├── rbac/                   # Role-based access control
│   │   ├── services/               # Business logic & API services
│   │   ├── styles/                 # Global styles & RTL overrides
│   │   ├── test/                   # Test utilities & setup
│   │   ├── types/                  # TypeScript type definitions
│   │   └── utils/                  # Utility functions
│   ├── eslint.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
├── backend/                        # Express API server
│   ├── src/
│   │   ├── auth/                   # OIDC provider & middleware
│   │   ├── config/                 # Environment config (env.ts)
│   │   ├── controllers/            # Request handlers
│   │   ├── databases/              # Database access layer
│   │   ├── middlewares/             # Express middleware
│   │   ├── models/                 # Data models
│   │   ├── proxies/                # Upstream service proxies
│   │   ├── routes/                 # Route definitions
│   │   ├── services/               # Business logic services
│   │   ├── types/                  # TypeScript types & declarations
│   │   ├── utils/                  # Logger, session store, utilities
│   │   ├── app.ts                  # Express app setup
│   │   └── server.ts               # Server entry point
│   ├── .envExample                 # Environment variable template
│   ├── eslint.config.js
│   ├── tsconfig.json
│   └── package.json
├── docs/                           # Documentation
├── Dockerfile                      # Multi-stage production build
├── sonar-project.properties        # SonarQube configuration
├── CLAUDE.md                       # Claude Code instructions
└── README.md                       # This file
```

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Sunbird-Spark/sunbird-spark-portal.git
cd sunbird-spark-portal
```

### 2. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

> **Note**: `npm install` triggers a **postinstall script** (`copy-assets.js`) that copies Sunbird web component assets (content players, editors, icons) from `node_modules` into `public/assets/`. This runs automatically and is required for content players (PDF, video, ePub, QUML) to render correctly.

#### Available Frontend Scripts

```bash
# Start development server (http://localhost:5173)
npm run dev

# Run tests
npm run test            # Vitest in watch mode
npm run test:run        # Single test run
npm run test:coverage   # Coverage report (70% thresholds)

# Code quality
npm run lint            # Check for linting errors
npm run lint:fix        # Auto-fix linting errors
npm run type-check      # TypeScript type checking (no emit)
npm run format          # Prettier format all files
npm run format:check    # Check formatting (CI)
```

Run a single test file:
```bash
npx vitest run src/path/to/file.test.tsx
```

### 3. Backend Setup

Open a new terminal, navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

#### i. Configure Environment Variables

**Before running the backend**, you must create and configure your `.env` file:

```bash
cd backend
cp .envExample .env
```

**Important**: After copying, edit `backend/.env` and make these changes for local development:

1. **Change `ENVIRONMENT`** from `test` to `local`:
   ```bash
   ENVIRONMENT=local
   ```

2. **Remove or comment out `NODE_ENV`**:
   ```bash
   # NODE_ENV=test  (comment out or delete this line)
   ```

3. **Update other values** with your actual configuration (database credentials, API tokens, etc.)

> **Note**: The `.envExample` file is configured for automated testing (CI/CD). For local development, you must change `ENVIRONMENT=test` to `ENVIRONMENT=local` and remove the `NODE_ENV` variable.

#### Environment Configuration Files

Three files manage environment configuration in the `backend` folder:

- **`backend/.env`** - Your local values (create from `.envExample`)
- **`backend/.envExample`** - Template with required variables
- **`backend/src/config/env.ts`** - TypeScript module with defaults

#### Configuration Types

**Required Variables** - Must be set in `.env`:
- Listed in `.envExample`
- Examples: Database credentials, API tokens, session secrets

**Optional Variables** - Have defaults, don't need to be in `.env`:
- NOT listed in `.envExample`
- Defined only in `env.ts` with default values
- Examples: `PORT`, `SUNBIRD_PORTAL_LOG_LEVEL`

#### Adding New Configuration

**Optional Variable** (has a default):
Add ONLY to `env.ts`:
```typescript
//Optional ENVIRONMENT VARIABLES
NEW_OPTIONAL_CONFIG: env.NEW_OPTIONAL_CONFIG || 'default-value',
```

**Required Variable** (must be configured):
1. Add to `env.ts`:
```typescript
NEW_REQUIRED_CONFIG: env.NEW_REQUIRED_CONFIG || 'fallback-value',
```
2. Add to `.envExample`:
```bash
NEW_REQUIRED_CONFIG=your-value-here
```
3. Add to your `.env` and notify team members

#### Environment Variables Reference

##### Server Configuration

| Variable | Description | Required | Default |
|---|---|---|---|
| `ENVIRONMENT` | Runtime environment (`local`, `test`, `production`) | Yes | `''` |
| `PORT` | Backend server port | No | `3000` |
| `DOMAIN_URL` | Public-facing domain URL of the portal | Yes | `''` |
| `SERVER_URL` | Internal server URL (used for OIDC callbacks, etc.) | Yes | `''` |
| `DEVELOPMENT_REACT_APP_URL` | Frontend dev server URL (used in local/dev mode only) | Yes | `''` |
| `SUNBIRD_PORTAL_LOG_LEVEL` | Winston log level (`debug`, `info`, `warn`, `error`) | No | `debug` |

##### Session Configuration

| Variable | Description | Required | Default |
|---|---|---|---|
| `SUNBIRD_SESSION_SECRET` | Secret key used to sign session cookies | Yes | `default_secret` |
| `SUNBIRD_ANONYMOUS_SESSION_TTL` | Anonymous session time-to-live in milliseconds | No | `60000` |
| `SUNBIRD_PORTAL_SESSION_STORE` | Session store type (`in-memory` or `yugabyte`) | No | `in-memory` |

##### Kong API Gateway

| Variable | Description | Required | Default |
|---|---|---|---|
| `KONG_URL` | Base URL of the Kong API gateway | Yes | `''` |
| `KONG_ANONYMOUS_FALLBACK_TOKEN` | API token for anonymous (unauthenticated) requests | Yes | `''` |
| `KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN` | API token for anonymous device registration | Yes | `''` |
| `KONG_LOGGEDIN_FALLBACK_TOKEN` | API token for authenticated user requests | Yes | `''` |
| `KONG_LOGGEDIN_DEVICE_REGISTER_TOKEN` | API token for authenticated device registration | Yes | `''` |

##### Keycloak / OIDC Authentication

| Variable | Description | Required | Default |
|---|---|---|---|
| `PORTAL_REALM` | Keycloak realm name | Yes | `''` |
| `PORTAL_AUTH_SERVER_CLIENT` | Keycloak client ID for the portal | Yes | `''` |
| `OIDC_ISSUER_URL` | OIDC issuer URL (Keycloak realm endpoint) | Yes | `''` |

##### Google OAuth

| Variable | Description | Required | Default |
|---|---|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth client ID (web) | Yes | `''` |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth client secret (web) | Yes | `''` |
| `GOOGLE_OAUTH_CLIENT_ID_IOS` | Google OAuth client ID (iOS app) | Yes | `''` |
| `KEYCLOAK_GOOGLE_CLIENT_ID` | Keycloak Google identity provider client ID | Yes | `''` |
| `KEYCLOAK_GOOGLE_CLIENT_SECRET` | Keycloak Google identity provider client secret | Yes | `''` |

##### Mobile Authentication

| Variable | Description | Required | Default |
|---|---|---|---|
| `KEYCLOAK_ANDROID_CLIENT_ID` | Keycloak confidential client ID for Android native auth | Yes | `''` |
| `KEYCLOAK_ANDROID_CLIENT_SECRET` | Keycloak confidential client secret for Android | Yes | `''` |
| `KEYCLOAK_GOOGLE_ANDROID_CLIENT_ID` | Keycloak client ID for Google Sign-In on Android | Yes | `''` |
| `KEYCLOAK_GOOGLE_ANDROID_CLIENT_SECRET` | Keycloak client secret for Google Sign-In on Android | Yes | `''` |

##### Database (YugabyteDB)

| Variable | Description | Required | Default |
|---|---|---|---|
| `SUNBIRD_YUGABYTE_HOST` | YugabyteDB host address | Yes | `''` |
| `SUNBIRD_YUGABYTE_PORT` | YugabyteDB YSQL port | No | `5433` |
| `SUNBIRD_YUGABYTE_YCQL_PORT` | YugabyteDB YCQL (Cassandra-compatible) port | No | `9042` |
| `SUNBIRD_YUGABYTE_DATABASE` | YugabyteDB database name | No | `portal` |
| `SUNBIRD_YUGABYTE_USER` | YugabyteDB username | No | `''` |
| `SUNBIRD_YUGABYTE_PASSWORD` | YugabyteDB password | No | `''` |
| `FORMS_DB_NAME` | Cassandra keyspace for forms data | Yes | `''` |
| `CONTENT_REVIEW_COMMENT_DB_NAME` | Cassandra keyspace for review comments | Yes | `''` |

##### Google reCAPTCHA

| Variable | Description | Required | Default |
|---|---|---|---|
| `GOOGLE_RECAPTCHA_SECRET` | Server-side reCAPTCHA secret key | No | `''` |
| `GOOGLE_RECAPTCHA_VERIFY_URL` | reCAPTCHA verification endpoint | No | `https://www.google.com/recaptcha/api/siteverify` |

##### Upstream Services

| Variable | Description | Required | Default |
|---|---|---|---|
| `LEARN_BASE_URL` | Base URL for the Learner service | No | `http://userorg-service:9000` |
| `KNOWLG_MW_BASE_URL` | Base URL for the Knowledge middleware service | No | `http://knowledge-mw-service:5000` |

#### Available Backend Scripts

```bash
# Start development server with hot reload (http://localhost:3000)
npm run dev

# Run tests
npm run test            # Vitest in watch mode
npm run test:run        # Single test run
npm run test:coverage   # Coverage report

# Code quality
npm run lint            # Check for linting errors
npm run lint:fix        # Auto-fix linting errors
npm run type-check      # TypeScript type checking (no emit)
npm run format          # Prettier format all files
npm run format:check    # Check formatting (CI)
```

### 4. Running Both Services (Development)

Open two terminals:

1. **Terminal 1 (Backend)**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Terminal 2 (Frontend)**:
   ```bash
   cd frontend
   npm run dev
   ```

The Vite dev server proxies API requests (e.g., `/api`, `/portal`, `/action`) to the backend automatically. Access the application at **http://localhost:5173**.

## Application URLs

| Environment | Frontend | Backend API |
|---|---|---|
| Development | http://localhost:5173 | http://localhost:3000 |
| Production | Served by backend | http://localhost:3000 |

## Docker

A multi-stage `Dockerfile` is provided for production deployments:

```bash
# Build the Docker image (COMMIT_HASH is required)
docker build --build-arg COMMIT_HASH=$(git rev-parse --short HEAD) -t sunbird-portal .

# Run the container
docker run -p 3000:3000 --env-file backend/.env sunbird-portal
```

The Dockerfile performs three stages:
1. **Frontend build** — Installs dependencies and builds the React app
2. **Backend build** — Compiles TypeScript and stamps the build hash
3. **Production image** — Copies built assets with production-only dependencies, runs as non-root user

## Testing

Both frontend and backend use **Vitest** as the test framework with a **70% coverage threshold** across branches, functions, lines, and statements.

### Frontend Testing

Uses Vitest + happy-dom + @testing-library/react:

```bash
cd frontend
npm run test            # Watch mode
npm run test:run        # Single run
npm run test:coverage   # With coverage report
```

### Backend Testing

Uses Vitest + supertest for integration tests:

```bash
cd backend
npm run test            # Watch mode
npm run test:run        # Single run
npm run test:coverage   # With coverage report
```

## Code Quality

This project enforces strict code quality standards:

### TypeScript Configuration
- **Strict mode enabled** across both frontend and backend
- **`noUncheckedIndexedAccess`** — always handle potentially-undefined array/object access
- **`noUnusedLocals: true`** in backend
- **Max file length** — 250 lines per file (500 for test files)

### ESLint Rules
- TypeScript-first linting configuration
- Prettier integration for consistent formatting

### Theming (Tailwind CSS + Sunbird Design Tokens)

All styling uses Tailwind CSS utility classes. Custom Sunbird design tokens are defined as CSS variables in `src/index.css` and mapped in `tailwind.config.ts`.

**Colors** — Use `sunbird-*` classes (e.g., `text-sunbird-dark-blue`, `bg-sunbird-yellow`):

| Category | Example tokens |
|---|---|
| Brand | `sunbird-dark-blue`, `sunbird-yellow`, `sunbird-light-blue`, `sunbird-medium-blue` |
| Accent | `sunbird-ginger`, `sunbird-brick`, `sunbird-sunflower`, `sunbird-ivory` |
| Nature | `sunbird-leaf`, `sunbird-forest`, `sunbird-moss`, `sunbird-wave` |
| Dark | `sunbird-ink`, `sunbird-charcoal`, `sunbird-obsidian`, `sunbird-jamun` |
| Status | `sunbird-success-green`, `sunbird-status-completed-*`, `sunbird-status-ongoing-*` |
| Grays | `sunbird-gray-75`, `sunbird-gray-82`, `sunbird-gray-b2`, `sunbird-gray-d0`, etc. |

**Shadows** — `shadow-sunbird-sm`, `shadow-sunbird-md`, `shadow-sunbird-lg`

**Font** — `font-rubik` for Sunbird-branded text

**Dark mode** — Enabled via `class` strategy (add `dark` class to root element)

### Pre-commit Quality Checks
```bash
# Frontend
cd frontend
npm run lint && npm run type-check

# Backend
cd backend
npm run lint && npm run type-check
```

## Code Formatting (Prettier)

This repository uses Prettier to enforce consistent code formatting.

```bash
cd frontend
npm run format       # formats files
npm run format:check # checks formatting (CI)
```

```bash
cd backend
npm run format       # formats files
npm run format:check # checks formatting (CI)
```

## CI/CD Pipeline

The project includes GitHub Actions workflows:

### Pull Request Checks ([.github/workflows/pull-requests.yml](.github/workflows/pull-requests.yml))

Runs on every pull request against Node.js 24.12.0:

| Check | Frontend | Backend |
|---|---|---|
| Lint (ESLint) | Yes | Yes |
| Build | Yes | Yes |
| Test with coverage | Yes | Yes |

### Docker Image Push ([.github/workflows/image-push.yml](.github/workflows/image-push.yml))

Triggers on **git tag pushes** (any tag). Builds the Docker image and pushes it to a container registry.

- **Image tag format**: `tagname_commitsha` (lowercase)
- **Supported registries** (configured via `vars.REGISTRY_PROVIDER`):
  - `gcp` — GCP Artifact Registry
  - `azure` — Azure Container Registry
  - `dockerhub` — Docker Hub
  - Default — GitHub Container Registry (ghcr.io)

### SonarQube

Code quality analysis is configured via `sonar-project.properties`. Coverage reports from both frontend and backend are aggregated for analysis.

## Development Workflow

1. **Create feature branch**: `git checkout -b feature/your-feature-name`
2. **Make changes** following TypeScript strict guidelines
3. **Run quality checks**:
   ```bash
   cd frontend && npm run lint && npm run type-check
   cd ../backend && npm run lint && npm run type-check
   ```
4. **Run tests**:
   ```bash
   cd frontend && npm run test:run
   cd ../backend && npm run test:run
   ```
5. **Commit changes**: Follow conventional commit format (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`)
6. **Create pull request**: CI pipeline will run automatically

## Internationalization (i18n)

### Supported Languages
| Language | Code | Direction | Font |
|---|---|---|---|
| English | `en` | LTR | Rubik |
| French | `fr` | LTR | Rubik |
| Portuguese | `pt` | LTR | Rubik |
| Arabic | `ar` | RTL | Noto Sans Arabic |

### Architecture

- **Library**: i18next + react-i18next
- **Config**: `frontend/src/configs/i18n.ts`
- **Language config**: `frontend/src/configs/languages.ts` (codes, labels, direction, fonts)
- **Locale files**: `frontend/src/locales/{en,fr,pt,ar}.json`
- **Hook**: `useAppI18n()` in `frontend/src/hooks/useAppI18n.ts` — provides `t()`, `changeLanguage()`, `isRTL`, `dir`
- **Storage**: `localStorage('app-language')`

### RTL (Arabic) Support

- `I18nDirectionProvider` (`frontend/src/providers/I18nDirectionProvider.tsx`) sets `dir` attribute on `<html>` and `<body>`, and applies the Arabic font via CSS variable
- RTL-specific CSS overrides are in `frontend/src/styles/rtl.css`

### Keycloak Login Page Integration

Portal and Keycloak share the same origin in production, so they share `localStorage`. The Keycloak theme (`sunbird`) reads `localStorage('app-language')` on page load and sets the `KEYCLOAK_LOCALE` cookie to render login/password pages in the user's selected language.

Key files:
- `useAppI18n.ts` — writes language to `localStorage` on change
- `i18n.ts` — reads language from `localStorage` on init
- Keycloak `template.ftl` — reads `localStorage`, sets `KEYCLOAK_LOCALE` cookie, reloads once

### Mobile App Language Sync

The mobile app opens portal pages (signup, forgot-password) in InAppBrowser, which has a separate `localStorage`. To pass the language:
1. Mobile `AuthWebviewService.ts` appends `?lang=XX` to the URL
2. Portal's `ForgotPassword.tsx` reads the `lang` param on mount and writes to `localStorage`
3. Keycloak `template.ftl` reads `localStorage` and applies the locale

### Adding a New Language
1. Add config to `frontend/src/configs/languages.ts`
2. Create `frontend/src/locales/XX.json` with all translated keys
3. Import and register in `frontend/src/configs/i18n.ts`
4. If RTL, add overrides to `frontend/src/styles/rtl.css`
5. Add mapping in Keycloak `template.ftl` locale JS and create `messages_XX.properties`

---

## Mobile App Integration

The portal serves as both a standalone web application and a backend for the **Sunbird mobile app**. Mobile integration spans two patterns:

1. **Native API endpoints** — Token-based authentication with no server-side sessions, called directly from mobile native code
2. **InAppBrowser pages** — Portal pages (signup, forgot-password) opened inside the mobile app's WebView

### Backend Mobile API Routes

All mobile routes are mounted at `/mobile` (defined in `backend/src/routes/mobileRoutes.ts`, registered in `backend/src/app.ts`):

| Endpoint | Method | Purpose |
|---|---|---|
| `/mobile/keycloak/login` | POST | Native username/password login via Keycloak ROPC grant |
| `/mobile/google/auth/android` | POST | Google Sign-In for Android/iOS using native SDK ID token |
| `/mobile/auth/v1/refresh/token` | POST | Token refresh for whitelisted mobile Keycloak clients |

Key backend files:

| File | Purpose |
|---|---|
| `backend/src/routes/mobileRoutes.ts` | Route definitions |
| `backend/src/controllers/mobileKeycloakController.ts` | Handles native Keycloak username/password login |
| `backend/src/controllers/mobileGoogleController.ts` | Handles Google Sign-In (verifies ID token, finds/creates user) |
| `backend/src/controllers/mobileTokenRefreshController.ts` | Validates client whitelist and refreshes tokens |
| `backend/src/services/mobileAuthService.ts` | Core mobile auth logic (token verification, user management, Keycloak ROPC) |

### Authentication Flows

**Native Login (Keycloak ROPC):**
1. Mobile app sends `emailId` + `password` to `/mobile/keycloak/login`
2. Backend authenticates via Keycloak Resource Owner Password Credentials grant using the Android client
3. Returns `access_token` + `refresh_token` directly (no server session)

**Google Sign-In:**
1. Mobile app authenticates with Google natively and obtains an ID token
2. Mobile app sends the ID token (via `X-GOOGLE-ID-TOKEN` header) + `emailId` to `/mobile/google/auth/android`
3. Backend verifies the Google token with the platform-specific client ID (`GOOGLE_OAUTH_CLIENT_ID` for Android, `GOOGLE_OAUTH_CLIENT_ID_IOS` for iOS)
4. Backend finds or creates the Sunbird user, then creates a Keycloak session via the Google Android client
5. Returns `access_token` + `refresh_token` with `offline_access` scope

**Token Refresh:**
1. Mobile app sends `refresh_token` in the request body to `/mobile/auth/v1/refresh/token`
2. Backend decodes the JWT to identify the issuing Keycloak client and validates it against a whitelist
3. Verifies the caller's bearer token against the echo API
4. Returns new `access_token` + `refresh_token`

### InAppBrowser Pages

The mobile app opens these portal pages inside an InAppBrowser (WebView):

| Page | URL | Purpose |
|---|---|---|
| Sign Up | `/signup` | New user registration |
| Forgot Password | `/forgot-password` | Password reset flow |

**Query parameters** passed by the mobile app:

| Parameter | Example | Purpose |
|---|---|---|
| `client` | `mobileApp` | Signals the request originates from the mobile app |
| `redirect_uri` | `org.sunbird.app://oauth2callback` | App-scheme URL to redirect after success |
| `error_callback` | `<url>` | Redirect target on error |
| `lang` | `fr` | Language code for i18n sync (see [Mobile App Language Sync](#mobile-app-language-sync)) |

**How it works:**
1. Mobile app opens the portal URL with params: `?client=mobileApp&redirect_uri=<app-scheme>&lang=<code>`
2. Portal calls `persistMobileContext()` to save context to `sessionStorage` (survives Keycloak redirects)
3. After the flow completes, portal redirects to the `redirect_uri` (converted to Android `intent://` URL if needed)
4. The `lang` param is applied to i18n on mount so the page renders in the mobile app's language

Key frontend files:

| File | Purpose |
|---|---|
| `frontend/src/utils/forgotPasswordUtils.ts` | Mobile context utilities: `isMobileApp()`, `persistMobileContext()`, `getSafeRedirectUrl()` |
| `frontend/src/pages/forgotPassword/ForgotPassword.tsx` | Forgot password page with mobile language sync and redirect handling |
| `frontend/src/pages/forgotPassword/PasswordResetSuccess.tsx` | Success page with mobile-aware redirect |
| `frontend/src/pages/signup/SignUp.tsx` | Sign up page with mobile context persistence |
| `frontend/src/components/signup/SignUpForm.tsx` | Sign up form with mobile-aware "Already have account?" link |

### Mobile Environment Variables

Mobile auth requires the following environment variables (see [Environment Variables Reference](#environment-variables-reference) for full details):

- `KEYCLOAK_ANDROID_CLIENT_ID` / `KEYCLOAK_ANDROID_CLIENT_SECRET` — Android native Keycloak client
- `KEYCLOAK_GOOGLE_ANDROID_CLIENT_ID` / `KEYCLOAK_GOOGLE_ANDROID_CLIENT_SECRET` — Google Sign-In Keycloak client
- `GOOGLE_OAUTH_CLIENT_ID` — Google OAuth client ID (Android)
- `GOOGLE_OAUTH_CLIENT_ID_IOS` — Google OAuth client ID (iOS)

---

## Troubleshooting

### Common Issues

1. **Node.js version mismatch**: Ensure you're using Node.js 24.12.0
   ```bash
   nvm install 24.12.0
   nvm use 24.12.0
   ```

2. **Port conflicts**:
   - Frontend (5173) and Backend (3000) ports should be available
   - Change ports in [vite.config.ts](frontend/vite.config.ts) or [server.ts](backend/src/server.ts) if needed

3. **TypeScript errors**: Run type check to identify issues
   ```bash
   cd frontend && npm run type-check
   cd ../backend && npm run type-check
   ```

4. **Backend won't start**: Ensure you've created `backend/.env` from `.envExample` and set `ENVIRONMENT=local`

## Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vite.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)
- [Vitest](https://vitest.dev/)

## License

MIT License - see LICENSE file for details.
