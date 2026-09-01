# Playwright Test Suite – Quick Setup Guide

## Overview

This repository contains an end-to-end (E2E) Playwright test suite for validating user flows on the Spark Portal, including:

* Login
* Course consumption
* Progress tracking
* Certificate downloads

---

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/akshitha-1210/UI_automation.git
cd UI_automation
git checkout complete-user-flow
```

---

### 2. Install Dependencies

```bash
# All Playwright commands must be run from inside the desktop-testing/ directory
cd test-suite/ui/desktop-testing
npm install
npx playwright install
```

---

### 3. Create Your `.env` File

Create `.env` from the template inside `ui/desktop-testing/`:

```bash
cd test-suite/ui/desktop-testing
cp .env.sample .env
```

Open `.env` and fill in all required values:

| Variable             | Description                                         | Example                              |
| -------------------- | --------------------------------------------------- | ------------------------------------ |
| `BASE_URL`           | Portal base URL (no trailing slash)                 | `https://test.sunbirded.org`         |
| `LOGIN_URL`          | Full Keycloak auth URL (copy from browser on login page) | `https://…/auth/realms/sunbird/…` |
| `HOME_URL`           | Home page URL                                       | `https://test.sunbirded.org/home`    |
| `EXPLORE_URL`        | Explore page URL                                    | `https://test.sunbirded.org/explore` |
| `PROFILE_URL`        | Profile page URL                                    | `https://test.sunbirded.org/profile` |
| `TEST_USER_EMAIL`    | Login email for the test account                    | `user1@yopmail.com`                  |
| `TEST_USER_PASSWORD` | Password for the test account                       | `User1@123`                          |

> ⚠️ `.env` is gitignored — **never commit it**. Use `.env.sample` as the checked-in reference.  
> `playwright.config.ts` loads `.env` automatically via `dotenv` before any test runs.

### 4. (Optional) Install MCP Extension

* Install the Playwright MCP extension if required for your environment.

---

## Project Structure

```bash
tests/consumption_1/
```

### Key Files

* **login_flow.spec.ts**

  * Login (valid, Google sign-in, invalid scenarios)

* **home_course_flow.spec.ts**

  * Resume course, sync progress, content consumption

* **course_flow_explore.spec.ts**

  * Explore courses, join course, leave course

* **certificate_download.spec.ts**

  * Certificate validation scenarios

* **helpers.ts**

  * Reusable functions (login, progress, configuration)
  * Exports `BASE_URL`, `LOGIN_URL`, `HOME_URL`, `EXPLORE_URL`, `PROFILE_URL`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` — all sourced from `.env`

* **playwright.config.ts**

  * Test configuration (desktop + mobile)
  * Loads `.env` via `dotenv` on startup

---

## Running Tests

> ⚠️ All commands below must be run from **`test-suite/ui/desktop-testing/`**, not the repo root.  
> Running `npx playwright test` from the wrong directory will result in  
> `Project(s) "chromium" not found` because no `playwright.config.ts` is found.

```bash
cd test-suite/ui/desktop-testing
```

### Full end-to-end flow (Desktop)

```bash
npx playwright test --project=full-flow --headed
```

### Full end-to-end flow (Mobile)

```bash
npx playwright test --project=mobile-full-flow --headed
```

### Desktop + Mobile together

```bash
npx playwright test --project=full-flow --project=mobile-full-flow --headed
```

### Run a single spec file

```bash
npx playwright test tests/consumption_1/login_flow.spec.ts --headed --project=chromium
```

---

## Reports

```bash
npx playwright show-report
```

If you encounter port issues:

```bash
npx playwright show-report --port=9324
```

---
