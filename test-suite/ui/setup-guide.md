# Test Suite – Sunbird Spark Portal

A comprehensive end-to-end (E2E) automation suite for the Sunbird Spark Portal, covering both **desktop** and **mobile** user journeys. This suite ensures reliability of core features like login, course consumption, progress tracking, and certificate workflows across platforms.

---

##  Tech Stack

### Desktop Automation

* **Playwright**
* **TypeScript**


### Mobile Automation

* **Appium**
* **WebdriverIO**
* **UiAutomator2 (Android)**
* **Chrome (Mobile Web)**

---

## Project Structure

```
test-suite/
└── ui/
    ├── desktop-testing/      # Playwright tests (Desktop)
    │   ├── tests/
    │   ├── .env.sample
    │   ├── helpers.ts
    │   ├── playwright.config.ts
    │   └── package.json
    │
    └── mobile-testing/       # Appium tests (Mobile)
        ├── app/test/specs/
        ├── wdio.conf.ts
        ├── wdio.android.conf.ts
        ├── wdio.main.conf.ts
        └── package.json
```

---

## Getting Started

### Prerequisites

* **Node.js** (latest LTS recommended)
* **npm**
* **Git**
* **Android Studio** (for mobile testing)
* **Android Emulator** (recommended: Pixel 7 API 35)

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd test-suite
```

---

### 2. Install Dependencies

#### Desktop (Playwright)

```bash
cd ui/desktop-testing
npm install
npx playwright install
```

#### Mobile (Appium)

```bash
cd ../mobile-testing
npm install
appium driver install uiautomator2
```

---

## Desktop Testing (Playwright)

### Environment Setup

> ⚠️ All Playwright commands must be run from inside `ui/desktop-testing/` — **not** the repo root.  
> Running from the wrong directory causes `Project(s) "chromium" not found`.

#### Step 3: Create the `.env` file

```bash
cd ui/desktop-testing
cp .env.sample .env
```

Open `.env` and populate every variable:

| Variable             | Description                                         | Example value                              |
| -------------------- | --------------------------------------------------- | ------------------------------------------ |
| `BASE_URL`           | Portal base URL (no trailing slash)                 | `https://test.sunbirded.org`               |
| `LOGIN_URL`          | Full Keycloak OIDC auth URL (copy from browser on login page) | `https://…/auth/realms/sunbird/…` |
| `HOME_URL`           | Home page URL                                       | `https://test.sunbirded.org/home`          |
| `EXPLORE_URL`        | Explore page URL                                    | `https://test.sunbirded.org/explore`       |
| `PROFILE_URL`        | Profile page URL                                    | `https://test.sunbirded.org/profile`       |
| `TEST_USER_EMAIL`    | Login email for the test account                    | `user1@yopmail.com`                        |
| `TEST_USER_PASSWORD` | Password for the test account                       | `User1@123`                                |

> ⚠️ `.env` is gitignored — **never commit it**. Use `.env.sample` as the checked-in reference template.  
> `playwright.config.ts` loads `.env` automatically via `dotenv` before any test runs.


---

### Run Tests

```bash
# Must be run from ui/desktop-testing/
cd ui/desktop-testing
npx playwright test --project=full-flow --headed
```

Run a specific spec:

```bash
npx playwright test tests/consumption_1/home_course_flow.spec.ts --project=chromium --headed
```

---

### View Reports

```bash
npx playwright show-report
```

If port conflict:

```bash
npx playwright show-report --port=9324
```

---

## Mobile Testing (Appium + WebdriverIO)

### Emulator Setup

1. Start Android Emulator
2. Verify device:

```bash
adb devices -l
```

3. Update `wdio.android.conf.ts` if needed:

```ts
"appium:deviceName": "Pixel_7_API_35",
// "appium:udid": "<your-device-id>"
```

---

### Environment Configuration

Create `.env` file inside `mobile-testing`:

| Variable            | Description             |
| ------------------- | ----------------------- |
| `SUNBIRD_URL`       | Portal URL              |
| `SUNBIRD_USERNAME`  | Login email             |
| `SUNBIRD_PASSWORD`  | Login password          |
| `COURSE_NAME`       | Course for consumption  |
| `COMPLETE_COURSE`   | 100% completed course   |
| `INCOMPLETE_COURSE` | Partial course          |
| `LOW_SCORE_COURSE`  | Completed but low score |

---

### Run Tests

#### Full Suite

```bash
npm run wdio:suite
```

#### Individual Tests

```bash
npm run wdio:android -- --spec <test-file>
```

---

## Test Coverage

### Desktop (Playwright)

* Login (valid, invalid, Google sign-in)
* Course continuation & progress sync
* Explore & enroll flows
* Certificate validation

### Mobile (Appium)

* Course consumption (all content types)
* Certificate validation scenarios
* Sync progress functionality

---

## Scripts Overview

### Playwright

```bash
npx playwright test
npx playwright show-report
```

### Appium (WebdriverIO)

```bash
npm run wdio:suite
npm run wdio:android
```

---

## Troubleshooting

### Common Issues

1. **`Project(s) "chromium" not found`**

   Playwright was run from the wrong directory — it couldn't find `playwright.config.ts`.  
   Always `cd` into `ui/desktop-testing/` first:

   ```bash
   cd test-suite/ui/desktop-testing
   npx playwright test …
   ```

2. **Port already in use (9323)**

```bash
npx playwright show-report --port=9324
```

2. **No tests found**

* Ensure correct file naming (`*.spec.ts`)
* Check test directory structure

3. **Emulator not detected**

```bash
adb devices -l
```

4. **Dependency issues**

```bash
rm -rf node_modules
npm install
```

---

## Summary

This test suite enables:

* Cross-platform automation (Desktop + Mobile)
* End-to-end validation of critical user flows
* Scalable and reusable testing setup for Spark Portal


