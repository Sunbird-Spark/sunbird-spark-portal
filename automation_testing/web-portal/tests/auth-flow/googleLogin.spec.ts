import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/loginPage';
import { OnboardingPage } from '../../pages/onboardingPage';
import { urls } from '../../data/urls';
import { authPaths } from '../../data/authPaths';

// Restore the full Google session (cookies + localStorage) before each test.
// The setup file only visits accounts.google.com, so this file contains no
// portal cookies — the test still starts with the user unauthenticated on the portal.
test.use({ storageState: authPaths.googleUser });

test.describe('Google Sign-In Flow', () => {
  test('Verify that a registered user can sign in using Google', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const onboardingPage = new OnboardingPage(page);


    // 1. Navigate to the portal — user is not logged in, Login button is visible
    await loginPage.navigateTo(urls.main);

    // 2. Click Login to open the Keycloak login form
    await loginPage.clickLoginHeader();
    await page.locator('#username, #fgtPortalFlow').first().waitFor({ state: 'visible', timeout: 15000 });

    // 3. Click "Sign in with Google" — Google auto-approves using the saved session cookies
    await loginPage.clickGoogleSignIn();

    // Wait for the full OAuth round-trip to complete and land back on the portal.
    // With saved Google session cookies the redirect through accounts.google.com
    // happens faster than Playwright can observe — wait directly for the portal host.
    const portalHost = new URL(urls.main).hostname;
    await page.waitForURL((url) => url.hostname === portalHost, { timeout: 60000 });
   
    // Wait for OnboardingGuard's API calls (userRead + formRead) to settle.
    // Only after networkidle will the guard have redirected to /onboarding if needed.
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});


    // 5. Handle T&C + onboarding if this is a first-time Google login.
    //    Both methods are no-ops when onboarding is absent (returning users).
    if (page.url().includes('/onboarding')) {
      await test.step('Handle T&C and onboarding', async () => {
        await onboardingPage.handleTermsAndConditions();
        await onboardingPage.fillOnboardingForm('Teacher');
      });
    }

    // 6. Wait until we are on the portal home/dashboard.
    await page.waitForURL(
      (url) => !url.pathname.includes('/onboarding') && !url.pathname.includes('/auth/realms'),
      { timeout: 30000 }
    ).catch(() => {});

    // 7. Verify the user is logged in — Login button must not be visible
    await expect(loginPage.loginButtonHeader).not.toBeVisible({ timeout: 15000 });
  });
});
