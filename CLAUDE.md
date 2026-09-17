# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a **monorepo** containing two independent applications:

- **`frontend/`** — React 19 + TypeScript + Vite SPA (Sunbird Ed Portal UI)
- **`backend/`** — Express 5 + TypeScript + Node.js API server (BFF)

In production, the backend serves the frontend's static build from `dist/public/`. In development, Vite runs on port 5173 and proxies API/content requests to the backend on port 3000.

Commands are always run from within their respective directory (`frontend/` or `backend/`) — there is no root build.

## Rules

Detailed guidance is split into component rule files under `.claude/rules/` (auto-discovered):

| Rule file | Loads | Covers |
|---|---|---|
| `workflow.md` | **Always** | Security (no secrets), plan-mode-before-changes, post-change lint+test, TypeScript conventions, conventional commits, full prod build, CI |
| `frontend.md` | When a `frontend/**` file is open | React/Vite SPA architecture, Vite dev proxy, frontend commands, Tailwind/styling conventions |
| `backend.md` | When a `backend/**` file is open | Express BFF architecture, backend commands, env setup, header-forwarding/tenant-isolation caveat |
| `testing.md` | When a `**/*.test.ts` / `**/*.test.tsx` file is open | Vitest setup, 70% coverage threshold, single-test run, test file layout |

The always-on rules in `workflow.md` (Security, Planning, Post-Change Validation) are REQUIRED and apply to every task.
