---
name: code-review-and-quality
description: Use when reviewing a pull request or self-reviewing staged changes in the Sunbird Spark Portal before committing. Applies a five-axis framework covering correctness, readability, architecture, security, and performance.
---

## Overview

Code review is the last quality gate before code enters the shared history. In this codebase, strict TypeScript (`noUncheckedIndexedAccess`, `noUnusedLocals` on backend), a 250-line file limit, Tailwind-only styling, and the React 19 + TanStack Query v5 conventions all provide objective review anchors. This skill keeps reviews focused and consistent across the monorepo.

## When to Use

**Use when:**
- Reviewing a pull request diff
- Self-reviewing staged changes before a commit
- Auditing a file that is about to be significantly modified

**Exclude when:**
- Reviewing auto-generated files (Vite build output, `dist/`)
- Reviewing locale JSON files for code quality (content review only)

## Core Process

1. **Run automated checks first** — do not review manually what tools can catch:
   ```bash
   cd frontend && npm run lint && npm run type-check && npm run test:run
   cd backend && npm run lint && npm run type-check && npm run test:run
   ```
2. **Apply the five-axis framework** to each changed file:

   **1. Correctness**
   - Does the logic match the spec/requirements?
   - Are all TypeScript strict-mode violations resolved (no `any`, no unchecked index access)?
   - Do new tests cover the happy path and at least one edge case?

   **2. Readability**
   - Are names descriptive? (No single-letter variables outside loop counters)
   - Does each function/component do one thing?
   - Is the file under 250 lines (500 for test files)?

   **3. Architecture**
   - Frontend: Does data fetching live in a TanStack Query hook, not inside a component?
   - Backend: Does business logic live in a service, not a controller or route?
   - Are new Radix UI primitives used instead of custom dialog/dropdown implementations?
   - Does the change follow the existing `routes → controllers → services` layering?

   **4. Security**
   - Is user input validated before use (backend: AJV schema or explicit checks)?
   - Is HTML rendered via `DOMPurify.sanitize()` (frontend)?
   - Are secrets read from `process.env` via `src/config/env.ts` only — never hardcoded?
   - Does a new API endpoint require session auth and apply it?

   **5. Performance**
   - Are expensive React components wrapped in `React.memo` where justified?
   - Does the TanStack Query mutation call `queryClient.invalidateQueries` with the correct key?
   - Does a new backend endpoint avoid N+1 queries?

3. **Classify each finding** using severity:
   - **(no prefix)** — must be fixed before merge
   - **Critical** — blocks merge; security or data-loss risk
   - **Nit** — optional; style preference
   - **Consider** — suggestion worth discussing, not blocking

4. **Write specific fix recommendations**, not vague observations ("Extract this into a TanStack Query hook" not "improve data fetching").

## Common Rationalizations

| Rationalization | Reality |
|-----------------|---------|
| "The lint passes, so quality is fine" | ESLint catches syntax and style; it does not verify architecture layering or security logic |
| "It's a small change, no need for full review" | Small changes in auth middleware or proxy config have large blast radius |
| "I'll add tests in a follow-up PR" | Follow-up PRs for tests rarely happen; CI's coverage threshold will block the next PR anyway |
| "The file is 300 lines but it's all related" | The ESLint `max-lines: 250` rule exists to force decomposition; split the file |

## Red Flags

Watch for:
- `any` type in new TypeScript code without an explanatory comment
- `useEffect` with an empty dependency array that triggers data fetching (should be TanStack Query)
- A controller function containing business logic (SQL queries, external API calls) instead of delegating to a service
- `dangerouslySetInnerHTML` without `DOMPurify.sanitize()` wrapping the value
- A new route file that does not apply `requireSession` middleware for protected endpoints

## Verification

□ `npm run lint` exits 0 for the affected side  
□ `npm run type-check` exits 0 for the affected side  
□ `npm run test:run` exits 0 with no new skips  
□ All Critical and required findings addressed or explicitly accepted with justification  
□ No new file exceeds 250 lines (500 for tests)  
□ New API endpoints documented in a comment or the route file's JSDoc
