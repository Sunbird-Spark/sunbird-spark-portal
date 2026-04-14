You are creating an implementation plan for a change in the Sunbird Spark Portal — a React 19 + Vite frontend with an Express 5 + Node.js backend, both TypeScript.

## Steps

1. **Understand the request** — If the task is vague, ask one focused clarifying question before proceeding.

2. **Explore the codebase** — Before planning, read relevant existing files:
   - Closest existing page or feature in `frontend/src/pages/`
   - Related components in `frontend/src/components/`
   - Existing API client functions in `frontend/src/api/`
   - Related backend routes/controllers/services
   - `contentDisplayConfig.ts` if the feature involves content types

3. **Produce the plan** using the structure below.

4. **Confirm before implementing** — Present the plan and ask the user to approve before making any changes.

---

## Plan Structure

### Summary
One sentence: what will be built, where it lives, and why.

### Files to Change
List every file that will be created or modified:
```
CREATE  frontend/src/pages/{feature}/index.tsx
CREATE  frontend/src/pages/{feature}/{FeatureName}Page.tsx
CREATE  frontend/src/components/{feature}/{ComponentName}.tsx
CREATE  frontend/src/components/{feature}/{ComponentName}.test.tsx
MODIFY  frontend/src/api/{feature}.ts
CREATE  frontend/src/hooks/use{Feature}.ts
CREATE  frontend/src/types/{feature}.ts
MODIFY  frontend/src/services/{feature}/index.ts
---
CREATE  backend/src/routes/{feature}.ts
CREATE  backend/src/controllers/{feature}Controller.ts
CREATE  backend/src/services/{feature}Service.ts
MODIFY  backend/src/app.ts   (register route)
```

### Layer Breakdown

**1. Frontend: Page & Routing**
- Route path and how it's registered in `App.tsx`
- Data fetching: TanStack Query key and query function
- Loading / error states

**2. Frontend: Components**
- Component names and props interfaces
- Which existing Radix UI primitives to use
- Tailwind/Sunbird tokens for styling
- Thumbnail placeholder: use `CardThumbnailBackground` if a thumbnail is needed

**3. Frontend: API Client** (`src/api/{feature}.ts`)
- Function signatures with request/response types
- Endpoint path (relative — proxied to backend via Vite config)

**4. Frontend: Types** (`src/types/{feature}.ts`)
- TypeScript interfaces for request/response/domain objects

**5. Backend: Route** (`src/routes/{feature}.ts`)
- HTTP method + path
- Input validation before controller
- Auth middleware: required or public?

**6. Backend: Controller** (`src/controllers/{feature}Controller.ts`)
- Request parsing
- Response shaping
- Error forwarding via `next(err)`

**7. Backend: Service** (`src/services/{feature}Service.ts`)
- Business logic
- Upstream Sunbird API calls (if any)
- Database queries (if any)

### i18n
- New translation keys needed in `src/locales/en.json` (and other locales)

### Environment Variables
- New env vars (must be added to `backend/.envExample` and `backend/src/config/env.ts`)

### Test Plan
```
Frontend:
- {ComponentName}.test.tsx
  - [ ] Renders with expected content
  - [ ] Handles loading state
  - [ ] Handles error state
  - [ ] thumbnail: '' exercises placeholder fallback (if applicable)

Backend:
- {feature}Controller.test.ts / {feature}Service.test.ts
  - [ ] Happy path
  - [ ] Invalid input → 400 response
  - [ ] Upstream failure → graceful error
```

### Build & Verify
```bash
# Frontend
cd frontend && npm run type-check && npm run lint && npm run test:run

# Backend
cd backend && npm run type-check && npm run lint && npm run test:run

# Full build
cd frontend && npm run build && cd ../backend && npm run build:full
```

### Open Questions
List any ambiguities that need resolution before implementation (empty if none).

---

Produce this plan now based on the user's request. If anything is unclear, ask first.
