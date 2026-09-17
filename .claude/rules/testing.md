---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
---

# Testing conventions

- **Frontend**: Vitest + happy-dom + @testing-library/react
- **Backend**: Vitest + node environment (loads `.envExample`)
- **Coverage threshold**: 70% across branches, functions, lines, statements
- Test files are colocated with source or in `__tests__/` subdirectory
- Max 500 lines per test file (250 for non-test files)

Run a single test file:
```bash
npx vitest run src/path/to/file.test.tsx
```
