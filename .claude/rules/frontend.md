---
paths:
  - "frontend/**"
---

# Frontend — React 19 + Vite SPA

React 19 + TypeScript + Vite SPA (Sunbird Ed Portal UI). In production the backend serves the frontend's static build from `dist/public/`. In development, Vite runs on port 5173 and proxies API/content requests to the backend on port 3000.

## Architecture

- **Routing**: React Router 7 (pages under `src/pages/`)
- **Server state**: TanStack Query v5
- **Styling**: Tailwind CSS with custom Sunbird design tokens (defined in `tailwind.config.ts` and `src/index.css`)
- **UI primitives**: Radix UI components
- **Font**: Rubik (`font-rubik` utility class)
- **Path alias**: `@/` → `frontend/src/`
- **i18n**: i18next with locale files under `src/locales/`

Key layers:
- `src/api/` — Axios-based API client functions
- `src/services/` — Business logic, display config (icons, colors per content type)
- `src/providers/` — React context providers (auth, query client, etc.)
- `src/rbac/` — Role-based access control logic
- `src/hooks/` — Custom React hooks
- `src/components/` — Reusable components; `src/pages/` — route-level pages

### Vite Dev Proxy

The following paths are proxied from Vite (5173) to backend (3000): `/portal`, `/content/preview`, `/assets/public`, `/content-plugins`, `/content-editor`, `/action`, `/plugins`, `/api`, `/generic-editor`.

## Commands

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

## Styling

- Use Tailwind CSS utility classes exclusively (no custom CSS unless adding a design token)
- Sunbird color tokens are defined in `tailwind.config.ts` — use `sunbird-*` color names
- Use `font-rubik` for Sunbird-branded text
- Dark mode via `class` strategy
