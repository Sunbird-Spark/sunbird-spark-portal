import { Page } from '@playwright/test';

/**
 * Global helper to detect and recover from server errors (502/503/504)
 */
export async function handleServerErrors(page: Page, maxRetries = 4): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    if (page.isClosed()) return true;

    const errorDetected = await page.evaluate(() => {
      const text = document.body.innerText;
      const title = document.title;
      return text.includes('502') || text.includes('Bad Gateway') ||
        text.includes('503') || text.includes('Service Unavailable') ||
        text.includes('504') || text.includes('Gateway Timeout') ||
        text.includes('Bad gateway') || text.includes('Failed to fetch content') ||
        text.includes('404') || text.includes('Not Found') ||
        title.toLowerCase().includes('not found') || title.includes('404');
    }).catch(() => false);

    if (errorDetected) {
      console.warn(`Server Error (50x) detected. Attempt ${i + 1}/${maxRetries}. Refreshing in 10s...`);
      await page.waitForTimeout(10000).catch(() => { });
      if (page.isClosed()) return true;
      await page.reload({ waitUntil: 'load', timeout: 60000 }).catch(() => { });
    } else {
      return true;
    }
  }
  return false;
}

/**
 * Handle Auth/Login if present
 */
export async function handleLogin(page: Page) {
  const emailField = page.locator('input[type="email"], input[name="username"]').first();
  if (await emailField.count() > 0 && await emailField.isVisible()) {
    console.log('Login page detected. Filling credentials...');
    await emailField.fill('user2@yopmail.com');
    const passField = page.locator('input[type="password"]').first();
    if (await passField.count() > 0) await passField.fill('User2@123');

    await page.getByRole('button', { name: /LOGIN|Sign in/i }).first().click().catch(() => page.keyboard.press('Enter'));
    await page.waitForLoadState('networkidle').catch(() => { });
  }
}
