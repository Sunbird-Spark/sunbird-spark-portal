import { test, expect } from '@playwright/test';
import { urls } from '../../data/urls';
import { users } from '../../data/users';
import { loginAsUser } from '../helpers/loginHelper';
import { collectCards, consumeContent } from '../helpers/contentHelper';

test.use({ launchOptions: { slowMo: 1000 } });
test.setTimeout(300000);

test.describe('Registered User - Home Page Course Consumption', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, users.registeredUser.email, users.registeredUser.password);
    await page.goto(urls.main);
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

    // Confirm the user is logged in (Login button must not be visible)
    const loginBtn = page.getByRole('button', { name: /^login$/i })
      .or(page.getByRole('link', { name: /^login$/i }));
    await expect(loginBtn.first()).not.toBeVisible({ timeout: 10000 });
  });

  test('Consume all available content types on the home page', async ({ page }) => {
    // Scroll to load all content cards
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 600));
      await page.waitForTimeout(300);
    }

    const cardsToConsume = await collectCards(page);
    console.log('Cards to consume (registered user):', cardsToConsume);
    expect(cardsToConsume.length).toBeGreaterThan(0);

    for (const { type, href } of cardsToConsume) {
      console.log(`\n── Consuming ${type} ──`);

      await page.goto(urls.main);
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

      const cardId = href.split('/').pop()!;
      const card = page.locator(`a[href*="${cardId}"]`).first();

      for (let i = 0; i < 8; i++) {
        if (await card.isVisible({ timeout: 1000 }).catch(() => false)) break;
        await page.evaluate(() => window.scrollBy(0, 400));
        await page.waitForTimeout(200);
      }

      if (!(await card.isVisible({ timeout: 3000 }).catch(() => false))) {
        console.log(`Card not found for ${type}, skipping`);
        continue;
      }

      await card.scrollIntoViewIfNeeded();
      await card.click();
      await page.waitForURL(/\/content\//, { timeout: 15000 });
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

      await consumeContent(page, type);
      console.log(`Done: ${type}`);
    }
  });
});
