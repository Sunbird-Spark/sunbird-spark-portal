import { test, expect, Page } from '@playwright/test';
import { urls } from '../../data/urls';
import { collectCards, consumeContent } from '../helpers/contentHelper';

test.describe.configure({ mode: 'serial' });
test.use({ launchOptions: { slowMo: 500 } });
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

// ── Flow 1: Explore page filter verification (runs first) ───────────────────

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
    'mat-checkbox',
    'sb-checkbox',
    'label:has(input[type="checkbox"])',
    'input[type="checkbox"]',
    '[role="checkbox"]',
    '[class*="filter"] [class*="item"]',
    '[class*="filter"] [class*="option"]',
    '[class*="facet"] label',
    '[class*="filter"] label',
  ];

  for (const sel of candidates) {
    const loc = page.locator(sel);
    const count = await loc.count().catch(() => 0);
    if (count > 0) {
      return loc;
    }
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
  console.log('DOM dump:', dump);

  return null;
}

test.describe('Anonymous User - Explore Page Filters', () => {
  test('Verify content changes when filters are applied', async ({ page }) => {
    await page.goto(urls.explore);
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Capture baseline
    const baselineHrefs = await getVisibleCardHrefs(page);
    expect(baselineHrefs.length).toBeGreaterThan(0);

    const filterItems = await findFilterItems(page);

    if (!filterItems) {
      // Dump page text to help diagnose what selectors to use
      const bodyText = (await page.locator('body').innerText()).slice(0, 800);
      console.log('── No filter elements found. Page text sample ──\n', bodyText);
      throw new Error('Could not locate any filter checkboxes on the Explore page');
    }

    const filterCount = await filterItems.count();
    let passedFilters = 0;
    let tried = 0;

    for (let i = 0; i < filterCount && tried < 5; i++) {
      const item = filterItems.nth(i);

      if (!(await item.isVisible({ timeout: 1000 }).catch(() => false))) continue;

      const filterName = (await item.textContent().catch(() => ''))?.trim() || `Filter ${i}`;

      // Skip empty labels or very short ones (likely decorative / section headers)
      if (filterName.length < 2) continue;

      tried++;

      await test.step(`Filter: "${filterName}"`, async () => {
        await item.scrollIntoViewIfNeeded().catch(() => {});
        await item.click();
        await page.waitForTimeout(3000);

        const filteredHrefs = await getVisibleCardHrefs(page);
        const hasChanged =
          filteredHrefs.length !== baselineHrefs.length ||
          filteredHrefs.some((h) => !baselineHrefs.includes(h)) ||
          baselineHrefs.some((h) => !filteredHrefs.includes(h));

        // Soft assertion — a single filter that shows all content doesn't fail the run
        expect.soft(hasChanged, `Filter "${filterName}" did not change content`).toBe(true);
        if (hasChanged) passedFilters++;

        // Deselect and wait for content to reset
        await item.click().catch(() => {});
        await page.waitForTimeout(2000);
      });
    }

    // At least one filter must have changed the content
    expect(passedFilters, 'No filter changed the displayed content').toBeGreaterThan(0);
  });
});

// ── Flow 2: Course access gate for anonymous users ───────────────────────────

test.describe('Anonymous User - Course Access Gate', () => {
  test('Verify join-course message and Login button appear on a Course page', async ({ page }) => {
    await page.goto(urls.explore);
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await scrollToLoadAll(page);

    // Attempt a second scroll pass if the first didn't surface a Course card.
    // Collection cards use div.related-resource-card-badge (not span.resource-card-badge).
    let courseCard = page.locator('a[href*="/collection/"]')
      .filter({ has: page.locator('div.related-resource-card-badge', { hasText: 'Course' }) })
      .first();

    if (!(await courseCard.isVisible({ timeout: 3000 }).catch(() => false))) {
      for (let i = 0; i < 10; i++) {
        await page.evaluate(() => window.scrollBy(0, 600));
        await page.waitForTimeout(300);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    await expect(courseCard, 'A Course card must be present on the Explore page').toBeVisible({ timeout: 8000 });
    await courseCard.scrollIntoViewIfNeeded();
    await courseCard.click();

    await page.waitForURL(
      (url) => url.pathname.includes('/collection/'),
      { timeout: 15000 }
    );
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // 1. The "You must join the course" gate message must be visible in the
    //    content player area (centre of the page).
    const joinMessage = page.getByText(/you must join the course to get complete access to content/i);
    await expect(joinMessage, '"You must join the course" message should be visible').toBeVisible({ timeout: 15000 });

    // 2. The "Unlock your learning" panel on the right must contain a Login button.
    //    This panel is distinct from the header Login button and sits on the right
    //    side of the viewport — we confirm with a bounding-box check (x-centre > 50%).
    const unlockPanel = page.getByText(/unlock your learning/i).first();
    await expect(unlockPanel, '"Unlock your learning" panel should be visible').toBeVisible({ timeout: 10000 });

    const loginBtn = page.getByRole('button', { name: /^login$/i })
      .or(page.getByRole('link', { name: /^login$/i }))
      .last(); // last() picks the panel button; first() would be the header button
    await expect(loginBtn, 'A Login button should be visible on the course page').toBeVisible({ timeout: 10000 });

    const box = await loginBtn.boundingBox();
    const viewportWidth = page.viewportSize()?.width ?? 1280;
    if (!box) throw new Error('Login button bounding box is null');
    expect(
      box.x + box.width / 2,
      'Login button should be positioned on the right side of the page'
    ).toBeGreaterThan(viewportWidth / 2);
  });
});

// ── Flow 3: Consume every distinct content type on the Explore page ─────────

test.describe('Anonymous User - Explore Page Content Consumption', () => {
  test('Consume all available content types on the Explore page', async ({ page }) => {
    await page.goto(urls.explore);
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await scrollToLoadAll(page);

    const cardsToConsume = await collectCards(page);
    await test.info().attach('Cards to consume on Explore', {
      body: JSON.stringify(cardsToConsume, null, 2),
      contentType: 'application/json',
    });
    expect(cardsToConsume.length).toBeGreaterThan(0);

    for (const { type, href } of cardsToConsume) {
      await test.step(`Consume ${type}`, async () => {
        await page.goto(urls.explore);
        await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
        await scrollToLoadAll(page);

        const cardId = href.split('/').pop();
        if (!cardId) { console.warn(`Skipping card with unparseable href: ${href}`); return; }
        const card = page.locator(`a[href*="${cardId}"]`).first();

        for (let i = 0; i < 8; i++) {
          if (await card.isVisible({ timeout: 1000 }).catch(() => false)) break;
          await page.evaluate(() => window.scrollBy(0, 400));
          await page.waitForTimeout(200);
        }

        if (!(await card.isVisible({ timeout: 3000 }).catch(() => false))) {
          console.warn(`  Card not found for ${type}, skipping`);
          return;
        }

        await card.scrollIntoViewIfNeeded();
        await card.click();
        await page.waitForURL(
          (url) => url.pathname.includes('/content/') || url.pathname.includes('/collection/'),
          { timeout: 15000 }
        );
        await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

        await consumeContent(page, type);
      });
    }
  });
});
