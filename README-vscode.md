# Playwright Test Suite – Setup & Usage Guide

## 📌 Overview

This repository contains an end-to-end (E2E) automation test suite built using Playwright to validate user consumption flows on the Spark Portal. It covers critical user journeys such as login, course consumption, progress tracking, and certificate downloads.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/akshitha-1210/UI_automation.git
cd UI_automation
git checkout some-changes
```

---

### 2. Install Dependencies

Install the required Node.js packages:

```bash
npm install
```

---

### 3. Install Playwright Browsers

```bash
npx playwright install
```

---

### 4. Install Playwright MCP Extension

Download and install the Playwright MCP extension (if required for your environment).

---

## 📂 Project Structure

### Main Test Directory

```
tests/consumption_1/
```

This folder contains all the test scenarios related to user consumption flows.

---

## 🧪 Test Files Overview

### 1. `full_flow.spec.ts`

* Covers the complete end-to-end flow
* Includes login → course consumption → certificate download

---

### 2. `login_flow.spec.ts`

* Validates login functionality
* Covers:

  * Login with valid credentials
  * Sign in with Google
  * Negative scenario: invalid credentials and alert validation

---

### 3. `home_course_flow.spec.ts`

* Tests course continuation from the homepage
* Validates:

  * “Continue from where you left” feature
  * “Sync Progress Now” functionality
  * Consumption of PDF and video content
  * Progress and status updates

---

### 4. `course_flow_explore.spec.ts`

* Tests course discovery and enrollment
* Covers:

  * Navigating to Explore page
  * Joining a course via batch selection
  * Verifying “Leave Course” functionality

---

### 5. `certificate_download.spec.ts`

* Validates certificate-related scenarios
* Covers:

  * Certificate download for completed courses
  * Verification that courses without certificates do not show one

---

### 6. `helpers.ts`

* Contains reusable utility functions such as:

  * Login helpers
  * Course progress validation
* Helps reduce code duplication across test files

---

### 7. `playwright.config.ts`

* Configuration file for Playwright
* Includes:

  * Test settings
  * Browser configuration
  * Timeouts and environment setup

---

## ▶️ Running Tests

Run all tests:

```bash
npx playwright test
```

Run a specific test file:

```bash
npx playwright test tests/consumption_1/login_flow.spec.ts
```

---

## 📊 Viewing Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

If you encounter port issues, use:

```bash
npx playwright show-report --port=9324
```

---

