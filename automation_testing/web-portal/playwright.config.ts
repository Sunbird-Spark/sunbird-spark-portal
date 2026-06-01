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
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL ?? 'https://test.sunbirded.org',
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
          slowMo: 500,
          args: ['--disable-blink-features=AutomationControlled'],
        },
      },
    },

    // ── Standard tests: signup, login, forgot-password, anonymous, etc. ──────
    {
      name: 'chromium',
      testIgnore: /googleLogin\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Google login tests only ───────────────────────────────────────────────
    {
      name: 'chromium-google',
      testMatch: /googleLogin\.spec\.ts/,
      dependencies: ['googleSetup'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
