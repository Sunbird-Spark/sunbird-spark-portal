import { Page, Frame, expect } from '@playwright/test';

export async function dismissModal(page: Page, timeout = 2000) {
  // 1. RatingDialog — custom overlay div, no outside-click handler, no Escape.
  //    Close button is the first button inside .rating-dialog-overlay and has
  //    aria-label="Close rating dialog". Must be handled before the Radix path.
  const ratingOverlay = page.locator('.rating-dialog-overlay');
  if (await ratingOverlay.isVisible({ timeout: 300 }).catch(() => false)) {
    const ratingClose = ratingOverlay.locator('button').first();
    if (await ratingClose.isVisible({ timeout: 500 }).catch(() => false)) {
      await ratingClose.click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
    }
    return;
  }

  // 2. Radix Dialog — click backdrop at (10, 10) triggers onInteractOutside.
  const anyDialog = page.locator('[role="dialog"]').first();
  if (!(await anyDialog.isVisible({ timeout }).catch(() => false))) return;

  await page.mouse.click(10, 10).catch(() => {});
  await page.waitForTimeout(300);
  if (!(await anyDialog.isVisible({ timeout: 300 }).catch(() => false))) return;

  // 3. Close button by accessible name (sr-only "Close" span in Dialog.tsx).
  const closeByRole = page.getByRole('button', { name: /close/i }).last();
  if (await closeByRole.isVisible({ timeout: 500 }).catch(() => false)) {
    await closeByRole.click({ force: true, timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(300);
    if (!(await anyDialog.isVisible({ timeout: 300 }).catch(() => false))) return;
  }

  // 4. Last button in the open dialog (close button is always last in Radix DialogContent).
  const closeBtn = page.locator('[role="dialog"][data-state="open"] button').last();
  if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await closeBtn.click({ force: true, timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(300);
    if (!(await anyDialog.isVisible({ timeout: 300 }).catch(() => false))) return;
  }

  // 5. Escape key.
  await page.keyboard.press('Escape').catch(() => {});
}

// Call once in beforeEach. Playwright automatically fires each handler whenever the
// matching dialog appears mid-test, before any subsequent interaction is attempted.
export async function registerAutoDialogHandlers(page: Page): Promise<void> {
  const closeTopDialog = async () => {
    const isStillOpen = () =>
      page.locator('[role="dialog"][data-state="open"]').isVisible({ timeout: 300 }).catch(() => false);

    // Strategy 1: click the overlay backdrop at the top-left corner — always outside
    // the centred dialog card. Radix fires onInteractOutside → onOpenChange(false).
    // The user confirmed this reliably closes the dialog regardless of close-button state.
    await page.mouse.click(10, 10).catch(() => {});
    await page.waitForTimeout(400);
    if (!(await isStillOpen())) return;

    // Strategy 2: close button by accessible name (sr-only "Close" span in Dialog.tsx).
    const closeByName = page.getByRole('button', { name: /close/i }).last();
    if (await closeByName.isVisible({ timeout: 500 }).catch(() => false)) {
      await closeByName.click({ force: true, timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(400);
      if (!(await isStillOpen())) return;
    }

    // Strategy 3: last button in the open dialog (close button is always last in DialogContent).
    const closeBtn = page.locator('[role="dialog"][data-state="open"] button').last();
    if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await closeBtn.click({ force: true, timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(400);
      if (!(await isStillOpen())) return;
    }

    // Strategy 4: Escape key.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  };

  await page.addLocatorHandler(
    page.getByRole('heading', { name: /congratulations/i }),
    closeTopDialog,
  );
  await page.addLocatorHandler(
    page.getByRole('heading', { name: /course updated/i }),
    closeTopDialog,
    { times: 50 },
  );

  // RatingDialog — "We would love to hear from you". Custom overlay with no
  // outside-click or Escape handler. Close button is the first button inside
  // .rating-dialog-overlay (aria-label="Close rating dialog").
  await page.addLocatorHandler(
    page.getByText(/we would love to hear from you/i),
    async () => {
      const ratingOverlay = page.locator('.rating-dialog-overlay');
      if (!(await ratingOverlay.isVisible({ timeout: 500 }).catch(() => false))) return;
      const closeBtn = ratingOverlay.locator('button').first();
      if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await closeBtn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(300);
      }
    },
  );
}

async function dismissEcmlUserSwitcher(page: Page): Promise<void> {
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    try {
      const popup = frame.locator('.popup-overlay');
      if (await popup.isVisible({ timeout: 500 }).catch(() => false)) {
        const firstCard = frame.locator('.userswitcher-card').first();
        if (await firstCard.isVisible({ timeout: 500 }).catch(() => false)) {
          await firstCard.click();
          await page.waitForTimeout(300);
          return;
        }
        await frame.locator('body').press('Escape').catch(() => {});
        return;
      }
    } catch { /* cross-origin or detached frame */ }
  }
}

// Click the "Submit" button whenever a "Submit to continue." prompt is visible.
// Checks the main page first, then all child frames (ECML quiz renders inside an iframe).
// Returns true if Submit was clicked.
async function handleSubmitToContinue(page: Page): Promise<boolean> {
  const submitContinueText = /submit to continue/i;
  // Main page
  if (await page.getByText(submitContinueText).isVisible({ timeout: 300 }).catch(() => false)) {
    const btn = page.getByRole('button', { name: /^submit$/i }).filter({ visible: true }).first();
    if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
      console.log('  "Submit to continue" — clicking Submit');
      await btn.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(1000);
      return true;
    }
  }
  // Child frames (ECML quiz player renders inside iframe#contentPlayer)
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    try {
      if (await frame.getByText(submitContinueText).isVisible({ timeout: 300 }).catch(() => false)) {
        const btn = frame.getByRole('button', { name: /^submit$/i }).filter({ visible: true }).first();
        if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
          console.log('  "Submit to continue" (in frame) — clicking Submit');
          await btn.click({ timeout: 2000 }).catch(() => {});
          await page.waitForTimeout(1000);
          return true;
        }
      }
    } catch { /* cross-origin or detached */ }
  }
  return false;
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
  // extra common variants
  'mat-icon:has-text("navigate_next")',
  'button:has-text("Next")',
  'button:has-text("NEXT")',
  // ECML content player — AngularJS uses <a> tags for navigation, not <button>
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
  try {
    await page.evaluate(() => window.scrollTo(0, 0));
  } catch {
    return false;
  }
  await page.waitForTimeout(100);

  // ECML fast path: if the contentPlayer iframe is present, try nav-next directly
  // inside it. This skips the ~25 main-page selectors in Strategy 1 (saves ~2.5s
  // per slide click) and is the common case for AngularJS ECML course content.
  try {
    const ecmlIframe = page.locator('iframe#contentPlayer, iframe[name="contentPlayer"]').first();
    if (await ecmlIframe.isVisible({ timeout: 300 }).catch(() => false)) {
      const frame = page.frames().find((f) => f.name() === 'contentPlayer');
      if (frame) {
        for (const sel of ['a.nav-next:not([class*="nav-disable"])', 'a[class*="nav-next"]:not([class*="nav-disable"])', '.nav-icon.nav-next']) {
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
  // For PDFs with > 20 pages, jump near the end via the page-number input, then
  // click the confirmed Next button for the final step.
  // IMPORTANT: a direct fill() to totalPages fires only IMPRESSION/INTERACT events —
  // NOT the END telemetry event that records completion. Only clicking the next button
  // from page (totalPages-1) → totalPages triggers the END event in sunbird-pdf-player.
  // So we jump to totalPages-1, then let the next loop iteration click next once.
  try {
    const player = page.locator('sunbird-pdf-player, sunbird-epub-player').first();
    if (await player.isVisible({ timeout: 2000 }).catch(() => false)) {
      await player.hover();
      await page.waitForTimeout(800);

      // Read total pages and current page from the page-number input.
      const pageInput = page.locator('sunbird-pdf-player input[type="number"]').first();
      const maxAttr = await pageInput.getAttribute('max').catch(() => null);
      const totalPages = maxAttr ? parseInt(maxAttr, 10) : 0;

      if (totalPages > 20) {
        const currentVal = await pageInput.inputValue().catch(() => '1');
        const currentPage = parseInt(currentVal, 10) || 1;
        console.log(`    PDF: totalPages=${totalPages} currentPage=${currentPage}`);

        if (currentPage >= totalPages) {
          // On the last page — click next to fire the END event.
          // sunbird-pdf-player fires END when next is clicked FROM the last page,
          // not simply when the last page is reached via fill().
          const nextBtn = page.locator(
            'sunbird-pdf-player button[aria-label="navigation-arrows-nextIcon"], ' +
            'sunbird-epub-player button[aria-label="navigation-arrows-nextIcon"], ' +
            'sunbird-pdf-player button.player-nextIcon, ' +
            'sunbird-epub-player button.player-nextIcon'
          ).first();
          if (await nextBtn.isVisible({ timeout: 800 }).catch(() => false)) {
            console.log(`    Large PDF: on last page ${currentPage}/${totalPages}, clicking next to fire END event`);
            await nextBtn.click();
            return true;
          }
          console.log(`    Large PDF: on last page ${currentPage}/${totalPages}, next button not visible — END may have already fired`);
          return true;
        }

        if (currentPage === totalPages - 1) {
          // One page before last: click the next button to reach totalPages.
          // This is the only navigation method that fires the END event.
          const nextBtn = page.locator(
            'sunbird-pdf-player button[aria-label="navigation-arrows-nextIcon"], ' +
            'sunbird-epub-player button[aria-label="navigation-arrows-nextIcon"], ' +
            'sunbird-pdf-player button.player-nextIcon, ' +
            'sunbird-epub-player button.player-nextIcon'
          ).first();
          if (await nextBtn.isVisible({ timeout: 800 }).catch(() => false)) {
            console.log(`    Large PDF: clicking next ${currentPage} → ${totalPages} (fires END event)`);
            await nextBtn.click();
            return true;
          }
        }

        if (currentPage < totalPages - 1) {
          // Jump to second-to-last page via the page input. Stopping one page short
          // so the next iteration can use the next button (which fires END).
          const targetPage = totalPages - 1;
          console.log(`    Large PDF: jumping from page ${currentPage} to ${targetPage}`);
          await pageInput.click({ clickCount: 3 });
          await pageInput.fill(String(targetPage));
          // Click the "Go to page" span (black arrow next to the input).
          // It is a <span role="button" class="focus-arrow">, NOT a <button>.
          const goToPageBtn = page.locator('sunbird-pdf-player span[aria-label="Go to page"], sunbird-pdf-player .focus-arrow').first();
          if (await goToPageBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await goToPageBtn.click();
          } else {
            await pageInput.press('Enter');
          }
          await page.waitForTimeout(1500);
          return true;
        }
      }

      // Confirmed next-page button (MCP-verified: aria-label="navigation-arrows-nextIcon")
      const nextBtn = page.locator(
        'sunbird-pdf-player button[aria-label="navigation-arrows-nextIcon"], ' +
        'sunbird-epub-player button[aria-label="navigation-arrows-nextIcon"], ' +
        'sunbird-pdf-player button.player-nextIcon, ' +
        'sunbird-epub-player button.player-nextIcon'
      ).first();
      if (await nextBtn.isVisible({ timeout: 800 }).catch(() => false)) {
        await nextBtn.click();
        return true;
      }

      // Legacy PDF.js selectors (fallback for older player versions)
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

      // Bounding box fallback: the Next button sits at the top-right of the toolbar.
      const box = await player.boundingBox();
      if (box) {
        await page.mouse.click(
          Math.round(box.x + box.width * 0.96),
          Math.round(box.y + 20),
        );
        return true;
      }
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

async function consumeCourse(page: Page): Promise<void> {
  // Completed rows (status 2) render a child span with class text-sunbird-status-completed-text.
  // Select only ContentRow elements that are NOT completed (status 0 or 1, or no status shown).
  const incompleteLesson = () =>
    page.locator('[data-objecttype="Content"]:not(:has(.text-sunbird-status-completed-text))').first();

  const MAX_LESSONS = 50;
  for (let i = 0; i < MAX_LESSONS; i++) {
    await page.waitForTimeout(800); // let sidebar refresh after returning from a lesson

    const lesson = incompleteLesson();
    if (!(await lesson.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('  No more incomplete lessons');
      break;
    }

    const title = await lesson.textContent().then((t) => t?.trim().slice(0, 60) ?? '').catch(() => '');
    console.log(`  Consuming lesson ${i + 1}: ${title}`);

    await lesson.scrollIntoViewIfNeeded();
    await lesson.click();
    await page.waitForURL(
      (url) => url.pathname.includes('/content/'),
      { timeout: 15000 }
    );
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await consumeContent(page, 'ecml');

    // consumeContent navigates back via Go Back / Exit / page.goBack().
    // Wait until we are back on the course page (no /content/ in the path).
    await page.waitForURL(
      (url) => url.pathname.includes('/collection/') && !url.pathname.includes('/content/'),
      { timeout: 20000 }
    ).catch(() => {});
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  }

  // Verify the progress bar has reached 100% (backend may lag slightly).
  const progressBar = page.locator('[role="progressbar"]');
  await expect(progressBar).toHaveAttribute('aria-valuenow', '100', { timeout: 30000 });
}

// Consume ALL lessons inside a Content Playlist or Digital Textbook collection.
// The collection auto-navigates to the first lesson; we collect every sidebar link
// upfront and navigate to each one in turn, consuming it without navigating back
// between lessons. A single navigate-back is issued after all lessons are done.
async function consumeAnonymousCollection(page: Page): Promise<void> {
  // Wait for the collection to auto-navigate into the first lesson.
  await page.waitForTimeout(3000);

  // Collect all lesson hrefs from the sidebar (persists across lesson navigations).
  const sidebarSel = 'aside a[href*="/content/"], [role="complementary"] a[href*="/content/"]';
  const lessonLinks = page.locator(sidebarSel);
  await lessonLinks.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

  const lessonCount = await lessonLinks.count();
  const lessonHrefs: string[] = [];
  for (let i = 0; i < lessonCount; i++) {
    const href = await lessonLinks.nth(i).getAttribute('href') ?? '';
    if (href) lessonHrefs.push(href);
  }
  console.log(`  Anonymous collection — ${lessonHrefs.length} lesson(s) found`);

  const origin = new URL(page.url()).origin;

  for (let i = 0; i < lessonHrefs.length; i++) {
    const href = lessonHrefs[i];
    const absUrl = href.startsWith('http') ? href : `${origin}${href}`;
    console.log(`  Lesson ${i + 1}/${lessonHrefs.length}: ${absUrl}`);

    await page.goto(absUrl);
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Detect the player type loaded for this lesson.
    const hasPdf   = await page.locator('sunbird-pdf-player').isVisible({ timeout: 3000 }).catch(() => false);
    const hasQuml  = await page.locator('sunbird-quml-player').isVisible({ timeout: 3000 }).catch(() => false);
    const hasYt    = page.frames().some(f => f.url().includes('youtube.com'));
    const hasVideo = await page.locator('video').isVisible({ timeout: 2000 }).catch(() => false);
    const hasEcml  = await page.locator('iframe[name="contentPlayer"], iframe#contentPlayer').isVisible({ timeout: 2000 }).catch(() => false);
    const hasIframe = await page.locator('iframe').first().isVisible({ timeout: 2000 }).catch(() => false);

    let detected: string;
    if (hasPdf)         detected = 'pdf';
    else if (hasQuml)   detected = 'quml';
    else if (hasYt)     detected = 'youtube';
    else if (hasVideo)  detected = 'video';
    else if (hasEcml)   detected = 'ecml';
    else if (hasIframe) detected = 'html';
    else                detected = 'unknown';

    console.log(`  Lesson ${i + 1} type: ${detected}`);
    // Consume without navigating back — we'll navigate to the next lesson directly.
    await consumeContent(page, detected, { navigateBack: false });
    await dismissModal(page);
  }

  // Navigate back once after all lessons are consumed.
  if (!page.isClosed()) {
    await page.goBack();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
  }
}

export async function consumeContent(page: Page, type: string, opts: { navigateBack?: boolean } = {}) {
  const lowerType = type.toLowerCase();
  console.log(`[consumeContent] type=${type} url=...${page.url().split('/content/').pop()?.slice(0, 50) ?? page.url().slice(-50)}`);
  const completionBanner = page.getByText(/you just completed|we would love to hear from you/i);

  // Anonymous users cannot access course/collection content — skip gracefully.
  const joinGate = page.getByText(/you must join the course/i);
  if (await joinGate.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log(`  ${type} — requires course enrollment (anonymous user), skipping`);
    await page.goBack();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    return;
  }

  // Dispatch collection types to the appropriate flow.
  // 'course' requires enrollment → consumeCourse.
  // 'content playlist' and 'digital textbook' are accessible without login →
  //   consumeAnonymousCollection (detects the auto-loaded lesson and consumes it).
  if (lowerType === 'course' || lowerType === 'textbook' || lowerType === 'collection') {
    await consumeCourse(page);
    return;
  }
  if (lowerType === 'content playlist' || lowerType === 'digital textbook') {
    await consumeAnonymousCollection(page);
    return;
  }

  const player = page.locator('iframe, video, [class*="player"], [class*="content-app"], sunbird-pdf-player').first();
  await expect(player).toBeVisible({ timeout: 30000 });

  // YouTube via ECML needs the same 5 s warm-up as ECML for the iframe chain to initialise.
  const waitMs = (lowerType === 'ecml' || lowerType === 'youtube') ? 5000 : 2000;
  await page.waitForTimeout(waitMs);

  // Detect YouTube: explicit type OR visible iframe src OR any frame URL contains youtube.
  const isYouTube = lowerType === 'youtube'
    || await page.locator('iframe[src*="youtube"]').isVisible({ timeout: 3000 }).catch(() => false)
    || page.frames().some((f) => f.url().includes('youtube.com'));
  console.log(`[consumeContent] isYouTube=${isYouTube}`);

  if (isYouTube) {
    await page.waitForTimeout(5000); // Let ECML iframe chain initialize

    // Quick presence check — confirms the iframe chain is fully rendered.
    const ytIframeEl = page
      .frameLocator('iframe#contentPlayer')
      .frameLocator('[id="org.ekstep.youtuberenderer"]')
      .locator('iframe');
    const ibox = await ytIframeEl.boundingBox().catch(() => null);

    if (!ibox) {
      console.log('  YouTube — iframe not found after 10 s, skipping');
    } else {
      // Always click the centre of the YouTube iframe first to ensure the video
      // starts playing. Without a user-gesture click the browser may block autoplay,
      // causing getDuration() to return 0 and the seek to silently fail.
      console.log('  YouTube — clicking centre to start playback');
      await page.mouse.click(
        Math.round(ibox.x + ibox.width * 0.5),
        Math.round(ibox.y + ibox.height * 0.5),
      );
      await page.waitForTimeout(2000);

      // Seek near the end using the YT IFrame API player object in youtube.html's context.
      // youtube.html is same-origin so window.player is accessible via page.evaluate().
      // CRITICAL: directly setting video.currentTime in the cross-origin YouTube embed
      // does NOT fire onStateChange() callbacks — only YT IFrame API methods (seekTo,
      // playVideo) send the postMessage that youtube.html's handler uses to emit ECML
      // END telemetry, which is what marks the lesson complete.
      const seekResult = await page.evaluate(() => {
        try {
          const cpDoc = (document.querySelector('#contentPlayer') as HTMLIFrameElement).contentDocument;
          if (!cpDoc) return 'no-cpDoc';
          const ytRenderer = cpDoc.querySelector('[id="org.ekstep.youtuberenderer"]') as HTMLIFrameElement;
          if (!ytRenderer) return 'no-ytRenderer';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ytWin = ytRenderer.contentWindow as any;
          const player = ytWin?.player;
          if (!player) return 'no-player';
          const duration: number = player.getDuration?.() ?? 0;
          if (!duration || duration < 5) return 'no-duration';
          player.seekTo(duration - 5, true);
          player.playVideo();
          return `seeked:${Math.round(duration)}`;
        } catch (e) {
          return `error:${String(e)}`;
        }
      }).catch(() => 'evaluate-error');

      console.log(`  YouTube — seek via YT IFrame API: ${seekResult}`);

      if (!seekResult.startsWith('seeked')) {
        // Fallback: seek via direct video element manipulation (cross-origin CDP).
        // Note: currentTime does not fire onStateChange, so the END event may not
        // fire — but it is still better than doing nothing when the API is unavailable.
        const ytFrame = page.frames().find((f) => f.url().includes('youtube.com/embed'));
        if (ytFrame) {
          await ytFrame.evaluate(function () {
            const v = document.querySelector('video') as HTMLVideoElement;
            if (v && v.duration) { v.currentTime = v.duration - 3; v.play(); }
          }).catch(() => {});
          console.log('  YouTube — fallback: seeked via video.currentTime');
        }
      }

      // Video ends ~5 s after seek; portal shows the dialog ~5 s after that.
      await page.waitForTimeout(10000);
      const bannerVisible = await page.getByText(/you just completed|we would love to hear from you/i)
        .isVisible({ timeout: 5000 }).catch(() => false);
      console.log(bannerVisible
        ? '  YouTube — "We would love to hear from you" confirmed'
        : '  YouTube — completion dialog not seen (checking sidebar anyway)');
    }

  } else if (lowerType === 'quml') {
    console.log('  QuML quiz — clicking through questions via right-arrow navigation');
    // Same circular arrow button as PDF/EPUB players (aria-label="navigation-arrows-nextIcon").
    // The previous approach used quml.getByRole('navigation') which found nothing, and
    // quml.boundingBox() returns null for shadow-DOM web components — breaking immediately.
    const nextBtn = page.locator(
      'nav[aria-label="next slide"], ' +
      '[role="navigation"][aria-label="next slide"], ' +
      'sunbird-quml-player button[aria-label="navigation-arrows-nextIcon"], ' +
      'button[aria-label="navigation-arrows-nextIcon"]'
    ).first();
    for (let q = 0; q < 40; q++) {
      if (await completionBanner.isVisible({ timeout: 500 }).catch(() => false)) break;
      if (await isEcmlComplete(page)) {
        console.log('  QuML — score screen detected');
        break;
      }
      if (await nextBtn.isVisible({ timeout: 800 }).catch(() => false)) {
        await nextBtn.click();
      } else {
        // Specific aria-label button not found — fall back to broader right-arrow strategies
        // (catches the > circle button used in digital textbook players)
        const clicked = await clickRightArrow(page);
        if (!clicked) {
          console.log(`  QuML — no navigation found at iteration ${q}, stopping`);
          break;
        }
      }
      await page.waitForTimeout(1200);
    }
    console.log('  QuML — finished');

  } else if (lowerType === 'epub') {
    console.log('  EPUB — hovering and clicking through pages via next-arrow navigation');
    const epubPlayer = page.locator('sunbird-epub-player').first();
    const nextBtn = page.locator(
      'sunbird-epub-player button[aria-label="navigation-arrows-nextIcon"], ' +
      'sunbird-epub-player button.player-nextIcon'
    ).first();
    const lessonStartEpub = Date.now();
    for (let p = 0; p < 200; p++) {
      if (Date.now() - lessonStartEpub > 30_000) {
        console.log(`  EPUB — 30s limit reached after ${p} clicks, moving on`);
        break;
      }
      if (await completionBanner.isVisible({ timeout: 500 }).catch(() => false)) {
        console.log(`  EPUB — completion banner detected after ${p} clicks`);
        break;
      }
      if (await epubPlayer.isVisible({ timeout: 1000 }).catch(() => false)) {
        await epubPlayer.hover();
        await page.waitForTimeout(500);
      }
      if (await nextBtn.isVisible({ timeout: 800 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(1200);
      } else {
        console.log(`  EPUB — next arrow not visible at page ${p} — end of content, waiting for completion signal`);
        await completionBanner.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        break;
      }
    }
    console.log('  EPUB — finished');

  } else if (lowerType === 'pdf') {
    console.log('  PDF — hovering player and clicking through pages');
    const pdfPlayer = page.locator('sunbird-pdf-player').first();
    const nextBtn = page.locator(
      'sunbird-pdf-player button[aria-label="navigation-arrows-nextIcon"], ' +
      'sunbird-pdf-player button.player-nextIcon'
    ).first();
    const pageInput = page.locator('sunbird-pdf-player input[type="number"]').first();

    // Large PDF fast-path: jump to second-to-last page via the page number input so
    // we only need to click next once (from totalPages-1 → totalPages) to fire the
    // END telemetry event. Jumping directly to totalPages skips the END event.
    if (await pdfPlayer.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pdfPlayer.hover();
      await page.waitForTimeout(800);
      const maxAttr = await pageInput.getAttribute('max').catch(() => null);
      const totalPages = maxAttr ? parseInt(maxAttr, 10) : 0;
      if (totalPages > 20) {
        const currentVal = await pageInput.inputValue().catch(() => '1');
        const currentPage = parseInt(currentVal, 10) || 1;
        if (currentPage < totalPages - 1) {
          const targetPage = totalPages - 1;
          console.log(`  PDF large: jumping from ${currentPage} to ${targetPage}/${totalPages}`);
          await pageInput.click({ clickCount: 3 });
          await pageInput.fill(String(targetPage));
          const goBtn = page.locator(
            'sunbird-pdf-player span[aria-label="Go to page"], sunbird-pdf-player .focus-arrow'
          ).first();
          if (await goBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await goBtn.click();
          } else {
            await pageInput.press('Enter');
          }
          await page.waitForTimeout(1500);
        }
      }
    }

    // Page-by-page: hover to reveal the arrow, click next, repeat until last page.
    const lessonStartPdf = Date.now();
    for (let p = 0; p < 200; p++) {
      if (Date.now() - lessonStartPdf > 30_000) {
        console.log(`  PDF — 30s limit after ${p} clicks`);
        break;
      }
      if (await completionBanner.isVisible({ timeout: 500 }).catch(() => false)) {
        console.log(`  PDF — completion banner after ${p} clicks`);
        break;
      }
      if (await pdfPlayer.isVisible({ timeout: 3000 }).catch(() => false)) {
        await pdfPlayer.hover();
        await page.waitForTimeout(1000);
      }
      if (await nextBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(600);
      } else {
        console.log(`  PDF — next button not visible at page ${p} — end of content`);
        await completionBanner.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        break;
      }
    }
    console.log('  PDF — finished');

  } else if (lowerType === 'unknown') {
    console.log('  Unknown content type — waiting 3 s then navigating back');
    await page.waitForTimeout(3000);

  } else if (lowerType === 'html') {
    console.log('  HTML/SCORM content — attempting completion');
    await page.waitForTimeout(3000);
    await dismissEcmlUserSwitcher(page);

    // Detect multi-page vs single-page.
    // Hover over the iframe first so hover-revealed navigation controls become visible,
    // then scan frames with RIGHT_ARROW_SELECTORS; fall back to JS evaluate for
    // SVG/icon-font/custom elements that have no text content.
    let hasNavArrow = false;
    try {
      const iframeEl = page
        .locator('iframe#contentPlayer, iframe[name="contentPlayer"]')
        .first()
        .or(page.locator('iframe').first());
      if (await iframeEl.isVisible({ timeout: 300 }).catch(() => false)) {
        const box = await iframeEl.boundingBox();
        if (box) {
          await page.mouse.move(
            Math.round(box.x + box.width * 0.5),
            Math.round(box.y + box.height * 0.5),
          );
          await page.waitForTimeout(500);
        }
      }
    } catch { /* ignore */ }
    for (const frame of page.frames()) {
      if (frame === page.mainFrame()) continue;
      try {
        for (const sel of RIGHT_ARROW_SELECTORS) {
          if (await frame.locator(sel).last().isVisible({ timeout: 300 }).catch(() => false)) {
            hasNavArrow = true;
            break;
          }
        }
      } catch { /* cross-origin or detached */ }
      if (hasNavArrow) break;
    }
    if (!hasNavArrow) {
      for (const frame of page.frames()) {
        if (frame === page.mainFrame()) continue;
        try {
          hasNavArrow = await frame.evaluate((): boolean => {
            const W = window.innerWidth;
            const H = window.innerHeight;
            const candidates: HTMLElement[] = [];
            document.querySelectorAll('*').forEach((el) => {
              const r = el.getBoundingClientRect();
              if (r.width < 5 || r.height < 5) return;
              if (r.right < W * 0.45) return;
              if (r.top < 0 || r.bottom > H) return;
              const style = window.getComputedStyle(el);
              const tag = el.tagName.toUpperCase();
              if (
                style.cursor === 'pointer' || tag === 'BUTTON' || tag === 'A' ||
                el.getAttribute('role') === 'button'
              ) candidates.push(el as HTMLElement);
            });
            candidates.sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right);
            const el = candidates.find((c) => {
              const r = c.getBoundingClientRect();
              return r.width < W * 0.4 && r.height < H * 0.4;
            });
            return !!el;
          }).catch(() => false);
        } catch { /* cross-origin */ }
        if (hasNavArrow) break;
      }
    }
    console.log(`  HTML/SCORM hasNavArrow=${hasNavArrow}`);

    if (hasNavArrow) {
      // Multi-page: click right arrow until "Completed" — no wall-clock timeout.
      // Same layered strategy as ECML: selector scan → JS evaluate → clickRightArrow fallback.
      // No break on !clicked; safety exit if no navigation click for 30 continuous seconds.
      console.log('  HTML/SCORM multi-page: clicking right arrow until Completed...');
      const MAX_SLIDES = 500;
      let lastClickTime = Date.now();
      for (let i = 0; i < MAX_SLIDES; i++) {
        // A quiz "Submit to continue" may appear at the end of the content.
        if (await handleSubmitToContinue(page)) lastClickTime = Date.now();
        let clicked = false;
        for (const frame of page.frames()) {
          if (frame === page.mainFrame()) continue;
          try {
            for (const sel of RIGHT_ARROW_SELECTORS) {
              const el = frame.locator(sel).last();
              if (await el.isVisible({ timeout: 300 }).catch(() => false)) {
                await el.click().catch(() => {});
                clicked = true;
                break;
              }
            }
          } catch { /* cross-origin or detached */ }
          if (clicked) break;
        }
        if (!clicked) {
          for (const frame of page.frames()) {
            if (frame === page.mainFrame()) continue;
            try {
              const jsClicked = await frame.evaluate((): boolean => {
                const W = window.innerWidth;
                const H = window.innerHeight;
                const candidates: HTMLElement[] = [];
                document.querySelectorAll('*').forEach((el) => {
                  const r = el.getBoundingClientRect();
                  if (r.width < 5 || r.height < 5) return;
                  if (r.right < W * 0.45) return;
                  if (r.top < 0 || r.bottom > H) return;
                  const style = window.getComputedStyle(el);
                  const tag = el.tagName.toUpperCase();
                  if (
                    style.cursor === 'pointer' || tag === 'BUTTON' || tag === 'A' ||
                    el.getAttribute('role') === 'button'
                  ) candidates.push(el as HTMLElement);
                });
                candidates.sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right);
                const el = candidates.find((c) => {
                  const r = c.getBoundingClientRect();
                  return r.width < W * 0.4 && r.height < H * 0.4;
                });
                if (el) { (el as HTMLElement).click(); return true; }
                return false;
              }).catch(() => false);
              if (jsClicked) { clicked = true; break; }
            } catch { /* cross-origin */ }
          }
        }
        if (!clicked) {
          await clickRightArrow(page);
        } else {
          lastClickTime = Date.now();
        }
        await page.waitForTimeout(400);
        if (await completionBanner.isVisible({ timeout: 500 }).catch(() => false)) {
          console.log(`  HTML/SCORM multi-page: completion banner after ${i + 1} iterations`);
          break;
        }
        if (await isEcmlComplete(page)) {
          console.log(`  HTML/SCORM multi-page: completion screen after ${i + 1} iterations`);
          break;
        }
        if (!clicked) {
          if (Date.now() - lastClickTime > 30_000) {
            console.log('  HTML/SCORM multi-page: no nav button for 30 s — moving on');
            break;
          }
          if (i % 25 === 0) {
            console.log(`  HTML/SCORM multi-page: no nav button (iteration ${i}) — waiting`);
          }
        }
      }
    } else {
      // Single-page: no navigation arrows — wait 15 s for content to register as viewed.
      console.log('  HTML/SCORM single-page: waiting 15 s');
      await page.waitForTimeout(15_000);
    }

  } else if (lowerType === 'video' || lowerType === 'webm') {
      console.log('  Direct video — seeking to near end');
      const hasMainVideo = await page.locator('video').isVisible({ timeout: 3000 }).catch(() => false);
      const iframeHandle = await page.locator('iframe').first()
        .elementHandle({ timeout: 10000 })
        .catch(() => null);
      const ctx = hasMainVideo
        ? page
        : (iframeHandle ? await iframeHandle.contentFrame() : null) ?? page;
      await ctx.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        if (!video) return;
        const seek = () => {
          if (video.duration && video.duration > 3) {
            video.currentTime = video.duration - 2;
            video.play().catch(() => {});
          } else {
            video.addEventListener('loadedmetadata', seek, { once: true });
            video.load();
          }
        };
        seek();
      });
      // Poll until the video element reports ended (up to 15 s), instead of a fixed wait.
      // Exit early if the completion banner appears (some players fire it before video.ended).
      let videoEnded = false;
      for (let t = 0; t < 30 && !videoEnded; t++) {
        await page.waitForTimeout(500);
        videoEnded = await ctx.evaluate(() => {
          const v = document.querySelector('video') as HTMLVideoElement | null;
          return !!(v && v.ended);
        }).catch(() => false);
        if (await completionBanner.isVisible({ timeout: 300 }).catch(() => false)) break;
      }
      console.log(`  Video — ended=${videoEnded}`);
  } else if (lowerType === 'ecml') {
    console.log('  ECML — attempting completion');
    // Initial 5 s warm-up already applied above via waitMs before this branch.
    await dismissEcmlUserSwitcher(page);

    // Pre-check: click "Submit to continue" if a quiz shows it immediately on load.
    await handleSubmitToContinue(page);

    // Step 1: Check for SCORM "Complete Course" button.
    // SCORM content (zip) loads inside iframe#contentPlayer and is detected as 'ecml'.
    // The button may be in the outer contentPlayer doc or in a nested inner SCORM iframe.
    const completeCourseResult = await page.evaluate((): string => {
      const ecmlIframe = (
        document.querySelector('iframe#contentPlayer') as HTMLIFrameElement | null
        ?? document.querySelector('iframe[name="contentPlayer"]') as HTMLIFrameElement | null
      );
      if (!ecmlIframe?.contentDocument) return 'no-iframe';
      const outerBtn = Array.from(ecmlIframe.contentDocument.querySelectorAll('button'))
        .find((b) => /complete\s*course/i.test(b.textContent ?? '')) as HTMLElement | null;
      if (outerBtn) { outerBtn.click(); return 'clicked'; }
      const scormIframe = ecmlIframe.contentDocument.querySelector('iframe') as HTMLIFrameElement | null;
      if (!scormIframe?.contentDocument) return 'no-inner';
      const innerBtn = Array.from(scormIframe.contentDocument.querySelectorAll('button'))
        .find((b) => /complete\s*course/i.test(b.textContent ?? '')) as HTMLElement | null;
      if (innerBtn) { innerBtn.click(); return 'clicked-inner'; }
      return 'not-found';
    });
    console.log(`  ECML step1 (Complete Course): ${completeCourseResult}`);

    if (completeCourseResult === 'clicked' || completeCourseResult === 'clicked-inner') {
      await page.waitForTimeout(3000);
      if (await isEcmlComplete(page)) {
        console.log('  ECML (SCORM): completion screen after "Complete Course"');
      } else if (await completionBanner.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('  ECML (SCORM): completion banner after "Complete Course"');
      } else {
        console.log('  ECML (SCORM): no completion signal after "Complete Course" — may complete asynchronously');
      }
    } else {
      // Step 2: Detect multi-page content.
      // First check for ECML nav-next in the contentPlayer frame (standard AngularJS ECML).
      // Then fall back to checking ALL child frames for generic "Next" buttons — this
      // covers SCORM multi-SCO content whose navigation lives in a nested SCO iframe.
      const cpFrame = page.frames().find((f) => f.name() === 'contentPlayer');
      const navNextSelectors = [
        'a.nav-next:not([class*="nav-disable"])',
        'a[class*="nav-next"]:not([class*="nav-disable"])',
        '.nav-icon.nav-next',
      ];
      let navNextFound = false;
      if (cpFrame) {
        for (const sel of navNextSelectors) {
          const el = cpFrame.locator(sel).first();
          if (await el.isVisible({ timeout: 300 }).catch(() => false)) {
            navNextFound = true;
            break;
          }
        }
      }

      // If ECML nav-next not found, check all nested frames using the full RIGHT_ARROW_SELECTORS
      // list (covers →, chevron_right, Next, NEXT, and more).
      // Wait 2 s first — SCORM players initialise the first SCO asynchronously after load.
      // Then hover over the contentPlayer so hover-revealed navigation controls become visible.
      if (!navNextFound) {
        await page.waitForTimeout(2000);
        try {
          const iframeEl = page.locator('iframe#contentPlayer, iframe[name="contentPlayer"]').first();
          if (await iframeEl.isVisible({ timeout: 300 }).catch(() => false)) {
            const box = await iframeEl.boundingBox();
            if (box) {
              await page.mouse.move(
                Math.round(box.x + box.width * 0.5),
                Math.round(box.y + box.height * 0.5),
              );
              await page.waitForTimeout(500);
            }
          }
        } catch { /* ignore */ }
        for (const frame of page.frames()) {
          if (frame === page.mainFrame()) continue;
          try {
            for (const sel of RIGHT_ARROW_SELECTORS) {
              if (await frame.locator(sel).last().isVisible({ timeout: 300 }).catch(() => false)) {
                navNextFound = true;
                break;
              }
            }
          } catch { /* cross-origin or detached frame */ }
          if (navNextFound) break;
        }
      }

      // Final fallback: deeply nested iframes (contentPlayer → SCO iframe) mean SCORM multi-SCO.
      // Some SCORM players auto-advance through SCOs without any visible "Next" button.
      // Still treat as multi-page so we wait for the completion banner instead of hitting
      // the 30 s single-page timeout.
      if (!navNextFound) {
        const hasDeepNesting = page.frames().some((f) => {
          if (f === page.mainFrame()) return false;
          const parent = f.parentFrame();
          return parent !== null && parent !== page.mainFrame();
        });
        if (hasDeepNesting) {
          console.log('  Deep iframe nesting detected — treating as SCORM multi-page');
          navNextFound = true;
        }
      }

      console.log(`  ECML navNextFound=${navNextFound} totalFrames=${page.frames().length}`);

      if (navNextFound) {
        // Multi-page ECML or SCORM: click navigation until Completed — no wall-clock timeout.
        // SCORM auto-advancing content may have no clickable "Next" button; in that case we
        // keep the loop alive (no break on !clicked) and wait for the completion banner.
        console.log('  ECML/SCORM multi-page: clicking until Completed...');
        const MAX_SLIDES = 500;
        let lastClickTime = Date.now();
        for (let i = 0; i < MAX_SLIDES; i++) {
          // A quiz "Submit to continue" may appear after the last slide — click it.
          if (await handleSubmitToContinue(page)) lastClickTime = Date.now();
          let clicked = false;
          // ECML: prefer direct nav-next in contentPlayer frame
          if (cpFrame) {
            for (const sel of navNextSelectors) {
              const el = cpFrame.locator(sel).first();
              if (await el.isVisible({ timeout: 300 }).catch(() => false)) {
                await el.click().catch(() => {});
                clicked = true;
                break;
              }
            }
          }
          // SCORM / generic: scan all frames using the full RIGHT_ARROW_SELECTORS list
          // (covers →, chevron_right, Next, NEXT, aria-label variants, etc).
          if (!clicked) {
            for (const frame of page.frames()) {
              if (frame === page.mainFrame()) continue;
              try {
                for (const sel of RIGHT_ARROW_SELECTORS) {
                  const el = frame.locator(sel).last();
                  if (await el.isVisible({ timeout: 300 }).catch(() => false)) {
                    await el.click().catch(() => {});
                    clicked = true;
                    break;
                  }
                }
              } catch { /* cross-origin or detached */ }
              if (clicked) break;
            }
          }
          // JS-evaluate fallback: selector-agnostic — finds the rightmost cursor:pointer
          // element in the right half of each frame and fires a JS click on it. Handles
          // SVG icons, icon-font buttons, and custom elements that have no text content.
          if (!clicked) {
            for (const frame of page.frames()) {
              if (frame === page.mainFrame()) continue;
              try {
                const jsClicked = await frame.evaluate((): boolean => {
                  const W = window.innerWidth;
                  const H = window.innerHeight;
                  const candidates: HTMLElement[] = [];
                  document.querySelectorAll('*').forEach((el) => {
                    const r = el.getBoundingClientRect();
                    if (r.width < 5 || r.height < 5) return;
                    if (r.right < W * 0.45) return; // must be in right half
                    if (r.top < 0 || r.bottom > H) return; // must be in viewport
                    const style = window.getComputedStyle(el);
                    const tag = el.tagName.toUpperCase();
                    if (
                      style.cursor === 'pointer' ||
                      tag === 'BUTTON' ||
                      tag === 'A' ||
                      el.getAttribute('role') === 'button'
                    ) {
                      candidates.push(el as HTMLElement);
                    }
                  });
                  // Sort rightmost first, prefer smaller elements (navigation icons)
                  candidates.sort((a, b) => {
                    const ra = a.getBoundingClientRect();
                    const rb = b.getBoundingClientRect();
                    return rb.right - ra.right;
                  });
                  // Skip huge elements (the whole frame body, large containers)
                  const el = candidates.find((c) => {
                    const r = c.getBoundingClientRect();
                    return r.width < W * 0.4 && r.height < H * 0.4;
                  });
                  if (el) { el.click(); return true; }
                  return false;
                }).catch(() => false);
                if (jsClicked) { clicked = true; break; }
              } catch { /* cross-origin or detached */ }
            }
          }
          // Last resort: hover over the contentPlayer, then coordinate-click right-centre.
          // Reveals hover-hidden controls and uses approximate position as final attempt.
          if (!clicked) {
            await clickRightArrow(page);
          } else {
            lastClickTime = Date.now();
          }
          await page.waitForTimeout(400);
          if (await completionBanner.isVisible({ timeout: 500 }).catch(() => false)) {
            console.log(`  ECML/SCORM multi-page: completion banner after ${i + 1} iterations`);
            break;
          }
          if (await isEcmlComplete(page)) {
            console.log(`  ECML/SCORM multi-page: completion screen after ${i + 1} iterations`);
            break;
          }
          if (!clicked) {
            if (Date.now() - lastClickTime > 30_000) {
              console.log(`  ECML/SCORM multi-page: no nav button for 30 s — moving on`);
              break;
            }
            if (i % 25 === 0) {
              console.log(`  ECML/SCORM multi-page: no nav button (iteration ${i}) — waiting`);
            }
          }
        }
      } else {
        // Single-page ECML (quiz/assessment): 15 s timeout then move on.
        const MAX_CLICKS = 200;
        const lessonStart = Date.now();
        for (let i = 0; i < MAX_CLICKS; i++) {
          if (Date.now() - lessonStart > 15_000) {
            console.log(`  15s lesson limit reached after ${i} clicks — moving on`);
            break;
          }
          if (page.isClosed()) {
            console.log('  Page was closed — treating as content complete');
            break;
          }
          if (await completionBanner.isVisible({ timeout: 500 }).catch(() => false)) {
            console.log(`  Completion detected after ${i} clicks`);
            break;
          }
          if (await isEcmlComplete(page)) {
            console.log(`  ECML score screen detected after ${i} clicks — content complete`);
            break;
          }
          // Handle the "Submit to continue" dialog in ECML assessments.
          if (await handleSubmitToContinue(page)) continue;
          await dismissModal(page, 300);
          await dismissEcmlUserSwitcher(page);
          let clicked = false;
          for (let a = 0; a < 3 && !clicked; a++) {
            clicked = await clickNextButton(page);
            if (clicked) break;
            clicked = await clickRightArrow(page);
            if (clicked) break;
            if (page.isClosed()) break;
            await page.waitForTimeout(200);
          }
          if (!clicked) {
            console.log('  No navigation found after retries — content may already be complete or in an unhandled state');
            break;
          }
          try {
            await page.waitForTimeout(300);
          } catch {
            console.log('  Page closed during wait — treating as content complete');
            break;
          }
        }
        // Post-loop poll: accept score screen or portal completion banner.
        let ecmlDone = false;
        for (let t = 0; t < 30 && !ecmlDone; t++) {
          ecmlDone = await isEcmlComplete(page)
            || await completionBanner.isVisible({ timeout: 500 }).catch(() => false);
          if (!ecmlDone) await page.waitForTimeout(500);
        }
        if (!ecmlDone) console.log('  ECML completion screen not detected — moving on to next lesson');
      }
    }

  } else {
    console.log(`  ${type} — clicking → until completion screen`);
    const MAX_CLICKS = 200;
    const lessonStart = Date.now();
    for (let i = 0; i < MAX_CLICKS; i++) {
      if (Date.now() - lessonStart > 30_000) {
        console.log(`  30s lesson limit reached after ${i} clicks — moving on`);
        break;
      }
      if (page.isClosed()) {
        console.log('  Page was closed — treating as content complete');
        break;
      }
      if (await completionBanner.isVisible({ timeout: 500 }).catch(() => false)) {
        console.log(`  Completion detected after ${i} clicks`);
        break;
      }
      await dismissModal(page, 300);
      let clicked = false;
      for (let a = 0; a < 3 && !clicked; a++) {
        clicked = await clickNextButton(page);
        if (clicked) break;
        clicked = await clickRightArrow(page);
        if (clicked) break;
        if (page.isClosed()) break;
        await page.waitForTimeout(200);
      }
      if (!clicked) {
        console.log('  No navigation found after retries — content may already be complete or in an unhandled state');
        break;
      }
      try {
        await page.waitForTimeout(300);
      } catch {
        console.log('  Page closed during wait — treating as content complete');
        break;
      }
    }
    const bannerSeen = await completionBanner.isVisible({ timeout: 5000 }).catch(() => false);
    if (!bannerSeen) console.log(`  ${type} — completion banner not detected, moving on`);
  }

  // Dismiss any post-completion overlay (e.g. feedback screen) before navigating back.
  if (!page.isClosed()) {
    const bannerSeen = await completionBanner.isVisible({ timeout: 500 }).catch(() => false);
    console.log(`[consumeContent] completion banner visible before nav back: ${bannerSeen}`);
    await dismissModal(page);
  }

  // Navigate back (skipped when called from consumeAnonymousCollection, which
  // handles its own inter-lesson navigation).
  if (opts.navigateBack !== false && !page.isClosed()) {
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
