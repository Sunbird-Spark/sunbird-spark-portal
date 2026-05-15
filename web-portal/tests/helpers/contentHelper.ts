import { Page, expect } from '@playwright/test';

export async function dismissModal(page: Page) {
  const closeBtn = page.locator('[role="dialog"] button, [class*="modal"] button')
    .filter({ hasText: /^[×✕x]$/i })
    .first();
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click();
  }
}

// Selectors to try for the "next / forward / right-arrow" button
const RIGHT_ARROW_SELECTORS = [
  '[class*="next-btn"]',
  '[class*="nextBtn"]',
  '[class*="btn-next"]',
  '[class*="right-arrow"]',
  '[class*="rightArrow"]',
  '[class*="arrow-right"]',
  '[class*="arrowRight"]',
  '[class*="nav-right"]',
  '[class*="forward"]',
  'button[aria-label*="next" i]',
  'button[aria-label*="right" i]',
  'button[title*="next" i]',
  'button[title*="right" i]',
  '.glyphicon-chevron-right',
  '[class*="chevron-right"]',
  'button:has-text(">")',
  'button:has-text("›")',
  'button:has-text("→")',
  'button:has-text("chevron_right")',
  'mat-icon:text("chevron_right")',
];

async function trySelectorsOnLocator(
  root: ReturnType<Page['frameLocator']> | Page,
  selectors: string[]
): Promise<boolean> {
  for (const sel of selectors) {
    try {
      const el = root.locator(sel).last();
      if (await el.isVisible({ timeout: 800 }).catch(() => false)) {
        await el.click();
        return true;
      }
    } catch { /* ignore */ }
  }
  return false;
}

export async function clickRightArrow(page: Page): Promise<boolean> {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  // Strategy 1: known selectors on the main page (PDF toolbar, outer controls)
  if (await trySelectorsOnLocator(page, RIGHT_ARROW_SELECTORS)) return true;

  // Strategy 2: look inside each iframe
  const iframeCount = await page.locator('iframe').count().catch(() => 0);
  for (let i = 0; i < iframeCount; i++) {
    try {
      const frame = page.frameLocator('iframe').nth(i);
      if (await trySelectorsOnLocator(frame, RIGHT_ARROW_SELECTORS)) return true;

      // If no named selector matched, fall back to the rightmost visible button inside the iframe
      const buttons = frame.locator('button');
      const btnCount = await buttons.count().catch(() => 0);
      for (let j = btnCount - 1; j >= Math.max(0, btnCount - 8); j--) {
        const btn = buttons.nth(j);
        if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
          await btn.click();
          return true;
        }
      }
    } catch { /* ignore */ }
  }

  // Strategy 3: click the right-centre of the first visible iframe bounding box
  try {
    const iframeEl = page.locator('iframe').first();
    if (await iframeEl.isVisible({ timeout: 2000 }).catch(() => false)) {
      const box = await iframeEl.boundingBox();
      if (box) {
        await page.mouse.click(
          Math.round(box.x + box.width * 0.92),
          Math.round(box.y + box.height * 0.5)
        );
        return true;
      }
    }
  } catch { /* ignore */ }

  // Strategy 4: rightmost cursor:pointer element on the main page (below the header)
  const coords = await page.evaluate(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const all = Array.from(document.querySelectorAll('*')) as HTMLElement[];
    const candidates = all.filter((el) => {
      const r = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return (
        r.width > 10 && r.height > 10 &&
        r.top > 80 && r.bottom < H - 40 &&
        r.left > W * 0.5 &&
        style.cursor === 'pointer'
      );
    });
    candidates.sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right);
    const el = candidates[0];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  });
  if (coords) {
    await page.mouse.click(coords.x, coords.y);
    return true;
  }

  // Strategy 5: focus the player area and press ArrowRight
  try {
    const player = page.locator('iframe, [class*="player"], [class*="content"]').first();
    await player.click({ timeout: 3000 });
    await page.keyboard.press('ArrowRight');
    return true;
  } catch { /* ignore */ }

  return false;
}

export async function consumeContent(page: Page, type: string) {
  const lowerType = type.toLowerCase();
  const completionBanner = page.getByText(/you just completed/i);

  const player = page.locator('iframe, video, [class*="player"], [class*="content-app"]').first();
  await expect(player).toBeVisible({ timeout: 30000 });

  const waitMs = lowerType === 'ecml' ? 8000 : 4000;
  await page.waitForTimeout(waitMs);
  await dismissModal(page);

  if (lowerType === 'video' || lowerType === 'webm') {
    const isYouTube = await page.locator('iframe[src*="youtube"]').isVisible({ timeout: 3000 }).catch(() => false);
    if (isYouTube) {
      console.log('  YouTube video — watching for 20s');
      await page.waitForTimeout(20000);
    } else {
      console.log('  Direct video — playing (max 30s)');
      const hasMainVideo = await page.locator('video').isVisible({ timeout: 3000 }).catch(() => false);
      const ctx = hasMainVideo
        ? page
        : (await (await page.locator('iframe').first().elementHandle())?.contentFrame()) ?? page;
      await ctx.evaluate(() =>
        new Promise<void>((resolve) => {
          const video = document.querySelector('video') as HTMLVideoElement;
          if (!video || video.ended) return resolve();
          const cap = setTimeout(resolve, 30000);
          video.addEventListener('ended', () => { clearTimeout(cap); resolve(); }, { once: true });
          video.play().catch(() => {});
        })
      );
    }
  } else {
    console.log(`  ${type} — clicking → until completion screen`);
    const MAX_CLICKS = 200;
    for (let i = 0; i < MAX_CLICKS; i++) {
      await dismissModal(page);
      if (await completionBanner.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`  Completion detected after ${i} clicks`);
        break;
      }
      const clicked = await clickRightArrow(page);
      if (!clicked) {
        console.log('  Right arrow not found — content may already be complete');
        break;
      }
      await page.waitForTimeout(3000);
    }
    await expect(completionBanner).toBeVisible({ timeout: 15000 });
  }

  // Click "Go back" to return to the previous page
  const goBack = page.getByRole('link', { name: /go back/i })
    .or(page.getByText(/go back/i).first());
  await goBack.waitFor({ state: 'visible', timeout: 10000 });
  await goBack.click();
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
}

// Collect one card URL per unique content type visible on the current page
export async function collectCards(page: Page): Promise<{ type: string; href: string }[]> {
  const knownTypes = ['Video', 'ECML', 'PDF', 'EPUB', 'WebM'];
  return page.locator('a[href*="/content/do_"]').evaluateAll(
    (anchors, types) => {
      const seen = new Set<string>();
      const result: { type: string; href: string }[] = [];
      for (const a of anchors) {
        const text = a.textContent?.trim() ?? '';
        const type = types.find((t) => text.startsWith(t));
        const href = (a as HTMLAnchorElement).href;
        if (type && !seen.has(type) && href) {
          seen.add(type);
          result.push({ type, href });
        }
      }
      return result;
    },
    knownTypes
  );
}
