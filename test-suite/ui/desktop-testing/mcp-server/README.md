# MCP-style Playwright server

This is a minimal local HTTP server that exposes a simple API to run Playwright tests programmatically. It's intentionally lightweight and avoids extra dependencies.

Endpoints

- GET /health
  - Returns { status: 'ok', pid }

- POST /run
  - JSON body options:
    - spec: path to a test file (default `tests/02_course_consume_and_certificate.spec.ts`)
    - project: Playwright project (default `chromium`)
    - headed: boolean (default false)
    - trace: boolean (default true)
  - Example:

```bash
curl -X POST http://localhost:3001/run -H 'Content-Type: application/json' -d '{"spec":"tests/02_course_consume_and_certificate.spec.ts","headed":true}'
```

Response

Returns JSON with keys: success, exitCode, trace (array of trace.zip paths produced), stdout (tail), stderr (tail).

Notes

- The server runs `npx playwright test ...` under the hood. Make sure Playwright is installed locally (it is in devDependencies).
- Traces are stored under `test-results/.../trace.zip`. The server will return trace paths it finds in Playwright output.
