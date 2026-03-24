# Playwright Test Suite – Spark Portal

## Overview

This repository contains an end-to-end (E2E) automation test suite built using Playwright to validate key user flows on the Spark Portal, including:

* Login
* Course consumption
* Progress tracking
* Certificate download

---

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/akshitha-1210/UI_automation.git
cd UI_automation
git checkout complete-user-flow
```

### 2. Install Dependencies

```bash
npm install
npx playwright install
```

### 3. Configure Credentials

* Update the login URL and credentials in `helpers.ts` if required (e.g., staging/production).

### 4. (Optional) Install MCP Extension

* Install the Playwright MCP extension if required for your environment.

---

## Project Structure

```
tests/consumption_1/
```

### Test Files

* **login_flow.spec.ts**

  * Valid login
  * Google sign-in
  * Invalid login scenario

* **home_course_flow.spec.ts**

  * Resume course
  * Sync progress
  * PDF & video consumption
  * Progress validation

* **course_flow_explore.spec.ts**

  * Explore courses
  * Join course
  * Leave course

* **certificate_download.spec.ts**

  * Download certificate
  * Validate absence of certificate where applicable

* **helpers.ts**

  * Reusable functions (login, progress checks, config)

* **playwright.config.ts**

  * Test configuration (desktop + mobile)
  * Browser setup, timeouts, environments

---

## Running Tests

### Run Desktop Tests

```bash
npx playwright test --project=full-flow --headed
```

### Run Mobile Tests

```bash
npx playwright test --project=mobile-full-flow --headed
```

### Run Both (Desktop + Mobile)

```bash
npx playwright test --project=full-flow --project=mobile-full-flow --headed
```

### Run Specific Test

```bash
npx playwright test tests/consumption_1/login_flow.spec.ts --headed --project=chromium
```

---

## View Test Reports

```bash
npx playwright show-report
```

If you encounter port issues:

```bash
npx playwright show-report --port=9324
```

---

## Summary

This test suite enables comprehensive validation of end-to-end user consumption flows across both desktop and mobile views, ensuring consistent functionality and user experience.
