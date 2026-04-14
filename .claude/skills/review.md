You are performing a code review of recent changes in the Sunbird Spark Portal — a React 19 + TypeScript frontend and Express 5 + Node.js backend.

## Steps

1. Run `git diff HEAD` to see all unstaged changes, and `git diff --staged` for staged changes. If the user specified a file or PR, review that instead.
2. Read each changed TypeScript/TSX file **in full** (not just the diff) to understand context.
3. Run `npm run type-check` and `npm run lint` in the affected directory if type or lint issues are suspected.
4. For each file, produce a structured review.

## Review Output Format

```
## Code Review

### {relative/path/to/File.tsx}

**Critical** (must fix before merge)
- Line X: {specific issue and why it matters}

**Warning** (should fix)
- Line X: {issue}

**Suggestion** (optional improvement)
- Line X: {suggestion}

✓ No issues
```

After all files:
```
## Summary
Verdict: Approved | Needs Changes | Blocked
{One sentence explaining the verdict}
```

---

## Review Checklist

**Type Safety**
- [ ] No unjustified `any` (ESLint warns — flag if suppressed)
- [ ] No non-null assertions (`!`) without a guard
- [ ] Array/object access handles `undefined` (project uses `noUncheckedIndexedAccess`)
- [ ] Public functions have explicit return types

**React Correctness**
- [ ] `useEffect` dependency arrays are complete and correct
- [ ] No direct state mutation
- [ ] No index keys in dynamic lists
- [ ] Server state fetched via TanStack Query (not raw `useEffect` + `fetch`)
- [ ] No derived state computed inside `useEffect`

**Async & Error Handling**
- [ ] No unhandled promise rejections
- [ ] No `async` inside `forEach` — use `Promise.all` + `map`
- [ ] No empty `catch` blocks
- [ ] `JSON.parse` wrapped in try/catch

**Security**
- [ ] HTML rendered via `dangerouslySetInnerHTML` is sanitised with DOMPurify
- [ ] Redirect URIs validated before use (see `forgotPassword` utils pattern)
- [ ] No hardcoded secrets or credentials
- [ ] User input validated before use in queries or system calls (backend)

**UI & Styling**
- [ ] Sunbird colour tokens used (`sunbird-*`) — no raw hex values
- [ ] `font-rubik` applied to Sunbird-branded text
- [ ] Radix UI primitives used for interactive elements (no raw `<div onClick>`)
- [ ] Thumbnail placeholders use `CardThumbnailBackground` (established pattern)
- [ ] New content types extend `contentDisplayConfig.ts` — no scattered conditionals

**i18n**
- [ ] No hardcoded English strings in JSX — use `i18next` translation keys
- [ ] New translation keys added to `src/locales/`

**Accessibility**
- [ ] Interactive elements have `aria-label` or visible label
- [ ] Focus managed after modal/dialog open/close
- [ ] Keyboard navigation handled for custom widgets

**Backend (if backend files changed)**
- [ ] Route handlers have try/catch or `next(err)` forwarding
- [ ] Env vars accessed via `src/config/env.ts` — not raw `process.env`
- [ ] No synchronous I/O in request handlers
- [ ] New routes protected by auth middleware if they require authentication

**Tests (if test files changed)**
- [ ] Mocks use `vi.mock()` (Vitest syntax, not `jest.mock`)
- [ ] `thumbnail: ''` (empty string) used to test placeholder fallback paths
- [ ] Both happy path and error paths tested
- [ ] Coverage threshold maintained (70%)

---

Be direct and line-specific. Skip checklist sections that don't apply. If a file is clean, say ✓ and move on.
