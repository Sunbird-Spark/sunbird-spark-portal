
# Directory Structure

```txt
test-automation/
│
├── config/                                    # Central configuration for all testing environments
│   ├── env.config.json                       # Environment URLs (dev, staging, prod) for both web and mobile
│   ├── test.config.json                      # Test execution settings (timeouts, retries, workers, screenshots)
│   └── devices.config.json                   # Mobile device configurations (Android/iOS emulators and real devices)
│
│
├── web-portal/                                # ========== PLAYWRIGHT WEB TESTING ==========
│   │
│   ├── playwright.config.ts                  # Playwright configuration (browsers, base URL, reporters)
│   ├── package.json                          # Web project dependencies (Playwright, TypeScript, etc.)
│   │
│   ├── data/                                 # Test data and credentials for web portal
│   │   ├── urls.ts                          # Helper URLs (endpoints, navigation paths)
│   │   ├── users.ts                         # User credentials (test users with roles)
│   │   └── testdata.ts                      # Test data (course names, content IDs, form inputs)
│   │
│   ├── pages/                                # Page Object Model - Web page representations
│   │   ├── LoginPage.ts                     # Login page selectors and actions
│   │   ├── SignupPage.ts                    # Signup page selectors and actions
│   │   ├── HomePage.ts                      # Home page (continue watching, in-progress content)
│   │   ├── ExplorePage.ts                   # Explore page (filters, search, content cards)
│   │   ├── MyLearningPage.ts                # My Learning page (active, completed, upcoming courses)
│   │   ├── ProfilePage.ts                   # Profile page (user info, certificates)
│   │   ├── CoursePage.ts                    # Course detail/collection page
│   │   ├── ContentPlayerPage.ts             # Content player (video, PDF, ePub, etc.)
│   │   └── components/                      # Reusable UI components across pages
│   │       ├── Header.ts                    # Header navigation component
│   │       ├── Sidebar.ts                   # Sidebar menu component
│   │       ├── ContentCard.ts               # Content card component (reused in Home/Explore)
│   │       ├── Modal.ts                     # Modal/dialog component
│   │       └── CourseCard.ts                # Course card component
│   │
│   ├── fixtures/                             # Reusable setup and teardown logic
│   │   ├── auth.fixture.ts                  # Authentication fixture (auto-login, session management)
│   │   └── data.fixture.ts                  # Data fixtures (pre-created courses, users)
│   │
│   ├── assertions/                           # Custom assertion functions for validation
│   │   ├── common.assertions.ts             # Common UI assertions (visibility, text, enabled/disabled)
│   │   ├── course.assertions.ts             # Course-specific assertions (enrollment, progress)
│   │   └── player.assertions.ts             # Content player assertions (playback, progress tracking)
│   │
│   ├── tests/                                # Test specifications organized by feature
│   │   ├── auth/                            # Authentication flow tests
│   │   │   ├── login.spec.ts               # Login test cases
│   │   │   ├── signup.spec.ts              # Signup test cases
│   │   │   └── forgot-password.spec.ts     # Password recovery tests
│   │   │
│   │   ├── consumption/                     # Content consumption flow tests
│   │   │   ├── home.spec.ts                # Home page tests (continue watching)
│   │   │   ├── explore.spec.ts             # Explore page tests (filters, search)
│   │   │   ├── content-player.spec.ts      # Content player tests (all formats)
│   │   │   ├── my-learning.spec.ts         # My Learning page tests
│   │   │   ├── certificates.spec.ts        # Certificate download/verification
│   │   │   └── reports.spec.ts             # User reports tests
│   │   │
│   │   └── profile/                         # Profile management tests
│   │       └── profile.spec.ts             # Profile page tests
│   │
│   ├── utils/                                # Utility functions and helpers
│   │   ├── helpers.ts                       # Common helper functions (wait, scroll, etc.)
│   │   ├── logger.ts                        # Custom logger for test execution
│   │   └── api-helpers.ts                   # API utility functions (if needed)
│   │
│   └── reports/                              # Test execution reports (HTML, JSON)
│       ├── html/                            # HTML reports
│       └── json/                            # JSON reports
│
│
├── mobile-app/                                # ========== APPIUM MOBILE TESTING ==========
│   │
│   ├── appium.config.ts                      # Appium configuration (capabilities, server settings)
│   ├── package.json                          # Mobile project dependencies (Appium, WebdriverIO, etc.)
│   │
│   ├── data/                                 # Test data and credentials for mobile app
│   │   ├── users.ts                         # User credentials (test users)
│   │   └── testdata.ts                      # Test data (course names, content IDs)
│   │
│   │
│   ├── fixtures/                             # Reusable setup and teardown logic for mobile
│   │   ├── auth.fixture.ts                  # Authentication fixture (auto-login)
│   │   └── app.fixture.ts                   # App installation/reset fixtures
│   │
│   ├── assertions/                           # Custom assertion functions for mobile
│   │   ├── common.assertions.ts             # Common mobile assertions (element visibility, text)
│   │   ├── course.assertions.ts             # Course-specific assertions
│   │   └── player.assertions.ts             # Player assertions
│   │
│   ├── tests/                                # Test specifications organized by platform and feature
│   │   │
│   │   ├── android/                         # Android-specific tests
│   │   │   ├── auth/                       # Authentication tests
│   │   │   │   ├── login.spec.ts
│   │   │   │   └── signup.spec.ts
│   │   │   │
│   │   │   ├── consumption/                # Consumption flow tests
│   │   │   │   ├── home.spec.ts
│   │   │   │   ├── explore.spec.ts
│   │   │   │   ├── content-player.spec.ts
│   │   │   │   └── my-learning.spec.ts
│   │   │   │
│   │   │   └── profile/                    # Profile tests
│   │   │       └── profile.spec.ts
│   │   │
│   │   └── ios/                             # iOS-specific tests
│   │                                                             
│   │
│   ├── app/                                 # Mobile application binaries
│   │   └── android/                         # Android APK files
│   │      ├── app-debug.apk               # Debug build
│   │      └── app-release.apk             # Release build
│   │
│   └── reports/                              # Mobile test execution reports
│       └── android/                         # Android test reports                              
│
├── scripts/                                   # Shell scripts for easy test execution
│   ├── test.sh                              # Main interactive test runner (asks user for choices)
│   ├── setup.sh                             # Initial project setup (install dependencies, configure)
│   ├── web-test.sh                          # Run web portal tests only
│   ├── mobile-test.sh                       # Run mobile app tests only
│   └── cleanup.sh                           # Clean up old reports, logs, and temporary files
│
│
├── .gitignore                                # Git ignore file (exclude node_modules, reports, .env)
├── package.json                              # Root package.json (workspaces or common scripts)
└── README.md                                 # Project documentation and usage instructions

```


## WEB PORTAL STRUCTURE (web-portal/)
- **data/**: Stores all test data, URLs, and user credentials
- **pages/**: Page Object Model - each file represents a web page with its selectors and actions
- **pages/components/**: Reusable UI components shared across multiple pages
- **fixtures/**: Pre-configured states (like logged-in user) to avoid repetitive setup
- **assertions/**: Custom validation functions to check expected outcomes
- **tests/**: Actual test cases organized by feature (auth, consumption, profile, etc..)
- **utils/**: Helper functions for common operations
- **reports/**: Generated test execution reports

## MOBILE APP STRUCTURE (mobile-app/)
- **data/**: Test data and user credentials for mobile tests
- **fixtures/**: Pre-configured states for mobile (app reset, login state)
- **assertions/**: Custom validation functions for mobile UI
- **tests/android/**: Platform-specific test cases
- **apps/**: APK (Android) and IPA (iOS) application files
- **reports/**: Generated mobile test reports

## CONFIGURATION (config/)
- **env.config.json**: Defines different environments (dev, staging, prod) with their URLs
- **test.config.json**: Test execution settings (timeouts, retries, parallel execution)
- **devices.config.json**: Mobile device configurations (emulators, real devices)

## SCRIPTS (scripts/)
- **test.sh**: Main entry point - interactive menu for users to choose what to test
- **setup.sh**: One-time setup to install all dependencies
- **web-test.sh**: Quick script to run only web tests
- **mobile-test.sh**: Quick script to run only mobile tests
- **cleanup.sh**: Clean up old reports and temporary files
