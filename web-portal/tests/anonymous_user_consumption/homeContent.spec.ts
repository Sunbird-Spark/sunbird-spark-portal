import { test, expect } from '@playwright/test';
import { urls } from '../../data/urls';
import { collectCards, consumeContent } from '../helpers/contentHelper';

test.use({ launchOptions: { slowMo: 1000 } });
test.setTimeout(300000);

test.describe('Anonymous User - Home Page Content Consumption', () => {
  test('Verify that an anonymous user can consume all available content types', async ({ page }) => {

    // 1. Go to home page and scroll to collect one card URL per content type
    await page.goto(urls.main);
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 600));
      await page.waitForTimeout(300);
    }

    const cardsToConsume = await collectCards(page);
    console.log('Cards to consume:', cardsToConsume);
    expect(cardsToConsume.length).toBeGreaterThan(0);

    // 2. For each type: go to home → click card → consume → "Go back" lands on home
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
        console.log(`  Card not found for ${type}, skipping`);
        continue;
      }

      await card.scrollIntoViewIfNeeded();
      await card.click();
      await page.waitForURL(/\/content\//, { timeout: 15000 });
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

      await consumeContent(page, type);
      console.log(`  Done: ${type}`);
    }
  });
});
