import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 10 * 60 * 1000,
  workers: 1,
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    viewport: { width: 1280, height: 800 },

    // Slow down each action by 800ms so tests run at a readable pace
    launchOptions: {
      slowMo: 800,
    },

    // Capture screenshot only on failure
    screenshot: 'only-on-failure',

    // Record video only on failure
    video: 'retain-on-failure',

    // Capture trace on failure for detailed debugging
    trace: 'retain-on-failure',

    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    navigationTimeout: 60000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // ── Full end-to-end flow: 4 steps in strict order ─────────────────────
    // Each step depends on the previous so they always run in sequence.
    // Usage: npx playwright test --project=full-flow --headed
    // {
    //   name: 'step-1-login',
    //   use: { ...devices['Desktop Chrome'] },
    //   testMatch: '**/consumption_1/login_flow.spec.ts',
    // },
    {
      name: 'step-2-home',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/consumption_1/home_course_flow.spec.ts',
      // dependencies: ['step-1-login'],
    },
    {
      name: 'step-3-explore',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/consumption_1/course_flow_explore.spec.ts',
      dependencies: ['step-2-home'],
    },
    {
      name: 'full-flow',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/consumption_1/certificate_download.spec.ts',
      dependencies: ['step-3-explore'],
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // ── Mobile full flow (same 4 steps, Pixel 5 viewport) ─────────────────
    // Usage: npx playwright test --project=mobile-full-flow --headed
    {
      name: 'mobile-step-2-home',
      use: { ...devices['Pixel 5'] },
      testMatch: '**/consumption_1/home_course_flow.spec.ts',
    },
    {
      name: 'mobile-step-3-explore',
      use: { ...devices['Pixel 5'] },
      testMatch: '**/consumption_1/course_flow_explore.spec.ts',
      dependencies: ['mobile-step-2-home'],
    },
    {
      name: 'mobile-full-flow',
      use: { ...devices['Pixel 5'] },
      testMatch: '**/consumption_1/certificate_download.spec.ts',
      dependencies: ['mobile-step-3-explore'],
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
