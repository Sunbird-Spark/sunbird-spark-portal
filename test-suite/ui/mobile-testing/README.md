# Appium Test suite - Setup & Usage Guide

Automated end-to-end test suite for the Sunbird Spark learning portal, built with WebdriverIO + Appium on Android Chrome (mobile view).

---

## Recommened Setup
- Android Emulator — `Pixel_7_API_35` (Android 14)
- Android Studio (for emulator setup)
- Chrome browser on emulator

---


## Setup

### Cloning the repository and installing Node.js packages:
```bash
git clone https://github.com/sho6000/MobileUI_automation
git checkout testsuit-1
```

### Install
```bash
npm install
appium driver install uiautomator2
```

### package.json modification
```ts
"scripts": {
    "wdio": "wdio run ./wdio.conf.js",
    
    // Add below files for the installed android emulator and the main test script file
    // Android connecter file
    "wdio:android": "wdio run ./wdio.android.conf.ts",
    // Combined test suite
    "wdio:suite": "wdio run ./wdio.main.conf.ts"
  }
```



### wdio.android.conf.ts modification

To find emulator udid after running the android instance
```cmd
adb devices -l
```

Cross-check with your deviceName & `appium:udid` to connect the scirpt to the chrome browser
```ts
capabilities: [
    {
      platformName: "Android",

      browserName: "chrome", 

      "appium:deviceName": "Pixel_7_API_35",
      "appium:platformVersion": "14",
      "appium:automationName": "UiAutomator2",
    //   "appium:udid": "UPDATE HERE",
      "appium:chromedriverAutodownload": true,
      "appium:newCommandTimeout": 600,
      "appium:noReset": false,
    },
  ]
```

### Run complete test script
```bash
npm run wdio:suite
```

### Run individual scripts
1. Course consumption
```bash
npm run wdio:android -- --spec course-consumption-any-content.e2e.ts
```
2. Certificate
```bash
npm run wdio:android -- --spec education-certificate-download.e2e.ts
```
3. Sync in Progress
```bash
npm run wdio:android -- --spec course-sync-progress-menu.e2e.ts
```

---

## Project Structure
```bash
app/
├── test/
│   └── specs/
│       ├── course-consumption-any-content.e2e.ts
│       ├── education-certificate-download.e2e.ts
│       └── course-sync-progress-menu.e2e.ts
├── wdio.conf.ts
├── wdio.android.conf.ts
├── wdio.main.conf.ts
└── package.json
```

---

## Test Scripts Overview

### 1. Course Consumption (`course-consumption-any-content.e2e.ts`)

Tests the full course consumption flow — enrolls a user and consumes all content types to reach 100% completion.

**Content types handled:** Video, YouTube, PDF, EPUB, H5P, HTML, Assessment

**Test case:**

| TC | Description |
|---|---|
| TC1 | Enroll → consume all content types → verify 100% completion |

**Run:**
- [Go here to run](#run-individual-scripts)


**Course name can be changed via environment variable:**
```bash
COURSE_NAME="Your Course Name" npm run wdio:android -- --spec course-consumption-any-content.e2e.ts
```

---

### 2. Certificate Download (`education-certificate-download.e2e.ts`)

Tests certificate availability based on course completion and assessment score.

**Test cases:**

| TC | Description | Expected |
|---|---|---|
| TC1 & TC3 | 100% completed course → Download Certificate | ✅ Certificate downloads |
| TC2 | Incomplete course → Check certificate | ✅ No certificate shown |
| TC4 | 100% complete but low assessment score → Check certificate | ✅ "No certificate" shown (Neagtive) |

**Run:**
- [Go here to run](#run-individual-scripts)

---

### 3. Sync Progress Menu (`course-sync-progress-menu.e2e.ts`)

Tests the 3-dot sync progress menu on a completed course.

**Test cases:**

| TC | Description | Expected |
|---|---|---|
| TC2 | 100% course → Click 3-dot menu → Sync progress now | ✅ Success toast appears |
| TC3 | After sync → Check progress | ✅ Progress stays at 100% |
| TC1 | Course < 100% → Click 3-dot menu → Check menu options | ✅ Shows "Leave course" NOT "Sync progress now" — ON HOLD (3-dot click unreliable) (Negative) |



**Run:**
- [Go here to run](#run-individual-scripts)

---

## Configuration

Test credentials and URLs can be set via environment variables:

### Create .env file following the below requirements
-  `COMPLETE_COURSE` Must be 100% completed course
-  `INCOMPLETE_COURSE` 
- - Must be course with less than 100% completion
- `LOW_SCORE_COURSE`
- - Course should be 100% but should _not_ have 100% assessment score

| Variable | Default | Description |
|---|---|---|
| `SUNBIRD_URL` | `https://test.sunbirded.org` | Portal URL |
| `SUNBIRD_USERNAME` | `user1@yopmail.com` | Login email |
| `SUNBIRD_PASSWORD` | `User1@123` | Login password |
| `COURSE_NAME` | varies per script | Target course name for **course-consumption** |
|---|---|---|
| `COMPLETE_COURSE` | varies per script | Target course name for **sync-progress** |
| `INCOMPLETE_COURSE` | varies per script | Target course name for **sync-progress** |
|---|---|---|
| `LOW_SCORE_COURSE` | varies per script | Target course name for **certificate-download** |

---

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@wdio/cli` | `^9.24.0` | WebdriverIO CLI |
| `@wdio/local-runner` | `^9.24.0` | Local test runner |
| `@wdio/mocha-framework` | `^9.24.0` | Mocha test framework |
| `@wdio/spec-reporter` | `^9.24.0` | Test reporter |
| `@wdio/appium-service` | `^9.24.0` | Appium service |
| `@wdio/visual-service` | `^9.1.6` | Visual testing |
| `appium` | `^2.19.0` | Mobile automation |
| `appium-uiautomator2-driver` | `^4.2.9` | Android driver |

