---
name: test-driven-development
description: Use when implementing new features, fixing bugs, or refactoring in the Sunbird Spark Portal to ensure correctness through tests written before implementation. Applies to both frontend (Vitest + React Testing Library) and backend (Vitest + Supertest).
---

## Overview

Writing tests first forces you to clarify the contract before writing code. In this monorepo the test runner is Vitest for both sides; the frontend uses React Testing Library with happy-dom, the backend uses Supertest for HTTP assertions. Coverage thresholds are 70% across branches, functions, lines, and statements — CI blocks merges that drop below this.

## When to Use

**Use when:**
- Adding a new React component or hook
- Adding a new Express route, controller, or service function
- Fixing a bug (prove it with a failing test first)
- Refactoring existing code that lacks test coverage

**Exclude when:**
- Writing pure configuration files (Vite config, ESLint config, tsconfig)
- Updating locale JSON files or Tailwind design tokens

## Core Process

1. **Read the spec** — understand the expected input/output/behaviour before opening a code file.
2. **Write a failing test first** using the RED step:
   - Frontend: create `ComponentName.test.tsx` co-located with the component or in `__tests__/`
   - Backend: create `featureController.test.ts` or `featureService.test.ts` co-located with the source
3. **Run only the new test** to confirm it fails for the right reason:
   ```bash
   # Frontend
   cd frontend && npx vitest run src/path/to/Component.test.tsx
   # Backend
   cd backend && npx vitest run src/path/to/service.test.ts
   ```
4. **Write the minimum code** to make the test pass (GREEN step). No extras.
5. **Run the full suite** to catch regressions:
   ```bash
   cd frontend && npm run test:run
   cd backend && npm run test:run
   ```
6. **Refactor** (REFACTOR step) — clean up duplication, naming, structure — without changing behaviour. Re-run the suite after.
7. **For bug fixes** — apply the Prove-It Pattern:
   - Write a test that reproduces the bug and fails
   - Confirm the test fails
   - Apply the fix
   - Confirm the test now passes
   - Run the full suite for regressions

## Common Rationalizations

| Rationalization | Reality |
|-----------------|---------|
| "I'll add tests after — it's faster now" | Tests written after implementation rarely cover edge cases; CI will catch the gap at coverage threshold |
| "This component is too simple to test" | Simple components break silently during refactors; a 10-line test prevents future regressions |
| "Mocking the API is too complex" | Use `vi.fn()` for service stubs; React Testing Library's `renderWithProviders` pattern is already in the codebase |
| "The backend just proxies — no logic to test" | Controllers validate input and shape responses; both are worth contract-testing with Supertest |

## Red Flags

Watch for:
- Test file created after the implementation file in the same commit
- `vi.mock` wrapping entire modules instead of just boundaries (external HTTP, DB)
- Tests that only check `expect(wrapper).toBeDefined()` with no behavioural assertion
- `coverage` script shows a drop below 70% on any metric
- Tests disabled with `it.skip` or `xit` with no linked issue

## Verification

□ New test file exists alongside or in `__tests__/` near the source file  
□ Test was written before or in parallel with implementation (not after)  
□ `cd frontend && npm run test:run` exits 0 with no failures  
□ `cd backend && npm run test:run` exits 0 with no failures  
□ `cd frontend && npm run test:coverage` shows all metrics ≥ 70%  
□ Bug fixes include a test that was failing before the fix and passing after
