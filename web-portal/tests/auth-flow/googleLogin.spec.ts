import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/loginPage';
import { urls } from '../../data/urls';
import fs from 'fs';

const authFile = '.auth/googleUser.json';

test.beforeEach(async ({ context }) => {
  // Load only Google cookies from the saved session — portal cookies are excluded
  // so the test always starts with the user unauthenticated on the portal.
  const state = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
  const googleCookies = state.cookies.filter((c: { domain: string }) =>
    c.domain.includes('google.com')
  );
  await context.addCookies(googleCookies);
});

test.describe('Google Sign-In Flow', () => {
  test('Verify that a registered user can sign in using Google', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // 1. Navigate to the portal — user is not logged in, Login button is visible
    await loginPage.navigateTo(urls.main);

    // 2. Click Login to open the modal
    await loginPage.clickLoginHeader();
    await page.locator('#username, #fgtPortalFlow').first().waitFor({ state: 'visible', timeout: 15000 });

    // 3. Click "Sign in with Google" — Google auto-approves using the saved cookies
    await loginPage.clickGoogleSignIn();
    await page.waitForURL(/accounts\.google\.com/, { timeout: 15000 });

    // 4. Google redirects back to the portal automatically
    await page.waitForURL(/sandbox\.sunbirded\.org/, { timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // 5. Verify the user is logged in — Login button must not be visible
    await expect(loginPage.loginButtonHeader).not.toBeVisible({ timeout: 15000 });
  });
});
