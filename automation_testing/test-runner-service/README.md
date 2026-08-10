# E2E Test Runner Service

A one-button trigger + report page for the Playwright E2E suite in
[`automation_testing/web-portal`](../web-portal), for people who don't have GitHub
access and shouldn't need it. It builds and runs the suite in Docker, entirely
outside GitHub Actions — see [`../web-portal/Dockerfile.e2e`](../web-portal/Dockerfile.e2e)
for the image, and [`../ci-templates/e2e-on-demand.yml`](../ci-templates/e2e-on-demand.yml)
for the GitHub-Actions equivalent this mirrors.

## Important: point this at a test environment, not production

The E2E suite mutates real state (enrollment, course progress, certificates)
against whatever `BASE_URL` it's given, and runs are serialized one at a time
for exactly that reason (see `playwright.config.ts`). Only ever point
`BASE_URL` at a dedicated test/staging environment.

## Setup

No manual image build step — every run rebuilds `e2e-runner` from current source
before executing it (see `dockerRunner.rebuildImage`), so the container can never
silently run stale code. This adds time to each run (Docker layer caching keeps it
fast unless `package.json` changed), but a fix landing in `web-portal` is guaranteed
to actually be there the next time someone clicks "Run E2E Tests." If you want to
pre-warm the image cache before the first run, you can still build it manually:
```bash
docker build -f ../web-portal/Dockerfile.e2e -t e2e-runner ../web-portal
```

1. Install this service's dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables (create a `.env` or export directly). **You
   must set either `TRIGGER_SHARED_SECRET` or `ALLOW_NO_AUTH=1` before starting
   — the service refuses to boot otherwise** (see table below):

   | Variable | Purpose | Default |
   |---|---|---|
   | `PORT` | Port the web page listens on | `4000` |
   | `DOCKER_IMAGE` | Name/tag the image is rebuilt as before every run | `e2e-runner` |
   | `WEB_PORTAL_DIR` | Path to `web-portal/` (build context + `Dockerfile.e2e` location), relative to this service's working directory | `../web-portal` |
   | `RUNS_DIR` | Where per-run reports are written | `./runs` |
   | `TRIGGER_SHARED_SECRET` | Password required to use the page (Basic Auth) | *(none)* |
   | `ALLOW_NO_AUTH` | Set to `1` to explicitly run without `TRIGGER_SHARED_SECRET` (local testing only). The service refuses to start if neither is set. | `0` |
   | `BASE_URL` | **Default** target environment, pre-filled in the web form — the page lets you override it per run (e.g. to point at sandbox instead of test) without restarting the service | `https://test.sunbirded.org` |
   | `REGISTERED_USER_EMAIL` / `REGISTERED_USER_PASSWORD` | Test user 1 credentials | see `.env.example` in `web-portal` |
   | `USER2_EMAIL` / `USER2_PASSWORD` | Test user 2 credentials | see `.env.example` in `web-portal` |

3. Run it:
   ```bash
   npm run build && npm start   # production
   npm run dev                  # local development, hot reload
   ```

4. Open `http://<host>:<port>/` — click **Run E2E Tests**. While a run is in
   progress the button is disabled and a second click is rejected (HTTP 409) —
   this is deliberate, not a bug, since overlapping runs would corrupt each
   other's enrollment/certificate state.

5. Once finished, the run's row links to its Playwright HTML report. If the
   automatic rebuild itself fails (e.g. a broken `Dockerfile.e2e`), the run is
   reported as `error` with the build output logged server-side, rather than
   silently doing nothing.

## Programmatic use

`POST /run` also works for scripts/CI jobs, not just the browser form: send
`Accept: application/json` and it responds `202` with `{ runId, status }`
instead of redirecting. Poll `GET /runs/:id` afterward for the run's current
status. Both endpoints require the same Basic Auth as the rest of the service.
JSON callers don't need to handle the CSRF cookie/token described below — that
check only applies to the browser form submission path.

## Development

```bash
npm run lint
npm run test:run
```
