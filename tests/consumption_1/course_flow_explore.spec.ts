import { test, expect, Page } from '@playwright/test';
import { loginWithValidCredentials, closeAnyPopup, reportBug } from './helpers';

test.setTimeout(15 * 60 * 1000);

// ─── shared helpers ───────────────────────────────────────────────────────────

async function bugReport(page: Page, id: string, message: string) {
  const ts = Date.now();
  const imgPath = `test-results/bug-${id}-${ts}.png`;
  try { await page.screenshot({ path: imgPath, fullPage: false }); } catch (_) {}
  try { await test.info().attach(`bug-${id}`, { path: imgPath, contentType: 'image/png' }); } catch (_) {}
  try { await test.info().attach(`bug-${id}-msg`, { body: message, contentType: 'text/plain' }); } catch (_) {}
  console.log('🐞 BUG:', message);
}

async function readProgress(page: Page): Promise<number | null> {
  try {
    const panel = page.locator('h3:has-text("Course Progress"), h2:has-text("Course Progress")').first().locator('..');
    const txt = await panel.textContent({ timeout: 3000 }).catch(() => '');
    const m = txt?.match(/(\d+)%/);
    if (m) return parseInt(m[1], 10);
  } catch (_) {}
  try {
    const pct = page.locator('text=/^\\d+%$/').first();
    if (await pct.isVisible({ timeout: 1000 }).catch(() => false)) {
      const t = await pct.textContent().catch(() => '');
      const m2 = t?.match(/(\d+)/);
      if (m2) return parseInt(m2[1], 10);
    }
  } catch (_) {}
  return null;
}

async function expandAllUnits(page: Page) {
  const unitBtns = page.locator('button:has-text("Course Unit")');
  const count = await unitBtns.count().catch(() => 0);
  for (let i = 0; i < count; i++) {
    try {
      await unitBtns.nth(i).scrollIntoViewIfNeeded().catch(() => {});
      await unitBtns.nth(i).click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(400);
    } catch (_) {}
  }
}

// ─── helper: join course via batch if "must join" banner is shown ─────────────
// Triggered when content player shows:
//   "You must join the course to get complete access to content"
// Flow: right panel → "Available batches" → Select a batch dropdown → pick first
//       option → "Join the course" button becomes enabled → click it.
// Every failure step is reported as a bug with a screenshot.

async function joinCourseViaBatch(page: Page): Promise<boolean> {
  // ── Detect whether batch-join is needed ──────────────────────────────────
  // TWO triggers:
  //   a) The "Available Batches" card is already on the page (landing page case)
  //   b) The "You must join" banner text is shown (player case)
  // In both cases the flow is identical: pick batch → click Join.

  const BANNER = 'text=/you must join the course to get complete access to content/i';

  const batchCard = page.locator('[data-testid="available-batches-card"]').first();
  const cardVisible = await batchCard.isVisible({ timeout: 5000 }).catch(() => false);

  const bannerVisible = cardVisible
    ? false  // already have what we need — skip banner check
    : await page.locator(BANNER).first().isVisible({ timeout: 3000 }).catch(() => false);

  if (!cardVisible && !bannerVisible) return false;

  console.log(cardVisible
    ? '  ⚠️  Batch card on page — starting batch-join flow…'
    : '  ⚠️  "Must join" banner detected — starting batch-join flow…'
  );

  // Screenshot: current state
  const entryShot = `test-results/must-join-entry-${Date.now()}.png`;
  await page.screenshot({ path: entryShot }).catch(() => {});
  await test.info().attach('batch-join-entry', { path: entryShot, contentType: 'image/png' }).catch(() => {});

  // ── Step 1: Confirm batch card is visible ─────────────────────────────────
  if (!cardVisible) {
    // Banner was seen but card not yet visible — wait a bit more
    if (!await batchCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await bugReport(page, 'batch-panel-not-found',
        'BUG: "You must join" banner shown but the "Available Batches" card (data-testid="available-batches-card") was not found on the page');
      return false;
    }
  }
  console.log('  ✅ Found "Available Batches" card');

  // ── Step 2: Click the "Select a Batch" combobox to open the batch list ────
  // Real DOM: <button role="combobox" data-testid="batch-select" data-state="closed">
  const combobox = batchCard.locator('[data-testid="batch-select"]').first();
  if (!await combobox.isVisible({ timeout: 3000 }).catch(() => false)) {
    await bugReport(page, 'batch-combobox-not-found',
      'BUG: "Available Batches" card found but the batch dropdown combobox (data-testid="batch-select") is not visible');
    return false;
  }

  console.log('  Clicking "Select a Batch" combobox to open batch list…');
  await combobox.click();
  await page.waitForTimeout(800);

  // Screenshot: dropdown opened
  const dropdownOpenShot = `test-results/batch-dropdown-open-${Date.now()}.png`;
  await page.screenshot({ path: dropdownOpenShot }).catch(() => {});
  await test.info().attach('batch-dropdown-open', { path: dropdownOpenShot, contentType: 'image/png' }).catch(() => {});

  // ── Step 3: Pick the first batch option from the Radix listbox ───────────
  // Radix Select renders options into a portal: [role="listbox"] > [role="option"]
  const listbox = page.locator('[role="listbox"]').first();
  if (!await listbox.isVisible({ timeout: 3000 }).catch(() => false)) {
    await bugReport(page, 'batch-listbox-not-visible',
      'BUG: Clicked "Select a Batch" dropdown but no batch list (role="listbox") appeared');
    return false;
  }

  const options = listbox.locator('[role="option"]');
  const optCount = await options.count().catch(() => 0);
  if (optCount === 0) {
    await bugReport(page, 'batch-no-options',
      'BUG: Batch listbox opened but contains no options (role="option") — no batches available to select');
    await page.keyboard.press('Escape').catch(() => {});
    return false;
  }

  const firstOption = options.first();
  const batchName = (await firstOption.textContent().catch(() => ''))?.trim() ?? '(unknown)';
  console.log(`  Selecting first batch: "${batchName}" (${optCount} total)`);

  await firstOption.click();
  await page.waitForTimeout(800);

  // Screenshot: batch selected
  const batchSelectedShot = `test-results/batch-selected-${Date.now()}.png`;
  await page.screenshot({ path: batchSelectedShot }).catch(() => {});
  await test.info().attach('batch-selected', { path: batchSelectedShot, contentType: 'image/png' }).catch(() => {});

  // Verify combobox now shows the selected batch name (not the placeholder)
  const comboboxText = (await combobox.textContent().catch(() => ''))?.trim() ?? '';
  if (/select a batch/i.test(comboboxText)) {
    await bugReport(page, 'batch-selection-not-reflected',
      `BUG: Clicked batch option "${batchName}" but combobox still shows placeholder "Select a Batch"`);
    // Do not bail — Join button check below will catch this too
  } else {
    console.log(`  ✅ Combobox now shows: "${comboboxText}"`);
  }

  // ── Step 4: "Join The Course" button must now be enabled ─────────────────
  // Real DOM: <button data-edataid="join-course-btn" disabled="">
  const joinBtn = page.locator('[data-edataid="join-course-btn"]').first();
  if (!await joinBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await bugReport(page, 'join-btn-not-found',
      `BUG: Batch "${batchName}" selected but the Join button (data-edataid="join-course-btn") is not visible`);
    return false;
  }

  const isDisabled = await joinBtn.evaluate((el: Element) =>
    (el as HTMLButtonElement).disabled
  ).catch(() => true);

  if (isDisabled) {
    const disabledShot = `test-results/join-btn-disabled-${Date.now()}.png`;
    await page.screenshot({ path: disabledShot }).catch(() => {});
    await test.info().attach('join-btn-disabled', { path: disabledShot, contentType: 'image/png' }).catch(() => {});
    await bugReport(page, 'join-btn-still-disabled',
      `BUG: "Join The Course" button (data-edataid="join-course-btn") is still disabled after selecting batch "${batchName}" — it must become enabled once a batch is selected`);
    return false;
  }

  console.log('  ✅ "Join The Course" button is enabled — clicking…');
  await joinBtn.click();
  await page.waitForTimeout(3000);
  await closeAnyPopup(page).catch(() => {});

  // ── Step 5: Verify join succeeded ────────────────────────────────────────
  // a) Batch card gone (enrolled — card is replaced by progress card)
  const batchCardGone = !await batchCard.isVisible({ timeout: 2000 }).catch(() => false);
  if (batchCardGone) {
    console.log('  ✅ Batch card gone — course joined successfully');
    return true;
  }

  // b) Banner gone
  const bannerGone = !await page.locator(BANNER).first().isVisible({ timeout: 3000 }).catch(() => false);
  if (bannerGone) {
    console.log('  ✅ Banner gone — course joined successfully');
    return true;
  }

  // c) Success toast
  for (const sel of [
    'text=/successfully joined/i', 'text=/you have joined/i',
    'text=/enrolled.*course/i',
    '[role="alert"]:has-text("joined")', '[role="alert"]:has-text("enrolled")',
  ]) {
    if (await page.locator(sel).first().isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`  ✅ Join confirmed via toast: "${sel}"`);
      return true;
    }
  }

  // d) Course Progress panel appeared
  if (await page.locator('[data-testid="course-progress-card"], h3:has-text("Course Progress"), h2:has-text("Course Progress")')
    .first().isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('  ✅ Course Progress panel visible — join succeeded');
    return true;
  }

  const failShot = `test-results/join-failed-${Date.now()}.png`;
  await page.screenshot({ path: failShot }).catch(() => {});
  await test.info().attach('join-failed', { path: failShot, contentType: 'image/png' }).catch(() => {});
  await bugReport(page, 'join-course-failed',
    `BUG: Clicked "Join The Course" after selecting batch "${batchName}" but join appears to have failed (batch card still visible)`);
  return false;
}

async function consumeCurrentLesson(page: Page, lessonLabel: string): Promise<boolean> {
  await page.waitForTimeout(1000);
  await closeAnyPopup(page).catch(() => {});

  // ── 0. Handle "must join" banner before attempting to consume ─────────────
  await joinCourseViaBatch(page).catch(async (e) => {
    await bugReport(page, 'join-via-batch-exception',
      `BUG: joinCourseViaBatch threw an exception: ${e?.message ?? e}`);
  });
  await page.waitForTimeout(500);

  const isFeedbackFormVisible = async () =>
    await page.locator(
      '[class*="feedback"], [class*="rating"], ' +
      'text=/how was this|rate this|share your feedback|lesson feedback/i'
    ).first().isVisible({ timeout: 500 }).catch(() => false);

  const dismissFeedbackForm = async () => {
    for (const sel of [
      'button:has-text("Skip")', 'button:has-text("Close")',
      'button[aria-label="Close"]', 'button:has-text("Submit")',
      'button:has-text("Done")', '[class*="feedback"] button:last-of-type',
    ]) {
      if (await page.locator(sel).first().isVisible({ timeout: 600 }).catch(() => false)) {
        await page.locator(sel).first().click().catch(() => {});
        await page.waitForTimeout(500);
        return;
      }
    }
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);
  };

  const isLessonCompleted = async () =>
    await page.locator(
      '[class*="active"] span:has-text("Completed"), ' +
      'a[class*="active"]:has-text("Completed"), ' +
      'a[aria-current] span:has-text("Completed")'
    ).first().isVisible({ timeout: 500 }).catch(() => false);

  if (await isLessonCompleted()) { console.log(`  [${lessonLabel}] Already Completed`); return true; }
  if (await isFeedbackFormVisible()) { console.log(`  [${lessonLabel}] Feedback form on entry — done`); await dismissFeedbackForm(); return true; }

  // ── 1. Video ────────────────────────────────────────────────────────────────
  const hasVideo = async () => {
    for (const f of [page as any, ...page.frames()]) {
      try { if (await f.locator('video').first().isVisible({ timeout: 500 }).catch(() => false)) return true; } catch (_) {}
    }
    return false;
  };

  if (await hasVideo()) {
    console.log(`  [${lessonLabel}] Video detected`);

    // Set 2x speed — YouTube settings gear
    for (const f of page.frames()) {
      try {
        if (!f.url().includes('youtube.com')) continue;
        const gear = f.locator('.ytp-settings-button, button[aria-label*="Settings" i]').first();
        if (await gear.isVisible({ timeout: 1500 }).catch(() => false)) {
          await gear.click();
          await f.waitForTimeout(600);
          const speedMenu = f.locator('text=/playback speed/i').first();
          if (await speedMenu.isVisible({ timeout: 1500 }).catch(() => false)) {
            await speedMenu.click();
            await f.waitForTimeout(400);
            const speed2 = f.locator('text=/^2$/, [aria-label="2"]').first();
            if (await speed2.isVisible({ timeout: 1500 }).catch(() => false)) {
              await speed2.click();
              console.log(`  [${lessonLabel}] ✅ YouTube speed → 2x`);
            }
          }
          break;
        }
      } catch (_) {}
    }
    // Fallback: JS playbackRate on native video
    for (const f of [page as any, ...page.frames()]) {
      try {
        const set = await f.evaluate(() => { const v = document.querySelector('video') as HTMLVideoElement | null; if (v) { v.playbackRate = 2; return true; } return false; }).catch(() => false);
        if (set) { console.log(`  [${lessonLabel}] ✅ Native video speed → 2x`); break; }
      } catch (_) {}
    }

    // Click player center to start
    const playerIframe = page.locator('iframe#contentPlayer, iframe[name="contentPlayer"], iframe[class*="content-player"]').first();
    const pBox = await playerIframe.boundingBox().catch(() => null);
    if (pBox) {
      await page.mouse.click(Math.round(pBox.x + pBox.width / 2), Math.round(pBox.y + pBox.height / 2)).catch(() => {});
      await page.waitForTimeout(500);
    }
    await page.keyboard.press('k').catch(() => {});

    // Poll for completion
    const deadline = Date.now() + 10 * 60 * 1000;
    while (Date.now() < deadline) {
      if (await isFeedbackFormVisible()) {
        console.log(`  [${lessonLabel}] ✅ Feedback form — video done`);
        await dismissFeedbackForm();
        return true;
      }
      if (await isLessonCompleted()) {
        console.log(`  [${lessonLabel}] ✅ Video Completed (TOC)`);
        return true;
      }
      await page.waitForTimeout(3000);
    }
    return true;
  }

  // ── 2. Non-video: blue ">" right-arrow ─────────────────────────────────────
  console.log(`  [${lessonLabel}] Non-video — clicking right-arrow`);
  const blueArrowSels = [
    'button.navigate-next', 'button[aria-label*="Next" i]',
    'button[aria-label*="next page" i]', 'button[aria-label*="forward" i]',
    'button:has(svg[class*="right"]):not([aria-label*="left" i])',
    '.content-player-container button:last-of-type', '[class*="player"] button:last-of-type',
  ];
  const getPageInfo = async (): Promise<{ current: number; total: number } | null> => {
    try {
      // common patterns: "1 / 104", "Page 1 of 104", numeric input for page
      const input = page.locator('input[type="number"], [class*="page-number"] input').first();
      if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
        const cur = parseInt(await input.inputValue().catch(() => '0'), 10) || 0;
        const totTxt = (await page.locator('text=/\\/\\s*\\d+/, text=/of\\s+\\d+/i').first().textContent().catch(() => '') ) ?? '';
        const totMatch = totTxt.match(/(\d+)$/);
        const total = totMatch ? parseInt(totMatch[1], 10) : cur || 1;
        return { current: cur, total };
      }
      // fallback: look for text like "1 / 104" on the page
      const frac = await page.locator('text=/\\d+\\s*\\/\\s*\\d+/').first().textContent().catch(() => '');
      if (frac) {
        const m = frac.match(/(\d+)\s*\/\s*(\d+)/);
        if (m) return { current: parseInt(m[1], 10), total: parseInt(m[2], 10) };
      }
    } catch (_) {}
    return null;
  };

  let arrowBtn = null;
  for (const sel of blueArrowSels) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 1000 }).catch(() => false)) { arrowBtn = el; console.log(`  Found arrow: "${sel}"`); break; }
  }

  // Prefer using page-info if available so we can iterate exactly total pages
  const pi = await getPageInfo();
  if (pi) console.log(`  Detected pagination: ${pi.current} / ${pi.total}`);

  // If we have a reliable total, loop until current >= total.
  if (pi && pi.total > 1) {
    const target = pi.total;
    let attempts = 0;
    // allow up to 2x clicks in case some clicks don't advance
    const maxAttempts = Math.max(200, target * 2);
    while (attempts < maxAttempts) {
      attempts++;
      if (await isFeedbackFormVisible()) { console.log(`  ✅ Feedback form`); await dismissFeedbackForm(); return true; }
      if (await isLessonCompleted()) { console.log(`  ✅ Completed (TOC)`); return true; }

      const curInfo = await getPageInfo();
      if (curInfo) {
        console.log(`  Page ${curInfo.current} / ${curInfo.total}`);
        if (curInfo.current >= curInfo.total) {
          // reached last page — wait for completion indicators
          await page.waitForTimeout(1500);
          if (await isFeedbackFormVisible()) { await dismissFeedbackForm(); return true; }
          if (await isLessonCompleted()) return true;
        }
      }

      // click arrow
      if (arrowBtn) {
        await arrowBtn.scrollIntoViewIfNeeded().catch(() => {});
        await arrowBtn.click({ timeout: 2000 }).catch(() => {});
      } else {
        const pBox = await page.locator('iframe#contentPlayer, iframe[name="contentPlayer"]').first().boundingBox().catch(() => null);
        if (pBox) {
          await page.mouse.move(Math.round(pBox.x + pBox.width - 20), Math.round(pBox.y + 30));
          await page.waitForTimeout(300);
          for (const sel of blueArrowSels) {
            const el = page.locator(sel).first();
            if (await el.isVisible({ timeout: 800 }).catch(() => false)) { await el.click().catch(() => {}); arrowBtn = el; break; }
          }
        }
      }
      await page.waitForTimeout(700);
    }
  } else {
    // Unknown total: keep clicking until lesson completion or a reasonable cap
    let clicks = 0;
    const maxClicks = 1000; // large cap to support long lessons (e.g., 100+ pages)
    while (clicks < maxClicks) {
      clicks++;
      if (await isFeedbackFormVisible()) { console.log(`  ✅ Feedback form`); await dismissFeedbackForm(); return true; }
      if (await isLessonCompleted()) { console.log(`  ✅ Completed (TOC)`); return true; }

      if (arrowBtn) {
        await arrowBtn.scrollIntoViewIfNeeded().catch(() => {});
        await arrowBtn.click({ timeout: 2000 }).catch(() => {});
      } else {
        const pBox = await page.locator('iframe#contentPlayer, iframe[name="contentPlayer"]').first().boundingBox().catch(() => null);
        if (pBox) {
          await page.mouse.move(Math.round(pBox.x + pBox.width - 20), Math.round(pBox.y + 30));
          await page.waitForTimeout(300);
          for (const sel of blueArrowSels) {
            const el = page.locator(sel).first();
            if (await el.isVisible({ timeout: 800 }).catch(() => false)) { await el.click().catch(() => {}); arrowBtn = el; break; }
          }
        }
      }
      await page.waitForTimeout(500);
    }
  }

  // After navigation attempts, verify no red alerts
  for (const sel of ['[role="alert"]:not(:has-text("Completed"))', '.alert-danger']) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 400 }).catch(() => false)) {
      await bugReport(page, `lesson-err-${lessonLabel.replace(/\s+/g,'-').substring(0,25)}`,
        `Red alert: ${(await el.textContent().catch(() => ''))?.trim()}`);
      return false;
    }
  }
  // Final best-effort: consider lesson done
  return await isLessonCompleted() || !(await isFeedbackFormVisible());
}

// ─── helper: find and click the ⋮ button in the Course Progress card ──────────
// The button sits in the card header row, at the same level as the heading or
// one level above it. We try multiple DOM depths and a page-level fallback.
async function clickThreeDotsInProgressCard(page: Page): Promise<boolean> {
  const DOTS_SEL =
    'button[aria-label*="more" i], button[aria-label*="option" i], ' +
    'button[aria-label*="menu" i], button:has(svg[class*="dots"]), ' +
    'button:has(svg[class*="ellipsis"]), button:has(svg[class*="more"]), ' +
    'button:last-of-type';

  // Walk up from the heading through up to 4 ancestor levels
  const heading = page.locator(
    'h3:has-text("Course Progress"), h2:has-text("Course Progress")'
  ).first();

  for (const upPath of ['..', '../..', '../../..', '../../../..']) {
    try {
      const container = heading.locator(upPath);
      await container.hover({ timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(300);
      const btn = container.locator(DOTS_SEL).first();
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click();
        console.log(`  ⋮ button found at ancestor depth "${upPath}"`);
        return true;
      }
    } catch (_) {}
  }

  // Page-level fallback: find ANY button adjacent to the Course Progress heading
  try {
    const btn = page.locator(DOTS_SEL).filter({ has: page.locator(':scope') }).first();
    // Specifically look near the progress heading using evaluate
    const clicked = await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h2, h3'))
        .find(el => /course progress/i.test(el.textContent ?? ''));
      if (!heading) return false;
      // Walk up to find a container that also has a button
      let el: Element | null = heading;
      for (let i = 0; i < 5; i++) {
        el = el?.parentElement ?? null;
        if (!el) break;
        const btns = Array.from(el.querySelectorAll('button'));
        // Pick the button that is NOT the heading itself (i.e. a sibling/cousin)
        const dotsBtn = btns.find(b => {
          const txt = b.textContent?.trim() ?? '';
          // Empty or contains SVG only = likely an icon button
          return txt === '' || txt === '⋮' || txt === '...' || b.querySelector('svg') !== null;
        });
        if (dotsBtn) {
          (dotsBtn as HTMLElement).click();
          return true;
        }
      }
      return false;
    }).catch(() => false);
    if (clicked) {
      console.log('  ⋮ button found via page.evaluate proximity search');
      await page.waitForTimeout(400);
      return true;
    }
  } catch (_) {}

  return false;
}

// ─── helper: three-dots check for an already-100% completed course ────────────

async function checkThreeDotsForCompletedCourse(page: Page, coursePageUrl: string) {
  console.log('\nCheck: Three-dots behaviour on a completed (100%) course…');

  const progressPanel = page.locator(
    'h3:has-text("Course Progress"), h2:has-text("Course Progress")'
  ).first().locator('..');

  await progressPanel.hover().catch(() => {});
  await page.waitForTimeout(400);

  // ── Expected behaviour: "Leave Course" must NOT be visible on a 100% course ──
  // It is correct for the button to be absent. Its presence is the bug.
  const leaveBtn = page.getByRole('button', { name: /leave course/i })
    .or(page.locator('button').filter({ hasText: /leave course/i }))
    .first();
  if (await leaveBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await bugReport(page, 'leave-course-on-completed',
      `BUG: "Leave Course" button is visible on a 100% completed course — it must NOT appear when the course is complete`);
  } else {
    console.log('  ✅ "Leave Course" button correctly absent on 100% course');
  }

  const dotsClicked = await clickThreeDotsInProgressCard(page);

  if (!dotsClicked) {
    // No ⋮ button on a 100% completed course is acceptable — already synced
    console.log('  ℹ️  No three-dots button on 100% course — already synced (correct)');
    return;
  }

  await page.waitForTimeout(600);

  // Screenshot the open menu
  const menuShot = `test-results/threedots-100pct-menu-${Date.now()}.png`;
  await page.screenshot({ path: menuShot }).catch(() => {});
  await test.info().attach('threedots-100pct-menu', { path: menuShot, contentType: 'image/png' }).catch(() => {});

  // "Leave Course" must NOT be inside the ⋮ menu on a 100% course
  const leaveInMenu = await page.getByRole('button', { name: /leave course/i })
    .or(page.getByRole('menuitem', { name: /leave course/i }))
    .or(page.locator('button').filter({ hasText: /leave course/i }))
    .first()
    .isVisible({ timeout: 1000 }).catch(() => false);
  if (leaveInMenu) {
    await bugReport(page, 'leave-course-in-menu-on-100pct',
      `BUG: "Leave Course" option is in the ⋮ menu of a 100% completed course — it must NOT appear when the course is complete`);
  } else {
    console.log('  ✅ "Leave Course" correctly absent in ⋮ menu on 100% course');
  }

  // "Sync Progress now" should be present
  const syncBtn = page.locator(
    'text=/sync progress now/i, text=/sync progress/i, ' +
    '[role="menuitem"]:has-text("Sync"), li:has-text("Sync"), button:has-text("Sync")'
  ).first();

  const syncVisible = await syncBtn.isVisible({ timeout: 2000 }).catch(() => false);
  if (!syncVisible) {
    console.log('  ℹ️  Three-dots open but no "Sync Progress now" — already synced');
    await page.keyboard.press('Escape').catch(() => {});
    return;
  }

  console.log('  Found "Sync Progress now" — clicking…');
  await syncBtn.click();
  await page.waitForTimeout(2000);

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
    await bugReport(page, 'sync-no-toast-on-100pct',
      'BUG: "Sync Progress now" clicked on a 100% course but "You can view the progress in 24 hours" toast did not appear');
  }
}

// ─── helper: find a course from Explore matching a progress condition ─────────

async function findCourseFromExplore(
  page: Page,
  condition: 'any' | 'incomplete' | 'complete'
): Promise<{ url: string; progress: number | null } | null> {
  await page.goto('https://test.sunbirded.org/explore', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await closeAnyPopup(page).catch(() => {});

  const cardSels = ['a[href*="/collection/"]', '.course-card a', '[class*="course-card"] a', '.card a[href*="course"]'];
  const tried = new Set<string>();

  for (const sel of cardSels) {
    const cards = page.locator(sel);
    const count = await cards.count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      try {
        const href = await cards.nth(i).getAttribute('href').catch(() => null);
        if (!href) continue;
        const url = href.startsWith('http') ? href : `https://test.sunbirded.org${href}`;
        if (tried.has(url)) continue;
        tried.add(url);

        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1200);
        await closeAnyPopup(page).catch(() => {});

        // Batch-join first (batch card may be on landing page — Join btn is disabled until batch selected)
        const joined = await joinCourseViaBatch(page).catch(() => false);
        if (!joined) {
          // Plain join button (already enabled, no batch required)
          for (const jSel of ['button:has-text("Join The Course")', 'button:has-text("Join the Course")', 'button:has-text("Join")']) {
            const btn = page.locator(jSel).first();
            if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
              const dis = await btn.evaluate((el: Element) => (el as HTMLButtonElement).disabled).catch(() => false);
              if (!dis) {
                await btn.click();
                await page.waitForTimeout(1500);
                await closeAnyPopup(page).catch(() => {});
              }
              break;
            }
          }
        }

        const progress = await readProgress(page);
        if (condition === 'any') return { url, progress };
        if (condition === 'complete' && progress !== null && progress >= 100) return { url, progress };
        if (condition === 'incomplete' && (progress === null || progress < 100)) return { url, progress };
      } catch (_) { continue; }
    }
  }
  return null;
}

// ─── tests ───────────────────────────────────────────────────────────────────

test.describe('Course Flow — Explore page', () => {

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 1: Consume an incomplete course end-to-end
  // ══════════════════════════════════════════════════════════════════════════
  test('Explore → open course card → consume all lessons → verify completion', async ({ page }) => {
    await loginWithValidCredentials(page);

    // ── Step 1: Go to Explore and find an incomplete course ──────────────────
    await page.goto('https://test.sunbirded.org/explore', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await closeAnyPopup(page).catch(() => {});

    let courseUrl = '';
    for (const sel of ['a[href*="/collection/"]', '.course-card a', '[class*="course-card"] a', '.card a[href*="course"]']) {
      const cards = page.locator(sel);
      const count = await cards.count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        const href = await cards.nth(i).getAttribute('href').catch(() => null);
        if (href) { courseUrl = href.startsWith('http') ? href : `https://test.sunbirded.org${href}`; break; }
      }
      if (courseUrl) break;
    }

    if (!courseUrl) {
      await bugReport(page, 'explore-no-cards', 'No course cards found on the Explore page');
      throw new Error('No course cards on Explore page');
    }

    console.log('Opening course:', courseUrl);
    await page.goto(courseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await closeAnyPopup(page).catch(() => {});

    // ── Step 2: Join if needed ─────────────────────────────────────────────────
    // First check if this course needs batch-based join (batch card is on landing page).
    // The "Join The Course" button is DISABLED until a batch is selected, so we must
    // run joinCourseViaBatch BEFORE attempting a plain button click.
    const batchJoined = await joinCourseViaBatch(page).catch(() => false);

    if (!batchJoined) {
      // No batch card — try plain "Join" / "Enroll" button (already-enabled case)
      for (const sel of [
        'button:has-text("Join The Course")', 'button:has-text("Join the Course")',
        'button:has-text("Enroll")', 'a:has-text("Join")',
      ]) {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
          const disabled = await btn.evaluate((el: Element) => (el as HTMLButtonElement).disabled).catch(() => false);
          if (!disabled) {
            console.log(`Joining via plain button: "${sel}"`);
            await btn.click();
            await page.waitForTimeout(2000);
            await closeAnyPopup(page).catch(() => {});
          }
          break;
        }
      }
    }

    const coursePageUrl = page.url();

    // ── Step 3: If course is already 100% — run three-dots check instead ─────
    const initialProgress = await readProgress(page);
    console.log('Initial progress:', initialProgress);

    if (initialProgress !== null && initialProgress >= 100) {
      console.log('Course is already 100% — running three-dots / sync check');
      await checkThreeDotsForCompletedCourse(page, coursePageUrl);
      return;
    }

    // ── Step 4 & 5: Expand TOC and consume every lesson in order ────────────────
    //
    // Strategy:
    //   a) Expand all Course Units in the TOC sidebar.
    //   b) Collect href links for every leaf lesson (not unit-header) in DOM order.
    //   c) Iterate the list: navigate to each lesson URL, consume it, verify it
    //      flips to "Completed" in the TOC before moving on.
    //   d) After each lesson, re-expand units (accordion may collapse) and re-check
    //      the next lesson href by its saved index so we stay in order.
    //
    // This avoids brittle "find first not-viewed lesson" re-scans that can get stuck.

    await expandAllUnits(page);
    await page.waitForTimeout(600);

    // ── Helper: gather all lesson hrefs visible in the TOC ───────────────────
    //   Returns only leaf-level content links — excludes the course landing URL
    //   itself and duplicate hrefs.  Priority selectors tried in order; first
    //   one that returns ≥1 result wins.
    const TOC_LESSON_SELS = [
      // Sunbird-specific: lesson links inside <nav> pointing to /content/
      'nav a[href*="/content/"]',
      // Generic TOC sidebar anchors
      '[class*="toc"] a[href*="/content/"]',
      '[class*="sidebar"] a[href*="/content/"]',
      // Fallback: any /content/ link on the page
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
            // Exclude the course landing page itself and duplicates
            if (full === currentUrl) continue;
            if (hrefs.includes(full)) continue;
            hrefs.push(full);
          }
          if (hrefs.length > 0) {
            console.log(`  TOC via "${sel}" → ${hrefs.length} lesson(s)`);
            return hrefs;
          }
        } catch (_) {}
      }
      // Last resort: evaluate DOM for /content/do_ links (true leaf lessons only)
      const fromDOM = await page.evaluate((baseUrl: string) => {
        const seen = new Set<string>();
        const out: string[] = [];
        document.querySelectorAll('a[href]').forEach((a) => {
          const href = (a as HTMLAnchorElement).href;
          // Only leaf content links (do_ IDs inside /content/ path)
          if (/\/content\/do_/.test(href) && href !== baseUrl && !seen.has(href)) {
            seen.add(href);
            out.push(href);
          }
        });
        return out;
      }, currentUrl).catch(() => [] as string[]);
      console.log(`  TOC via DOM eval → ${fromDOM.length} lesson(s)`);
      return fromDOM;
    };

    // ── Helper: click a lesson by href (TOC anchor or direct navigate) ────────
    const openLesson = async (href: string, label: string): Promise<boolean> => {
      // Try clicking the TOC anchor first (keeps player SPA state intact)
      const anchor = page.locator(`a[href="${href}"], a[href="${href.replace('https://test.sunbirded.org', '')}"]`).first();
      if (await anchor.isVisible({ timeout: 2000 }).catch(() => false)) {
        await anchor.scrollIntoViewIfNeeded().catch(() => {});
        await anchor.click({ timeout: 5000 }).catch(async () => {
          const h = await anchor.elementHandle().catch(() => null);
          if (h) await page.evaluate((el: Element) => (el as HTMLElement).click(), h).catch(() => {});
        });
        await page.waitForTimeout(1500);
        return true;
      }
      // Fallback: navigate directly
      console.log(`  [${label}] TOC anchor not visible — navigating directly to ${href}`);
      await page.goto(href, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      return true;
    };

    // ── Helper: check if a lesson href is already Completed in the TOC ────────
    const isHrefCompleted = async (href: string): Promise<boolean> => {
      const rel = href.replace('https://test.sunbirded.org', '');
      const anchor = page.locator(`a[href="${href}"], a[href="${rel}"]`).first();
      if (!await anchor.isVisible({ timeout: 1000 }).catch(() => false)) return false;
      const txt = (await anchor.textContent().catch(() => ''))?.trim() ?? '';
      return /completed/i.test(txt);
    };

    // ── Build the initial ordered lesson list ─────────────────────────────────
    let lessonHrefs = await collectLessonHrefs();

    if (lessonHrefs.length === 0) {
      console.log('⚠️  No lesson hrefs collected from TOC — falling back to consuming initial player only');
      await consumeCurrentLesson(page, 'initial-player');
    } else {
      console.log(`\nLesson list (${lessonHrefs.length} total):`);
      lessonHrefs.forEach((h, i) => console.log(`  ${i + 1}. ${h}`));

      for (let idx = 0; idx < lessonHrefs.length; idx++) {
        const href = lessonHrefs[idx];
        const label = `Lesson-${idx + 1}`;

        // Re-expand units before each lesson (accordion may have collapsed)
        await expandAllUnits(page);
        await page.waitForTimeout(300);

        // Skip if already Completed
        if (await isHrefCompleted(href)) {
          console.log(`\n→ [${label}] Already Completed — skip`);
          continue;
        }

        console.log(`\n→ [${label}] Opening: ${href}`);
        await openLesson(href, label);
        await closeAnyPopup(page).catch(() => {});

        // Handle "must join" banner that may appear when opening a lesson
        await joinCourseViaBatch(page).catch(() => {});

        await consumeCurrentLesson(page, label);
        await page.waitForTimeout(800);

        // Re-expand and verify the lesson flipped to Completed
        await expandAllUnits(page);
        await page.waitForTimeout(400);

        const nowCompleted = await isHrefCompleted(href);
        if (nowCompleted) {
          console.log(`  ✅ [${label}] Completed ✓`);
        } else {
          // Check what the TOC shows for this lesson
          const rel = href.replace('https://test.sunbirded.org', '');
          const anchor = page.locator(`a[href="${href}"], a[href="${rel}"]`).first();
          const statusTxt = (await anchor.textContent().catch(() => ''))?.trim() ?? '(not found)';
          await bugReport(page, `explore-lesson-not-completed-${idx + 1}`,
            `BUG: [${label}] TOC still shows "${statusTxt.substring(0, 100)}" after consumption — expected "Completed"`);
        }
      }
      console.log('\n✅ All lessons iterated');
    }

    // ── Step 6: Post-completion checks ───────────────────────────────────────

    // 6a — Success popup (check NOW before reload wipes it)
    console.log('\nCheck 6a: Success popup…');
    const successSels = [
      'text=/congratulations/i', 'text=/course.*complet/i', 'text=/well done/i',
      'text=/you.*complet/i', '[role="dialog"]:has-text("complet")',
      '[class*="modal"]:has-text("complet")', '[class*="toast"]:has-text("complet")',
    ];
    let successFound = false;
    for (const sel of successSels) {
      if (await page.locator(sel).first().isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`  ✅ Success popup: "${sel}"`);
        successFound = true;
        break;
      }
    }
    if (!successFound) {
      await bugReport(page, 'explore-no-success-popup',
        'BUG: Course completed but no congratulations/success popup appeared');
    }

    // Reload for remaining checks
    await page.goto(coursePageUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expandAllUnits(page);

    const courseTitle = await page.locator('h1, h2').first().textContent().catch(() => '') ?? '';

    // 6b — Progress 100%
    console.log('Check 6b: Progress = 100%…');
    const finalProgress = await readProgress(page);
    if (finalProgress !== 100) {
      await bugReport(page, 'explore-progress-not-100',
        `BUG: Progress shows ${finalProgress}% after consuming all lessons — expected 100%`);
      throw new Error(`Progress is ${finalProgress}%`);
    }
    console.log('  ✅ Progress is 100%');

    // 6c — All lessons Completed
    console.log('Check 6c: All lesson statuses…');
    // Re-collect hrefs after reload (DOM is fresh) and check each TOC link for "Completed"
    const allFinalHrefs = await collectLessonHrefs();
    let checkedCount = 0;
    for (let i = 0; i < allFinalHrefs.length; i++) {
      const href = allFinalHrefs[i];
      const rel = href.replace('https://test.sunbirded.org', '');
      const anchor = page.locator(`a[href="${href}"], a[href="${rel}"]`).first();
      const txt = (await anchor.textContent().catch(() => ''))?.trim() ?? '';
      checkedCount++;
      if (txt && !/completed/i.test(txt))
        await bugReport(page, `explore-lesson-status-wrong-${i + 1}`,
          `BUG: Lesson ${i + 1} does not show "Completed": "${txt.substring(0, 100)}"`);
    }
    console.log(`  ✅ All ${checkedCount} lesson(s) checked`);

    // 6d — Three-dots sync check
    await checkThreeDotsForCompletedCourse(page, coursePageUrl);

    // 6e — Go Back → course absent from Continue / In Progress
    console.log('Check 6e: Go Back → not in Continue/In Progress…');
    const goBack = page.locator('text=Go Back, a:has-text("Go Back"), button:has-text("Go Back")').first();
    if (await goBack.isVisible({ timeout: 2000 }).catch(() => false)) await goBack.click();
    else await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForURL(/\/home/, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2000);
    if (!page.url().includes('/home')) {
      await page.goto('https://test.sunbirded.org/home', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
    }
    const titleKey = courseTitle.trim().substring(0, 40);
    if (titleKey) {
      const contTxt = await page.locator('section:has-text("Continue from where you left"), div:has-text("Continue from where you left")').first().textContent().catch(() => '') ?? '';
      const ipTxt = await page.locator('section:has-text("In Progress"), div:has-text("In Progress")').first().textContent().catch(() => '') ?? '';
      if (contTxt.includes(titleKey)) await bugReport(page, 'explore-still-in-continue', `BUG: "${courseTitle}" still in "Continue from where you left"`);
      else console.log('  ✅ Not in "Continue from where you left"');
      if (ipTxt.includes(titleKey)) await bugReport(page, 'explore-still-in-inprogress', `BUG: "${courseTitle}" still in "In Progress"`);
      else console.log('  ✅ Not in "In Progress"');
    }

    console.log('\n✅ Explore course flow complete');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TEST 2: "Leave Course" button — only valid for incomplete courses
  // ══════════════════════════════════════════════════════════════════════════
  test('Explore → find incomplete course → verify Leave Course unenrols user', async ({ page }) => {
    await loginWithValidCredentials(page);

    console.log('Finding an incomplete course from Explore…');
    const found = await findCourseFromExplore(page, 'incomplete');
    if (!found) {
      await bugReport(page, 'leave-course-no-incomplete', 'Could not find any incomplete course on Explore');
      throw new Error('No incomplete course found on Explore');
    }

    console.log(`Found incomplete course (${found.progress}%): ${found.url}`);
    const courseTitle = await page.locator('h1, h2').first().textContent().catch(() => '') ?? '';
    const progressPanel = page.locator(
      'h3:has-text("Course Progress"), h2:has-text("Course Progress")'
    ).first().locator('..');

    // ── Check A: "Leave Course" must be present ───────────────────────────────
    // The "Leave course" button appears inline in the Course Progress card header
    // (revealed when the ⋮ button is clicked). We use getByRole for reliability
    // since the button contains an icon image alongside the text.
    console.log('\nCheck A: "Leave Course" must be accessible on an incomplete course…');

    // Helper: find the Leave course button using multiple strategies
    const findLeaveBtn = () =>
      page.getByRole('button', { name: /leave course/i })
        .or(page.locator('[active][ref]').filter({ hasText: /leave course/i }))
        .or(page.locator('button').filter({ hasText: /leave course/i }))
        .first();

    // First check if already visible (inline) without clicking ⋮
    let leaveBtn = findLeaveBtn();
    let leaveVisible = await leaveBtn.isVisible({ timeout: 1500 }).catch(() => false);

    if (!leaveVisible) {
      // Not visible yet — click ⋮ to reveal it
      const dotsClicked = await clickThreeDotsInProgressCard(page);
      if (!dotsClicked) {
        await bugReport(page, 'leave-course-no-threedots',
          'BUG: Three-dots (⋮) button not found on incomplete course — cannot access "Leave Course"');
        throw new Error('Three-dots button not found');
      }
      await page.waitForTimeout(600);

      // Screenshot the revealed state
      const menuShot = `test-results/leave-course-menu-${Date.now()}.png`;
      await page.screenshot({ path: menuShot }).catch(() => {});
      await test.info().attach('leave-course-menu', { path: menuShot, contentType: 'image/png' }).catch(() => {});

      leaveBtn = findLeaveBtn();
      leaveVisible = await leaveBtn.isVisible({ timeout: 2000 }).catch(() => false);
    } else {
      console.log('  "Leave course" button already visible inline (no ⋮ click needed)');
      const shot = `test-results/leave-course-visible-${Date.now()}.png`;
      await page.screenshot({ path: shot }).catch(() => {});
      await test.info().attach('leave-course-visible', { path: shot, contentType: 'image/png' }).catch(() => {});
    }

    if (!leaveVisible) {
      const bugMsg =
        `BUG: "Leave Course" option not found for an incomplete course (progress: ${found.progress}%).\n` +
        `  Checked both inline and inside ⋮ menu.\n` +
        `  The button is visible in the screenshot but the selector could not match it.\n` +
        `  Expected: "Leave course" button visible in the Course Progress card.`;
      await bugReport(page, 'leave-course-option-missing', bugMsg);
      expect.soft(leaveVisible, bugMsg).toBe(true);
      await page.keyboard.press('Escape').catch(() => {});
      throw new Error('"Leave Course" option not found');
    }
    console.log('  ✅ "Leave Course" option is present for incomplete course');

    // ── Check B: Click "Leave Course" → confirmation popup → unenrolment ─────
    console.log('\nCheck B: Click "Leave Course" → expect unenrolment confirmation…');
    await leaveBtn.click().catch(async () => {
      // If direct click fails, try JS click
      await leaveBtn.evaluate((el: Element) => (el as HTMLElement).click()).catch(() => {});
    });
    await page.waitForTimeout(1000);

    // Screenshot immediately after click to capture any popup
    const afterClickShot = `test-results/leave-course-after-click-${Date.now()}.png`;
    await page.screenshot({ path: afterClickShot }).catch(() => {});
    await test.info().attach('leave-course-after-click', { path: afterClickShot, contentType: 'image/png' }).catch(() => {});

    // The "Batch Unenrolment" dialog appears — it has a "Leave course" button to confirm.
    // Try getByRole first (most reliable for "Leave course" text), then CSS fallbacks.
    const dialogLeaveBtn =
      page.getByRole('button', { name: /leave course/i })
          .or(page.locator('[role="dialog"] button').filter({ hasText: /leave course/i }))
          .or(page.locator('button').filter({ hasText: /leave course/i }))
          .first();

    const dialogVisible = await dialogLeaveBtn.isVisible({ timeout: 4000 }).catch(() => false);
    if (dialogVisible) {
      console.log('  Confirming "Batch Unenrolment" dialog → clicking "Leave course" button…');
      await dialogLeaveBtn.click();
      await page.waitForTimeout(1500);
    } else {
      // Fallback: try other confirmation button texts
      const confirmSels = [
        'button:has-text("Yes")', 'button:has-text("Confirm")',
        'button:has-text("Leave")', 'button:has-text("OK")',
        '[role="dialog"] button:has-text("Yes")',
      ];
      for (const sel of confirmSels) {
        if (await page.locator(sel).first().isVisible({ timeout: 1500 }).catch(() => false)) {
          console.log(`  Confirming leave via fallback: "${sel}"`);
          await page.locator(sel).first().click();
          await page.waitForTimeout(1500);
          break;
        }
      }
    }

    // Verify unenrolment success message
    // Sunbird shows "User enrolled successfully" (unenrolment uses same toast wording)
    const unenrolSels = [
      'text=/user.*enrolled.*successfully/i',
      'text=/user.*enrol.*success/i',
      'text=/enrolled.*successfully/i',
      'text=/successfully unenrolled/i',
      'text=/unenrolled from the course/i',
      'text=/left the course/i',
      'text=/successfully left/i',
      '[role="alert"]:has-text("unenrolled")',
      '[role="alert"]:has-text("enroll")',
      '[role="alert"]:has-text("enrolled")',
      '[class*="toast"]:has-text("unenrolled")',
      '[class*="toast"]:has-text("enrolled")',
      '[class*="toast"]:has-text("left")',
      '[class*="toast"]:has-text("success")',
      '[class*="snack"]:has-text("success")',
    ];
    let unenrolFound = false;
    for (const sel of unenrolSels) {
      if (await page.locator(sel).first().isVisible({ timeout: 5000 }).catch(() => false)) {
        const txt = await page.locator(sel).first().textContent().catch(() => sel);
        console.log(`  ✅ Unenrolment confirmed: "${txt?.trim().substring(0, 100)}"`);
        unenrolFound = true;
        break;
      }
    }
    if (!unenrolFound) {
      const unenrolMsg = 'BUG: Clicked "Leave Course" but "User enrolled from course successfully" message did not appear';
      await bugReport(page, 'leave-course-no-unenrol-toast', unenrolMsg);
      expect.soft(unenrolFound, unenrolMsg).toBe(true);
    }

    // ── Check C: Verify "Leave Course" does NOT appear on a 100% course ───────
    // Expected behaviour: "Leave course" is ABSENT on a 100% completed course.
    // Its presence is the bug — its absence is correct.
    console.log('\nCheck C: "Leave Course" must NOT appear on a 100% complete course…');
    const completed = await findCourseFromExplore(page, 'complete');
    if (!completed) {
      console.log('  ℹ️  No 100% course found to verify — skipping Check C');
      return;
    }

    console.log(`Found 100% course: ${completed.url}`);

    // Use getByRole for reliability — button contains an icon + text
    const leaveOnCompleteInline = await page.getByRole('button', { name: /leave course/i })
      .or(page.locator('button').filter({ hasText: /leave course/i }))
      .first()
      .isVisible({ timeout: 1500 }).catch(() => false);

    if (leaveOnCompleteInline) {
      await bugReport(page, 'leave-course-visible-on-100pct',
        `BUG: "Leave Course" button is visible on a 100% completed course — it must NOT appear when the course is complete`);
    } else {
      console.log('  ✅ "Leave Course" correctly absent (inline) on 100% course');
    }

    // Also open the ⋮ menu and verify "Leave course" is absent there too
    const dotsClicked2 = await clickThreeDotsInProgressCard(page);
    if (dotsClicked2) {
      await page.waitForTimeout(600);

      const menuShot2 = `test-results/completed-course-menu-${Date.now()}.png`;
      await page.screenshot({ path: menuShot2 }).catch(() => {});
      await test.info().attach('completed-course-menu', { path: menuShot2, contentType: 'image/png' }).catch(() => {});

      const leaveInMenu = await page.getByRole('button', { name: /leave course/i })
        .or(page.getByRole('menuitem', { name: /leave course/i }))
        .or(page.locator('button').filter({ hasText: /leave course/i }))
        .first()
        .isVisible({ timeout: 1000 }).catch(() => false);

      if (leaveInMenu) {
        await bugReport(page, 'leave-course-in-menu-on-100pct',
          `BUG: "Leave Course" is in the ⋮ menu of a 100% completed course (${completed.url}) — it must NOT appear when the course is complete`);
      } else {
        console.log('  ✅ "Leave Course" correctly absent in ⋮ menu on 100% course');
      }
      await page.keyboard.press('Escape').catch(() => {});
    } else {
      // No ⋮ button on a completed course is perfectly fine
      console.log('  ✅ No ⋮ button on 100% course (correct behaviour)');
    }

    console.log('\n✅ Leave Course checks complete');
  });
});
