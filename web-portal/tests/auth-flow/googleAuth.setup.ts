import { test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authFile = path.join(__dirname, '../.auth/googleUser.json');

setup('authenticate with Google', async ({ page }) => {
  if (fs.existsSync(authFile)) {
    return;
  }

  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  // Go directly to Google — this captures only Google session cookies,
  // not the portal session, so the test can exercise the full sign-in flow.
  await page.goto('https://accounts.google.com');
  await page.waitForLoadState('networkidle');

  // Complete the Google sign-in manually, then press Resume.
  await page.pause();

  await page.context().storageState({ path: authFile });
});
