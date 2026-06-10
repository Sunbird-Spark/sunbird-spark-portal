import { Page, Frame } from '@playwright/test';

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
  // extra common variants
  'mat-icon:has-text("navigate_next")',
  'button:has-text("Next")',
  'button:has-text("NEXT")',
  // ECML content player — AngularJS uses <a> tags for navigation, not <button>
  'a.nav-next',
  'a[class*="nav-next"]:not([class*="nav-disable"])',
  '.nav-icon.nav-next',
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

// Click a "Next" / "NEXT" button — checks the main DOM first, then every child
// frame (ECML player slides render their NEXT button inside an iframe).
export async function clickNextButton(page: Page): Promise<boolean> {
  const mainNext = page.getByRole('button', { name: /^next$/i });
  if (await mainNext.isVisible({ timeout: 500 }).catch(() => false)) {
    await mainNext.click();
    return true;
  }
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    try {
      const frameNext = frame.getByRole('button', { name: /^next$/i });
      if (await frameNext.isVisible({ timeout: 1500 }).catch(() => false)) {
        await frameNext.click();
        return true;
      }
    } catch { /* cross-origin or detached frame */ }
  }
  return false;
}

export async function clickRightArrow(page: Page): Promise<boolean> {
  if (page.isClosed()) return false;

  // Hover over the content player to reveal hidden navigation arrows.
  // Do NOT scroll the page — the player is already in the viewport and
  // scrolling would move it out of position for coordinate-based clicks.
  try {
    const playerArea = page.locator(
      'sunbird-epub-player, sunbird-pdf-player, iframe#contentPlayer, iframe[name="contentPlayer"], iframe'
    ).first();
    if (await playerArea.isVisible({ timeout: 300 }).catch(() => false)) {
      const pbox = await playerArea.boundingBox().catch(() => null);
      if (pbox) {
        await page.mouse.move(
          Math.round(pbox.x + pbox.width * 0.5),
          Math.round(pbox.y + pbox.height * 0.5),
        );
        await page.waitForTimeout(600); // give arrows time to appear after hover
      }
    }
  } catch { /* ignore */ }

  // EPUB fast path: hover the epub player and immediately try to click the
  // next-page arrow before the hover state can expire.
  try {
    const epubPlayer = page.locator('sunbird-epub-player').first();
    if (await epubPlayer.isVisible({ timeout: 300 }).catch(() => false)) {
      await epubPlayer.hover().catch(() => {});
      await page.waitForTimeout(400);

      // Named selectors scoped to the epub player (try most-specific first)
      const epubNextSelectors = [
        'sunbird-epub-player button[aria-label*="next" i]',
        'sunbird-epub-player [id*="next-btn"]',
        'sunbird-epub-player [class*="next-btn"]',
        'sunbird-epub-player [class*="nextBtn"]',
        'sunbird-epub-player [class*="nav-next"]',
        'sunbird-epub-player [class*="right-arrow"]',
        'sunbird-epub-player button[title*="next" i]',
        'sunbird-epub-player [class*="arrow"][class*="right"]',
        'sunbird-epub-player [class*="forward"]',
      ];
      for (const sel of epubNextSelectors) {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 300 }).catch(() => false)) {
          await btn.click();
          return true;
        }
      }

      // Coordinate fallback: right edge at vertical centre of the epub player
      const box = await epubPlayer.boundingBox().catch(() => null);
      if (box) {
        await page.mouse.click(
          Math.round(box.x + box.width * 0.95),
          Math.round(box.y + box.height * 0.5),
        );
        return true;
      }
    }
  } catch { /* not an EPUB page */ }

  // ECML fast path: if the contentPlayer iframe is present, hover over its centre
  // first (ECML hides nav arrows until hover), then try nav-next directly inside it.
  // This skips the ~25 main-page selectors in Strategy 1 (saves ~2.5s per slide
  // click) and is the common case for AngularJS ECML course content.
  try {
    const ecmlIframe = page.locator('iframe#contentPlayer, iframe[name="contentPlayer"]').first();
    if (await ecmlIframe.isVisible({ timeout: 300 }).catch(() => false)) {
      const frame = page.frames().find((f) => f.name() === 'contentPlayer');
      if (frame) {
        for (const sel of ['a.nav-next', 'a[class*="nav-next"]:not([class*="nav-disable"])', '.nav-icon.nav-next']) {
          const el = frame.locator(sel).first();
          if (await el.isVisible({ timeout: 300 }).catch(() => false)) {
            await el.click();
            return true;
          }
        }
      }
    }
  } catch { /* not an ECML page — fall through to Strategy 1 */ }

  // Strategy 0: sunbird-pdf-player web component (light DOM, no shadow DOM).
  // • If already on the last page → return false so the caller's loop breaks cleanly.
  // • For large PDFs (> 20 pages) jump directly via the page-number input.
  // • For small PDFs, click the last toolbar button — the "next page" arrow is
  //   always the rightmost button in the sunbird-pdf-player toolbar.
  try {
    const player = page.locator('sunbird-pdf-player').first();
    if (await player.isVisible({ timeout: 2000 }).catch(() => false)) {
      await player.hover();
      await page.waitForTimeout(300);

      const pageInput = page.locator('sunbird-pdf-player input[type="number"]').first();
      const maxAttr = await pageInput.getAttribute('max').catch(() => null);
      const totalPages = maxAttr ? parseInt(maxAttr, 10) : 0;
      const currentVal = await pageInput.inputValue().catch(() => '1');
      const currentPage = parseInt(currentVal, 10) || 1;

      // Already on the last page — click ► to fire the lesson-complete event,
      // then return false so the caller loop stops.
      if (totalPages > 0 && currentPage >= totalPages) {
        const completionBox = await player.boundingBox().catch(() => null);
        const nextBtnFinal = page.locator(
          'sunbird-pdf-player button[aria-label="navigation-arrows-nextIcon"], ' +
          'sunbird-pdf-player button.player-nextIcon, ' +
          'sunbird-pdf-player button[aria-label*="next" i], ' +
          'sunbird-pdf-player button[title*="next" i], ' +
          'sunbird-pdf-player button[class*="next"]'
        ).first();
        if (await nextBtnFinal.isVisible({ timeout: 800 }).catch(() => false)) {
          await nextBtnFinal.click();
          await page.waitForTimeout(800);
        } else if (completionBox) {
          await page.mouse.click(
            Math.round(completionBox.x + completionBox.width * 0.92),
            Math.round(completionBox.y + 22),
          );
          await page.waitForTimeout(800);
        }
        return false;
      }

      // Large PDFs: jump directly to last page via the page-number input.
      if (totalPages > 20) {
        console.log(`    PDF: jumping from page ${currentPage} to ${totalPages}`);
        await pageInput.click({ clickCount: 3 });
        await pageInput.fill(String(totalPages));
        const goToPageBtn = page.locator(
          'sunbird-pdf-player span[aria-label="Go to page"], sunbird-pdf-player .focus-arrow'
        ).first();
        if (await goToPageBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await goToPageBtn.click();
        } else {
          await pageInput.press('Enter');
        }
        await page.waitForTimeout(1500);
        return true;
      }

      // Small PDFs — find and click the ► (next page) button.
      // 1. Named selectors (aria-label / class — version-specific but exact).
      const nextBtnNamed = page.locator(
        'sunbird-pdf-player button[aria-label="navigation-arrows-nextIcon"], ' +
        'sunbird-pdf-player button.player-nextIcon, ' +
        'sunbird-pdf-player button[aria-label*="next" i], ' +
        'sunbird-pdf-player button[title*="next" i], ' +
        'sunbird-pdf-player button[class*="next"]'
      ).first();
      if (await nextBtnNamed.isVisible({ timeout: 800 }).catch(() => false)) {
        await nextBtnNamed.click();
        await page.waitForTimeout(800);
        return true;
      }

      // 2. Coordinate fallback — the ► button is always in the right portion of the
      //    toolbar (visually), at roughly 92 % of the player width and ~22 px from the
      //    top of the sunbird-pdf-player element (inside the toolbar strip).
      //    Placed BEFORE the "last button" scan because button DOM order does not always
      //    match visual left-to-right order (the ≡ TOC button can appear last in the DOM
      //    even though it renders on the far left), causing the wrong button to be clicked.
      const box = await player.boundingBox().catch(() => null);
      if (box) {
        await page.mouse.click(
          Math.round(box.x + box.width * 0.92),
          Math.round(box.y + 22),
        );
        await page.waitForTimeout(800);
        return true;
      }

      // 3. Last visible button in the toolbar (final fallback when bounding box unavailable).
      const allPdfBtns = page.locator('sunbird-pdf-player button');
      const btnCount = await allPdfBtns.count().catch(() => 0);
      for (let b = btnCount - 1; b >= 0; b--) {
        const btn = allPdfBtns.nth(b);
        if (await btn.isVisible({ timeout: 300 }).catch(() => false)) {
          await btn.click();
          await page.waitForTimeout(800);
          return true;
        }
      }

      // Completely unknown state — fall through to generic strategies.
    }
  } catch { /* ignore */ }

  // Strategy 1: known selectors on the main page (PDF toolbar, outer controls)
  if (await trySelectorsOnLocator(page, RIGHT_ARROW_SELECTORS)) return true;

  // Strategy 2: try RIGHT_ARROW_SELECTORS inside each child frame.
  // No "last visible button" fallback here — ECML frames contain many interactive
  // buttons (slide elements, activities) and clicking the wrong one silently
  // fails to advance the slide while still returning true, breaking the loop.
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    try {
      if (await trySelectorsOnLocator(frame, RIGHT_ARROW_SELECTORS)) return true;
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
        // brief wait for UI to settle
        await page.waitForTimeout(700);
        return true;
      }
    }
  } catch { /* ignore */ }

  // Strategy 4: rightmost cursor:pointer element on the main page (below the header)
  let coords: { x: number; y: number } | null = null;
  try {
    coords = await page.evaluate(() => {
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
  } catch {
    return false;
  }
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
