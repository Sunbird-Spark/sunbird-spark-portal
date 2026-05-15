import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/loginPage';
import { urls } from '../../data/urls';
import { users } from '../../data/users';

test.describe('Authentication Flow - Login', () => {
  test('Verify that a registered user can successfully log in', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // 1. Navigate to the portal homepage and then to login page
    await loginPage.navigateTo(urls.main);
    await loginPage.clickLoginHeader();

    // 2 & 3. Enter the registered Email/Phone and password
    // Use the newly registered account from the signup flow if available
    const { getTempUser } = require('../../data/temp_user_util');
    const tempUser = getTempUser();
    const userToLogin = tempUser || users.contentCreator;

    console.log(`Logging in with user: ${userToLogin.email}`);

    // Slowing down the flow for visibility
    await page.waitForTimeout(2000);
    await loginPage.loginUsernameInput.fill(userToLogin.email);
    await page.waitForTimeout(1000);
    await loginPage.passwordInput.fill(userToLogin.password);
    await page.waitForTimeout(1000);
    await loginPage.loginSubmitButton.click();

    // 4. Verification: After clicking login, check if the user is redirected to the dashboard/home
    // Usually, the Login button disappears and a profile icon or Logout appears
    await expect(page).not.toHaveURL(/.*login.*/);

    // Additional verification: check if a common logged-in element is visible
    // (e.g., the user's name, profile icon, or a 'Welcome' message)
    // For now, we'll wait for the network to be idle to ensure redirection finished
    await page.waitForLoadState('networkidle');
  });
});
