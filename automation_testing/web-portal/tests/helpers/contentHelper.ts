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

    // The HTML/SCORM player loads inside a nested iframe chain:
    //   main page → outer ECML player iframe (gc-menu-btn, Replay) → inner SCORM iframe (Complete Course btn)
    // On standalone content pages the outer iframe has no id; on course player pages it is
    // iframe#contentPlayer. A <main class="content-player-container"> overlay blocks Playwright
    // pointer clicks, so we use page.evaluate() to JS-click through the iframe chain directly.

    // Step 1: "Complete Course" button inside the inner SCORM iframe.
    const step1 = await page.evaluate((): string => {
      const ecmlIframe = (
        document.querySelector('iframe#contentPlayer') as HTMLIFrameElement |null
        ?? document.querySelector('iframe[name="contentPlayer"]') as HTMLIFrameElement | null
        ?? document.querySelector('iframe') as HTMLIFrameElement | null
      );
      if (!ecmlIframe?.contentDocument) return 'no-ecml-iframe';
      const scormIframe = ecmlIframe.contentDocument.querySelector('iframe') as HTMLIFrameElement | null;
      if (!scormIframe?.contentDocument) return 'no-scorm-iframe';
      const btn = Array.from(scormIframe.contentDocument.querySelectorAll('button'))
        .find((b) => /complete\s*course/i.test(b.textContent ?? '')) as HTMLElement | null;
      if (btn) { btn.click(); return 'clicked-complete-course'; }
      return 'no-complete-button';
    });
    console.log(`  HTML/SCORM step1: ${step1}`);

    if (step1 === 'clicked-complete-course') {
      await page.waitForTimeout(3000);
      if (await isEcmlComplete(page)) {
        console.log('  HTML/SCORM: completion screen after "Complete Course"');
      } else if (await completionBanner.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('  HTML/SCORM: completion banner after "Complete Course"');
      } else {
        console.log('  HTML/SCORM: no completion signal after "Complete Course" — may complete asynchronously');
      }
    } else {
      // Step 2: open the sidebar via openMenu() on the AngularJS scope.
      // Plain .click() on the gc-menu-btn does not flush Angular's digest cycle,
      // so the sidebar never visually opens. We must call scope.openMenu() via $apply.
      const step2 = await page.evaluate((): string => {
        const ecmlIframe = (
          document.querySelector('iframe#contentPlayer') as HTMLIFrameElement | null
          ?? document.querySelector('iframe[name="contentPlayer"]') as HTMLIFrameElement | null
          ?? document.querySelector('iframe') as HTMLIFrameElement | null
        );
        if (!ecmlIframe?.contentDocument) return 'no-ecml-iframe';
        const menuBtn = ecmlIframe.contentDocument.querySelector('.gc-menu-btn') as HTMLElement | null;
        if (!menuBtn) return 'no-sidebar-btn';
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ng = (ecmlIframe.contentWindow as any)?.angular;
          if (ng) {
            const scope = ng.element(menuBtn).scope();
            if (scope) { scope.$apply(() => scope.openMenu()); return 'opened-sidebar'; }
          }
        } catch { /* fall through to plain click */ }
        menuBtn.click();
        return 'opened-sidebar-click';
      });
      console.log(`  HTML/SCORM step2: ${step2}`);
      await page.waitForTimeout(500);

      // Step 3: click Replay via replayContent() on the AngularJS scope.
      // Same reason: ng-click=replayContent() needs $apply to run.
      const step3 = await page.evaluate((): string => {
        const ecmlIframe = (
          document.querySelector('iframe#contentPlayer') as HTMLIFrameElement | null
          ?? document.querySelector('iframe[name="contentPlayer"]') as HTMLIFrameElement | null
          ?? document.querySelector('iframe') as HTMLIFrameElement | null
        );
        if (!ecmlIframe?.contentDocument) return 'no-ecml-iframe';
        const replayEl = Array.from(
          ecmlIframe.contentDocument.querySelectorAll('[role="button"], button')
        ).find((el) => /^replay$/i.test((el as HTMLElement).textContent?.trim() ?? '')) as HTMLElement | null;
        if (!replayEl) return 'no-replay';
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ng = (ecmlIframe.contentWindow as any)?.angular;
          if (ng) {
            const scope = ng.element(replayEl).scope();
            if (scope) { scope.$apply(() => scope.replayContent()); return 'clicked-replay'; }
          }
        } catch { /* fall through to plain click */ }
        replayEl.click();
        return 'clicked-replay-click';
      });
      console.log(`  HTML/SCORM step3: ${step3}`);

      if (step3.startsWith('clicked-replay')) {
        await page.waitForTimeout(5000);
        if (await isEcmlComplete(page)) {
          console.log('  HTML/SCORM: completion screen after Replay');
        } else if (await completionBanner.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('  HTML/SCORM: completion banner after Replay');
        } else {
          console.log('  HTML/SCORM: no completion signal after Replay — may complete asynchronously');
        }
      } else {
        // Fallback: navigate to a completed lesson in the course sidebar.
        console.log('  HTML/SCORM: Replay not found — falling back to sidebar navigation');
        const currentContentId = page.url().split('/content/').pop()?.split(/[?#]/)[0] ?? '';
        const allSidebarLinks = page.locator(
          'aside a[href*="/content/"], [role="complementary"] a[href*="/content/"]'
        );
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
            console.log('  Fallback: clicked completed sidebar lesson');
          }
        }
        if (!completionTriggered) {
          console.log('  HTML/SCORM: no fallback link found — waiting 2s');
          await page.waitForTimeout(2000);
        }
      }
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
  } else {
    console.log(`  ${type} — clicking → until completion screen`);
    if (lowerType === 'ecml') await dismissEcmlUserSwitcher(page);
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
