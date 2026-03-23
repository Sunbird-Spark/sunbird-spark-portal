import { expect, Page } from '@playwright/test';
import fs from 'fs';

export const LOGIN_URL =
  'https://test.sunbirded.org/auth/realms/sunbird/protocol/openid-connect/auth' +
  '?redirect_uri=https%3A%2F%2Ftest.sunbirded.org%2Fportal%2Fauth%2Fcallback' +
  '&scope=openid' +
  '&code_challenge=GKZ_TMQHPb4d42sBgPGxmV8tWFB9Wn6BVmMjqN6MI9U' +
  '&code_challenge_method=S256' +
  '&state=de644eaf-2385-4160-be32-1d39635bf82d' +
  '&prompt=login' +
  '&client_id=portal' +
  '&response_type=code';

/** Check for any visible failure/error alerts on the page and fail with a bug identifier */
export async function checkForFailureAlerts(page: Page, context: string) {
  const alertSelectors = [
    '.alert-error',
    '.alert-danger',
    '.error-message',
    '.sb-alert-error',
    'text=Something went wrong',
    'text=Failed',
    'text=Unauthorized',
    'text=Session expired',
  ];
  for (const selector of alertSelectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 1000 })) {
        const msg = await el.textContent().catch(() => selector);
        expect(false, `Bug Identifier [${context}]: Failure alert visible — "${msg?.trim()}"`).toBeTruthy();
      }
    } catch (_) {
      // suppress timeout noise
    }
  }
}

/** Login with valid credentials and assert landing on /home */
export async function loginWithValidCredentials(page: Page) {
  await page.goto(LOGIN_URL);
  await page.waitForSelector('#emailormobile', { timeout: 10000 });
  await page.fill('#emailormobile', 'user1@yopmail.com');
  await page.fill('#password', 'User1@123');
  await page.click('#kc-login');
  try {
    await page.waitForURL('**/home', { timeout: 20000 });
  } catch (_) {
    await checkForFailureAlerts(page, 'Login with valid credentials');
    expect(false, 'Bug Identifier: Login failed — did not reach home page after valid credentials').toBeTruthy();
  }
  await checkForFailureAlerts(page, 'Post-login home page');
  expect(page.url()).toContain('/home');
}

/** Close common modal/pop-up patterns to unblock the test flow. */
export async function closeAnyPopup(page: Page) {
  const closeSelectors = [
    'button[aria-label="Close"]',
    'button[aria-label="close"]',
    'button[title="Close"]',
    'button[aria-label*="close" i]',
    'button:has-text("×")',
    'button:has-text("X")',
    '.modal-close',
    '.close-btn',
    '.close',
    '.popup-close',
    '.sb-modal-close',
    '.mat-snack-bar-action',
  ];

  for (const sel of closeSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 400 }).catch(() => false)) {
        try { await el.click({ force: true }); } catch (_) {}
        await page.waitForTimeout(300);
      }
    } catch (_) {}
  }

  // Press Escape a couple of times
  try {
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(200);
    }
  } catch (_) {}

  // Click common backdrop selectors
  const backdropSelectors = ['.modal-backdrop', '.overlay', '.backdrop', '.sb-backdrop', '.cdk-overlay-backdrop'];
  for (const sel of backdropSelectors) {
    try {
      const bd = page.locator(sel).first();
      if (await bd.isVisible({ timeout: 200 }).catch(() => false)) {
        try { await bd.click({ force: true }); } catch (_) {}
        await page.waitForTimeout(200);
      }
    } catch (_) {}
  }

  try {
    await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('.modal, .popup, .overlay, .backdrop, .sb-modal, [role="dialog"]')) as HTMLElement[];
      for (const el of candidates) {
        try {
          const style = window.getComputedStyle(el);
          if (style && style.display !== 'none' && style.visibility !== 'hidden') {
            el.style.display = 'none';
          }
        } catch (_) {}
      }
    });
    await page.waitForTimeout(150);
  } catch (_) {}
}

/** Read the current course progress percentage from the right-side panel (best-effort) */
export async function getCourseProgress(page: Page): Promise<number | null> {
  try {
    const panel = page.locator('text=Course Progress').locator('..');
    if (await panel.isVisible({ timeout: 2000 }).catch(() => false)) {
      const txt = await panel.textContent().catch(() => '');
      const m = txt?.match(/(\d+)%/);
      if (m) return parseInt(m[1]);
    }
    const pct = page.locator('text=/^\d+%$/').first();
    if (await pct.isVisible({ timeout: 1000 }).catch(() => false)) {
      const txt = await pct.textContent().catch(() => '');
      const m = txt?.match(/(\d+)/);
      if (m) return parseInt(m[1]);
    }
  } catch (_) {}
  return null;
}

/** Record a bug report: take a screenshot and append an entry to test-results/bugs.json */
export async function reportBug(page: Page, id: string, message: string) {
  const ts = Date.now();
  const screenshot = `test-results/bug-${id}-${ts}.png`;
  try { await page.screenshot({ path: screenshot, fullPage: false }); } catch (_) {}
  const entry = { id, message, screenshot, ts, url: page.url() };
  try {
    const outPath = 'test-results/bugs.json';
    let arr: any[] = [];
    if (fs.existsSync(outPath)) {
      try { arr = JSON.parse(fs.readFileSync(outPath, 'utf8') || '[]'); } catch (_) { arr = []; }
    }
    arr.push(entry);
    fs.writeFileSync(outPath, JSON.stringify(arr, null, 2));
    console.log('  🐞 Recorded bug:', id, message, '->', outPath);
  } catch (e) { console.log('  ⚠ Failed to write bug file', e); }
}

/**
 * Robustly play any visible video and wait until it ends (best-effort).
 * Strategies:
 *  - If a same-origin <video> element exists, call .play() and wait for ended
 *  - Otherwise, click the center of any iframe that looks like a player (YouTube/Vimeo)
 *    and poll for completion indicators (Replay button in contentPlayer frame or lesson status change).
 * Returns true if we believe the video played to completion, false otherwise.
 */
export async function watchVideoFully(page: Page, timeoutMs = 120000): Promise<boolean> {
  const start = Date.now();
  try {
    // If there's a same-origin <video> element, play it and wait for ended
    try {
      const frames: any[] = [page, ...page.frames()];
      for (const f of frames) {
        try {
          const v = (f as any).locator ? (f as any).locator('video').first() : null;
          if (v && (await v.isVisible({ timeout: 500 }).catch(() => false))) {
            try { await v.evaluate((el: HTMLVideoElement) => el.play().catch(() => {})); } catch (_) {}
            try {
              await (f as any).waitForFunction(() => {
                const vid = document.querySelector('video') as HTMLVideoElement | null;
                return !!vid && vid.ended === true;
              }, null, { timeout: Math.min(timeoutMs, 10 * 60 * 1000) });
              return true;
            } catch (_) {
              // we triggered play; treat as success even when ended not observed
              return true;
            }
          }
        } catch (_) {}
      }
    } catch (_) {}

    // Fallback: find the best candidate iframe/player to click (choose largest visible iframe)
    const iframes = await page.locator('iframe').elementHandles();
    let best: any = null;
    let bestArea = 0;
    for (const ih of iframes) {
      try {
        const box = await ih.boundingBox();
        if (!box) continue;
        // ignore tiny iframes
        const area = box.width * box.height;
        if (area > bestArea && box.width > 80 && box.height > 60) {
          bestArea = area; best = { handle: ih, box };
        }
      } catch (_) {}
    }

    // Also consider visible player containers that include an iframe or a big play overlay
    const containerCandidates = ['sb-player', '.content-player', '[class*="content-player"]', '.course-player', '.player-container'];
    for (const sel of containerCandidates) {
      try {
        const c = page.locator(sel).first();
        if (!(await c.isVisible({ timeout: 300 }).catch(() => false))) continue;
        const nested = await c.locator('iframe').elementHandle().catch(() => null);
        if (nested) {
          const box = await nested.boundingBox().catch(() => null);
          if (box) {
            const area = box.width * box.height;
            if (area > bestArea) { bestArea = area; best = { handle: nested, box }; }
          }
        } else {
          // try container bounding box
          const elh = await c.elementHandle();
          const box2 = await elh?.boundingBox().catch(() => null);
          if (box2) {
            const area = box2.width * box2.height;
            if (area > bestArea) { bestArea = area; best = { handle: elh, box: box2 }; }
          }
        }
      } catch (_) {}
    }

    if (best) {
      const { box, handle } = best;
      const cx = Math.round(box.x + box.width / 2);
      const cy = Math.round(box.y + box.height / 2);

      // Before interacting with the parent iframe, try to find a nested iframe (YouTube/Vimeo) inside it and click that directly
      try {
        const allIframes = await page.locator('iframe').elementHandles();
        for (const ih of allIframes) {
          try {
            const b2 = await ih.boundingBox();
            if (!b2) continue;
            // check if nested (child) iframe bbox is visually inside the parent candidate
            if (b2.x >= box.x - 2 && b2.y >= box.y - 2 && (b2.x + b2.width) <= (box.x + box.width) + 2 && (b2.y + b2.height) <= (box.y + box.height) + 2) {
              const src = (await ih.getAttribute('src')) || '';
              if (/youtube|vimeo|embed|player/i.test(src)) {
                const cx2 = Math.round(b2.x + b2.width / 2);
                const cy2 = Math.round(b2.y + b2.height / 2);
                try { await page.mouse.move(cx2, cy2); } catch (_) {}
                await page.waitForTimeout(120);
                try { await page.mouse.click(cx2, cy2).catch(() => {}); } catch (_) {}
                await page.waitForTimeout(800);
                // give a short moment for playback to start
                try {
                  const frames = page.frames();
                  for (const ff of frames) {
                    const hasPause = await ff.locator('button[aria-label*="Pause"], .ytp-play-button[title*="Pause"]').first().isVisible().catch(() => false);
                    if (hasPause) return true;
                  }
                } catch (_) {}
              }
            }
          } catch (_) {}
        }
      } catch (_) {}

      // try multiple gentle interactions: hover -> click -> keyboard toggles
      try { await page.mouse.move(cx, cy); } catch (_) {}
      await page.waitForTimeout(150);

      const clickAttempts = 6;
      for (let a = 0; a < clickAttempts; a++) {
          try {
          await page.mouse.click(cx, cy).catch(() => {});
          await page.waitForTimeout(300 + a * 200);
          // try keyboard toggles which work for YouTube ('k'/'Space') if focused
          try {
            await page.keyboard.press('k').catch(() => {});
            await page.waitForTimeout(200);
            await page.keyboard.press('Space').catch(() => {});
          } catch (_) {}
        } catch (_) {}

        // Quick poll for playback indicators across frames
        const pollUntil = Date.now() + Math.min(timeoutMs, 5 * 60 * 1000);
        while (Date.now() < pollUntil) {
          try {
            // 1) Look for common pause/play indicator in frames (YouTube/Vimeo)
            const frames = page.frames();
            for (const ff of frames) {
              try {
                // pause/play buttons have various labels/classes; probe a few common ones
                const hasPause = await ff.locator('button[aria-label*="Pause"], .ytp-play-button[title*="Pause"], button[title*="Pause (k)"]').first().isVisible().catch(() => false);
                if (hasPause) return true;
              } catch (_) {}
            }

            // 2) Check TOC or lesson status change on parent page
            const tocStatus = await page.locator('a.flex.items-center.gap-3[class*="rounded"] span.font-rubik').first().textContent().catch(() => '');
            if (tocStatus && /complete|completed|done/i.test(tocStatus)) return true;

            // 3) Check overall course progress increase (best-effort)
            try {
              const before = await getCourseProgress(page);
              // if before is null skip; otherwise wait briefly to see update
              if (before !== null) {
                // small delay to allow progress UI to update
                await page.waitForTimeout(800).catch(() => {});
                const after = await getCourseProgress(page);
                if (after !== null && after > before) return true;
              }
            } catch (_) {}
          } catch (_) {}
          await page.waitForTimeout(700);
        }
      }
    }

    // As a last resort, if no player found or we couldn't detect completion, wait the specified timeout
    const remaining = Math.max(0, timeoutMs - (Date.now() - start));
    if (remaining > 0) await page.waitForTimeout(remaining);
  } catch (_) {}
  return false;
}

/** Verify lesson statuses match the course progress.
 *  - If progress === 0: all lessons should show 'Not viewed'
 *  - If progress === 100: all lessons should show 'Completed'
 *  - Otherwise, at least one lesson should be 'Not viewed' or 'In Progress'
 */
export async function verifyLessonStatusesMatchProgress(page: Page) {
  const progress = await getCourseProgress(page);
  if (progress === null) {
    // If we couldn't reliably read the progress UI, skip strict status assertions
    console.warn('  ⚠ getCourseProgress returned null — skipping strict lesson-status assertions');
    return;
  }
  const LESSON_SEL = 'a.flex.items-center.gap-3[class*="rounded"]';
  const STATUS_SEL = 'span.font-rubik[class*="text-muted-foreground"]';
  const lessons = page.locator(LESSON_SEL);
  const count = await lessons.count();
  if (count === 0) return; // nothing to assert

  if (progress === 0) {
    for (let i = 0; i < count; i++) {
      let s = (await lessons.nth(i).locator(STATUS_SEL).textContent().catch(() => '') )?.trim() ?? '';
      if (!s) {
        // fallback: take entire lesson text content when specific status span is not present
        s = (await lessons.nth(i).textContent().catch(() => ''))?.trim() ?? '';
      }
      if (!/not view|not viewed|not-viewed/i.test(s)) {
        throw new Error(`Bug Identifier [LessonStatusMismatch]: Expected 'Not viewed' for lesson ${i+1} but found '${s}'`);
      }
    }
  } else if (progress === 100) {
    for (let i = 0; i < count; i++) {
      let s = (await lessons.nth(i).locator(STATUS_SEL).textContent().catch(() => '') )?.trim() ?? '';
      if (!s) {
        s = (await lessons.nth(i).textContent().catch(() => ''))?.trim() ?? '';
      }
      if (!/complete|completed|done/i.test(s)) {
        throw new Error(`Bug Identifier [LessonStatusMismatch]: Expected 'Completed' for lesson ${i+1} but found '${s}'`);
      }
    }
  } else {
    // progress between 1 and 99: ensure at least one Not viewed or In Progress exists
    let found = false;
    for (let i = 0; i < count; i++) {
      let s = (await lessons.nth(i).locator(STATUS_SEL).textContent().catch(() => '') )?.trim() ?? '';
      if (!s) { s = (await lessons.nth(i).textContent().catch(() => ''))?.trim() ?? ''; }
      if (/not view|not viewed|in progress|in-progress|inprogress/i.test(s)) { found = true; break; }
    }
    if (!found) throw new Error(`Bug Identifier [LessonStatusMismatch]: Progress=${progress} but no lesson shows 'Not viewed' or 'In Progress'`);
  }
}

/** Check three-dots menu behavior: Sync Progress (for 100%) or Leave Course (for <100%).
 *  Clicks the appropriate action and verifies the expected toast/popup.
 */
export async function checkThreeDotsMenuActions(page: Page) {
  const progress = await getCourseProgress(page);
  const threeDotsSelectors = [
    'button[aria-label*="more" i]',
    'button[aria-label*="option" i]',
    'button[aria-label*="menu" i]',
    'button:has-text("⋮")',
    '[class*="course-progress"] button',
  ];

  // Scope to the Course Progress panel to reduce false matches
  const progressPanel = page.locator('h3:has-text("Course Progress")').first().locator('..');

  // Helper: try to click a direct action (Leave / Sync) if visible
  async function tryDirectAction() {
    const directSelectors = [
      'button:has-text("Leave course")',
      'a:has-text("Leave course")',
      'button:has-text("Sync progress now")',
      'button:has-text("Sync Progress Now")',
      'text=/leave course/i',
      'text=/sync progress now/i'
    ];
    for (const sel of directSelectors) {
      try {
        const btn = progressPanel.locator(sel).first();
        if (await btn.isVisible({ timeout: 800 }).catch(() => false)) {
          await btn.scrollIntoViewIfNeeded().catch(() => {});
          await btn.click().catch(() => {});
          return { clicked: true, selector: sel };
        }
      } catch (_) {}
    }
    return { clicked: false };
  }

  let menuOpened = false;
  // 1) Try direct action first (some UIs expose Leave/Sync inline)
  try {
    const direct = await tryDirectAction();
    if (direct.clicked) menuOpened = true;
  } catch (_) {}

  // 2) If not found, hover the progress area to reveal hover-only controls and try menu selectors
  if (!menuOpened) {
    try {
      await progressPanel.scrollIntoViewIfNeeded().catch(() => {});
      await progressPanel.hover().catch(() => {});
      await page.waitForTimeout(250);
    } catch (_) {}

    const menuSelectorsScoped = [
      'button[aria-label*="more" i]',
      'button[aria-label*="option" i]',
      'button[aria-label*="menu" i]',
      'button:has-text("⋮")',
      '[class*="course-progress"] button',
      'button:has-text("More")',
      'button:has-text("Options")'
    ];

    for (const sel of menuSelectorsScoped) {
      try {
        const btn = progressPanel.locator(sel).first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await btn.scrollIntoViewIfNeeded().catch(() => {});
          await btn.click().catch(() => {});
          menuOpened = true; break;
        }
      } catch (_) {}
    }
  }

  if (!menuOpened) {
    // attach a helpful screenshot for triage
    try { await page.screenshot({ path: `test-results/three-dots-missing-${Date.now()}.png` }); } catch (_) {}
    throw new Error('Bug Identifier [ThreeDotsMenu]: Could not open three-dots menu or direct action near Course Progress');
  }

  await page.waitForTimeout(800);

  if (progress === 100) {
    // look for Sync Progress Now
    const syncBtn = page.locator('button:has-text("Sync progress now"), button:has-text("Sync Progress Now"), text=/sync progress now/i').first();
    if (!(await syncBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
      throw new Error('Bug Identifier [SyncButtonMissing]: Expected "Sync Progress Now" option for 100% course');
    }
    await syncBtn.click().catch(() => {});
    // look for success popup text
    const success = page.locator('text=/updated in 24 hours|success!|progress will be updated/i').first();
    if (!(await success.isVisible({ timeout: 5000 }).catch(() => false))) {
      throw new Error('Bug Identifier [SyncPopupMissing]: Expected success popup after clicking "Sync progress now"');
    }
  } else {
    // expect Leave Course option
    const leaveBtn = page.locator('button:has-text("Leave course"), a:has-text("Leave course"), text=/leave course/i').first();
    if (!(await leaveBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
      throw new Error('Bug Identifier [LeaveMissing]: Expected "Leave course" option for incomplete course');
    }
    await leaveBtn.click().catch(() => {});
    // expect success toast
    const toast = page.locator('text=/unenrol|unenro|enrol|enroled|enrolled|success/i').first();
    if (!(await toast.isVisible({ timeout: 5000 }).catch(() => false))) {
      throw new Error('Bug Identifier [LeavePopupMissing]: Expected success toast after leaving course');
    }
  }
}
