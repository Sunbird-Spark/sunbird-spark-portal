import { test, expect, Page } from '@playwright/test';
import { urls } from '../../data/urls';
import { collectCards, consumeContent } from '../helpers/contentHelper';

test.use({ launchOptions: { slowMo: 1000 } });
test.setTimeout(300000);

async function scrollToLoadAll(page: Page) {
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(300);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

// Returns the hrefs of all content cards currently in the DOM
async function getVisibleCardHrefs(page: Page): Promise<string[]> {
  return page.locator('a[href*="/content/do_"]').evaluateAll((els) =>
    els.map((el) => (el as HTMLAnchorElement).href)
  );
}

// ── Flow 1: Explore page content consumption ─────────────────────────────────

test.describe('Anonymous User - Explore Page Content Consumption', () => {
  test('Consume all available content types on the Explore page', async ({ page }) => {
    await page.goto(urls.explore);
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await scrollToLoadAll(page);

    const cardsToConsume = await collectCards(page);
    console.log('Cards to consume on Explore:', cardsToConsume);
    expect(cardsToConsume.length).toBeGreaterThan(0);

    for (const { type, href } of cardsToConsume) {
      console.log(`\n── Consuming ${type} ──`);

      await page.goto(urls.explore);
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await scrollToLoadAll(page);

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

// ── Flow 2: Explore page filter verification ──────────────────────────────────

// Locate filter checkbox items in the left sidebar.
async function findFilterItems(page: Page) {
  // Wait up to 10 s for the "Filters" heading to appear (Angular renders async)
  await page.getByText('Filters').first()
    .waitFor({ state: 'visible', timeout: 10000 })
    .catch(() => {});
  await page.waitForTimeout(1000);

  // Note: do NOT use .filter({ visible: true }) for Angular Material / custom
  // components — their underlying <input> is hidden but the component itself
  // is interactive. We check visibility per-item in the loop instead.
  const candidates = [
    { sel: 'mat-checkbox',                       label: 'mat-checkbox' },
    { sel: 'sb-checkbox',                        label: 'sb-checkbox' },
    { sel: 'label:has(input[type="checkbox"])',  label: 'label>checkbox' },
    { sel: 'input[type="checkbox"]',             label: 'input[checkbox]' },
    { sel: '[role="checkbox"]',                  label: '[role=checkbox]' },
    { sel: '[class*="filter"] [class*="item"]',  label: 'filter-item' },
    { sel: '[class*="filter"] [class*="option"]',label: 'filter-option' },
    { sel: '[class*="facet"] label',             label: 'facet-label' },
    { sel: '[class*="filter"] label',            label: 'filter-label' },
  ];

  for (const { sel, label } of candidates) {
    const loc = page.locator(sel);
    const count = await loc.count().catch(() => 0);
    if (count > 0) {
      const desc = await loc.first()
        .evaluate((el) => `<${el.tagName.toLowerCase()} class="${el.className}">`)
        .catch(() => '?');
      console.log(`✓ Filter strategy [${label}]: ${count} elements — ${desc}`);
      return loc;
    }
    console.log(`  Filter strategy [${label}]: 0 matches`);
  }

  // Diagnostic: dump all tags + classes near text "Filters" to help identify the right selector
  const dump = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    return els
      .filter(el => {
        const t = (el.textContent ?? '').trim();
        return (t === 'Courses' || t === 'Video' || t === 'PDF' || t === 'EPUB') &&
               (el as HTMLElement).offsetParent !== null;
      })
      .slice(0, 10)
      .map(el => `<${el.tagName.toLowerCase()} class="${el.className}" role="${el.getAttribute('role')}">`);
  });
  console.log('── Elements with text "Courses/Video/PDF/EPUB" ──\n', dump.join('\n'));

  return null;
}

test.describe('Anonymous User - Explore Page Filters', () => {
  test('Verify content changes when filters are applied', async ({ page }) => {
    await page.goto(urls.explore);
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Capture baseline
    const baselineHrefs = await getVisibleCardHrefs(page);
    console.log(`Baseline: ${baselineHrefs.length} cards`);
    expect(baselineHrefs.length).toBeGreaterThan(0);

    const filterItems = await findFilterItems(page);

    if (!filterItems) {
      // Dump page text to help diagnose what selectors to use
      const bodyText = (await page.locator('body').innerText()).slice(0, 800);
      console.log('── No filter elements found. Page text sample ──\n', bodyText);
      throw new Error('Could not locate any filter checkboxes on the Explore page');
    }

    const filterCount = await filterItems.count();
    console.log(`Testing up to 5 of ${filterCount} filter options`);

    let passedFilters = 0;
    let tried = 0;

    for (let i = 0; i < filterCount && tried < 5; i++) {
      const item = filterItems.nth(i);

      if (!(await item.isVisible({ timeout: 1000 }).catch(() => false))) continue;

      const filterName = (await item.textContent().catch(() => ''))?.trim() || `Filter ${i}`;

      // Skip empty labels or very short ones (likely decorative / section headers)
      if (filterName.length < 2) continue;

      tried++;
      console.log(`\nApplying filter [${i}]: "${filterName}"`);

      await item.scrollIntoViewIfNeeded().catch(() => {});
      await item.click();
      await page.waitForTimeout(3000);

      const filteredHrefs = await getVisibleCardHrefs(page);
      console.log(`  After filter: ${filteredHrefs.length} cards`);

      const hasChanged =
        filteredHrefs.length !== baselineHrefs.length ||
        filteredHrefs.some((h) => !baselineHrefs.includes(h)) ||
        baselineHrefs.some((h) => !filteredHrefs.includes(h));

      console.log(`  Content changed: ${hasChanged}`);

      // Soft assertion — a single filter that shows all content doesn't fail the run
      expect.soft(hasChanged, `Filter "${filterName}" did not change content`).toBe(true);
      if (hasChanged) passedFilters++;

      // Deselect and wait for content to reset
      await item.click().catch(() => {});
      await page.waitForTimeout(2000);

      const resetHrefs = await getVisibleCardHrefs(page);
      console.log(`  After reset: ${resetHrefs.length} cards`);
    }

    // At least one filter must have changed the content
    expect(passedFilters, 'No filter changed the displayed content').toBeGreaterThan(0);
  });
});
