import { Page, Locator, expect } from '@playwright/test';
import { dismissModal, consumeContent } from './contentHelper';
import { dismissAllModals } from './modal';

export const SIDEBAR_LESSONS =
  'aside a[href*="/content/"], [role="complementary"] a[href*="/content/"]';

export async function expandAllUnits(page: Page): Promise<void> {
  await page.locator('aside button[data-state]').first()
    .waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

  const collapsedBtns = page.locator('aside button[data-state="closed"]');
  let remaining = await collapsedBtns.count().catch(() => 0);
  let safety = 0;
  while (remaining > 0 && safety < 30) {
    safety++;
    // Dismiss any modal before clicking — its overlay intercepts aside button clicks.
    const blocker = page.locator('[role="dialog"]').first();
    if (await blocker.isVisible({ timeout: 200 }).catch(() => false)) {
      await dismissModal(page, 1000);
      await page.waitForTimeout(300);
    }
    await collapsedBtns.first().scrollIntoViewIfNeeded().catch(() => {});
    await collapsedBtns.first().click();
    await page.waitForTimeout(400);
    remaining = await collapsedBtns.count().catch(() => 0);
  }
  console.log(`  All course units expanded (${safety} click(s))`);
}

export async function detectContentType(page: Page): Promise<string> {
  let ytFrameObj = page.frames().find((f) => f.url().includes('youtube.com/embed'));
  if (!ytFrameObj) {
    await page.waitForEvent('framenavigated', {
      predicate: (f) => f.url().includes('youtube.com/embed'),
      timeout: 2000,
    }).catch(() => {});
    ytFrameObj = page.frames().find((f) => f.url().includes('youtube.com/embed'));
  }
  const isYouTube = !!ytFrameObj
    || await page.locator('iframe[src*="youtube"]').isVisible({ timeout: 500 }).catch(() => false);

  if (isYouTube) return 'youtube';

  const [hasPdf, hasQuml, hasEcml, hasVideo, hasHtml] = await Promise.all([
    page.locator('sunbird-pdf-player').isVisible({ timeout: 3000 }).catch(() => false),
    page.locator('sunbird-quml-player').isVisible({ timeout: 3000 }).catch(() => false),
    page.locator('iframe[name="contentPlayer"], iframe#contentPlayer').isVisible({ timeout: 3000 }).catch(() => false),
    page.locator('video').first().isVisible({ timeout: 1500 }).catch(() => false),
    page.locator('iframe').first().isVisible({ timeout: 1500 }).catch(() => false),
  ]);
  if (hasPdf) return 'pdf';
  if (hasQuml) return 'quml';
  if (hasEcml) return 'ecml';
  if (hasVideo) return 'video';
  if (hasHtml) {
    // Distinguish EPUB (needs right-arrow navigation) from generic HTML iframe content.
    const isEpub = await page.locator('sunbird-epub-player').isVisible({ timeout: 500 }).catch(() => false)
      || await page.evaluate(() => {
        const iframes = Array.from(document.querySelectorAll('iframe'));
        return iframes.some((f) => {
          const src = (f.getAttribute('src') ?? '').toLowerCase();
          const name = (f.getAttribute('name') ?? '').toLowerCase();
          return src.includes('epub') || name.includes('epub');
        });
      }).catch(() => false);
    return isEpub ? 'epub' : 'html';
  }
  return 'unknown';
}

interface ConsumeAllLessonsOptions {
  waitSidebarCompletion?: boolean;
}

export async function consumeAllLessons(
  page: Page,
  origin: string,
  lessonAnchors: Locator,
  options: ConsumeAllLessonsOptions = {},
): Promise<string[]> {
  const { waitSidebarCompletion = true } = options;
  const stuckLessons: string[] = [];

  // Status labels (Completed / In Progress / not viewed) come from an async API call.
  // Wait until at least one anchor shows a status before snapshotting completion state,
  // otherwise initiallyCompleted will always be false and we'll navigate to every lesson.
  await lessonAnchors
    .filter({ hasText: /completed|in progress|not viewed/i })
    .first()
    .waitFor({ state: 'visible', timeout: 15000 })
    .catch(() => {});

  // Radix Collapsible removes collapsed unit content from the DOM entirely.
  // Wait until the count stabilizes so all expanded unit lesson links are mounted.
  let prevCount = -1;
  for (let s = 0; s < 8; s++) {
    await page.waitForTimeout(500);
    const cnt = await lessonAnchors.count().catch(() => 0);
    if (cnt > 0 && cnt === prevCount) break;
    prevCount = cnt;
  }

  const lessonCount = await lessonAnchors.count();
  const lessons: { href: string; title: string; initiallyCompleted: boolean }[] = [];
  for (let j = 0; j < lessonCount; j++) {
    const anchor = lessonAnchors.nth(j);
    const href = await anchor.getAttribute('href') ?? '';
    const rawText = await anchor.textContent() ?? '';
    const title = rawText.replace(/not viewed|in progress|completed|\d+\/\d+.*/gi, '').trim().slice(0, 60);
    // Use CSS class to detect completed status — immune to lesson titles containing "completed"
    const initiallyCompleted = await anchor
      .locator('.text-sunbird-status-completed-text')
      .count()
      .catch(() => 0) > 0;
    const statusLabel = initiallyCompleted
      ? 'completed'
      : await anchor.locator('.text-sunbird-status-ongoing-border').count().catch(() => 0) > 0
        ? 'in progress'
        : 'not viewed';
    console.log(`    Lesson "${title}" — status: ${statusLabel}`);
    lessons.push({ href, title, initiallyCompleted });
  }

  const remaining = lessons.filter((l) => !l.initiallyCompleted).length;
  console.log(`  Course has ${lessons.length} lessons (${remaining} incomplete)`);

  for (let i = 0; i < lessons.length; i++) {
    const { href, title, initiallyCompleted } = lessons[i];

    if (initiallyCompleted) {
      console.log(`  [${i + 1}/${lessons.length}] Already completed (sidebar), skipping: ${title}`);
      continue;
    }
    const contentId = href.split('/content/').pop() ?? '';

    const lessonPath = href.startsWith('http') ? new URL(href).pathname : href;
    const absoluteUrl = `${origin}${lessonPath}`;
    console.log(`  [${i + 1}/${lessons.length}] Navigating to: ${absoluteUrl}`);
    await page.goto(absoluteUrl);
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    console.log(`  [${i + 1}/${lessons.length}] Loaded: ${page.url()}`);

    // If the portal redirected away from the lesson (e.g. expired batch, unenrolled),
    // skip rather than waiting 30 s for a player that will never appear.
    if (!page.url().includes('/content/')) {
      console.log(`  [${i + 1}/${lessons.length}] Redirected to ${page.url()} — skipping: ${title}`);
      continue;
    }

    await dismissAllModals(page, 3000);

    // Re-expand all units after the hard reload — Radix Collapsible removes
    // collapsed content from the DOM on each page load, so the consumed lesson's
    // anchor won't be in the DOM for the sidebar completion check unless we expand
    // its unit again here.
    await expandAllUnits(page);
    // Dismiss any dialog that opened during unit expansion (TanStack refetch lag).
    await dismissAllModals(page, 1000);

    await page.locator(SIDEBAR_LESSONS).first()
      .waitFor({ state: 'visible', timeout: 15000 })
      .catch(() => {});

    const lessonLink = page.locator(
      `aside a[href*="${contentId}"], [role="complementary"] a[href*="${contentId}"]`
    ).first();
    const isNowCompleted = await lessonLink
      .locator('.text-sunbird-status-completed-text')
      .count()
      .catch(() => 0) > 0;
    if (isNowCompleted) {
      console.log(`  [${i + 1}/${lessons.length}] Already completed, skipping: ${title}`);
      continue;
    }

    console.log(`  [${i + 1}/${lessons.length}] Consuming: ${title}`);

    const player = page.locator('iframe, video, sunbird-pdf-player, [class*="player"]').first();
    try {
      await player.waitFor({ state: 'visible', timeout: 30000 });
    } catch {
      const closed = page.isClosed();
      console.log(`    Player not visible (page closed=${closed}) — skipping this lesson`);
      if (closed) continue;
    }

    await page.locator('sunbird-quml-player, sunbird-pdf-player').first()
      .waitFor({ state: 'visible', timeout: 5000 })
      .catch(() => {});

    const contentType = await detectContentType(page);
    console.log(`    Content type: ${contentType}`);
    await consumeContent(page, contentType, { navigateBack: false });
    console.log(`  [${i + 1}/${lessons.length}] consumeContent returned. URL now: ${page.url()}`);

    // If the course already hit 100%, skip the per-lesson sidebar wait entirely.
    // The addLocatorHandler for "congratulations" loops indefinitely when the
    // course-completion dialog appears, so we must exit before waitSidebarCompletion.
    const progressNow = await page
      .getByRole('progressbar', { name: /course progress/i })
      .getAttribute('aria-valuenow').catch(() => null);
    if (progressNow === '100') {
      console.log(`  [${i + 1}/${lessons.length}] Course is 100% — exiting lesson loop.`);
      await dismissAllModals(page);
      break;
    }

    // 2 s safety net — consumeContent already waits 6 s for the rating dialog internally.
    await dismissAllModals(page);
    // Re-expand units — Radix Collapsible may have collapsed them during consumption,
    // removing lesson links from the DOM. waitSidebarCompletion can't find the link otherwise.
    await expandAllUnits(page);
    const afterCount = await page.locator(SIDEBAR_LESSONS).count().catch(() => 0);
    console.log(`  [${i + 1}/${lessons.length}] Sidebar links visible after expand: ${afterCount}`);
    console.log(`  [${i + 1}/${lessons.length}] Moving to next lesson`);

    if (waitSidebarCompletion) {
      const statusChanged = await page
        .locator(`aside a[href*="${contentId}"], [role="complementary"] a[href*="${contentId}"]`)
        .first()
        .filter({ has: page.locator('.text-sunbird-status-completed-text') })
        .waitFor({ timeout: 20000 })
        .then(() => true)
        .catch(() => false);
      console.log(`  [${i + 1}/${lessons.length}] Sidebar status updated to Completed: ${statusChanged}`);
      if (!statusChanged) {
        const pb = await page
          .getByRole('progressbar', { name: /course progress/i })
          .getAttribute('aria-valuenow').catch(() => null);
        if (pb === '100') {
          console.log(`  [${i + 1}/${lessons.length}] Sidebar stale but course is 100% — not marking as stuck`);
        } else {
          console.log(`  Warning: lesson "${title}" sidebar did not update to Completed within 20 s (authoritative check is the progress bar)`);
          stuckLessons.push(title);
        }
      }
      // The CourseCompletionDialog fires when TanStack Query refetches and the
      // progress transitions to 100% — that same refetch is what resolves the
      // waitFor above, so the dialog may have opened while we were waiting.
      // Dismiss it here before navigating to the next lesson (or returning).
      await dismissAllModals(page, 1000);
    } else {
      await page.waitForTimeout(1500);
    }
  }
  return stuckLessons;
}

// Unenrolls the user from the course currently open in the browser.
// Must be called from the batch-root URL (where the three-dots menu is visible).
export async function leaveCourse(page: Page): Promise<void> {
  const menuTrigger = page.locator('button[data-edataid="course-progress-menu-toggle"]');
  if (!(await menuTrigger.isVisible({ timeout: 5000 }).catch(() => false))) {
    console.log('  [leaveCourse] menu trigger not visible — skipping');
    return;
  }
  await menuTrigger.click();
  const leaveItem = page.locator('[data-edataid="course-unenroll"]');
  if (!(await leaveItem.isVisible({ timeout: 3000 }).catch(() => false))) {
    await page.keyboard.press('Escape');
    console.log('  [leaveCourse] leave item not found — skipping');
    return;
  }
  await leaveItem.click();
  const confirmBtn = page.locator('[data-edataid="confirm-dialog-confirm"]');
  await expect(confirmBtn).toBeVisible({ timeout: 5000 });
  await confirmBtn.click();
  await page.waitForURL((url) => !url.pathname.includes('/batch/'), { timeout: 15000 }).catch(() => {});
  console.log('  [leaveCourse] successfully unenrolled');
}

// Navigates to /explore, finds a course the user has NOT enrolled in (skipping any IDs in
// skipCollectionIds), selects an active batch, joins, and returns true on success.
// Use this for retry logic when the currently enrolled course has a portal bug.
export async function joinFreshCourse(
  page: Page,
  origin: string,
  skipCollectionIds: Set<string> = new Set(),
): Promise<boolean> {
  await page.goto(`${origin}/explore`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const coursesCheckbox = page.getByRole('checkbox', { name: /^courses$/i });
  if (await coursesCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
    await coursesCheckbox.click();
    await page.waitForURL((url) => url.search.includes('primaryCategory=Course'), { timeout: 10000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  }

  const courseCards = page.locator('a[href*="/collection/"]');
  await courseCards.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  const cardCount = await courseCards.count();

  const courseHrefs: string[] = [];
  for (let i = 0; i < cardCount; i++) {
    const h = await courseCards.nth(i).getAttribute('href') ?? '';
    if (h) courseHrefs.push(h);
  }

  if (courseHrefs.length === 0) {
    console.log('  joinFreshCourse: no course links found on explore page');
    return false;
  }

  for (const href of courseHrefs) {
    const coursePath = href.startsWith('http') ? new URL(href).pathname : href;

    const collectionId = coursePath.split('/collection/')[1]?.split('/')[0] ?? '';
    if (collectionId && skipCollectionIds.has(collectionId)) {
      console.log(`  joinFreshCourse: skipping broken course ${collectionId}`);
      continue;
    }

    await page.goto(`${origin}${coursePath}`, { waitUntil: 'load' });

    const isEnrolled = await page.waitForURL(
      (u) => u.pathname.includes('/batch/'),
      { timeout: 8000 }
    ).then(() => true).catch(() => false);

    if (isEnrolled) {
      console.log(`  joinFreshCourse: already enrolled in ${href}, skipping`);
      continue;
    }

    const hasBatchSelect = await page.getByTestId('batch-select')
      .isVisible({ timeout: 4000 }).catch(() => false);

    if (!hasBatchSelect) {
      const noBatches = await page.getByText(/no batches available/i)
        .isVisible({ timeout: 1000 }).catch(() => false);
      console.log(`  joinFreshCourse: no join UI for ${href} (no-batches: ${noBatches}) — skipping`);
      continue;
    }

    console.log(`  joinFreshCourse: joining ${href}`);
    await page.getByTestId('batch-select').click();

    const opts = page.getByRole('option');
    await opts.first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(300);
    const optCount = await opts.count().catch(() => 0);
    const todayMs = Date.now();
    let activeBatchSelected = false;

    for (let o = 0; o < optCount; o++) {
      const text = (await opts.nth(o).textContent() ?? '').trim();
      if (/no end date/i.test(text)) {
        await opts.nth(o).click({ force: true }).catch(() => page.keyboard.press('Enter'));
        activeBatchSelected = true;
        break;
      }
      const bm = text.match(/Timeline:\s*(\d{1,2}\s+\w+\s+\d{4})\s*[–\-]\s*(\d{1,2}\s+\w+\s+\d{4})/);
      if (bm) {
        const sd = new Date(bm[1]).getTime();
        const ed = new Date(bm[2]).getTime();
        if (!isNaN(sd) && !isNaN(ed) && sd <= todayMs && ed >= todayMs) {
          await opts.nth(o).click({ force: true }).catch(() => page.keyboard.press('Enter'));
          activeBatchSelected = true;
          break;
        }
      }
    }
    if (!activeBatchSelected) {
      await opts.first().click({ force: true }).catch(() => page.keyboard.press('Enter'));
    }
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /join the course/i }).click();
    await page.waitForURL((url) => url.pathname.includes('/batch/'), { timeout: 20000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    console.log(`  joinFreshCourse: enrolled — URL: ${page.url()}`);
    return true;
  }

  console.log('  joinFreshCourse: no joinable unenrolled course found');
  return false;
}

// Checks whether the current course batch has expired. If it has, navigates to the Explore
// page to find an active-batch course (enrolled or joinable) and lands on its first lesson.
// If the batch is still active, returns immediately as a no-op.
export async function redirectToActiveBatchCourse(
  page: Page,
  exploreUrl: string,
  origin: string,
): Promise<void> {
  console.log(`  [redirectToActiveBatchCourse] checking batch end date on: ${page.url()}`);
  const batchEndText = await page.getByText(/Batch ends on/i).first()
    .textContent({ timeout: 3000 }).catch(() => '');
  console.log(`  [redirectToActiveBatchCourse] batchEndText="${batchEndText?.trim()}"`);
  const endMatch = batchEndText?.match(/Batch ends on[:\s]+(.+)/i);
  if (!endMatch) {
    console.log('  [redirectToActiveBatchCourse] no batch end date found — batch is open-ended, staying on current course');
    return;
  }

  const batchEndDate = new Date(endMatch[1].trim());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(batchEndDate.getTime()) || batchEndDate >= today) {
    console.log(`  [redirectToActiveBatchCourse] batch is still active (ends ${endMatch[1].trim()}) — staying on current course`);
    return;
  }

  console.log(`  Batch ended on ${endMatch[1].trim()} — finding an active-batch course on Explore`);

  await page.goto(exploreUrl);
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

  const coursesCheckbox = page.getByRole('checkbox', { name: /^courses$/i });
  if (await coursesCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
    await coursesCheckbox.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  }

  const courseCards = page.locator('a[href*="/collection/"]');
  await courseCards.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  const cardCount = await courseCards.count();
  const courseHrefs: string[] = [];
  for (let c = 0; c < cardCount; c++) {
    const href = await courseCards.nth(c).getAttribute('href') ?? '';
    if (href) courseHrefs.push(href);
  }

  for (const href of courseHrefs) {
    const coursePath = href.startsWith('http') ? new URL(href).pathname : href;
    await page.goto(`${origin}${coursePath}`);
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

    const enrolledRedirect = await page.waitForURL(
      (url) => url.pathname.includes('/batch/'),
      { timeout: 6000 }
    ).then(() => true).catch(() => false);

    if (enrolledRedirect) {
      const et = await page.getByText(/Batch ends on/i).first().textContent().catch(() => '');
      const em = et?.match(/Batch ends on[:\s]+(.+)/i);
      if (em) {
        const ed = new Date(em[1].trim());
        const tod = new Date(); tod.setHours(0, 0, 0, 0);
        if (!isNaN(ed.getTime()) && ed >= tod) {
          console.log(`  Found enrolled active-batch course: ${href}`);
          const firstLesson = page.locator(SIDEBAR_LESSONS).first();
          if (await firstLesson.isVisible({ timeout: 5000 }).catch(() => false)) {
            const lessonHref = await firstLesson.getAttribute('href') ?? '';
            if (lessonHref) {
              const lPath = lessonHref.startsWith('http') ? new URL(lessonHref).pathname : lessonHref;
              await page.goto(`${origin}${lPath}`);
              await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
            }
          }
          return;
        }
      }
      continue; // enrolled but expired
    }

    // Not enrolled — look for a join button with an active batch
    const joinBtn = page.locator('[data-edataid="join-course-btn"]');
    if (!(await joinBtn.isVisible({ timeout: 3000 }).catch(() => false))) continue;
    if (await page.getByText(/no batches available/i).isVisible({ timeout: 1000 }).catch(() => false)) continue;

    const batchDropdown = page.getByTestId('batch-select');
    await batchDropdown.click();
    const opts = page.getByRole('option');
    await opts.first().waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(300);
    const optCount = await opts.count().catch(() => 0);
    let activeBatchSelected = false;
    for (let o = 0; o < optCount; o++) {
      const optText = (await opts.nth(o).textContent() ?? '').trim();
      if (/no end date/i.test(optText)) {
        await opts.nth(o).click({ force: true }).catch(() => page.keyboard.press('Enter'));
        activeBatchSelected = true;
        break;
      }
      const bm = optText.match(/Timeline:\s*(\d{1,2}\s+\w+\s+\d{4})\s*[–\-]\s*(\d{1,2}\s+\w+\s+\d{4})/);
      if (bm) {
        const sd = new Date(bm[1]); const ed = new Date(bm[2]);
        const tod = new Date(); tod.setHours(0, 0, 0, 0);
        if (sd <= tod && ed >= tod) {
          await opts.nth(o).click({ force: true }).catch(() => page.keyboard.press('Enter'));
          activeBatchSelected = true;
          break;
        }
      }
    }
    if (!activeBatchSelected) { await page.keyboard.press('Escape'); continue; }

    const joinCourseBtn = page.getByRole('button', { name: /join the course/i });
    await joinCourseBtn.waitFor({ timeout: 5000 }).catch(() => {});
    await joinCourseBtn.click();
    await page.waitForURL(
      (url) => url.pathname.includes('/batch/') && url.pathname.includes('/content/'),
      { timeout: 20000 }
    ).catch(() => {});
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    console.log(`  Joined and navigated to active-batch course: ${href}`);
    return;
  }

  console.log('  Warning: no active-batch course found — test will likely fail on sidebar assertion');
}

// Searches through courseHrefs for a course user2 hasn't joined that has an available batch.
// Returns true with the page positioned on that course page (ready for batch selection).
// If none found, runs the leave/sync fallback and returns false so the caller can skip the
// rest of the enrollment flow.
export async function findJoinableCourse(
  page: Page,
  courseHrefs: string[],
  origin: string,
): Promise<boolean> {
  for (const href of courseHrefs) {
    const coursePath = href.startsWith('http') ? new URL(href).pathname : href;
    await page.goto(`${origin}${coursePath}`, { waitUntil: 'domcontentloaded' });

    // SEQUENTIAL enrollment check — do NOT use Promise.race here.
    //
    // The problem with a race: the course overview page renders the batch-select
    // dropdown during the initial React render BEFORE the enrollment API responds.
    // A race sees that brief flash and returns 'joinable' for already-enrolled
    // courses, causing the test to re-enroll in the same course every run.
    //
    // Sequential approach:
    //   1. Wait up to 8 s for the React Router redirect to /batch/ (enrolled courses
    //      redirect once the enrollment API confirms the user is enrolled).
    //   2. Only if no redirect occurred do we then check for the join UI — at that
    //      point the API has already confirmed NOT enrolled.
    const isEnrolled = await page.waitForURL(
      (u) => u.pathname.includes('/batch/'),
      { timeout: 8000 }
    ).then(() => true).catch(() => false);

    if (isEnrolled) {
      console.log(`  Already enrolled in ${href}, skipping`);
      continue;
    }

    // URL stayed at the collection path — check that join UI is actually present
    // (rules out "no batches available" and error states).
    const hasBatchSelect = await page.getByTestId('batch-select')
      .isVisible({ timeout: 4000 }).catch(() => false);
    const hasJoinBtn = !hasBatchSelect && await page.locator('[data-edataid="join-course-btn"]')
      .isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasBatchSelect && !hasJoinBtn) {
      const noBatches = await page.getByText(/no batches available for enrollment/i)
        .isVisible({ timeout: 1000 }).catch(() => false);
      console.log(`  No join UI for ${href} (no-batches: ${noBatches}) — skipping`);
      continue;
    }

    console.log(`  Found joinable course: ${href}`);
    return true;
  }

  // No joinable course — run fallback: leave one non-100% course; sync one 100% course.
  console.log('No joinable course found — performing fallback actions from Explore page courses');
  let leaveDone = false;
  let syncDone = false;

  for (const href of courseHrefs) {
    if (leaveDone && syncDone) break;

    const coursePath = href.startsWith('http') ? new URL(href).pathname : href;
    await page.goto(`${origin}${coursePath}`);
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

    await page.waitForURL((url) => url.pathname.includes('/batch/'), { timeout: 10000 }).catch(() => {});
    if (!page.url().includes('/batch/')) continue;

    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(1000);

    const menuTrigger = page.locator('button[data-edataid="course-progress-menu-toggle"]');
    if (!(await menuTrigger.isVisible({ timeout: 5000 }).catch(() => false))) continue;

    const progressVal = await page.locator('[role="progressbar"]').first()
      .getAttribute('aria-valuenow').catch(() => null);
    const is100 = progressVal === '100';

    if (!is100 && !leaveDone) {
      await menuTrigger.click();
      const leaveItem = page.locator('[data-edataid="course-unenroll"]');
      if (!(await leaveItem.isVisible({ timeout: 3000 }).catch(() => false))) {
        await page.keyboard.press('Escape'); continue;
      }
      await leaveItem.click();
      const confirmBtn = page.locator('[data-edataid="confirm-dialog-confirm"]');
      await expect(confirmBtn).toBeVisible({ timeout: 5000 });
      await confirmBtn.click();
      await page.waitForURL((url) => !url.pathname.includes('/batch/'), { timeout: 15000 }).catch(() => {});
      console.log('  Successfully left a non-completed course');
      leaveDone = true;
    } else if (is100 && !syncDone) {
      await menuTrigger.click();
      const syncItem = page.locator('[data-edataid="course-force-sync"]');
      if (!(await syncItem.isVisible({ timeout: 3000 }).catch(() => false))) {
        await page.keyboard.press('Escape'); continue;
      }
      await syncItem.click();
      await page.getByText(/your course progress has been updated/i)
        .waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      console.log('  Successfully synced course progress');
      syncDone = true;
    }
  }

  return false;
}

export async function findAndSeedInProgressCourse(
  page: Page,
  origin: string,
): Promise<boolean> {
  // Load the explore page and filter by Courses so we have a concrete list.
  await page.goto(`${origin}/explore`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const coursesCheckbox = page.getByRole('checkbox', { name: /^courses$/i });
  if (await coursesCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
    await coursesCheckbox.click();
    await page.waitForURL((url) => url.search.includes('primaryCategory=Course'), { timeout: 10000 })
      .catch(() => {});
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  }

  const courseCards = page.locator('a[href*="/collection/"]');
  await courseCards.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  const cardCount = await courseCards.count();

  const courseHrefs: string[] = [];
  for (let i = 0; i < cardCount; i++) {
    const h = await courseCards.nth(i).getAttribute('href') ?? '';
    if (h) courseHrefs.push(h);
  }

  if (courseHrefs.length === 0) {
    console.log('  findAndSeedInProgressCourse: no course links found on explore page');
    return false;
  }

  // Pass 1 — find an already-enrolled course with < 100% server-side progress
  //           and at least one incomplete lesson to seed "Continue from where you left".
  for (const href of courseHrefs) {
    const coursePath = href.startsWith('http') ? new URL(href).pathname : href;
    await page.goto(`${origin}${coursePath}`, { waitUntil: 'load' });

    // SEQUENTIAL enrollment check — do NOT use Promise.race here.
    // Problem: course overview renders batch-select during initial React render BEFORE
    // enrollment API responds. Race sees that brief flash → returns 'joinable' for
    // already-enrolled courses → Pass 1 never finds any enrolled course.
    const isEnrolledP1 = await page.waitForURL(
      (u) => u.pathname.includes('/batch/'),
      { timeout: 8000 }
    ).then(() => true).catch(() => false);

    // Pass 1 only cares about enrolled courses — skip anything else.
    if (!isEnrolledP1) continue;

    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Settle on the batch root
    const batchUrl = page.url().replace(/\/content\/[^/?#]+.*$/, '');
    if (page.url() !== batchUrl) {
      await page.goto(batchUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
    }

    // Skip expired batches
    const batchEndText = await page.getByText(/Batch ends on/i).first()
      .textContent().catch(() => '');
    const endMatch = batchEndText?.match(/Batch ends on[:\s]+(.+)/i);
    if (endMatch) {
      const endDate = new Date(endMatch[1].trim());
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (!isNaN(endDate.getTime()) && endDate < today) {
        console.log(`  Skipping expired batch: ${batchUrl}`);
        continue;
      }
    }

    // Skip 100% courses
    const progressVal = await page
      .getByRole('progressbar', { name: /course progress/i })
      .getAttribute('aria-valuenow')
      .catch(() => null);
    if (progressVal === null || progressVal === '100') {
      console.log(`  Skipping ${progressVal ?? 'unknown'}% course: ${batchUrl}`);
      continue;
    }

    await dismissAllModals(page);
    await expandAllUnits(page);

    // Try the aside-scoped selector first; if units didn't expand (timing or layout
    // difference), fall back to any lesson link on the page.
    let anchors = page.locator(SIDEBAR_LESSONS);
    await anchors.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    if (await anchors.count().catch(() => 0) === 0) {
      anchors = page.locator('a[href*="/content/"]');
      await anchors.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    }

    let prevCount = -1;
    for (let s = 0; s < 8; s++) {
      await page.waitForTimeout(500);
      const cnt = await anchors.count().catch(() => 0);
      if (cnt > 0 && cnt === prevCount) break;
      prevCount = cnt;
    }

    const totalAnchors = await anchors.count();
    for (let k = 0; k < totalAnchors; k++) {
      const anchor = anchors.nth(k);
      const isCompleted = await anchor
        .locator('.text-sunbird-status-completed-text')
        .count()
        .catch(() => 0) > 0;
      if (isCompleted) continue;

      const lessonHref = await anchor.getAttribute('href') ?? '';
      if (!lessonHref) continue;

      const lessonPath = lessonHref.startsWith('http')
        ? new URL(lessonHref).pathname
        : lessonHref;
      console.log(`  findAndSeedInProgressCourse: seeding enrolled course → ${lessonPath}`);
      await page.goto(`${origin}${lessonPath}`, { waitUntil: 'domcontentloaded' });
      return true;
    }
    console.log(`  All lessons completed in sidebar for ${batchUrl} (progress=${progressVal}%)`);
  }

  // Pass 2 — no in-progress enrolled course found; enroll in the first joinable course
  //           so it becomes the "Continue from where you left" target.
  console.log('  findAndSeedInProgressCourse: no in-progress enrolled course — enrolling in a joinable one');
  for (const href of courseHrefs) {
    const coursePath = href.startsWith('http') ? new URL(href).pathname : href;
    await page.goto(`${origin}${coursePath}`, { waitUntil: 'load' });

    // SEQUENTIAL enrollment check — same pattern as findJoinableCourse.
    // Wait for URL redirect first; if it redirects the course is already enrolled.
    const isEnrolledP2 = await page.waitForURL(
      (u) => u.pathname.includes('/batch/'),
      { timeout: 8000 }
    ).then(() => true).catch(() => false);

    if (isEnrolledP2) {
      console.log(`  Pass 2: already enrolled in ${href}, skipping`);
      continue;
    }

    const hasBatchSelectP2 = await page.getByTestId('batch-select')
      .isVisible({ timeout: 4000 }).catch(() => false);

    if (!hasBatchSelectP2) {
      const noBatches = await page.getByText(/no batches available/i)
        .isVisible({ timeout: 1000 }).catch(() => false);
      console.log(`  Pass 2: no join UI for ${href} (no-batches: ${noBatches}) — skipping`);
      continue;
    }

    const batchDropdown = page.getByTestId('batch-select');
    await batchDropdown.click();

    const opts = page.getByRole('option');
    await opts.first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    // Let Radix finish any opening animation before reading or clicking options.
    await page.waitForTimeout(300);
    const optCount = await opts.count().catch(() => 0);
    let activeBatchSelected = false;
    const todayMs = Date.now();
    for (let o = 0; o < optCount; o++) {
      const text = (await opts.nth(o).textContent() ?? '').trim();

      // Open-ended batch ("No end date") — always active.
      if (/no end date/i.test(text)) {
        // force:true skips Playwright's stability check — Radix re-renders the option
        // list on hover/focus events, causing the element to detach between text-read
        // and click. Keyboard Enter is the fallback if the coordinate click also fails.
        await opts.nth(o).click({ force: true }).catch(() => page.keyboard.press('Enter'));
        activeBatchSelected = true;
        break;
      }

      // Format: "DD Mon YYYY – DD Mon YYYY"
      const bm = text.match(/Timeline:\s*(\d{1,2}\s+\w+\s+\d{4})\s*[–\-]\s*(\d{1,2}\s+\w+\s+\d{4})/);
      if (bm) {
        const sd = new Date(bm[1]).getTime();
        const ed = new Date(bm[2]).getTime();
        if (!isNaN(sd) && !isNaN(ed) && sd <= todayMs && ed >= todayMs) {
          await opts.nth(o).click({ force: true }).catch(() => page.keyboard.press('Enter'));
          activeBatchSelected = true;
          break;
        }
      }
    }
    if (!activeBatchSelected) {
      await opts.first().click({ force: true }).catch(() => page.keyboard.press('Enter'));
      activeBatchSelected = true;
    }
    await page.waitForTimeout(500);

    const joinCourseBtn = page.getByRole('button', { name: /join the course/i });
    await joinCourseBtn.waitFor({ timeout: 5000 }).catch(() => {});
    await joinCourseBtn.click();

    await page.waitForURL(
      (url) => url.pathname.includes('/batch/'),
      { timeout: 20000 }
    ).catch(() => {});
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

    if (!page.url().includes('/batch/')) continue;

    await dismissAllModals(page);
    console.log(`  findAndSeedInProgressCourse: enrolled and seeding → ${page.url()}`);
    return true;
  }

  console.log('  findAndSeedInProgressCourse: no suitable course found on explore page');
  return false;
}

export async function syncCourseProgress(page: Page): Promise<void> {
  const menuTrigger = page.locator('button[data-edataid="course-progress-menu-toggle"]');
  if (!(await menuTrigger.isVisible({ timeout: 5000 }).catch(() => false))) {
    console.log('  [syncCourseProgress] menu trigger not visible — skipping');
    return;
  }
  await menuTrigger.click();
  const syncItem = page.locator('[data-edataid="course-force-sync"]');
  if (!(await syncItem.isVisible({ timeout: 3000 }).catch(() => false))) {
    await page.keyboard.press('Escape');
    console.log('  [syncCourseProgress] force-sync item not found — skipping');
    return;
  }
  await syncItem.click();
  await page.getByText(/your course progress has been updated/i)
    .waitFor({ state: 'visible', timeout: 5000 })
    .catch(() => {});
  console.log('  [syncCourseProgress] course progress synced');
}

export async function updateProfileDataSharing(page: Page): Promise<void> {
  // Clear any congratulations / batch-expiry dialog that may still be open from course
  // completion. The dialog's overlay blocks interaction with the sharing card.
  await dismissAllModals(page, 3000);

  const pdShareUpdateBtn = page.getByTestId('profile-data-sharing-card')
    .getByRole('button', { name: /^update$/i });
  const cardVisible = await pdShareUpdateBtn.isVisible({ timeout: 8000 }).catch(() => false);

  if (cardVisible) {
    await pdShareUpdateBtn.click();

    const tncCheckbox = page.getByRole('checkbox', { name: /i agree to share profile details/i });
    await tncCheckbox.waitFor({ state: 'visible', timeout: 5000 });
    if (!(await tncCheckbox.isChecked())) await tncCheckbox.click();

    const shareBtn = page.locator('[data-edataid="profile-sharing-share"]');
    await shareBtn.waitFor({ state: 'visible', timeout: 3000 });
    await shareBtn.click();

    await page.getByText(/profile data sharing preference updated/i)
      .waitFor({ state: 'visible', timeout: 5000 })
      .catch(() => {});
    console.log('  Profile data sharing consent updated');
  } else {
    console.log('  Profile data sharing card not shown (course userConsent is not "yes") — skipping');
  }
}
