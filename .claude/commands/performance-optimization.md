---
name: performance-optimization
description: Use when a React component re-renders excessively, a TanStack Query result causes unnecessary network requests, or a Vite build produces an oversized bundle in the Sunbird Spark Portal. Diagnose first, optimize with evidence.
---

## Overview

Performance work without measurement is guessing. This codebase uses TanStack Query v5 for server state caching, Vite 7 for tree-shaking and code splitting, React 19 concurrent rendering, and Recharts for data visualisation. The most common performance problems are stale query key invalidation, missing memoisation on expensive list renders, and unoptimised bundle chunks from large third-party libraries (jQuery-UI, jsPDF, Recharts).

## When to Use

**Use when:**
- A component re-renders on every keystroke or parent update without data changes
- A network tab shows the same API endpoint called multiple times for the same data
- `npm run build` reports a chunk exceeding 500 kB
- A Recharts or heavy component blocks the main thread during initial render

**Exclude when:**
- Premature optimisation — do not add `React.memo` or `useMemo` without profiling evidence
- A component renders only once (no re-render path)

## Core Process

1. **Measure before optimising**:
   - React re-renders → use React DevTools Profiler to record the render and identify the component causing excess renders
   - Bundle size → run `cd frontend && npm run build` and inspect chunk sizes in the Vite output; use `vite-bundle-analyzer` if installed
   - API calls → open browser DevTools Network tab; note duplicate requests

2. **TanStack Query optimisations**:
   - Ensure `queryKey` arrays are stable — avoid constructing objects inside the key array
   - Use `staleTime` to prevent background refetches when data rarely changes:
     ```typescript
     useQuery({ queryKey: ['skills'], queryFn: fetchSkills, staleTime: 5 * 60 * 1000 })
     ```
   - Confirm `queryClient.invalidateQueries({ queryKey: ['skills'] })` uses the exact key shape — mismatches cause data to never refresh

3. **React component optimisations** (only after profiling confirms re-render issue):
   - Wrap stable child components in `React.memo`
   - Wrap expensive derived values in `useMemo`
   - Wrap event handlers passed as props in `useCallback`
   - Move static data (lookup tables, constants) outside the component function

4. **Vite bundle optimisations**:
   - Large libraries (Recharts, jsPDF, jQuery-UI) should be lazy-loaded with `React.lazy` + `Suspense` on the page that first uses them
   - Use dynamic `import()` for content editor web components that are not needed on every route
   ```typescript
   const CollectionEditor = React.lazy(() => import('./CollectionEditor'));
   ```

5. **Backend optimisations**:
   - Check that upstream proxy calls are not made sequentially when they can be parallelised with `Promise.all`
   - Cassandra queries should use partition keys in `WHERE` clauses; avoid full-table scans in `formsController`

6. **Verify the improvement** — re-run the profiler or rebuild and confirm the metric improved before committing.

## Common Rationalizations

| Rationalization | Reality |
|-----------------|---------|
| "I'll add `React.memo` everywhere to be safe" | Unnecessary memoisation adds comparison overhead and obscures real re-render causes; profile first |
| "The API already caches — no need for `staleTime`" | The browser makes a network request on every component mount unless `staleTime` is configured; TanStack Query cache is in-memory and survives only within the session |
| "The bundle is large but we have good internet" | Sunbird is designed for national-scale deployment including low-bandwidth environments; bundle size directly impacts first load |
| "I'll optimise after the feature is complete" | Features rarely get revisited for performance; if a Vite chunk already exceeds 500 kB, split it now |

## Red Flags

Watch for:
- `useQuery` called with `queryKey: [{ userId, filters }]` where the object is constructed inline each render — object references are not stable; use primitives or `useMemo` for the key
- A component importing `recharts` or `jspdf` at the top level on a page that is not the analytics dashboard — lazy-load instead
- A `useEffect` that calls `queryClient.invalidateQueries` on every render without a dependency guard
- A backend service function calling three upstream APIs sequentially with `await` when they are independent — use `Promise.all`

## Verification

□ A profiler screenshot or build output shows the metric improved after the change  
□ TanStack Query `queryKey` arrays use primitive values or `useMemo`-stabilised references  
□ `npm run build` shows no single chunk exceeding 500 kB for lazily-loaded routes  
□ `React.memo`, `useMemo`, or `useCallback` additions are each backed by a profiler observation  
□ `cd frontend && npm run test:run` exits 0 — optimisations must not break behaviour
