import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/loginPage';
import { urls } from '../../data/urls';
import { users } from '../../data/users';
import { getTempUser } from '../../data/temp_user_util';

test.describe('Authentication Flow - Login', () => {
  test('Verify that a registered user can successfully log in', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigateTo(urls.main);
    await loginPage.clickLoginHeader();

    const tempUser = getTempUser();
    const userToLogin = tempUser || users.contentCreator;

    console.log(`Logging in with user: ${userToLogin.email}`);

    await loginPage.login(userToLogin.email, userToLogin.password);

    // Wait for Keycloak to finish processing and redirect back to the portal.
    // login-actions/authenticate contains the word "login" and is a normal
    // intermediate Keycloak URL — we must wait for it to resolve before asserting.
    // Do NOT swallow the error: if the redirect never happens it means login failed
    // and the test should surface that clearly rather than hitting a confusing URL check.
    await page.waitForURL(
      (url) =>
        !url.pathname.includes('/login') &&
        !url.pathname.includes('/signup') &&
        !url.pathname.includes('/auth/realms'),
      { timeout: 30000 }
    );

    // Confirm we are no longer on any Keycloak auth page.
    // Use /\/auth\/realms\// instead of /.*login.*/ — the latter would also match
    // "login-actions" which is a valid mid-flight Keycloak URL, not a failure state.
    await expect(page).not.toHaveURL(/\/auth\/realms\//, { timeout: 10000 });

    // Positive confirmation: the Login button in the header must be gone,
    // meaning the session is fully established.
    const loginBtn = page.getByRole('button', { name: /^log.?in$/i })
      .or(page.getByRole('link', { name: /^log.?in$/i }));
    await expect(loginBtn.first()).not.toBeVisible({ timeout: 15000 });

    await page.waitForLoadState('networkidle');
  });
});
