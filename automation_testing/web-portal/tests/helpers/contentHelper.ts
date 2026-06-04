import { Page, Frame, expect } from '@playwright/test';

export async function dismissModal(page: Page, timeout = 2000) {
  // 1. getByRole resolves accessible names from aria-label, aria-labelledby, and
  //    text content — catches "Close rating dialog" regardless of how the name is set.
  const closeByRole = page.getByRole('button', { name: /close/i }).last();
  if (await closeByRole.isVisible({ timeout }).catch(() => false)) {
    await closeByRole.click();
    return;
  }
  // 2. Fallback: dialog/modal buttons with a ✕ character as text.
  const closeBtn = page.locator('[role="dialog"] button, [class*="modal"] button, [class*="overlay"] button')
    .filter({ hasText: /^[×✕x]$/i })
    .first();
  if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await closeBtn.click();
    return;
  }
  // 3. Last resort: any visible ✕ button anywhere on the page.
  const anyX = page.locator('button').filter({ hasText: /^[×✕x]$/i }).last();
  if (await anyX.isVisible({ timeout: 500 }).catch(() => false)) {
    await anyX.click();
  }
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
  // For PDFs with > 20 pages, jump directly to the last page via the page-number
  // input (confirmed via MCP: input[type="number"] with max="<totalPages>").
  // For small PDFs or when already at the last page, click the confirmed Next button.
  try {
    const player = page.locator('sunbird-pdf-player').first();
    if (await player.isVisible({ timeout: 2000 }).catch(() => false)) {
      await player.hover();
      await page.waitForTimeout(500);

      // Read total pages and current page from the page-number input.
      const pageInput = page.locator('sunbird-pdf-player input[type="number"]').first();
      const maxAttr = await pageInput.getAttribute('max').catch(() => null);
      const totalPages = maxAttr ? parseInt(maxAttr, 10) : 0;

      if (totalPages > 20) {
        const currentVal = await pageInput.inputValue().catch(() => '1');
        const currentPage = parseInt(currentVal, 10) || 1;
        if (currentPage < totalPages) {
          console.log(`    Large PDF: jumping from page ${currentPage} to ${totalPages}`);
          await pageInput.click({ clickCount: 3 });
          await pageInput.fill(String(totalPages));
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
        'sunbird-pdf-player button.player-nextIcon'
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

  if (isYouTube) {
    await page.waitForTimeout(5000); // Let ECML iframe chain initialize

    // Confirmed frame chain (via DOM inspection):
    // main page → iframe#contentPlayer → iframe#org.ekstep.youtuberenderer → iframe#youtubeIframe
    const ytFrameLocator = page
      .frameLocator('iframe#contentPlayer')
      .frameLocator('[id="org.ekstep.youtuberenderer"]')
      .frameLocator('iframe');

    // One level up — locator (not frameLocator) so we can call .boundingBox(),
    // which returns page-absolute coordinates.
    const ytIframeEl = page
      .frameLocator('iframe#contentPlayer')
      .frameLocator('[id="org.ekstep.youtuberenderer"]')
      .locator('iframe');

    // Resolve the iframe's position in the viewport before any interaction.
    // All subsequent mouse operations use these coordinates so they stay correct
    // regardless of scroll position.
    const ibox = await ytIframeEl.boundingBox().catch(() => null);
    if (!ibox) {
      console.log('  YouTube — iframe not found after 5 s, skipping');
    } else {
      // Step 1: Start the video.
      // • On fresh page load the YouTube thumbnail overlay is in the initial state —
      //   it is NOT exposed in the accessibility tree, so getByRole won't find it.
      //   Clicking the iframe centre triggers the overlay (large red play button).
      // • After a video has ended the REPLAY button IS accessible (aria-label="Play
      //   video"). Check for it first; if not present, fall back to centre click.
      const playBtn = ytFrameLocator.getByRole('button', { name: /play video/i });
      if (await playBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await playBtn.click({ timeout: 5000 }).catch(() => {});
        console.log('  YouTube — clicked replay button');
      } else {
        // Initial state: click the centre of the YouTube iframe to start playback
        await page.mouse.click(
          Math.round(ibox.x + ibox.width * 0.5),
          Math.round(ibox.y + ibox.height * 0.5),
        );
        console.log('  YouTube — clicked iframe centre to start playback');
      }
      await page.waitForTimeout(2000);

      // Step 2: Seek to near end via CDP frame evaluation.
      // Clicking the progress bar is intercepted by YouTube's player-controls-background
      // overlay. Directly setting video.currentTime inside the cross-origin iframe via
      // ytFrame.evaluate() bypasses this and triggers the natural 'ended' event which
      // ECML's onStateChange(0) handler uses to record completion.
      const ytFrame = page.frames().find((f) => f.url().includes('youtube.com/embed'));
      if (ytFrame) {
        await ytFrame.evaluate(function () {
          const v = document.querySelector('video');
          if (v && v.duration) {
            v.currentTime = v.duration - 3;
            v.play();
          }
        });
        console.log('  YouTube — seeked to near end via evaluate()');
      } else {
        console.log('  YouTube — cross-origin frame not found; video plays from current position');
      }

      // Step 3: Wait for the video to end naturally (~3 s) then give the portal
      // time to show the "We would love to hear from you" feedback dialog.
      // The dialog appears AFTER the ECML player fires onStateChange(0), which
      // can take 2–4 s after the video ends. dismissModal() runs immediately
      // after this block, so we must wait long enough for the dialog to appear.
      await page.waitForTimeout(6000);
      const bannerVisible = await page.getByText(/you just completed/i)
        .isVisible({ timeout: 3000 }).catch(() => false);
      console.log(bannerVisible
        ? '  YouTube — "You just completed" confirmed'
        : '  YouTube — completion inside ECML iframe (anonymous user — moving on)');
    }

  } else if (lowerType === 'quml') {
    // QuML quiz: click through questions via "next slide" navigation
    // (confirmed via MCP: <nav aria-label="next slide"> inside sunbird-quml-player).
    console.log('  QuML quiz — clicking through questions');
    const quml = page.locator('sunbird-quml-player');
    const nextSlide = quml.getByRole('navigation', { name: /next slide/i });
    for (let q = 0; q < 30; q++) {
      if (await completionBanner.isVisible({ timeout: 500 }).catch(() => false)) break;
      if (await nextSlide.isVisible({ timeout: 800 }).catch(() => false)) {
        await nextSlide.click();
      } else {
        // Coordinate fallback: right edge of the player at mid-height.
        const box = await quml.boundingBox().catch(() => null);
        if (!box) break;
        await page.mouse.click(Math.round(box.x + box.width * 0.95), Math.round(box.y + box.height * 0.5));
      }
      await page.waitForTimeout(1200);
    }
    // Anonymous users have no completion assertion for QuML.
    console.log('  QuML — finished clicking through questions');

  } else if (lowerType === 'unknown') {
    console.log('  Unknown content type — waiting 3 s then navigating back');
    await page.waitForTimeout(3000);

  } else if (lowerType === 'html') {
    console.log('  HTML content — clicking a completed sidebar lesson to trigger completion tracking');
    await page.waitForTimeout(2000);

    // Sunbird marks HTML lessons complete on in-app sidebar navigation (pushState).
    // Prefer clicking an already-completed lesson — safe for the outer loop (it skips
    // completed lessons) and avoids disrupting lesson order.
    const currentContentId = page.url().split('/content/').pop()?.split(/[?#]/)[0] ?? '';
    const allSidebarLinks = page.locator(
      'aside a[href*="/content/"], [role="complementary"] a[href*="/content/"]'
    );

    // Build candidate list: completed lessons first, then any other non-current lesson.
    const completedLinks = allSidebarLinks.filter({ hasText: /completed/i });
    const completedCount = await completedLinks.count().catch(() => 0);
    const candidates = completedCount > 0 ? completedLinks : allSidebarLinks;
    const candidateCount = completedCount > 0 ? completedCount : await allSidebarLinks.count().catch(() => 0);

    let completionTriggered = false;
    for (let idx = 0; idx < candidateCount && !completionTriggered; idx++) {
      const link = candidates.nth(idx);
      const href = (await link.getAttribute('href').catch(() => '')) ?? '';
      if (href && !href.includes(currentContentId) && await link.isVisible({ timeout: 300 }).catch(() => false)) {
        await link.click();
        await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(1000);
        completionTriggered = true;
        console.log('  Clicked completed sidebar lesson — HTML completion event triggered');
      }
    }
    if (!completionTriggered) {
      console.log('  No sidebar lesson found (anonymous or single-lesson course) — waiting 2s');
      await page.waitForTimeout(2000);
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
      await page.waitForTimeout(4000);
  } else {
    console.log(`  ${type} — clicking → until completion screen`);
    if (lowerType === 'ecml') await dismissEcmlUserSwitcher(page);
    const MAX_CLICKS = 200;
    const lessonStart = Date.now();
    for (let i = 0; i < MAX_CLICKS; i++) {
      if (Date.now() - lessonStart > 60_000) {
        console.log(`  60s lesson limit reached after ${i} clicks — moving on`);
        break;
      }
      if (page.isClosed()) {
        console.log('  Page was closed — treating as content complete');
        break;
      }
      // Check completion BEFORE dismissing any modal — the completion/feedback
      // screen itself is what we're waiting for; dismissing it first causes the
      // loop to miss the signal and run all 200 iterations.
      if (await completionBanner.isVisible({ timeout: 500 }).catch(() => false)) {
        console.log(`  Completion detected after ${i} clicks`);
        break;
      }
      if (lowerType === 'ecml' && await isEcmlComplete(page)) {
        console.log(`  ECML score screen detected after ${i} clicks — content complete`);
        break;
      }
      // Handle the "Submit to continue" dialog that appears in ECML assessments
      // after all questions have been skipped/answered.
      if (lowerType === 'ecml') {
        const submitBtn = page.getByRole('button', { name: /^submit$/i }).filter({ visible: true }).first();
        if (await submitBtn.isVisible({ timeout: 500 }).catch(() => false)) {
          console.log('  ECML "Submit to continue" — clicking Submit');
          await submitBtn.click();
          await page.waitForTimeout(1000);
          continue;
        }
        let clickedSubmit = false;
        for (const frame of page.frames()) {
          if (frame === page.mainFrame()) continue;
          try {
            const frameSubmit = frame.getByRole('button', { name: /^submit$/i }).filter({ visible: true }).first();
            if (await frameSubmit.isVisible({ timeout: 300 }).catch(() => false)) {
              console.log('  ECML "Submit to continue" (in frame) — clicking Submit');
              await frameSubmit.click();
              await page.waitForTimeout(1000);
              clickedSubmit = true;
              break;
            }
          } catch { /* cross-origin or detached frame */ }
        }
        if (clickedSubmit) continue;
      }
      // Only dismiss incidental modals (e.g. mid-content popups) after we've
      // confirmed we are NOT on a completion screen.
      await dismissModal(page, 300);
      if (lowerType === 'ecml') await dismissEcmlUserSwitcher(page);
        // Try NEXT button first (appears in ECML quiz popups after answering a question)
        let clicked = false;
        // Multiple small attempts to handle lazy-rendering buttons inside frames
        for (let a = 0; a < 3 && !clicked; a++) {
          clicked = await clickNextButton(page);
          if (clicked) break;
          clicked = await clickRightArrow(page);
          if (clicked) break;
          // wait a bit for UI to render and try again
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
    if (lowerType === 'ecml') {
      // Accept either the score screen (isEcmlComplete) or the portal's
      // "You just completed" completion banner — whichever appears first.
      let ecmlDone = false;
      for (let t = 0; t < 30 && !ecmlDone; t++) {
        ecmlDone = await isEcmlComplete(page)
          || await completionBanner.isVisible({ timeout: 500 }).catch(() => false);
        if (!ecmlDone) await page.waitForTimeout(500);
      }
      if (!ecmlDone) console.log('  ECML completion screen not detected — moving on to next lesson');
    } else {
      const bannerSeen = await completionBanner.isVisible({ timeout: 5000 }).catch(() => false);
      if (!bannerSeen) console.log(`  ${type} — completion banner not detected, moving on`);
    }
  }

  // Dismiss any post-completion overlay (e.g. feedback screen) before navigating back.
  if (!page.isClosed()) await dismissModal(page);

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
