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

## Running via GitHub Actions (no local setup needed)

1. Go to the repository on GitHub
2. Navigate to **Actions → E2E Tests (On Demand)**
3. Click **Run workflow**
4. Optionally enter a target URL (defaults to the configured test environment)
5. Once the run completes, the report is published to GitHub Pages and the link appears in the job summary

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
