# Sunbird Portal — E2E Automation Tests

Playwright-based end-to-end tests for the Sunbird Spark Portal.

## Prerequisites

- [Node.js](https://nodejs.org/) v24+
- A Chromium-compatible browser (installed automatically by Playwright)

## Setup

```bash
cd automation_testing/web-portal
npm install
npx playwright install chromium --with-deps
```

## Configuration

Tests read credentials and the target URL from environment variables. Create a `.env` file in `automation_testing/web-portal/`:

```env
BASE_URL=https://test.sunbirded.org
REGISTERED_USER_EMAIL=user1@yopmail.com
REGISTERED_USER_PASSWORD=User1@123
USER2_EMAIL=user2@yopmail.com
USER2_PASSWORD=User2@123
```

If no `.env` file is provided the values above are used as defaults.

## Running Tests

### Run all E2E tests (recommended)

Runs the full end-to-end suite: home content, explore content, enrollment, explore-enrollment, and certificate download.

```bash
npm run test:e2e -- --headed --workers=1
```

### Run all tests (includes auth-flow and standalone specs)

```bash
npm test 
```

### Run a specific project

| Project | What it tests |
|---|---|
| `e2e-1-home` | Home page content (anonymous user) |
| `e2e-2-explore` | Explore page content (anonymous user) |
| `e2e-5-enrollment` | Course enrollment (registered user) |
| `e2e-6-explore-enrollment` | Explore → enroll flow (registered user) |
| `e2e-7-certificate` | Certificate download after course completion |

```bash
npx playwright test --project e2e-1-home
```

### Run a specific spec file

```bash
npx playwright test tests/specs/enrollment.spec.ts
```

## Viewing the Report

After a local run, the HTML report opens automatically. To reopen it:

```bash
npx playwright show-report
```

## Optional CI Integration (GitHub Actions)

The automation suite is a self-contained add-on. CI integration is **opt-in** — ready-made workflow templates live in [`automation_testing/ci-templates/`](../ci-templates/) so you can activate them whenever you're ready, without them running automatically on every PR.

There are two templates:

| Template file | What it does |
|---|---|
| `ci-templates/e2e-on-demand.yml` | Manual trigger from GitHub Actions UI; publishes the HTML report to GitHub Pages |
| `ci-templates/e2e-pr-job.yml` | Job snippet to add to your PR workflow; runs the full E2E suite on every pull request |

---

### Activating the On-Demand workflow

1. Copy the template into your workflows folder:
   ```bash
   cp automation_testing/ci-templates/e2e-on-demand.yml .github/workflows/e2e-on-demand.yml
   ```
2. Set up [GitHub variables](#github-variables-setup) (or rely on the defaults).
3. Enable GitHub Pages in **Settings → Pages → Source: GitHub Actions**.
4. Trigger it: **Actions → E2E Tests (On Demand) → Run workflow**.
5. Once done, the HTML report link appears in the job summary.

> Only one on-demand run deploys to Pages at a time — concurrent runs queue automatically.

---

### Activating E2E on every Pull Request

1. Copy the snippet into your PR workflow:
   ```bash
   cat automation_testing/ci-templates/e2e-pr-job.yml >> .github/workflows/pull-requests.yml
   ```
2. Set up [GitHub variables](#github-variables-setup).
3. The `E2E All Tests` job now runs automatically on every PR after frontend and backend checks pass.
4. Download the report from the **Artifacts** section at the bottom of the Actions run page (`playwright-all-report`, kept for 7 days).

---

### GitHub Variables Setup

Both templates read credentials from **GitHub repository variables**. Set them once in **Settings → Secrets and variables → Actions → Variables**:

| Variable | Default fallback |
|---|---|
| `E2E_BASE_URL` | `https://test.sunbirded.org` |
| `E2E_REGISTERED_USER_EMAIL` | `user1@yopmail.com` |
| `E2E_REGISTERED_USER_PASSWORD` | `User1@123` |
| `E2E_USER2_EMAIL` | `user2@yopmail.com` |
| `E2E_USER2_PASSWORD` | `User2@123` |

The same keys are in `.env.example` — copy those values across. If a variable is missing, the workflow falls back to the default shown above.

---

## Adding a New Test

1. **Create your spec file** under the appropriate folder:
   - Anonymous-user flows → `tests/anonymous_user_consumption/`
   - Authenticated flows → `tests/specs/`
   - Auth setup/login flows → `tests/auth-flow/`

2. **Register it as a Playwright project** (if it needs its own project tag) in `playwright.config.ts`. If it fits an existing project, just add the file — no config change needed.

3. **Run it locally** to confirm it passes:
   ```bash
   npx playwright test tests/specs/your-new-spec.ts --headed
   ```

4. **Push your branch / open a PR** — the `E2E All Tests` job in the PR check will pick up the new spec automatically.

---

## Test Structure

```
tests/
├── anonymous_user_consumption/
│   ├── homeContent.spec.ts       # Home page (anonymous)
│   └── exploreContent.spec.ts    # Explore page (anonymous)
├── auth-flow/
│   ├── login.spec.ts             # Login / logout flows
│   ├── googleLogin.spec.ts       # Google OAuth login
│   ├── googleAuth.setup.ts       # Google auth state setup
│   └── user2Auth.setup.ts        # user2 auth state setup
└── specs/
    ├── enrollment.spec.ts         # Course enrollment
    ├── explore_enrollment.spec.ts # Explore → enroll flow
    └── certificate_download.spec.ts # Certificate download
```
