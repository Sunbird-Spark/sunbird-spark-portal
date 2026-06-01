import { test, expect } from '@playwright/test';
import { urls } from '../../data/urls';
import { consumeContent } from '../helpers/contentHelper';

test.describe.configure({ mode: 'serial' });
test.setTimeout(300000);

// Each section on the home page, keyed by its <h2> text.
// Sections whose cards are all Courses verify the anonymous-user gate.
// Sections with consumable content (PDF etc.) are fully consumed.
const HOME_SECTIONS: { displayName: string; sectionHeading: RegExp }[] = [
  { displayName: 'Most Popular Contents', sectionHeading: /most popular contents/i },
  { displayName: 'Resource Center',       sectionHeading: /stay ahead/i },
  { displayName: 'Most Viewed Content',   sectionHeading: /most viewed content/i },
  { displayName: 'Trending Content',      sectionHeading: /trending content/i },
];

// ── Flow 1: No filter sidebar ─────────────────────────────────────────────────

test.describe('Anonymous User - Home Page Has No Filters', () => {
  test('Verify the home page has no filter sidebar', async ({ page }) => {
    await page.goto(urls.main, { waitUntil: 'load' });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // The Explore page has "Content Types" / "Collections" filter accordion buttons;
    // the home page must not have them.
    const filterBtn = page.locator(
      'button:has-text("Content Types"), button:has-text("Collections"), [class*="filter-sidebar"]'
    );
    await expect(filterBtn, 'Home page must not have a filter sidebar').toHaveCount(0, {
      timeout: 5000,
    });

    // Content sections must be present
    const firstSectionHeading = page.getByRole('heading', {
      name: HOME_SECTIONS[0].sectionHeading,
      level: 2,
    });
    await expect(firstSectionHeading, '"Most Popular Contents" section should be visible').toBeVisible({
      timeout: 15000,
    });
    console.log('  Home page: no filter sidebar ✓, content sections present ✓');
  });
});

// ── Flow 2: One card per section ──────────────────────────────────────────────

test.describe('Anonymous User - Home Page Section Consumption', () => {
  test('Select one card from each section and consume or verify access gate', async ({ page }) => {
    for (const { displayName, sectionHeading } of HOME_SECTIONS) {
      await test.step(displayName, async () => {
        // Return to home before each section so state is clean
        await page.goto(urls.main, { waitUntil: 'load' });
        await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

        // Scroll until the section heading comes into view
        const heading = page.getByRole('heading', { name: sectionHeading, level: 2 });
        await heading.scrollIntoViewIfNeeded();
        await expect(heading, `${displayName} heading should be visible`).toBeVisible({ timeout: 10000 });

        // The section root is whichever direct child of <main> contains this heading
        const sectionRoot = page.locator('main > *').filter({ has: heading }).first();
        const firstCard = sectionRoot
          .locator('a[href*="/collection/"], a[href*="/content/"]')
          .first();
        await expect(firstCard, `${displayName} — first card should be visible`).toBeVisible({
          timeout: 8000,
        });

        const href = (await firstCard.getAttribute('href')) ?? '';
        const isCourse = href.includes('/collection/');
        const cardTitle = ((await firstCard.textContent()) ?? '').trim().slice(0, 60);
        console.log(`  [${displayName}] Clicking: "${cardTitle}" (${isCourse ? 'Course' : 'Content'})`);

        await firstCard.scrollIntoViewIfNeeded();
        await firstCard.click();

        if (isCourse) {
          // ── Course: anonymous users must hit the login gate ───────────────
          await page.waitForURL((url) => url.pathname.includes('/collection/'), { timeout: 15000 });
          await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
          await page.waitForTimeout(2000);

          const joinMessage = page.getByText(
            /you must join the course to get complete access to content/i
          );
          await expect(
            joinMessage,
            `${displayName} — "You must join the course" gate should be visible`
          ).toBeVisible({ timeout: 10000 });

          const unlockPanel = page.getByText(/unlock your learning/i).first();
          await expect(
            unlockPanel,
            `${displayName} — "Unlock your learning" panel should be visible`
          ).toBeVisible({ timeout: 5000 });

          const loginBtn = page
            .getByRole('button', { name: /^login$/i })
            .or(page.getByRole('link', { name: /^login$/i }))
            .last();
          await expect(loginBtn, `${displayName} — Login button should be visible`).toBeVisible({
            timeout: 5000,
          });
          console.log(`  [${displayName}] Course access gate verified ✓`);
        } else {
          // ── Consumable content: detect player type and consume ─────────────
          await page.waitForURL((url) => url.pathname.includes('/content/'), { timeout: 15000 });
          await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

          // Detect content type in parallel to avoid sequential 3 s waits per check
          const [hasPdf, hasQuml, hasYt, hasVideo, hasEcml] = await Promise.all([
            page.locator('sunbird-pdf-player').isVisible({ timeout: 3000 }).catch(() => false),
            page.locator('sunbird-quml-player').isVisible({ timeout: 3000 }).catch(() => false),
            page
              .locator('iframe[src*="youtube"]')
              .isVisible({ timeout: 1000 })
              .catch(() => page.frames().some((f) => f.url().includes('youtube.com'))),
            page.locator('video').first().isVisible({ timeout: 1500 }).catch(() => false),
            page
              .locator('iframe[name="contentPlayer"], iframe#contentPlayer')
              .isVisible({ timeout: 2000 })
              .catch(() => false),
          ]);

          let contentType = 'unknown';
          if (hasPdf) contentType = 'pdf';
          else if (hasQuml) contentType = 'quml';
          else if (hasYt) contentType = 'youtube';
          else if (hasVideo) contentType = 'video';
          else if (hasEcml) contentType = 'ecml';

          console.log(`  [${displayName}] Content type detected: ${contentType}`);
          await consumeContent(page, contentType);
          console.log(`  [${displayName}] Content consumed ✓`);
        }
      });
    }
  });
});
