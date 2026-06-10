import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60 * 1000,
  expect: {
    timeout: 10000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? 'html' : [['html', { open: 'always' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://sandbox.sunbirded.org',
    trace: 'on-first-retry',
  },
  projects: [
    // ── Setup: Google auth (only needed for googleLogin.spec.ts) ──────────────
    {
      name: 'googleSetup',
      testMatch: /googleAuth\.setup\.ts/,
      use: {
        channel: 'chrome',
        headless: false,
        launchOptions: {
          slowMo: Number(process.env.SLOWMO ?? 0),
          args: ['--disable-blink-features=AutomationControlled'],
        },
      },
    },

    // ── Setup: registeredUser auth (saves .auth/registeredUser.json) ──────────
    {
      name: 'registeredUserSetup',
      testMatch: /registeredUserAuth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Setup: user2 auth (saves .auth/user2.json) ────────────────────────────
    {
      name: 'user2Setup',
      testMatch: /user2Auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── tests/specs/ — superseded by the E2E chain below; keeping commented out
    // to avoid running each spec file twice (specs + e2e-5/6/7 would both match).
    // {
    //   name: 'specs',
    //   testMatch: /tests\/specs\/.*\.spec\.ts/,
    //   dependencies: ['user2Setup'],
    //   use: { ...devices['Desktop Chrome'] },
    // },

    // ── Standard tests: signup, login, forgot-password, anonymous, etc. ──────
    {
      name: 'chromium',
      testIgnore: [
        /googleLogin\.spec\.ts/,
        /tests\/specs\/.*\.spec\.ts/,
        /anonymous_user_consumption\/.*\.spec\.ts/,
      ],
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Google login tests only ───────────────────────────────────────────────
    {
      name: 'chromium-google',
      testMatch: /googleLogin\.spec\.ts/,
      dependencies: ['googleSetup'],
      use: { ...devices['Desktop Chrome'] },
    },

    // ── E2E projects — each runs independently (no inter-test dependencies). ────
    // retries: 0 on every E2E project — these tests mutate real state (enrollment,
    // course progress, certificates). Retrying after a failure re-runs against
    // already-modified state, wastes time, and can produce misleading results.
    {
      name: 'e2e-1-home',
      testMatch: /anonymous_user_consumption\/homeContent\.spec\.ts/,
      retries: 0,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e-2-explore',
      testMatch: /anonymous_user_consumption\/exploreContent\.spec\.ts/,
      retries: 0,
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'e2e-5-enrollment',
      testMatch: /specs\/enrollment\.spec\.ts/,
      dependencies: ['user2Setup'],
      retries: 0,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e-6-explore-enrollment',
      testMatch: /specs\/explore_enrollment\.spec\.ts/,
      dependencies: ['user2Setup'],
      retries: 0,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e-7-certificate',
      testMatch: /specs\/certificate_download\.spec\.ts/,
      dependencies: ['user2Setup'],
      retries: 0,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
