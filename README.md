# Sunbird Portal

A modern, scalable educational platform built with React and Node.js, designed for national-scale deployment.Sunbird is a next-generation scalable open-source learning solution for teachers and tutors. Built for the 21st century with state-of-the-art technology, Sunbird runs natively in cloud/mobile environments. The open-source governance of Sunbird allows a massive community of nation-builders to co-create and extend the solution in novel ways.

## Tech Stack

### Frontend
- **React**: 19.2.1
- **TypeScript**: 5.9.3
- **Vite**: 7.3.1
- **Testing**: Vitest
- **HTTP Client**: Axios 1.13.2

### Backend
- **Node.js**: 24.12.0
- **Express**: 5.2.1
- **TypeScript**: 5.9.3
- **CORS**: 2.8.5

### Development Tools
- **ESLint**: 9.39.2 with TypeScript support
- **Prettier**: 3.7.4
- **SonarQube**: Integrated code quality analysis
- **GitHub Actions**: Automated CI/CD pipeline

## Prerequisites

- **Node.js**: 24.12.0 
- **npm**: Latest version
- **Git**: For version control

### Using Node Version Manager (nvm)

```bash
# Install and use the correct Node.js version
nvm install 24.12.0
nvm use 24.12.0
```

## Project Structure

```
SunbirdEd-portal/
├── .github/                    # CI/CD workflows & GitHub config
│   ├── copilot-instructions.md
│   └── workflows/
│       └── pull-request.yml
├── frontend/                   # React application
│   ├── public/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── components/
│   │   └── configs/
│   │   └── hooks/
│   │   └── locales/
│   │   └── pages/
│   │   └── styles/
│   │   └── api/
│   │   └── types/
│   ├── .prettierrc            # Prettier configuration
│   ├── eslint.config.js       # ESLint configuration
│   ├── vitest.config.ts       # Vitest configuration
│   ├── package.json
│   ├── tsconfig.json          # TypeScript configuration
│   ├── tsconfig.node.json     # Node TypeScript config
│   └── vite.config.ts         # Vite build configuration
├── backend/                   # Express API server
│   ├── src/
│   │   ├── app.ts
│   │   └── server.ts
│   │   └── controllers
│   │   └── middlewares
│   │   └── proxies
│   │   └── routes
│   │   └── services
│   │   └── types
│   ├── .prettierrc            # Prettier configuration
│   ├── eslint.config.js       # ESLint configuration
│   ├── package.json
│   ├── tsconfig.json          # TypeScript configuration
├── .gitignore                 # Git ignore rules
├── README.md                  # This file
└── sonar-project.properties   # SonarQube configuration
```

##  Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sunbird-portal
```

### 2. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

#### Available Frontend Scripts

```bash

# Build for production
npm run build

# Start development server (http://localhost:5173)
npm run dev

# Preview production build
npm run preview

# Run tests
npm run test
npm run test:coverage  # With coverage report

# Code quality
npm run lint          # Check for linting errors
npm run lint:fix      # Auto-fix linting errors
npm run type-check    # TypeScript type checking
```

### 3. Backend Setup

Open a new terminal, navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```
#### i. Configure Environment Variables

**Before running the backend**, you must create and configure your `.env` file:

```bash
cd backend
cp .envExample .env
```

**Important**: After copying, edit `backend/.env` and make these changes for local development:

1. **Change `ENVIRONMENT`** from `test` to `local`:
   ```bash
   ENVIRONMENT=local
   ```

2. **Remove or comment out `NODE_ENV`**:
   ```bash
   # NODE_ENV=test  (comment out or delete this line)
   ```

3. **Update other values** with your actual configuration (database credentials, API tokens, etc.)

> **Note**: The `.envExample` file is configured for automated testing (CI/CD). For local development, you must change `ENVIRONMENT=test` to `ENVIRONMENT=local` and remove the `NODE_ENV` variable.

#### Environment Configuration Files

Three files manage environment configuration in the `backend` folder:

- **`backend/.env`** - Your local values (create from `.envExample`)
- **`backend/.envExample`** - Template with required variables
- **`backend/src/config/env.ts`** - TypeScript module with defaults

#### Configuration Types

**Required Variables** - Must be set in `.env`:
- Listed in `.envExample`
- Examples: Database credentials, API tokens, session secrets

**Optional Variables** - Have defaults, don't need to be in `.env`:
- NOT listed in `.envExample`
- Defined only in `env.ts` with default values
- Examples: `PORT`, `SUNBIRD_PORTAL_LOG_LEVEL`

#### Adding New Configuration

**Optional Variable** (has a default):
Add ONLY to `env.ts`:
```typescript
//Optional ENVIRONMENT VARIABLES
NEW_OPTIONAL_CONFIG: env.NEW_OPTIONAL_CONFIG || 'default-value',
```

**Required Variable** (must be configured):
1. Add to `env.ts`:
```typescript
NEW_REQUIRED_CONFIG: env.NEW_REQUIRED_CONFIG || 'fallback-value',
```
2. Add to `.envExample`:
```bash
NEW_REQUIRED_CONFIG=your-value-here
```
3. Add to your `.env` and notify team members

#### Available Backend Scripts

```bash

# Start server
npm run start

# Code quality
npm run lint          # Check for linting errors
npm run lint:fix      # Auto-fix linting errors
```

### 4. Running Both Services

#### Option 1: Separate Terminals
1. **Terminal 1 (Backend)**:
   ```bash
   cd backend
   npm run start
   ```

2. **Terminal 2 (Frontend)**:
   ```bash
   cd frontend
   npm run dev
   ```


## Application URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

## Testing

### Frontend Testing
The frontend uses vitest with React Testing Library:

```bash
cd frontend
npm run test           # Run all tests
npm run test:coverage  # Generate coverage report
```

### Backend Testing
Backend testing setup is ready but tests need to be implemented:

```bash
cd backend 
npm run test           # Run all tests
npm run test:coverage  # Generate coverage report
```

## Code Quality

This project enforces strict code quality standards:

### TypeScript Configuration
- **Strict mode enabled** across both frontend and backend
- **Comprehensive type checking** with `noUncheckedIndexedAccess`

### ESLint Rules
- TypeScript-first linting configuration
- Prettier integration for consistent formatting

### Pre-commit Quality Checks
```bash
# Frontend
cd frontend
npm run lint && npm run type-check

# Backend  
cd backend
npm run lint && npm run type-check
```
## Code Formatting (Prettier)

This repository uses Prettier to enforce consistent code formatting.

```bash
cd frontend
npm run format       # formats files
npm run format:check # checks formatting (CI)
```

```bash
cd backend
npm run format       # formats files
npm run format:check # checks formatting (CI)
```
### Build

#### Frontend
```bash
cd frontend
npm run build
# Output: frontend/dist/
```

#### Backend
```bash
cd backend
npm run start
# Output: backend/dist/
```

## CI/CD Pipeline

The project includes a GitHub Actions workflow ([.github/workflows/pull-request.yml](.github/workflows/pull-request.yml)) that runs on every pull request:

-  **Linting** (ESLint)
-  **Type checking** (TypeScript)
-  **Testing** (Vitest)
-  **SonarQube analysis** (Code quality & security)

## Development Workflow

1. **Create feature branch**: `git checkout -b feature/your-feature-name`
2. **Make changes** following TypeScript strict guidelines
3. **Run quality checks**: 
   ```bash
   cd frontend && npm run lint && npm run type-check
   cd ../backend && npm run lint && npm run type-check
   ```
4. **Commit changes**: Follow conventional commit format
5. **Create pull request**: CI pipeline will run automatically

## Additional Resources

- [React 19.2.1 Documentation](https://react.dev/)
- [Vite 7+ Guide](https://vite.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Internationalization (i18n)

### Supported Languages
| Language | Code | Direction | Font |
|---|---|---|---|
| English | `en` | LTR | Rubik |
| French | `fr` | LTR | Rubik |
| Portuguese | `pt` | LTR | Rubik |
| Arabic | `ar` | RTL | Noto Sans Arabic |

### Architecture

- **Library**: i18next + react-i18next
- **Config**: `frontend/src/configs/i18n.ts`
- **Language config**: `frontend/src/configs/languages.ts` (codes, labels, direction, fonts)
- **Locale files**: `frontend/src/locales/{en,fr,pt,ar}.json`
- **Hook**: `useAppI18n()` in `frontend/src/hooks/useAppI18n.ts` — provides `t()`, `changeLanguage()`, `isRTL`, `dir`
- **Storage**: `localStorage('app-language')`

### RTL (Arabic) Support

- `I18nDirectionProvider` (`frontend/src/providers/I18nDirectionProvider.tsx`) sets `dir` attribute on `<html>` and `<body>`, and applies the Arabic font via CSS variable
- RTL-specific CSS overrides are in `frontend/src/styles/rtl.css`

### Keycloak Login Page Integration

Portal and Keycloak share the same origin in production, so they share `localStorage`. The Keycloak theme (`sunbird`) reads `localStorage('app-language')` on page load and sets the `KEYCLOAK_LOCALE` cookie to render login/password pages in the user's selected language.

Key files:
- `useAppI18n.ts` — writes language to `localStorage` on change
- `i18n.ts` — reads language from `localStorage` on init
- Keycloak `template.ftl` — reads `localStorage`, sets `KEYCLOAK_LOCALE` cookie, reloads once

### Mobile App Language Sync

The mobile app opens portal pages (signup, forgot-password) in InAppBrowser, which has a separate `localStorage`. To pass the language:
1. Mobile `AuthWebviewService.ts` appends `?lang=XX` to the URL
2. Portal's `ForgotPassword.tsx` reads the `lang` param on mount and writes to `localStorage`
3. Keycloak `template.ftl` reads `localStorage` and applies the locale

### Adding a New Language
1. Add config to `frontend/src/configs/languages.ts`
2. Create `frontend/src/locales/XX.json` with all translated keys
3. Import and register in `frontend/src/configs/i18n.ts`
4. If RTL, add overrides to `frontend/src/styles/rtl.css`
5. Add mapping in Keycloak `template.ftl` locale JS and create `messages_XX.properties`

---

## Troubleshooting

### Common Issues

1. **Node.js version mismatch**: Ensure you're using Node.js 24.12.0
   ```bash
   nvm install 24.12.0
   nvm use 24.12.0

   ```

2. **Port conflicts**: 
   - Frontend (5173) and Backend (3000) ports should be available
   - Change ports in [vite.config.ts](frontend/vite.config.ts) or [server.ts](backend/src/server.ts) if needed

3. **TypeScript errors**: Run type check to identify issues
   ```bash
   npm run type-check
   ```

## License

MIT License - see LICENSE file for details.

---

## Test Automation Suite

The `web-portal/` and `mobile-app/` directories contain a Playwright/Appium test automation suite for end-to-end testing of the Sunbird portal.

### Directory Structure

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
│   │   ├── android/                         # Android-specific tests
│   │   │   ├── auth/
│   │   │   │   ├── login.spec.ts
│   │   │   │   └── signup.spec.ts
│   │   │   ├── consumption/
│   │   │   │   ├── home.spec.ts
│   │   │   │   ├── explore.spec.ts
│   │   │   │   ├── content-player.spec.ts
│   │   │   │   └── my-learning.spec.ts
│   │   │   └── profile/
│   │   │       └── profile.spec.ts
│   │   └── ios/                             # iOS-specific tests
│   │
│   ├── app/                                 # Mobile application binaries
│   │   └── android/
│   │      ├── app-debug.apk
│   │      └── app-release.apk
│   │
│   └── reports/
│       └── android/
│
├── scripts/                                   # Shell scripts for easy test execution
│   ├── test.sh                              # Main interactive test runner
│   ├── setup.sh                             # Initial project setup
│   ├── web-test.sh                          # Run web portal tests only
│   ├── mobile-test.sh                       # Run mobile app tests only
│   └── cleanup.sh                           # Clean up old reports and temporary files
│
├── .gitignore
├── package.json
└── README.md
```

### WEB PORTAL STRUCTURE (web-portal/)
- **data/**: Stores all test data, URLs, and user credentials
- **pages/**: Page Object Model — each file represents a web page with its selectors and actions
- **pages/components/**: Reusable UI components shared across multiple pages
- **fixtures/**: Pre-configured states (like logged-in user) to avoid repetitive setup
- **assertions/**: Custom validation functions to check expected outcomes
- **tests/**: Actual test cases organized by feature (auth, consumption, profile)
- **utils/**: Helper functions for common operations
- **reports/**: Generated test execution reports

### MOBILE APP STRUCTURE (mobile-app/)
- **data/**: Test data and user credentials for mobile tests
- **fixtures/**: Pre-configured states for mobile (app reset, login state)
- **assertions/**: Custom validation functions for mobile UI
- **tests/android/**: Platform-specific test cases
- **apps/**: APK (Android) and IPA (iOS) application files
- **reports/**: Generated mobile test reports

### CONFIGURATION (config/)
- **env.config.json**: Defines different environments (dev, staging, prod) with their URLs
- **test.config.json**: Test execution settings (timeouts, retries, parallel execution)
- **devices.config.json**: Mobile device configurations (emulators, real devices)

### SCRIPTS (scripts/)
- **test.sh**: Main entry point — interactive menu for users to choose what to test
- **setup.sh**: One-time setup to install all dependencies
- **web-test.sh**: Quick script to run only web tests
- **mobile-test.sh**: Quick script to run only mobile tests
- **cleanup.sh**: Clean up old reports and temporary files
