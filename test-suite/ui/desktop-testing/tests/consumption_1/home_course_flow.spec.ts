import { test, expect, Page } from '@playwright/test';
import { HOME_URL, loginWithValidCredentials, closeAnyPopup, reportBug } from './helpers';

test.setTimeout(15 * 60 * 1000);

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Read the numeric course progress % from the progress bar label or text */
async function readProgress(page: Page): Promise<number | null> {
  try {
    // The progress bar region has an aria-label like "Course Progress" — read its text sibling
    const progressPanel = page.locator('h3:has-text("Course Progress"), h2:has-text("Course Progress")').first().locator('..');
    const txt = await progressPanel.textContent({ timeout: 3000 }).catch(() => '');
    const m = txt?.match(/(\d+)%/);
    if (m) return parseInt(m[1], 10);
  } catch (_) {}
  // fallback: any standalone "XX%" text on page
  try {
    const pct = page.locator('text=/^\\d+%$/').first();
    if (await pct.isVisible({ timeout: 1500 }).catch(() => false)) {
      const t = await pct.textContent().catch(() => '');
      const m2 = t?.match(/(\d+)/);
      if (m2) return parseInt(m2[1], 10);
    }
  } catch (_) {}
  return null;
}

/** Attach a screenshot + text to the test report and print to console */
async function bugReport(page: Page, id: string, message: string) {
  const ts = Date.now();
  const imgPath = `test-results/bug-${id}-${ts}.png`;
  try { await page.screenshot({ path: imgPath, fullPage: false }); } catch (_) {}
  try { await test.info().attach(`bug-${id}`, { path: imgPath, contentType: 'image/png' }); } catch (_) {}
  try { await test.info().attach(`bug-${id}-details`, { body: message, contentType: 'text/plain' }); } catch (_) {}
  console.log('🐞 BUG:', message);
}

/** Expand all Course Unit accordions in the TOC sidebar.
 *  Only clicks units that are currently COLLAPSED so we never accidentally
 *  close an already-open unit. Checks aria-expanded / data-state attributes. */
async function expandAllUnits(page: Page) {
  const unitBtns = page.locator('button:has-text("Course Unit")');
  const count = await unitBtns.count().catch(() => 0);
  console.log(`  Found ${count} Course Unit accordion(s)`);
  for (let i = 0; i < count; i++) {
    try {
      const btn = unitBtns.nth(i);

      // Check aria-expanded attribute — only click if collapsed (false / absent / "false")
      const ariaExpanded = await btn.getAttribute('aria-expanded').catch(() => null);
      // Check Radix / shadcn data-state — "open" means already expanded
      const dataState = await btn.getAttribute('data-state').catch(() => null);

      const isAlreadyOpen =
        ariaExpanded === 'true' ||
        dataState === 'open';

      if (isAlreadyOpen) continue; // already expanded — skip

      await btn.scrollIntoViewIfNeeded().catch(() => {});
      await btn.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(400);
    } catch (_) {}
  }
}

/**
 * Consume whatever content is currently loaded in the course player.
 *
 * The player shows a blue ">" (right arrow) button at the top of the content area.
 * Clicking it advances through pages/slides. We keep clicking until either:
 *   - The TOC shows "Completed" for the current lesson, OR
 *   - The page counter stops advancing (last page reached), OR
 *   - A video is detected → play it fully
 *
 * Returns true when lesson is consumed.
 */
async function consumeCurrentLesson(page: Page, lessonLabel: string): Promise<boolean> {
  await page.waitForTimeout(1000);
  await closeAnyPopup(page).catch(() => {});

  // ── Helper: feedback form in the player = lesson is complete ──────────────
  // After finishing a lesson the app shows a feedback/rating form inside the player.
  // Sunbird's exact wording is "We would love to hear from you".
  const isFeedbackFormVisible = async () => {
    return await page.locator(
      '[class*="feedback"], [class*="rating"], ' +
      'text=/we would love to hear from you/i, ' +
      'text=/how was your learning/i, ' +
      'text=/how was this|rate this|share your feedback|lesson feedback/i'
    ).first().isVisible({ timeout: 500 }).catch(() => false);
  };

  // ── Helper: "You just completed" banner = lesson is done in the player ────
  // Sunbird shows this congratulations screen right after a lesson finishes,
  // before or instead of the feedback form. It always means the lesson is done.
  const isYouJustCompletedVisible = async () => {
    return await page.locator(
      'text=/you just completed/i'
    ).first().isVisible({ timeout: 500 }).catch(() => false);
  };

  // ── Helper: dismiss the feedback form, then wait for TOC to confirm Completed ─
  // The app updates lesson status AFTER the feedback form is dismissed (async).
  // IMPORTANT: We capture a screenshot + read status/progress BEFORE dismissing,
  // so we can report a bug if the TOC shows "In Progress" while the form is open.
  //
  // lessonHref is the content URL of the lesson just finished (e.g.
  // /collection/.../content/do_xxx). Passing it lets us find the exact TOC
  // anchor and read its status badge reliably.
  const dismissFeedbackForm = async (lessonHref?: string) => {
    // ── 📸 Capture screenshot BEFORE dismissing ───────────────────────────
    console.log(`  [${lessonLabel}] 📸 Feedback form visible — capturing state before dismiss`);
    const feedbackShotPath = `test-results/feedback-form-${lessonLabel.replace(/\s+/g, '-')}-${Date.now()}.png`;
    await page.screenshot({ path: feedbackShotPath, fullPage: false }).catch(() => {});
    await test.info().attach(`feedback-form-${lessonLabel}`, { path: feedbackShotPath, contentType: 'image/png' }).catch(() => {});

    // ── Read the TOC status for this specific lesson ──────────────────────
    // Use the same 3-strategy approach as getLessonStatus (but inline, since
    // getLessonStatus is only available in the test closure).
    let statusWhileFeedback: string | null = null;
    if (lessonHref) {
      const rel = lessonHref.replace('https://test.sunbirded.org', '');
      const anchor = page.locator(`a[href="${lessonHref}"], a[href="${rel}"]`).first();
      if (await anchor.isVisible({ timeout: 1500 }).catch(() => false)) {
        // Strategy 1: last span inside the anchor (the status badge)
        statusWhileFeedback = await anchor.evaluate((el: Element): string => {
          const spans = Array.from(el.querySelectorAll('span, small, [class*="status"], [class*="badge"]'));
          const last = spans[spans.length - 1];
          return last?.textContent?.trim() ?? el.textContent?.trim() ?? '';
        }).catch(() => '');
        // Normalise
        if (/completed/i.test(statusWhileFeedback ?? '')) statusWhileFeedback = 'Completed';
        else if (/in\s*progress/i.test(statusWhileFeedback ?? '')) statusWhileFeedback = 'In progress';
        else if (/not\s*view/i.test(statusWhileFeedback ?? '')) statusWhileFeedback = 'Not viewed';
        else {
          // Strategy 2: all spans
          const allSpans = await anchor.evaluate((el: Element): string =>
            Array.from(el.querySelectorAll('span, small')).map(s => s.textContent?.trim() ?? '').join('|')
          ).catch(() => '');
          if (/completed/i.test(allSpans)) statusWhileFeedback = 'Completed';
          else if (/in\s*progress/i.test(allSpans)) statusWhileFeedback = 'In progress';
          else if (/not\s*view/i.test(allSpans)) statusWhileFeedback = 'Not viewed';
          else {
            // Strategy 3: full textContent
            const full = (await anchor.textContent().catch(() => ''))?.trim() ?? '';
            if (/completed/i.test(full)) statusWhileFeedback = 'Completed';
            else if (/in\s*progress/i.test(full)) statusWhileFeedback = 'In progress';
            else if (/not\s*view/i.test(full)) statusWhileFeedback = 'Not viewed';
            else statusWhileFeedback = full.substring(0, 60) || null;
          }
        }
      }
    }

    // ── Read the progress % ───────────────────────────────────────────────
    const progressWhileFeedback: number | null = await page.evaluate((): number | null => {
      // aria-valuenow on a progress bar
      const bar = document.querySelector('[aria-valuenow][role="progressbar"], [aria-valuenow][class*="progress"]');
      if (bar) return parseInt((bar as HTMLElement).getAttribute('aria-valuenow') ?? '', 10) || null;
      // text like "50%"
      const match = document.body.innerText.match(/\b(\d{1,3})%/);
      return match ? parseInt(match[1], 10) : null;
    }).catch(() => null);

    console.log(`  [${lessonLabel}] While feedback form open — status="${statusWhileFeedback ?? '(anchor not found)'}", progress=${progressWhileFeedback ?? 'unknown'}%`);

    // ── Report bugs if status or progress is stale ────────────────────────
    if (statusWhileFeedback !== null && statusWhileFeedback !== 'Completed') {
      const bugMsg =
        `BUG: [${lessonLabel}] Lesson status not updated to "Completed" even while the ` +
        `feedback form ("We would love to hear from you") is visible.\n` +
        `  The feedback form confirms the lesson has been fully consumed,\n` +
        `  but the TOC still shows: "${statusWhileFeedback}".\n` +
        `  Course Progress bar shows: ${progressWhileFeedback ?? 'unknown'}%.\n` +
        `  Screenshot attached ("feedback-form-${lessonLabel}") shows the feedback form + stale TOC status side-by-side.\n` +
        `  Lesson URL: ${lessonHref ?? '(unknown)'}`;
      console.log(`  🐛 ${bugMsg}`);
      await bugReport(page, `lesson-status-stale-while-feedback-${lessonLabel.replace(/\s+/g, '-')}`, bugMsg);
      expect.soft(statusWhileFeedback, bugMsg).toBe('Completed');
    }

    // ── Now dismiss the feedback form ──────────────────────────────────────
    const dismissSels = [
      'button:has-text("Skip")',
      'button:has-text("Close")',
      'button[aria-label="Close"]',
      '[class*="feedback"] button[aria-label*="close" i]',
      '[class*="feedback"] button[aria-label*="dismiss" i]',
      'button:has-text("Submit")',
      'button:has-text("Done")',
      '[class*="feedback"] button:last-of-type',
    ];
    for (const sel of dismissSels) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 600 }).catch(() => false)) {
          await el.click().catch(() => {});
          await page.waitForTimeout(500);
          console.log(`  [${lessonLabel}] Dismissed feedback form via "${sel}"`);
          break;
        }
      } catch (_) {}
    }
    // If no dismiss button matched, try the × close button or Escape
    const xBtn = page.locator('button:has-text("×"), button[aria-label="×"], [class*="close-btn"]').first();
    if (await xBtn.isVisible({ timeout: 600 }).catch(() => false)) {
      await xBtn.click().catch(() => {});
      await page.waitForTimeout(500);
      console.log(`  [${lessonLabel}] Dismissed feedback form via × button`);
    } else {
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(300);
    }

    // ── Wait for TOC to reflect "Completed" (app updates status async) ────
    // Poll for up to 6 s; the status update is triggered server-side after dismiss.
    const deadline = Date.now() + 6000;
    while (Date.now() < deadline) {
      if (await isLessonCompleted()) {
        console.log(`  [${lessonLabel}] ✅ TOC confirmed Completed after feedback dismiss`);
        return;
      }
      await page.waitForTimeout(800);
    }
    console.log(`  [${lessonLabel}] ⚠️  TOC did not show Completed within 6 s of feedback dismiss`);
  };

  // ── Helper: "You just completed" detected — screenshot + bug check ─────────
  // Called every time the "You just completed" banner is seen. Takes a screenshot
  // of the banner alongside the TOC, checks if the lesson status is still stale,
  // and files a bug report if it is. Pass the current page URL as lessonHref.
  const handleYouJustCompleted = async (lessonHref?: string) => {
    console.log(`  [${lessonLabel}] 📸 "You just completed" banner visible — capturing state`);
    const shotPath = `test-results/you-just-completed-${lessonLabel.replace(/\s+/g, '-')}-${Date.now()}.png`;
    await page.screenshot({ path: shotPath, fullPage: false }).catch(() => {});
    await test.info().attach(`you-just-completed-${lessonLabel}`, { path: shotPath, contentType: 'image/png' }).catch(() => {});

    // Read the TOC status for this specific lesson right now
    let statusNow: string | null = null;
    if (lessonHref) {
      const rel = lessonHref.replace('https://test.sunbirded.org', '');
      const anchor = page.locator(`a[href="${lessonHref}"], a[href="${rel}"]`).first();
      if (await anchor.isVisible({ timeout: 1500 }).catch(() => false)) {
        // Strategy 1: last span (the status badge)
        statusNow = await anchor.evaluate((el: Element): string => {
          const spans = Array.from(el.querySelectorAll('span, small, [class*="status"], [class*="badge"]'));
          const last = spans[spans.length - 1];
          return last?.textContent?.trim() ?? el.textContent?.trim() ?? '';
        }).catch(() => '');
        if (/completed/i.test(statusNow ?? '')) statusNow = 'Completed';
        else if (/in\s*progress/i.test(statusNow ?? '')) statusNow = 'In progress';
        else if (/not\s*view/i.test(statusNow ?? '')) statusNow = 'Not viewed';
        else {
          // Strategy 2: all spans
          const allSpans = await anchor.evaluate((el: Element): string =>
            Array.from(el.querySelectorAll('span, small')).map(s => s.textContent?.trim() ?? '').join('|')
          ).catch(() => '');
          if (/completed/i.test(allSpans)) statusNow = 'Completed';
          else if (/in\s*progress/i.test(allSpans)) statusNow = 'In progress';
          else if (/not\s*view/i.test(allSpans)) statusNow = 'Not viewed';
          else {
            // Strategy 3: full textContent
            const full = (await anchor.textContent().catch(() => ''))?.trim() ?? '';
            if (/completed/i.test(full)) statusNow = 'Completed';
            else if (/in\s*progress/i.test(full)) statusNow = 'In progress';
            else if (/not\s*view/i.test(full)) statusNow = 'Not viewed';
            else statusNow = full.substring(0, 60) || null;
          }
        }
      }
    }

    // Read the progress %
    const progressNow: number | null = await page.evaluate((): number | null => {
      const bar = document.querySelector('[aria-valuenow][role="progressbar"], [aria-valuenow][class*="progress"]');
      if (bar) return parseInt((bar as HTMLElement).getAttribute('aria-valuenow') ?? '', 10) || null;
      const match = document.body.innerText.match(/\b(\d{1,3})%/);
      return match ? parseInt(match[1], 10) : null;
    }).catch(() => null);

    console.log(`  [${lessonLabel}] While "You just completed" visible — status="${statusNow ?? '(anchor not found)'}", progress=${progressNow ?? 'unknown'}%`);

    // Report lesson status bug
    if (statusNow !== null && statusNow !== 'Completed') {
      const bugMsg =
        `BUG: [${lessonLabel}] Lesson status not updated to "Completed" even while the ` +
        `"You just completed" banner is visible.\n` +
        `  The "You just completed" banner confirms the lesson has been fully consumed,\n` +
        `  but the TOC still shows: "${statusNow}".\n` +
        `  Course Progress bar shows: ${progressNow ?? 'unknown'}%.\n` +
        `  Screenshot attached ("you-just-completed-${lessonLabel}") shows the banner + stale TOC side-by-side.\n` +
        `  Lesson URL: ${lessonHref ?? '(unknown)'}`;
      console.log(`  🐛 ${bugMsg}`);
      await bugReport(page, `lesson-status-stale-you-just-completed-${lessonLabel.replace(/\s+/g, '-')}`, bugMsg);
      expect.soft(statusNow, bugMsg).toBe('Completed');
    }
  };
  const isLessonCompleted = async () => {
    return await page.locator(
      '[class*="active"] span:has-text("Completed"), ' +
      'a[class*="active"]:has-text("Completed"), ' +
      'a[aria-current] span:has-text("Completed")'
    ).first().isVisible({ timeout: 500 }).catch(() => false);
  };

  if (await isLessonCompleted()) {
    console.log(`  [${lessonLabel}] Already Completed — skipping`);
    return true;
  }

  // If "You just completed" banner is visible — lesson is done
  if (await isYouJustCompletedVisible()) {
    console.log(`  [${lessonLabel}] "You just completed" banner visible on entry — lesson done`);
    await handleYouJustCompleted(page.url());
    return true;
  }

  // If feedback form already showing — lesson was already done
  if (await isFeedbackFormVisible()) {
    console.log(`  [${lessonLabel}] Feedback form visible on entry — lesson already completed`);
    await dismissFeedbackForm(page.url());
    return true;
  }

  // ── 1. Detect video content (YouTube / native video) ──────────────────────
  // Wait up to 5s for the content iframe to load — WEBM players load slowly.
  await page.waitForTimeout(2000);

  for (const f of [page as any, ...page.frames()]) {
    try {
      const vid = f.locator('video').first();
      if (await vid.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`  [${lessonLabel}] Video content detected`);

        const playerIframe = page.locator('iframe#contentPlayer, iframe[name="contentPlayer"], iframe[class*="content-player"]').first();
        const pBox = await playerIframe.boundingBox().catch(() => null);

        // ── Click center to start playback ──
        if (pBox) {
          await page.mouse.click(
            Math.round(pBox.x + pBox.width / 2),
            Math.round(pBox.y + pBox.height / 2)
          ).catch(() => {});
          await page.waitForTimeout(800);
        }
        await page.keyboard.press('k').catch(() => {});
        await page.waitForTimeout(500);

        // ── Set playback speed to 2x ──────────────────────────────────────
        // Try YouTube settings icon first (inside the YT embed iframe)
        let speedSet = false;

        // Find the YouTube embed frame (deepest frame with youtube.com/embed URL)
        const ytFrame = page.frames().find(fr => fr.url().includes('youtube.com/embed'));
        if (ytFrame) {
          try {
            console.log(`  [${lessonLabel}] YouTube iframe found — setting 2x speed via settings`);

            // Click the settings (gear) icon in the YT player
            const settingsBtn = ytFrame.locator('.ytp-settings-button, button[aria-label*="Settings" i]').first();
            await settingsBtn.click({ timeout: 3000 });
            await ytFrame.waitForTimeout(500);

            // Click "Playback speed" menu item
            const speedMenu = ytFrame.locator('.ytp-menuitem:has-text("Playback speed"), .ytp-panel-menu :text("Playback speed")').first();
            await speedMenu.click({ timeout: 3000 });
            await ytFrame.waitForTimeout(400);

            // Click "2" (2x speed)
            const speed2x = ytFrame.locator('.ytp-menuitem:has-text("2"), .ytp-panel-menu :text-is("2")').first();
            await speed2x.click({ timeout: 3000 });
            await ytFrame.waitForTimeout(300);

            console.log(`  [${lessonLabel}] ✅ YouTube playback speed set to 2x`);
            speedSet = true;
          } catch (e) {
            console.log(`  [${lessonLabel}] Could not set YT speed via settings menu: ${e}`);
          }
        }

        if (!speedSet) {
          // Native video or fallback — set playbackRate = 2 via JS on all frames
          for (const fr of [page as any, ...page.frames()]) {
            try {
              await fr.evaluate(() => {
                document.querySelectorAll('video').forEach((v: HTMLVideoElement) => {
                  v.playbackRate = 2;
                });
              });
              console.log(`  [${lessonLabel}] ✅ Native video playbackRate set to 2x`);
              speedSet = true;
            } catch (_) {}
          }
        }

        // ── Poll for completion (feedback form OR TOC status) ─────────────
        const videoDeadline = Date.now() + 10 * 60 * 1000;
        let lastPageText = '';
        let lastPageTextChangedAt = Date.now();
        const STUCK_TIMEOUT_MS = 60_000; // 1 minute with no DOM change = stuck

        while (Date.now() < videoDeadline) {
          // Re-apply 2x speed every poll in case the player resets it
          for (const fr of [page as any, ...page.frames()]) {
            try {
              await fr.evaluate(() => {
                document.querySelectorAll('video').forEach((v: HTMLVideoElement) => {
                  if (v.playbackRate !== 2) v.playbackRate = 2;
                });
              });
            } catch (_) {}
          }

          if (await isFeedbackFormVisible()) {
            console.log(`  [${lessonLabel}] ✅ Feedback form appeared — video lesson done`);
            await dismissFeedbackForm(page.url());
            return true;
          }
          if (await isYouJustCompletedVisible()) {
            console.log(`  [${lessonLabel}] ✅ "You just completed" banner — video lesson done`);
            await handleYouJustCompleted(page.url());
            return true;
          }
          if (await isLessonCompleted()) {
            console.log(`  [${lessonLabel}] ✅ Video lesson Completed (TOC)`);
            return true;
          }

          // ── Stuck detection: if page text hasn't changed in 60s → report & bail ──
          const currentPageText = await page.evaluate(() =>
            document.body.innerText.substring(0, 500)
          ).catch(() => '');
          if (currentPageText !== lastPageText) {
            lastPageText = currentPageText;
            lastPageTextChangedAt = Date.now();
          } else if (Date.now() - lastPageTextChangedAt > STUCK_TIMEOUT_MS) {
            console.log(`  [${lessonLabel}] ⚠️  Page unchanged for 60s — lesson appears stuck`);
            const stuckShotPath = `test-results/stuck-${lessonLabel.replace(/\s+/g, '-')}-${Date.now()}.png`;
            await page.screenshot({ path: stuckShotPath, fullPage: false }).catch(() => {});
            await test.info().attach(`stuck-${lessonLabel}`, { path: stuckShotPath, contentType: 'image/png' }).catch(() => {});
            await bugReport(page, `lesson-stuck-${lessonLabel.replace(/\s+/g, '-')}`,
              `BUG: [${lessonLabel}] Lesson player was stuck on the same screen for over 60 seconds.\n` +
              `  The video may have completed but the app did not show the "You just completed" banner\n` +
              `  or update the TOC status to "Completed".\n` +
              `  Screenshot attached shows the stuck state.\n` +
              `  Lesson URL: ${page.url()}`
            );
            return true; // move on to next lesson
          }

          await page.waitForTimeout(3000);
        }
        return true;
      }
    } catch (_) {}
  }

  // ── 2. Non-video — click the blue ">" right-arrow to advance pages/slides ──
  console.log(`  [${lessonLabel}] Non-video content — clicking blue right-arrow to advance pages`);

  const blueArrowSels = [
    'button.navigate-next',
    'button[aria-label*="Next" i]',
    'button[aria-label*="next page" i]',
    'button[aria-label*="forward" i]',
    'button:has(svg[class*="right"]):not([aria-label*="left" i])',
    '.content-player-container button:last-of-type',
    '[class*="player"] button:last-of-type',
  ];

  // Read page counter — handles "1 / 104", "Page 1 of 104", numeric input
  const getPageInfo = async (): Promise<{ current: number; total: number } | null> => {
    try {
      const counterEl = page.locator('input[type="number"], [class*="page-number"] input').first();
      if (await counterEl.isVisible({ timeout: 500 }).catch(() => false)) {
        const cur = parseInt((await counterEl.inputValue().catch(() => '0')), 10) || 0;
        const totTxt = (await page.locator('text=/\\/\\s*\\d+/, text=/of\\s+\\d+/i').first().textContent().catch(() => '') ) ?? '';
        const totMatch = totTxt.match(/(\d+)$/);
        const total = totMatch ? parseInt(totMatch[1], 10) : cur || 1;
        return { current: cur, total };
      }
      // Fallback: look for inline "N / M" text
      const fracTxt = await page.locator('text=/\\d+\\s*\\/\\s*\\d+/').first().textContent().catch(() => '');
      if (fracTxt) {
        const m = fracTxt.match(/(\d+)\s*\/\s*(\d+)/);
        if (m) return { current: parseInt(m[1], 10), total: parseInt(m[2], 10) };
      }
    } catch (_) {}
    return null;
  };

  // Find the blue ">" button once
  let arrowBtn: ReturnType<typeof page.locator> | null = null;
  for (const sel of blueArrowSels) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
        arrowBtn = el;
        console.log(`  [${lessonLabel}] Found right-arrow: "${sel}"`);
        break;
      }
    } catch (_) {}
  }

  const clickArrow = async () => {
    if (arrowBtn) {
      await arrowBtn.scrollIntoViewIfNeeded().catch(() => {});
      await arrowBtn.click({ timeout: 2000 }).catch(() => {});
    } else {
      // Hover to reveal hidden arrow buttons
      const pBox = await page.locator('iframe#contentPlayer, iframe[name="contentPlayer"], iframe[class*="content-player"]').first().boundingBox().catch(() => null);
      if (pBox) {
        await page.mouse.move(Math.round(pBox.x + pBox.width - 20), Math.round(pBox.y + 30));
        await page.waitForTimeout(300);
        for (const sel of blueArrowSels) {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 800 }).catch(() => false)) {
            await el.click().catch(() => {});
            arrowBtn = el;
            break;
          }
        }
      }
    }
  };

  // Check if pagination is available so we know the exact total
  const pi = await getPageInfo();
  if (pi) console.log(`  [${lessonLabel}] Detected pagination: ${pi.current} / ${pi.total}`);

  if (pi && pi.total > 1) {
    // ── Known total: iterate until current page reaches total ──────────────
    const target = pi.total;
    const maxAttempts = Math.min(200, Math.max(50, target * 2));
    let attempts = 0;
    let lastArrowText = '';
    let lastArrowTextChangedAt = Date.now();
    while (attempts < maxAttempts) {
      attempts++;
      if (await isFeedbackFormVisible()) {
        console.log(`  [${lessonLabel}] ✅ Feedback form — lesson done`);
        await dismissFeedbackForm(page.url());
        return true;
      }
      if (await isYouJustCompletedVisible()) { await handleYouJustCompleted(page.url()); return true; }
      if (await isLessonCompleted()) {
        console.log(`  [${lessonLabel}] ✅ Completed (TOC)`);
        return true;
      }
      const cur = await getPageInfo();
      if (cur) {
        console.log(`  [${lessonLabel}] Page ${cur.current} / ${cur.total}`);
        if (cur.current >= cur.total) {
          await page.waitForTimeout(1500);
          if (await isFeedbackFormVisible()) { await dismissFeedbackForm(page.url()); return true; }
          if (await isYouJustCompletedVisible()) { await handleYouJustCompleted(page.url()); return true; }
          if (await isLessonCompleted()) return true;
        }
      }
      // Stuck detection: page text unchanged for 60s
      const curText = await page.evaluate(() => document.body.innerText.substring(0, 500)).catch(() => '');
      if (curText !== lastArrowText) { lastArrowText = curText; lastArrowTextChangedAt = Date.now(); }
      else if (Date.now() - lastArrowTextChangedAt > 60_000) {
        console.log(`  [${lessonLabel}] ⚠️  Page unchanged for 60s in arrow loop — stuck`);
        const stuckShotPath = `test-results/stuck-${lessonLabel.replace(/\s+/g, '-')}-${Date.now()}.png`;
        await page.screenshot({ path: stuckShotPath, fullPage: false }).catch(() => {});
        await test.info().attach(`stuck-${lessonLabel}`, { path: stuckShotPath, contentType: 'image/png' }).catch(() => {});
        await bugReport(page, `lesson-stuck-${lessonLabel.replace(/\s+/g, '-')}`,
          `BUG: [${lessonLabel}] Lesson player was stuck on the same screen for over 60 seconds.\n` +
          `  The content may have completed but the app did not update the TOC status.\n` +
          `  Screenshot attached shows the stuck state.\n` +
          `  Lesson URL: ${page.url()}`
        );
        return true;
      }
      await clickArrow();
      await page.waitForTimeout(700);
    }
  } else {
    // ── Unknown total: keep clicking until Completed or cap ────────────────
    const maxClicks = 50;
    let clicks = 0;
    let lastUnknownText = '';
    let lastUnknownTextChangedAt = Date.now();
    while (clicks < maxClicks) {
      clicks++;
      if (await isFeedbackFormVisible()) {
        console.log(`  [${lessonLabel}] ✅ Feedback form — lesson done`);
        await dismissFeedbackForm(page.url());
        return true;
      }
      if (await isYouJustCompletedVisible()) {
        console.log(`  [${lessonLabel}] ✅ "You just completed" banner — lesson done`);
        await handleYouJustCompleted(page.url());
        return true;
      }
      if (await isLessonCompleted()) {
        console.log(`  [${lessonLabel}] ✅ Completed (TOC)`);
        return true;
      }
      const cur = await getPageInfo();
      if (cur) {
        console.log(`  [${lessonLabel}] Page ${cur.current} / ${cur.total}`);
        if (cur.current >= cur.total) {
          await page.waitForTimeout(1500);
          if (await isFeedbackFormVisible()) { await dismissFeedbackForm(page.url()); return true; }
          if (await isYouJustCompletedVisible()) { await handleYouJustCompleted(page.url()); return true; }
          if (await isLessonCompleted()) return true;
        }
      }
      // Stuck detection: page text unchanged for 60s
      const curText = await page.evaluate(() => document.body.innerText.substring(0, 500)).catch(() => '');
      if (curText !== lastUnknownText) { lastUnknownText = curText; lastUnknownTextChangedAt = Date.now(); }
      else if (Date.now() - lastUnknownTextChangedAt > 60_000) {
        console.log(`  [${lessonLabel}] ⚠️  Page unchanged for 60s in arrow loop — stuck`);
        const stuckShotPath = `test-results/stuck-${lessonLabel.replace(/\s+/g, '-')}-${Date.now()}.png`;
        await page.screenshot({ path: stuckShotPath, fullPage: false }).catch(() => {});
        await test.info().attach(`stuck-${lessonLabel}`, { path: stuckShotPath, contentType: 'image/png' }).catch(() => {});
        await bugReport(page, `lesson-stuck-${lessonLabel.replace(/\s+/g, '-')}`,
          `BUG: [${lessonLabel}] Lesson player was stuck on the same screen for over 60 seconds.\n` +
          `  The content may have completed but the app did not update the TOC status.\n` +
          `  Screenshot attached shows the stuck state.\n` +
          `  Lesson URL: ${page.url()}`
        );
        return true;
      }
      await clickArrow();
      await page.waitForTimeout(500);
    }
    // Reached the cap — screenshot the current state and report as a stale-status bug
    console.log(`  [${lessonLabel}] ⚠️  Reached ${maxClicks}-click cap without detecting completion`);
    const capShotPath = `test-results/arrow-cap-${lessonLabel.replace(/\s+/g, '-')}-${Date.now()}.png`;
    await page.screenshot({ path: capShotPath, fullPage: false }).catch(() => {});
    await test.info().attach(`arrow-cap-${lessonLabel}`, { path: capShotPath, contentType: 'image/png' }).catch(() => {});
    await bugReport(page, `lesson-no-completion-signal-${lessonLabel.replace(/\s+/g, '-')}`,
      `BUG: [${lessonLabel}] Lesson did not show a completion signal (feedback form / "You just completed" / TOC "Completed") ` +
      `after ${maxClicks} arrow clicks. This likely means the lesson content completed but the app did not update the status.`
    );
  }

  // ── Final: check for red alert errors ────────────────────────────────────
  for (const sel of ['[role="alert"]:not(:has-text("Completed"))', '.alert-danger', '.sb-alert-error']) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 400 }).catch(() => false)) {
        const txt = (await el.textContent().catch(() => sel))?.trim();
        await bugReport(page, `lesson-error-${lessonLabel.replace(/\s+/g, '-').substring(0, 30)}`, `Red alert while consuming "${lessonLabel}": ${txt}`);
        return false;
      }
    } catch (_) {}
  }

  return await isLessonCompleted() || !(await isFeedbackFormVisible());
}

// ─── test ─────────────────────────────────────────────────────────────────────

test.describe('Home course flow', () => {
  test('Click Continue → consume all lessons → verify 100% completion', async ({ page }) => {
    await loginWithValidCredentials(page);

    // Make sure we are on /home (not /explore or anywhere else)
    if (!page.url().includes('/home')) {
      await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
    }
    await page.waitForTimeout(1500);

    // ── Step 1: Click the "Continue from where you left →" button ──────────
    // From the UI the button text is exactly "Continue from where you left"
    // (with a trailing arrow icon). It lives inside a course card on /home.
    // Try the most specific selectors first, then fall back progressively.
    const continueBtnSels = [
      // Exact button text (as seen in screenshot)
      'button:has-text("Continue from where you left")',
      'a:has-text("Continue from where you left")',
      // Partial match in case the arrow icon text is included
      'button:text-matches("Continue from where you left", "i")',
      'a:text-matches("Continue from where you left", "i")',
    ];

    let continueClicked = false;
    for (const sel of continueBtnSels) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
          await el.scrollIntoViewIfNeeded().catch(() => {});
          await el.click();
          continueClicked = true;
          console.log(`✅ Clicked continue button using: "${sel}"`);
          break;
        }
      } catch (_) {}
    }

    if (!continueClicked) {
      await bugReport(page, 'continue-missing', '"Continue from where you left" button not found on the Home page');
      throw new Error('Continue button not found on Home page');
    }

    // Wait for navigation INTO a course page (URL should change away from the bare /home page)
    await page.waitForTimeout(1500);

    const landedUrl = page.url();
    // A valid course URL will contain /learn/ or /course/ or /toc/ or /enroll
    // The bare home page is exactly https://test.sunbirded.org/home (or ends with /home)
    const isBareHome = /\/(home)\s*$/.test(landedUrl.replace(/\?.*$/, '').replace(/#.*$/, ''));
    const isBareExplore = /\/(explore)\s*$/.test(landedUrl.replace(/\?.*$/, '').replace(/#.*$/, ''));

    if (isBareHome || isBareExplore) {
      await bugReport(page, 'continue-wrong-nav', `Clicking Continue did not navigate away from "${landedUrl}" — still on home/explore instead of a course page`);
      throw new Error(`Continue did not navigate to a course page, still on: ${landedUrl}`);
    }

    await closeAnyPopup(page).catch(() => {});
    const coursePageUrl = page.url();
    console.log('Entered course page:', coursePageUrl);

    // ── Step 2: Check progress — must NOT be 100% ───────────────────────────
    const initialProgress = await readProgress(page);
    console.log('Initial course progress:', initialProgress);

    if (initialProgress !== null && initialProgress >= 100) {
      await bugReport(
        page,
        'continue-opened-100pct',
        `BUG: "Continue from where you left" opened a course that is already ${initialProgress}% complete. Completed courses should not appear in Continue.`
      );
      throw new Error(`BUG: Continue opened a ${initialProgress}% completed course`);
    }

    // ── Step 3 + 4 + 5: Build lesson list from TOC, consume every lesson in order ──
    //
    // Strategy:
    //   a) The "Continue" button lands directly inside a content page URL that already
    //      has a lesson loaded in the player (e.g. /collection/.../content/do_xxx).
    //      Consume THAT lesson first before touching the TOC.
    //   b) Expand all Course Units (aria-safe — only opens collapsed ones).
    //   c) Collect the href of every leaf lesson link from the TOC once, in DOM order.
    //   d) Iterate by index: skip Already-Completed lessons, consume "In progress" and
    //      "Not viewed" ones in order, verify TOC flips to Completed, and check that
    //      the Course Progress % increases — report a bug if it does not.

    await expandAllUnits(page);
    await page.waitForTimeout(600);

    // ── Helper: collect all leaf lesson hrefs from TOC ──────────────────────
    const TOC_LESSON_SELS = [
      'nav a[href*="/content/"]',
      '[class*="toc"] a[href*="/content/"]',
      '[class*="sidebar"] a[href*="/content/"]',
      'a[href*="/content/"]',
    ];

    const collectLessonHrefs = async (): Promise<string[]> => {
      const currentUrl = page.url();
      for (const sel of TOC_LESSON_SELS) {
        try {
          const anchors = page.locator(sel);
          const n = await anchors.count().catch(() => 0);
          if (n === 0) continue;
          const hrefs: string[] = [];
          for (let i = 0; i < n; i++) {
            const href = await anchors.nth(i).getAttribute('href').catch(() => null);
            if (!href) continue;
            const full = href.startsWith('http') ? href : `https://test.sunbirded.org${href}`;
            if (full === currentUrl) continue; // exclude course page itself
            if (hrefs.includes(full)) continue;
            hrefs.push(full);
          }
          if (hrefs.length > 0) {
            console.log(`  TOC via "${sel}" → ${hrefs.length} lesson(s)`);
            return hrefs;
          }
        } catch (_) {}
      }
      // Last resort: DOM eval for /content/do_ links
      const fromDOM = await page.evaluate((base: string) => {
        const seen = new Set<string>();
        const out: string[] = [];
        document.querySelectorAll('a[href]').forEach((a) => {
          const href = (a as HTMLAnchorElement).href;
          if (/\/content\/do_/.test(href) && href !== base && !seen.has(href)) {
            seen.add(href);
            out.push(href);
          }
        });
        return out;
      }, currentUrl).catch(() => [] as string[]);
      console.log(`  TOC via DOM eval → ${fromDOM.length} lesson(s)`);
      return fromDOM;
    };

    // ── Helper: open a lesson by its saved href ────────────────────────────
    const openLesson = async (href: string, label: string): Promise<void> => {
      const rel = href.replace('https://test.sunbirded.org', '');
      const anchor = page.locator(`a[href="${href}"], a[href="${rel}"]`).first();
      if (await anchor.isVisible({ timeout: 2000 }).catch(() => false)) {
        await anchor.scrollIntoViewIfNeeded().catch(() => {});
        await anchor.click({ timeout: 5000 }).catch(async () => {
          const h = await anchor.elementHandle().catch(() => null);
          if (h) await page.evaluate((el: Element) => (el as HTMLElement).click(), h).catch(() => {});
        });
        await page.waitForTimeout(1500);
      } else {
        // anchor not visible (unit might be collapsed) — expand all then retry
        await expandAllUnits(page);
        await page.waitForTimeout(400);
        const anchor2 = page.locator(`a[href="${href}"], a[href="${rel}"]`).first();
        if (await anchor2.isVisible({ timeout: 2000 }).catch(() => false)) {
          await anchor2.scrollIntoViewIfNeeded().catch(() => {});
          await anchor2.click({ timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(1500);
        } else {
          // Final fallback: navigate directly
          console.log(`  [${label}] TOC anchor not visible — navigating directly to ${href}`);
          await page.goto(href, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(1500);
        }
      }
    };

    // ── Helper: check if a lesson href shows Completed in the TOC ─────────
    const isHrefCompleted = async (href: string): Promise<boolean> => {
      const rel = href.replace('https://test.sunbirded.org', '');
      const anchor = page.locator(`a[href="${href}"], a[href="${rel}"]`).first();
      if (!await anchor.isVisible({ timeout: 1500 }).catch(() => false)) return false;
      const txt = (await anchor.textContent().catch(() => ''))?.trim() ?? '';
      return /completed/i.test(txt);
    };

    // ── Helper: read the status label of a lesson from the TOC ────────────
    // Reads only the status-badge element inside the anchor (not the full
    // textContent which includes the lesson title and can cause false matches).
    // Returns "Completed", "In progress", "Not viewed", or null.
    const getLessonStatus = async (href: string): Promise<string | null> => {
      const rel = href.replace('https://test.sunbirded.org', '');

      // Try to find the anchor first
      const anchor = page.locator(`a[href="${href}"], a[href="${rel}"]`).first();
      const visible = await anchor.isVisible({ timeout: 2000 }).catch(() => false);
      if (!visible) return null;

      // Strategy 1: read ONLY the status-badge span (last span / small / [class*="status"])
      // This avoids false "Completed" matches from lesson titles that contain the word.
      const badgeOnly = await anchor.evaluate((el: Element): string => {
        // Sunbird renders the status as the last <span> inside the TOC anchor
        const spans = Array.from(el.querySelectorAll('span, small, [class*="status"], [class*="badge"]'));
        if (spans.length === 0) return el.textContent?.trim() ?? '';
        // Return ONLY the last child span text (the status badge)
        const last = spans[spans.length - 1];
        return last.textContent?.trim() ?? '';
      }).catch(() => '');

      if (/completed/i.test(badgeOnly)) return 'Completed';
      if (/in\s*progress/i.test(badgeOnly)) return 'In progress';
      if (/not\s*view/i.test(badgeOnly)) return 'Not viewed';

      // Strategy 2: scan ALL spans inside the anchor for a status keyword
      const allSpanText = await anchor.evaluate((el: Element): string => {
        return Array.from(el.querySelectorAll('span, small'))
          .map(s => s.textContent?.trim() ?? '')
          .join('|');
      }).catch(() => '');

      if (/completed/i.test(allSpanText)) return 'Completed';
      if (/in\s*progress/i.test(allSpanText)) return 'In progress';
      if (/not\s*view/i.test(allSpanText)) return 'Not viewed';

      // Strategy 3: full anchor textContent as last resort
      const full = (await anchor.textContent().catch(() => ''))?.trim() ?? '';
      if (/completed/i.test(full)) return 'Completed';
      if (/in\s*progress/i.test(full)) return 'In progress';
      if (/not\s*view/i.test(full)) return 'Not viewed';

      return full.substring(0, 60) || null;
    };

    // ── Helper: consume + verify one lesson, with progress-delta check ─────
    const consumeAndVerify = async (href: string, label: string): Promise<void> => {
      const progressBefore = await readProgress(page);
      console.log(`  Progress before: ${progressBefore ?? 'unknown'}%`);

      // consumeCurrentLesson handles the feedback form internally — it captures
      // a screenshot and reports the stale-status bug BEFORE dismissing the form.
      await consumeCurrentLesson(page, label);

      await page.waitForTimeout(1000);

      // Re-expand so TOC status badges are visible for post-dismiss polling
      await expandAllUnits(page);
      await page.waitForTimeout(600);

      // ── Check 1: TOC status must flip to "Completed" ──────────────────────
      // Poll for up to 10 s — the app updates status asynchronously after the
      // feedback form is dismissed (server round-trip).
      let statusAfter: string | null = null;
      const statusDeadline = Date.now() + 10000;
      while (Date.now() < statusDeadline) {
        statusAfter = await getLessonStatus(href);
        console.log(`  [poll] status = "${statusAfter}"`);
        if (statusAfter === 'Completed') break;
        await page.waitForTimeout(1500);
        await expandAllUnits(page).catch(() => {});
      }

      console.log(`  Status after: "${statusAfter}" for ${href}`);

      if (statusAfter !== 'Completed') {
        // Capture the raw anchor HTML to diagnose what the DOM actually shows
        const rel = href.replace('https://test.sunbirded.org', '');
        const anchor = page.locator(`a[href="${href}"], a[href="${rel}"]`).first();
        const rawTxt = (await anchor.textContent().catch(() => ''))?.trim() ?? '(anchor not found in TOC)';
        const rawHtml = await anchor.evaluate((el: Element) => el.outerHTML).catch(() => '(unavailable)');
        console.log(`  Raw anchor HTML: ${rawHtml.substring(0, 300)}`);

        // Capture a final screenshot showing the stale TOC state
        const staleShotPath = `test-results/status-not-updated-${label.replace(/\s+/g, '-')}-${Date.now()}.png`;
        await page.screenshot({ path: staleShotPath, fullPage: false }).catch(() => {});
        await test.info().attach(`status-not-updated-${label}`, { path: staleShotPath, contentType: 'image/png' }).catch(() => {});

        const bugMsg =
          `BUG: [${label}] Lesson status did NOT update to "Completed" after the lesson was finished.\n` +
          `  Feedback form ("We would love to hear from you") confirmed lesson end,\n` +
          `  TOC anchor still shows: "${rawTxt.substring(0, 120)}"\n` +
          `  Expected: "Completed"   Got: "${statusAfter}"\n` +
          `  Lesson URL: ${href}`;

        await bugReport(page, `lesson-status-not-updated-${label.replace(/\s+/g, '-')}`, bugMsg);
        expect.soft(statusAfter, bugMsg).toBe('Completed');
      } else {
        console.log(`  ✅ [${label}] TOC shows Completed ✓`);
      }

      // ── Check 2: Course Progress % must increase ──────────────────────────
      const progressAfter = await readProgress(page);
      console.log(`  Progress after: ${progressAfter ?? 'unknown'}%`);

      if (progressBefore !== null && progressAfter !== null) {
        if (progressAfter <= progressBefore) {
          // Capture screenshot showing unchanged progress bar
          const progShotPath = `test-results/progress-no-increase-${label.replace(/\s+/g, '-')}-${Date.now()}.png`;
          await page.screenshot({ path: progShotPath, fullPage: false }).catch(() => {});
          await test.info().attach(`progress-no-increase-${label}`, { path: progShotPath, contentType: 'image/png' }).catch(() => {});

          const progMsg =
            `BUG: [${label}] Course Progress bar did not increase after completing this lesson.\n` +
            `  Feedback form ("We would love to hear from you") confirmed lesson end,\n` +
            `  Before: ${progressBefore}%  →  After: ${progressAfter}%  (no change)\n` +
            `  Lesson URL: ${href}`;
          await bugReport(page, `progress-no-increase-${label.replace(/\s+/g, '-')}`, progMsg);
          expect.soft(progressAfter, progMsg).toBeGreaterThan(progressBefore);
        } else {
          console.log(`  ✅ Progress updated: ${progressBefore}% → ${progressAfter}%`);
        }
      } else if (progressAfter === null) {
        const progMsg = `BUG: [${label}] Course Progress bar is not readable after completing the lesson`;
        await bugReport(page, `progress-unreadable-${label.replace(/\s+/g, '-')}`, progMsg);
        expect.soft(progressAfter, progMsg).not.toBeNull();
      }
    };

    // ── FIRST: consume the lesson that is already loaded in the player ─────
    // When "Continue" is clicked the URL is already on a content page like:
    //   /collection/<courseId>/batch/<batchId>/content/<lessonId>
    // That lesson is already rendered in the player — play it right now.
    const activeContentUrl = page.url();
    const activeContentMatch = activeContentUrl.match(/\/content\/(do_[^/?#]+)/);

    if (activeContentMatch) {
      console.log(`\n▶ Playing active player lesson: ${activeContentUrl}`);
      await closeAnyPopup(page).catch(() => {});
      await consumeAndVerify(activeContentUrl, 'active-player');
    } else {
      console.log('ℹ️  No content lesson detected in URL — will consume first lesson from TOC');
    }

    // ── THEN: consume remaining lessons — navigate back after each one ───────
    // After consumeCurrentLesson the player may have navigated away from the
    // course TOC page. We always return to coursePageUrl, expand the TOC and
    // find the NEXT lesson that is "Not viewed" or "In progress" before opening
    // it, so we never try to click a TOC anchor that is no longer on the page.
    let lessonIteration = 0;
    const MAX_LESSONS = 100; // safety cap

    while (lessonIteration < MAX_LESSONS) {
      // Go back to the course TOC page so the TOC is visible
      await page.goto(coursePageUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      await expandAllUnits(page);
      await page.waitForTimeout(500);

      // Re-collect lesson hrefs from the freshly loaded TOC
      const hrefs = await collectLessonHrefs();
      if (hrefs.length === 0) {
        console.log('⚠️  No lesson hrefs found in TOC — stopping');
        break;
      }

      if (lessonIteration === 0) {
        console.log(`\nLesson list from TOC (${hrefs.length} total):`);
        hrefs.forEach((h, i) => console.log(`  ${i + 1}. ${h}`));
      }

      // Find the first lesson that is NOT yet completed
      let foundNext = false;
      for (let i = 0; i < hrefs.length; i++) {
        const href = hrefs[i];
        const label = `Lesson-${i + 1}`;
        const statusNow = await getLessonStatus(href);

        console.log(`\n→ [${label}] Status: "${statusNow}" | ${href}`);

        if (statusNow === 'Completed') {
          console.log(`  ↳ Already Completed — skipping`);
          continue;
        }

        // Open this pending lesson via the TOC anchor
        await openLesson(href, label);
        await closeAnyPopup(page).catch(() => {});

        // Consume and verify, then break out to re-scan the TOC
        await consumeAndVerify(href, label);
        foundNext = true;
        break;
      }

      if (!foundNext) {
        console.log('\n✅ All lessons are Completed — done iterating');
        break;
      }

      lessonIteration++;
    }

    if (lessonIteration >= MAX_LESSONS) {
      console.warn(`⚠️  Reached MAX_LESSONS (${MAX_LESSONS}) safety cap — stopping lesson loop`);
    }

    // ════════════════════════════════════════════════════════════════════════
    // POST-COMPLETION CHECKS (all 5 scenarios)
    // ════════════════════════════════════════════════════════════════════════

    // Navigate back to the course page to run all checks from a clean state
    await page.goto(coursePageUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expandAllUnits(page);
    await page.waitForTimeout(500);

    // Read the course title for later home-page checks
    const courseTitle = await page.locator('h1, h2').first().textContent().catch(() => '') ?? '';
    console.log(`\nCourse title: "${courseTitle}"`);
    console.log('Running post-completion checks…\n');

    // ── Check 1: Success popup for course completion ─────────────────────────
    console.log('Check 1: Success popup…');
    const successPopupSels = [
      'text=/congratulations/i',
      'text=/course.*complet/i',
      'text=/well done/i',
      'text=/you.*complet/i',
      '[role="dialog"]:has-text("complet")',
      '.toast:has-text("complet")',
      '[class*="success"]:has-text("complet")',
      '[class*="modal"]:has-text("complet")',
    ];
    let successPopupFound = false;
    for (const sel of successPopupSels) {
      if (await page.locator(sel).first().isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`  ✅ Success popup found: "${sel}"`);
        successPopupFound = true;
        break;
      }
    }
    if (!successPopupFound) {
      await bugReport(page, 'check1-no-success-popup',
        'BUG: All lessons completed but no congratulations/success popup appeared');
    }

    // ── Check 2: Course Progress component shows 100% ────────────────────────
    console.log('Check 2: Course Progress = 100%…');
    const finalProgress = await readProgress(page);
    console.log(`  Progress reads: ${finalProgress}%`);
    if (finalProgress !== 100) {
      await bugReport(page, 'check2-progress-not-100',
        `BUG: Course Progress component shows ${finalProgress}% after all lessons consumed — expected 100%`);
      throw new Error(`BUG: Course progress is ${finalProgress}% after completing all lessons`);
    } else {
      console.log('  ✅ Course Progress is 100%');
    }

    // ── Check 3: Every lesson in TOC shows "Completed" ───────────────────────
    console.log('Check 3: All lesson statuses = Completed…');
    // Re-collect hrefs on the freshly reloaded page and check each TOC anchor
    const allFinalHrefs = await collectLessonHrefs();
    let allCompleted = true;
    for (let i = 0; i < allFinalHrefs.length; i++) {
      const href = allFinalHrefs[i];
      const rel = href.replace('https://test.sunbirded.org', '');
      const anchor = page.locator(`a[href="${href}"], a[href="${rel}"]`).first();
      const rowTxt = (await anchor.textContent().catch(() => ''))?.trim() ?? '';
      if (rowTxt && !/completed/i.test(rowTxt)) {
        allCompleted = false;
        await bugReport(page, `check3-lesson-not-completed-${i + 1}`,
          `BUG: Lesson ${i + 1} does not show "Completed" after course completion. Text: "${rowTxt.substring(0, 120)}"`);
      }
    }
    if (allCompleted && allFinalHrefs.length > 0) {
      console.log(`  ✅ All ${allFinalHrefs.length} lesson(s) show Completed`);
    }

    // ── Check 4: Three-dots menu → "Sync Progress now" → success toast ───────
    console.log('Check 4: Three-dots → Sync Progress now → success toast…');

    // The ⋮ button lives inside the Course Progress card (the yellow box).
    // Scope to the card container — go up 2 levels from the heading to reach
    // the card root so both the heading AND the ⋮ button are inside the scope.
    const progressCard = page.locator(
      'h3:has-text("Course Progress"), h2:has-text("Course Progress")'
    ).first().locator('../..');

    // Hover the card first — some implementations reveal the button on hover
    await progressCard.hover().catch(() => {});
    await page.waitForTimeout(400);

    // Find the ⋮ button — try multiple selector strategies inside the card
    const threeDotsBtn = progressCard.locator(
      'button[aria-label*="more" i], ' +
      'button[aria-label*="option" i], ' +
      'button[aria-label*="menu" i], ' +
      'button:has(svg[class*="dots"]), ' +
      'button:has(svg[class*="ellipsis"]), ' +
      '[class*="header"] button:last-child, ' +
      'div:first-child button:last-child, ' +
      'button:last-of-type'
    ).first();

    const dotsVisible = await threeDotsBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!dotsVisible) {
      await bugReport(page, 'check4-threedots-not-found',
        'BUG: Could not find the three-dots (⋮) button next to "Course Progress"');
      expect.soft(dotsVisible, 'Three-dots (⋮) button must be visible in the Course Progress card').toBe(true);
    } else {
      await threeDotsBtn.scrollIntoViewIfNeeded().catch(() => {});
      await threeDotsBtn.click();
      console.log('  Clicked three-dots (⋮) button');
      await page.waitForTimeout(600);

      // Screenshot the open menu for evidence
      const menuShot = `test-results/check4-threedots-menu-${Date.now()}.png`;
      await page.screenshot({ path: menuShot }).catch(() => {});
      await test.info().attach('check4-threedots-menu', { path: menuShot, contentType: 'image/png' }).catch(() => {});

      // Look for "Sync Progress now" menu item
      const syncBtn = page.locator(
        'text=/sync progress now/i, text=/sync progress/i, ' +
        '[role="menuitem"]:has-text("Sync"), li:has-text("Sync"), button:has-text("Sync")'
      ).first();

      const syncVisible = await syncBtn.isVisible({ timeout: 2000 }).catch(() => false);

      if (!syncVisible) {
        console.log('  ℹ️  "Sync Progress now" not in menu — may already be synced (not a bug)');
        await page.keyboard.press('Escape').catch(() => {});
      } else {
        await syncBtn.click();
        console.log('  Clicked "Sync Progress now"');
        await page.waitForTimeout(1500);

        // Verify success toast
        const toastSels = [
          'text=/you can view the progress in 24/i',
          'text=/view.*progress.*24 hours/i',
          'text=/24 hours/i',
          '[role="alert"]:has-text("24")',
          '[class*="toast"]:has-text("24")',
          '[class*="snack"]:has-text("Success")',
        ];
        let toastFound = false;
        for (const sel of toastSels) {
          if (await page.locator(sel).first().isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log(`  ✅ Sync toast confirmed: "${sel}"`);
            toastFound = true;
            break;
          }
        }
        if (!toastFound) {
          const toastMsg = 'BUG: Clicked "Sync Progress now" but did not see "You can view the progress in 24 hours" toast';
          await bugReport(page, 'check4-sync-no-toast', toastMsg);
          expect.soft(toastFound, toastMsg).toBe(true);
        }
      }
    }

    // ── Check 5: Go back → course NOT in "Continue" or "In Progress" on Home ─
    console.log('Check 5: Go Back → course absent from Continue / In Progress…');
    // Click "Go Back" / back arrow
    const goBackSels = [
      'a:has-text("Go Back")',
      'button:has-text("Go Back")',
      '[aria-label*="back" i]',
      'a.back-btn',
      // The "← Go Back" link visible in the course page header
      'text=Go Back',
    ];
    let wentBack = false;
    for (const sel of goBackSels) {
      if (await page.locator(sel).first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.locator(sel).first().click();
        wentBack = true;
        console.log(`  Clicked Go Back via: "${sel}"`);
        break;
      }
    }
    if (!wentBack) {
      // Fallback: browser back
      await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
    }

    // Wait to land on home
    await page.waitForURL(/\/home/, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Make sure we are actually on /home
    if (!page.url().includes('/home')) {
      await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
    }

    // Check "Continue from where you left" section
    const homePageText = await page.locator('body').textContent().catch(() => '') ?? '';
    const titleShort = courseTitle.trim().substring(0, 40);

    // Check "Continue from where you left" section specifically
    const continueSection = page.locator(
      'section:has-text("Continue from where you left"), ' +
      'div:has-text("Continue from where you left")'
    ).first();
    const continueSectionText = await continueSection.textContent().catch(() => '') ?? '';

    // Check "In Progress" section
    const inProgressSection = page.locator(
      'section:has-text("In Progress"), div:has-text("In Progress")'
    ).first();
    const inProgressText = await inProgressSection.textContent().catch(() => '') ?? '';

    if (titleShort && continueSectionText.includes(titleShort)) {
      await bugReport(page, 'check5-course-in-continue',
        `BUG: Completed course "${courseTitle}" still appears in "Continue from where you left" section on Home page`);
    } else {
      console.log('  ✅ Course NOT found in "Continue from where you left"');
    }

    if (titleShort && inProgressText.includes(titleShort)) {
      await bugReport(page, 'check5-course-in-inprogress',
        `BUG: Completed course "${courseTitle}" still appears in "In Progress" section on Home page`);
    } else {
      console.log('  ✅ Course NOT found in "In Progress"');
    }

    console.log('\n✅ All post-completion checks done');
  });
});
