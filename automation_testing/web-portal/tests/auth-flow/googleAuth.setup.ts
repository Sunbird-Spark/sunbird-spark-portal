import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { authPaths } from '../../data/authPaths';

setup('authenticate with Google', async ({ page }) => {
  fs.mkdirSync(path.dirname(authPaths.googleUser), { recursive: true });

  // Go directly to Google — this captures only Google session cookies,
  // not the portal session, so the test can exercise the full sign-in flow.
  await page.goto('https://accounts.google.com');
  await page.waitForLoadState('networkidle');

  // Complete Google sign-in manually in the headed browser, then press Resume.
  await page.pause();

  await page.context().storageState({ path: authPaths.googleUser });
});
