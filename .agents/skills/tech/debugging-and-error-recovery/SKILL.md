---
name: debugging-and-error-recovery
description: Use when encountering TypeScript compilation errors, runtime exceptions, failing tests, or unexpected API behaviour in the Sunbird Spark Portal. Stop, diagnose, fix the root cause, and guard with a test before resuming.
---

## Overview

Accumulating changes while errors exist hides the root cause and makes recovery harder. This skill enforces a stop-the-line discipline: preserve the error output, triage systematically, fix the root cause (not the symptom), and write a test that would have caught it. In this codebase the most common error sources are TypeScript strict mode violations, TanStack Query state mismatches, Express 5 middleware ordering, and upstream Kong proxy failures.

## When to Use

**Use when:**
- `npm run type-check` or `npm run build` exits non-zero
- `npm run test:run` reports failing tests
- A React component renders an error boundary fallback
- A TanStack Query result is `isError: true` unexpectedly
- An Express route returns 500 or the proxy returns an unexpected status

**Exclude when:**
- Lint warnings (not errors) that have a documented justification
- Expected 401/403 responses in auth flows

## Core Process

1. **Stop making changes** — do not write new code while an error exists.
2. **Preserve the full error output** — copy the exact message, stack trace, and file:line reference before doing anything.
3. **Triage: locate the error layer**:
   - TypeScript error → read the exact `tsc` message; `noUncheckedIndexedAccess` requires undefined guards on array/object access
   - Test failure → read the diff between expected and received; check if a mock is returning the wrong shape
   - Runtime React error → check the browser console for the component stack; verify TanStack Query key matches the invalidation key
   - Backend 500 → check `winston` logs; identify which middleware threw; verify the Express 5 route signature (`req, res, next` or `async (req, res, next)`)
   - Proxy error → check that the upstream URL is correctly configured in `src/config/env.ts`; verify Kong is reachable
4. **Reproduce the error in isolation** — run the single failing test or curl the failing endpoint.
5. **Fix the root cause** — do not mask with `as`, `!`, or `try/catch` that silently swallows errors.
6. **Write or update a test** that would have caught this error.
7. **Verify the fix**:
   ```bash
   cd frontend && npm run type-check && npm run test:run
   cd backend && npm run type-check && npm run test:run
   ```
8. **Resume the original task** only after all checks are green.

## Common Rationalizations

| Rationalization | Reality |
|-----------------|---------|
| "I'll use `as unknown as T` to get past the type error quickly" | Type assertions hide real contract mismatches; the error will resurface at runtime |
| "The test was already flaky — I'll just skip it" | A flaky test is a signal of a race condition or missing `await`; skipping it hides the bug |
| "It works in my browser, the test must be wrong" | React Testing Library uses happy-dom; if the test fails, the component has a real behaviour gap |
| "The proxy error is a network issue, not our code" | Check `env.ts` defaults and the Vite proxy config (`vite.config.ts`) before assuming external failure |

## Red Flags

Watch for:
- `// @ts-ignore` or `// @ts-expect-error` without a comment explaining why
- `catch (e) {}` empty catch blocks in async functions
- `vi.mock` wrapping a module globally when only one test needs it, hiding real failures in other tests
- `console.error` output in test output that is not asserted on — it often signals an unhandled React error
- Multiple `type-check` errors accumulating across a session without being fixed

## Verification

□ `npm run type-check` exits 0 for the affected side (frontend or backend or both)  
□ `npm run test:run` exits 0 with no skipped tests added  
□ A new or updated test directly exercises the code path that was broken  
□ No `@ts-ignore`, `as any`, or empty `catch` blocks introduced to suppress the error  
□ The original task can now proceed without error
