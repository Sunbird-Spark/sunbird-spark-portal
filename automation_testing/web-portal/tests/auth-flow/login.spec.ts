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

    // Wait for the post-Keycloak redirect to finish before asserting.
    await page.waitForURL(
      (url) =>
        !url.pathname.includes('/login') &&
        !url.pathname.includes('/signup') &&
        !url.pathname.includes('/auth/realms'),
      { timeout: 30000 }
    ).catch(() => {});

    await expect(page).not.toHaveURL(/.*login.*/);
    await page.waitForLoadState('networkidle');
  });
});
