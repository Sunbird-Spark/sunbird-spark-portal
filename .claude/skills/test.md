You are running tests for the Sunbird Spark Portal — a React 19 + Vite frontend (`frontend/`) and Express 5 + Node.js backend (`backend/`), both using Vitest.

## Steps

1. **Identify the target** from:
   - The user's message (e.g., "test WorkspaceContentCard", "test auth service")
   - Recently edited files in the conversation
   - Whether the change is frontend or backend

2. **Determine the test scope** — full project, single directory, single file, or single test name

3. **Run the appropriate command** (see reference below)

4. **Report results** — pass/fail count, any failures with their error messages and file locations

5. **Point to coverage report** if the user wants to check coverage thresholds

---

## Command Reference

### Frontend (`cd frontend` first)

```bash
# Run all tests once
npm run test:run

# Run a specific test file
npx vitest run src/path/to/Component.test.tsx

# Run tests matching a name pattern
npx vitest run --reporter=verbose -t "thumbnail placeholder"

# Watch mode (development)
npm run test

# Generate coverage report (must reach 70% threshold)
npm run test:coverage
# Report at: frontend/coverage/index.html
```

### Backend (`cd backend` first)

```bash
# Run all tests once
npm run test:run

# Run a specific test file
npx vitest run src/path/to/service.test.ts

# Run tests matching a name pattern
npx vitest run --reporter=verbose -t "auth middleware"

# Watch mode (development)
npm run test

# Generate coverage report
npm run test:coverage
# Report at: backend/coverage/index.html
```

---

## Test Patterns in This Project

### Frontend (Vitest + happy-dom + @testing-library/react)

- Test files colocated next to source: `Component.test.tsx` beside `Component.tsx`
- Setup file: `frontend/src/test/setup.ts` (imports `@testing-library/jest-dom`)
- Mock `@/components/common/DropdownMenu` and other heavy UI libs when testing components that include them
- Use `thumbnail: ''` (empty string, falsy) to exercise the `CardThumbnailBackground` placeholder fallback
- Focus tests on text content and interactions — not thumbnail rendering
- TanStack Query: wrap components under test in `QueryClientProvider` with a fresh `QueryClient`

```typescript
// Example pattern
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

it('shows empty state when no content', () => {
  render(<WorkspacePage />, { wrapper });
  expect(screen.getByText(/no content/i)).toBeInTheDocument();
});
```

### Backend (Vitest + node environment)

- Test files colocated: `service.test.ts` beside `service.ts`
- Environment variables loaded from `backend/.envExample` automatically
- Mock upstream Sunbird HTTP calls with `vi.mock` or `vi.spyOn` on Axios
- Test auth middleware by passing mock `req`/`res`/`next` objects

```typescript
// Example pattern
import { vi, describe, it, expect } from 'vitest';
import { contentService } from './contentService.js';

vi.mock('axios');

describe('contentService', () => {
  it('returns content list on success', async () => {
    // ...
  });

  it('throws on upstream failure', async () => {
    // ...
  });
});
```

---

## Coverage Thresholds

Both frontend and backend enforce **70% coverage** across branches, functions, lines, and statements. CI will fail if thresholds are not met.

```bash
# Check current coverage
cd frontend && npm run test:coverage
cd backend && npm run test:coverage
```

Coverage reports:
- `frontend/coverage/index.html`
- `backend/coverage/index.html`

---

## Module Reference

| Area | Test location |
|------|---------------|
| Workspace components | `frontend/src/components/workspace/*.test.tsx` |
| Page components | `frontend/src/pages/**/*.test.tsx` |
| Custom hooks | `frontend/src/hooks/*.test.ts` |
| API client functions | `frontend/src/api/*.test.ts` |
| Backend routes | `backend/src/routes/*.test.ts` |
| Backend controllers | `backend/src/controllers/*.test.ts` |
| Backend services | `backend/src/services/*.test.ts` |
| Auth middleware | `backend/src/auth/*.test.ts` |

---

If the target module is ambiguous (frontend or backend), ask the user which side they're working on before running.
