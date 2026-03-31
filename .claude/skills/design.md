You are helping design a new feature for the Sunbird Spark Portal — a React 19 + TypeScript SPA (Vite) with an Express 5 + Node.js backend.

The user has described a feature or requirement. Produce a concrete architecture design that fits the project's established patterns.

## Design Output Structure

### 1. Feature Summary
One paragraph: what the feature does, which layer(s) it lives in (frontend-only, full-stack, backend-only), and why it's needed.

### 2. API Design (if backend changes needed)
```
METHOD /api/{path}
Headers: Authorization: Bearer {token}  (if authenticated)

Request body:
{
  field: type,
  ...
}

Response (200):
{
  result: { ... },
  responseCode: "OK"
}

Error responses:
- 400: {validation failure reason}
- 401: unauthenticated
- 403: unauthorised (RBAC)
- 500: upstream/internal failure
```

Identify which backend route file to update or create.

### 3. Layer-by-Layer Design

#### Route → Controller (Backend)
- File: `backend/src/routes/{name}.ts`
- HTTP method + path + auth middleware requirement
- Input validation steps before controller

- File: `backend/src/controllers/{name}Controller.ts`
- Request parsing, response shaping, error forwarding

#### Controller → Service (Backend)
- File: `backend/src/services/{name}Service.ts`
- Business logic responsibilities
- Upstream Sunbird API calls (if any — proxied via `/action/*` or `/api/*`)
- Database operations (if any — PostgreSQL/YugabyteDB or Cassandra)

#### Frontend: API Client
- File: `frontend/src/api/{name}.ts`
- Function signatures:
  ```typescript
  export async function fetch{Name}(params: {Name}Params): Promise<{Name}Response> { ... }
  ```
- Uses Axios (project standard)

#### Frontend: Data Fetching Hook
- File: `frontend/src/hooks/use{Name}.ts`
- TanStack Query key and query function
- Mutation (if write operations involved)
  ```typescript
  export function use{Name}(id: string) {
    return useQuery({
      queryKey: ['{name}', id],
      queryFn: () => fetch{Name}(id),
    });
  }
  ```

#### Frontend: Page Component
- File: `frontend/src/pages/{feature}/{Name}Page.tsx`
- Route registration in `App.tsx`
- Loading / error / empty states
- RBAC guard (if applicable)

#### Frontend: Child Components
For each significant UI piece:
- File: `frontend/src/components/{feature}/{ComponentName}.tsx`
- Props interface
- Which Radix UI primitives to use
- Styling: Tailwind + Sunbird tokens (`sunbird-*`)
- Thumbnail: use `CardThumbnailBackground` if a content thumbnail is needed

### 4. Content Type Extension (if applicable)
If the feature introduces a new content type, update `contentDisplayConfig.ts`:
```typescript
{
  type: '{newType}',
  icon: Fi{IconName},
  primaryColor: 'sunbird-{token}',
  secondaryColor: 'sunbird-{token}',
  label: '{Display Name}',
}
```
`CardThumbnailBackground` will pick it up automatically.

### 5. TypeScript Types
- File: `frontend/src/types/{feature}.ts`
- Domain interfaces for request/response/entity objects
- Shared between API client, hook, and components

- File: `backend/src/types/{feature}.ts`
- Backend-side types (may differ from frontend if the API transforms data)

### 6. i18n
- Translation keys needed in `src/locales/en.json`
- Format: `{feature}.{element}` (e.g., `workspace.emptyState`)

### 7. Environment Variables (if new config needed)
| Variable | Default | Purpose |
|----------|---------|---------|
| `VAR_NAME` | `default` | ... |

Must be added to `backend/.envExample` and `backend/src/config/env.ts`.

### 8. Test Plan
```
Frontend:
- {ComponentName}.test.tsx
  - Renders correctly with data
  - Shows loading skeleton
  - Handles API error gracefully
  - Empty state shown when no data
  - thumbnail: '' exercises placeholder path (if applicable)
  Coverage target: 70%+

Backend:
- {name}Service.test.ts
  - Happy path with expected upstream response
  - Upstream failure → throws structured error
  - Invalid input → validation error
  Coverage target: 70%+
```

### 9. Open Questions
List ambiguities that need clarification before implementation starts.

---

Now produce this design for the feature the user described. Ask one clarifying question first if the requirement is ambiguous.
