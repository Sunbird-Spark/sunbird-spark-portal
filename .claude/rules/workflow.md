# Workflow, conventions & security (always-on)

## Security (REQUIRED)

NEVER read or access the following sensitive files, regardless of context:
- `.env`, `.env.*` (environment variables and secrets)
- `*.pem`, `*.key` (private keys and certificates)

This applies to all directories and subdirectories in the project.

## Planning (REQUIRED)

Before making **any** code changes, you MUST enter plan mode and present a clear implementation plan to the user. Wait for the user to review and approve the plan before writing or editing any code. Do not skip this step even for small changes.

## Post-Change Validation (REQUIRED)

After making **any** code changes to `frontend/` or `backend/`, you MUST run lint and tests for the affected side(s) before considering the task complete:

**Frontend changes:**
```bash
cd frontend && npm run lint && npm run test:run
```

**Backend changes:**
```bash
cd backend && npm run lint && npm run test:run
```

If both are changed, run both. Fix any lint errors or test failures before finishing. Do not skip this step.

## TypeScript

- Strict mode enabled with `noUncheckedIndexedAccess` — always handle potentially-undefined array/object access
- No `any` without justification (ESLint warns)
- Max 250 lines per file (500 for test files)

## Git Commits

Conventional commits are required:
- `feat:` new feature
- `fix:` bug fix
- `refactor:` code change without feature/fix
- `docs:` documentation
- `test:` test changes
- `chore:` build/tooling

## Full Production Build

```bash
cd frontend && npm run build
cd backend && npm run build:full
node dist/server.js
```

## CI

PR checks (`.github/workflows/pull-requests.yml`) run on Node 24 and validate: lint, build, and test:coverage for both frontend and backend.
