import { Page } from '@playwright/test';

// Collect one card URL per content type by clicking through each Content Types
// filter checkbox in the sidebar. Falls back to scanning the default page for
// collection types (Course, etc.) that don't appear in the filter list.
export async function collectCards(page: Page): Promise<{ type: string; href: string }[]> {
  const result: { type: string; href: string }[] = [];
  const seen = new Set<string>();
  const origin = new URL(page.url()).origin;

  const toAbs = (href: string) => (href.startsWith('http') ? href : `${origin}${href}`);

  // ── Step 1: Expand "Content Types" accordion if collapsed ──────────────────
  const contentTypesBtn = page.locator('button:has-text("Content Types")').first();
  if (await contentTypesBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    const state = await contentTypesBtn.evaluate(
      (el) => el.getAttribute('data-state')
    ).catch(() => '');
    if (state !== 'open') {
      await contentTypesBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // ── Step 2: Click each filter label and collect the first card found ────────
  // Interactive filter shows ECML content (mimeType=application/vnd.ekstep.ecml-archive).
  // YouTube cards display a "Video" badge but are distinct content — included separately.
  // Audio has no content on this platform — skipped.
  const filters: { label: string; badge: string }[] = [
    { label: 'Video',       badge: 'Video'   },
    { label: 'PDF',         badge: 'PDF'     },
    { label: 'EPUB',        badge: 'EPUB'    },
    { label: 'YouTube',     badge: 'YouTube' },
    { label: 'HTML',        badge: 'HTML'    },
    { label: 'Interactive', badge: 'ECML'    },
  ];

  for (const { label, badge } of filters) {
    const filterLabel = page.locator(`label:has-text("${label}")`).first();
    if (!(await filterLabel.isVisible({ timeout: 2000 }).catch(() => false))) {
      console.log(`  Filter "${label}" not visible — skipping`);
      continue;
    }

    await filterLabel.scrollIntoViewIfNeeded().catch(() => {});
    await filterLabel.click();
    await page.waitForTimeout(2000);

    const card = page.locator('a[href*="/content/"]').first();
    if (await card.isVisible({ timeout: 4000 }).catch(() => false)) {
      const href = await card.getAttribute('href') ?? '';
      if (href && !seen.has(badge)) {
        seen.add(badge);
        result.push({ type: badge, href: toAbs(href) });
        console.log(`  Found ${badge}: ${toAbs(href)}`);
      }
    } else {
      console.log(`  No content found for filter "${label}" — skipping`);
    }

    // Uncheck before moving to next filter
    await filterLabel.click();
    await page.waitForTimeout(1000);
  }

  // ── Step 3: Collect one Course collection from the default page ─────────────
  const courseCard = page.locator('a[href*="/collection/"]')
    .filter({ has: page.locator('div.related-resource-card-badge', { hasText: 'Course' }) })
    .first();
  if (await courseCard.isVisible({ timeout: 4000 }).catch(() => false)) {
    const href = await courseCard.getAttribute('href') ?? '';
    if (href) result.push({ type: 'Course', href: toAbs(href) });
  }

  return result;
}
