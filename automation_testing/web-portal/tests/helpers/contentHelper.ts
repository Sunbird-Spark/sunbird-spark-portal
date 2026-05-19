import { Page, Frame, expect } from '@playwright/test';

export async function dismissModal(page: Page) {
  // Close any modal/dialog ✕ button, AND any standalone overlay close button
  // (e.g. the post-ECML feedback screen "We would love to hear from you").
  const closeBtn = page.locator('[role="dialog"] button, [class*="modal"] button, [class*="overlay"] button')
    .filter({ hasText: /^[×✕x]$/i })
    .or(page.locator('button[aria-label*="close" i]'))
    .first();
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click();
    return;
  }
  // Broader fallback: any visible ✕ button on the page that is not inside the player toolbar.
  const anyX = page.locator('button').filter({ hasText: /^[×✕x]$/i }).last();
  if (await anyX.isVisible({ timeout: 500 }).catch(() => false)) {
    await anyX.click();
  }
}

// Selectors to try for the "next / forward / right-arrow" button
const RIGHT_ARROW_SELECTORS = [
  // PDF.js viewer inside sunbird-pdf-player web component
  'button.pageDown',
  'button#next',
  'button[title="Next Page"]',
  'button[data-l10n-id="next"]',
  // Generic next-button patterns
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
  root: Page | Frame,
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

  // Strategy 0: sunbird-pdf-player web component.
  // Hover to reveal the toolbar, try DOM selectors first, then fall back to
  // clicking at the known top-right position of the toolbar (where the blue > sits).
  try {
    const player = page.locator('sunbird-pdf-player').first();
    if (await player.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Hover over the player to ensure the toolbar is visible.
      await player.hover();
      await page.waitForTimeout(500);

      // Try selector-based approach (works when shadow DOM is open or in light DOM).
      const pdfSelectors = [
        'button.pageDown',
        'button[title="Next Page"]',
        'button#next',
        'button[data-l10n-id="next"]',
      ];
      for (const sel of pdfSelectors) {
        const btn = page.locator(`sunbird-pdf-player ${sel}`).last()
          .or(page.locator(sel).last());
        if (await btn.isVisible({ timeout: 800 }).catch(() => false)) {
          await btn.click();
          return true;
        }
      }

      // Fallback: click at the top-right of the player bounding box.
      // The blue > (next-page) button sits in the toolbar at the top-right corner.
      const box = await player.boundingBox();
      if (box) {
        await page.mouse.click(
          Math.round(box.x + box.width * 0.96),
          Math.round(box.y + 20),   // ~20 px from top = toolbar row
        );
        return true;
      }
    }
  } catch { /* ignore */ }

  // Strategy 1: known selectors on the main page (PDF toolbar, outer controls)
  if (await trySelectorsOnLocator(page, RIGHT_ARROW_SELECTORS)) return true;

  // Strategy 2: try selectors inside each live frame, then click last visible button
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    try {
      if (await trySelectorsOnLocator(frame, RIGHT_ARROW_SELECTORS)) return true;
      // Fallback: last button in the frame is typically the "Next" navigation button
      const buttons = frame.locator('button');
      const btnCount = await buttons.count().catch(() => 0);
      for (let j = btnCount - 1; j >= Math.max(0, btnCount - 8); j--) {
        const btn = buttons.nth(j);
        if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
          await btn.click();
          return true;
        }
      }
    } catch { /* cross-origin or detached frame */ }
  }

  // Strategy 3: hover over the content player iframe to reveal navigation controls,
  // then click the right-centre where the ECML right arrow sits.
  try {
    const iframeEl = page.locator('iframe#contentPlayer, iframe[name="contentPlayer"]').first()
      .or(page.locator('iframe').first());
    if (await iframeEl.isVisible({ timeout: 2000 }).catch(() => false)) {
      const box = await iframeEl.boundingBox();
      if (box) {
        // Hover at centre of the player to reveal any hidden navigation arrows.
        await page.mouse.move(
          Math.round(box.x + box.width * 0.5),
          Math.round(box.y + box.height * 0.5)
        );
        await page.waitForTimeout(500);
        // Right arrow is at the right edge, vertically centred in the player.
        await page.mouse.click(
          Math.round(box.x + box.width * 0.95),
          Math.round(box.y + box.height * 0.50)
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

  // Strategy 5: ArrowRight keypress inside first reachable non-main frame
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    try {
      await frame.locator('body').press('ArrowRight');
      return true;
    } catch { /* cross-origin or detached frame */ }
  }

  return false;
}

async function isEcmlComplete(page: Page): Promise<boolean> {
  const scoreRe    = /your score is/i;
  const redoRe     = /^redo$/i;
  const feedbackRe = /we would love to hear from you/i;

  if (await page.getByText(scoreRe).isVisible({ timeout: 500 }).catch(() => false)) return true;
  if (await page.getByRole('button', { name: redoRe }).isVisible({ timeout: 500 }).catch(() => false)) return true;
  // Post-completion feedback overlay ("We would love to hear from you")
  if (await page.getByText(feedbackRe).isVisible({ timeout: 500 }).catch(() => false)) return true;

  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    try {
      if (await frame.getByText(scoreRe).isVisible({ timeout: 500 }).catch(() => false)) return true;
      if (await frame.getByRole('button', { name: redoRe }).isVisible({ timeout: 500 }).catch(() => false)) return true;
      if (await frame.getByText(feedbackRe).isVisible({ timeout: 500 }).catch(() => false)) return true;
    } catch { /* cross-origin or detached frame */ }
  }
  return false;
}

export async function consumeContent(page: Page, type: string) {
  const lowerType = type.toLowerCase();
  const completionBanner = page.getByText(/you just completed|we would love to hear from you/i);

  // Anonymous users cannot access course/collection content — skip gracefully.
  const joinGate = page.getByText(/you must join the course/i);
  if (await joinGate.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log(`  ${type} — requires course enrollment (anonymous user), skipping`);
    await page.goBack();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    return;
  }

  const player = page.locator('iframe, video, [class*="player"], [class*="content-app"], sunbird-pdf-player').first();
  await expect(player).toBeVisible({ timeout: 30000 });

  const waitMs = lowerType === 'ecml' ? 5000 : 2000;
  await page.waitForTimeout(waitMs);

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
      if (page.isClosed()) {
        console.log('  Page was closed — treating as content complete');
        break;
      }
      // Check completion BEFORE dismissing any modal — the completion/feedback
      // screen itself is what we're waiting for; dismissing it first causes the
      // loop to miss the signal and run all 200 iterations.
      if (await completionBanner.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`  Completion detected after ${i} clicks`);
        break;
      }
      if (lowerType === 'ecml' && await isEcmlComplete(page)) {
        console.log(`  ECML score screen detected after ${i} clicks — content complete`);
        break;
      }
      // Only dismiss incidental modals (e.g. mid-content popups) after we've
      // confirmed we are NOT on a completion screen.
      await dismissModal(page);
      const clicked = await clickRightArrow(page);
      if (!clicked) {
        console.log('  Right arrow not found — content may already be complete');
        break;
      }
      try {
        await page.waitForTimeout(1500);
      } catch {
        console.log('  Page closed during wait — treating as content complete');
        break;
      }
    }
    if (lowerType === 'ecml') {
      // Accept either the score screen (isEcmlComplete) or the portal's
      // "You just completed" completion banner — whichever appears first.
      let ecmlDone = false;
      for (let t = 0; t < 30 && !ecmlDone; t++) {
        ecmlDone = await isEcmlComplete(page)
          || await completionBanner.isVisible({ timeout: 500 }).catch(() => false);
        if (!ecmlDone) await page.waitForTimeout(500);
      }
      expect(ecmlDone, 'ECML content did not reach a completion screen').toBe(true);
    } else {
      await expect(completionBanner).toBeVisible({ timeout: 15000 });
    }
  }

  // Dismiss any post-completion overlay (e.g. feedback screen) before navigating back.
  if (!page.isClosed()) await dismissModal(page);

  // Navigate back to the explore page.
  // On the content detail page a "Go Back" link is shown; on the completion
  // overlay the portal renders an "Exit" button instead.
  if (!page.isClosed()) {
    const goBack = page.getByRole('link', { name: /go back/i })
      .or(page.getByText(/go back/i).first());
    const exitBtn = page.getByRole('button', { name: /^exit$/i })
      .or(page.getByText(/^exit$/i).first());

    const hasGoBack = await goBack.isVisible({ timeout: 3000 }).catch(() => false);
    const hasExit   = !hasGoBack && await exitBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasGoBack) {
      await goBack.click();
    } else if (hasExit) {
      await exitBtn.click();
    } else {
      await page.goBack();
    }
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  }
}

// Collect one card URL per unique content type visible on the current page.
// Covers both standalone content (/content/) and collection types (/collection/).
export async function collectCards(page: Page): Promise<{ type: string; href: string }[]> {
  const knownTypes = [
    // Standalone content
    'Video', 'ECML', 'PDF', 'EPUB', 'WebM',
    // Collection types
    'Course', 'TextBook', 'Digital Textbook', 'Content Playlist', 'Collection',
  ];
  return page.locator('a[href*="/content/"], a[href*="/collection/"]').evaluateAll(
    (anchors, types) => {
      const seen = new Set<string>();
      const result: { type: string; href: string }[] = [];
      for (const a of anchors) {
        // Resource cards use span.resource-card-badge;
        // Collection cards (Course, TextBook, etc.) use div.related-resource-card-badge.
        const badge = a.querySelector('span.resource-card-badge') ?? a.querySelector('div.related-resource-card-badge');
        const badgeText = badge?.textContent?.trim() ?? '';
        const type = types.find(
          (t) => badgeText === t || badgeText.toLowerCase().includes(t.toLowerCase())
        );
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
