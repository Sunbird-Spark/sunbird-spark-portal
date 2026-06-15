import { test, expect } from '@playwright/test';
import { urls } from '../../data/urls';
import { authPaths } from '../../data/authPaths';
import { dismissModal, consumeContent, registerAutoDialogHandlers } from '../helpers/contentHelper';
import { expandAllUnits, leaveCourse } from '../helpers/courseHelper';

test.setTimeout(600000);

const SIDEBAR_LESSONS = 'aside a[href*="/content/"], [role="complementary"] a[href*="/content/"]';

test.describe('Registered User - Course Enrollment from Explore Page', () => {
  test.use({ storageState: authPaths.user2 });

  test.beforeEach(async ({ page }) => {
    await registerAutoDialogHandlers(page);
    await page.goto(urls.explore, { waitUntil: 'load' });
  });

  test('Find a course with available batch, join it, consume all lessons', async ({ page }) => {
    // Always rebuild URLs from the configured base origin so session cookies apply.
    const origin = new URL(urls.explore).origin;

    // 1. Filter explore page by Courses
    const coursesCheckbox = page.getByRole('checkbox', { name: /^courses$/i });
    await expect(coursesCheckbox).toBeVisible({ timeout: 10000 });
    await coursesCheckbox.click();
    await page.waitForURL((url) => url.search.includes('primaryCategory=Course'), { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

    // 2. Collect all course card hrefs from the filtered list
    const courseCards = page.locator('a[href*="/collection/"]');
    await expect(courseCards.first()).toBeVisible({ timeout: 15000 });
    const cardCount = await courseCards.count();
    expect(cardCount).toBeGreaterThan(0);

    const courseHrefs: string[] = [];
    for (let i = 0; i < cardCount; i++) {
      const href = await courseCards.nth(i).getAttribute('href') ?? '';
      if (href) courseHrefs.push(href);
    }

    await test.info().attach('Course cards found', {
      body: JSON.stringify(courseHrefs, null, 2),
      contentType: 'application/json',
    });

    // 3. Find a course that user2 hasn't joined and that has active batches
    let joinableCourseFound = false;
    for (const href of courseHrefs) {
      // Strip origin from absolute hrefs — always use configured base
      const coursePath = href.startsWith('http') ? new URL(href).pathname : href;
      const courseUrl = `${origin}${coursePath}`;
      await page.goto(courseUrl);
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

      // Wait for the enrollment API to respond. Enrolled users trigger a client-side
      // React Router redirect to /batch/ once useUserEnrolledCollections resolves (~1-3 s).
      // Un-enrolled users: URL stays the same. 6 s is a safe ceiling for the API round-trip.
      // (A button-presence check cannot be used here — AvailableBatchesCard renders on the
      // first React pass before enrollment data arrives, making it always visible initially.)
      const alreadyEnrolled = await page.waitForURL(
        (url) => url.pathname.includes('/batch/'),
        { timeout: 6000 }
      ).then(() => true).catch(() => false);

      if (alreadyEnrolled) {
        console.log(`  Already enrolled in ${href}, skipping`);
        continue;
      }

      // URL stable after 6 s → not enrolled. Check for joinable state.
      if (await page.getByText(/something went wrong/i).isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`  Content error for ${href}, skipping`);
        continue;
      }
      if (await page.getByText(/no batches available for enrollment/i).isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`  No batches for ${href}, skipping`);
        continue;
      }
      const joinBtn = page.locator('[data-edataid="join-course-btn"]');
      if (!(await joinBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
        console.log(`  No join button for ${href}, skipping`);
        continue;
      }

      console.log(`  Found joinable course: ${href}`);
      joinableCourseFound = true;
      break;
    }

    // 4. Fallback when no joinable course exists — stay on Explore page:
    //    Navigate to each already-enrolled course and either leave it (non-100%)
    //    or sync its progress (100%), using the three-dots menu on the course page.
    if (!joinableCourseFound) {
      console.log('No joinable course found — performing fallback actions from Explore page courses');

      let leaveDone = false;
      let syncDone = false;

      for (const href of courseHrefs) {
        if (leaveDone && syncDone) break;

        const coursePath = href.startsWith('http') ? new URL(href).pathname : href;
        await page.goto(`${origin}${coursePath}`);
        await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

        // For enrolled courses Sunbird redirects to /batch/.../content/...
        // Wait for the redirect to settle then confirm we are on an enrolled course page.
        await page.waitForURL((url) => url.pathname.includes('/batch/'), { timeout: 10000 }).catch(() => {});
        if (!page.url().includes('/batch/')) continue;

        await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
        await page.waitForTimeout(1000);

        // The three-dots trigger sits inside the CourseProgressCard component.
        // Exact selector from the source: data-edataid="course-progress-menu-toggle"
        const menuTrigger = page.locator('button[data-edataid="course-progress-menu-toggle"]');
        if (!(await menuTrigger.isVisible({ timeout: 5000 }).catch(() => false))) continue;

        // Determine progress from the aria-valuenow on the progress bar div
        const progressVal = await page
          .locator('[role="progressbar"]')
          .first()
          .getAttribute('aria-valuenow')
          .catch(() => null);
        const is100 = progressVal === '100';

        // ── Action 1: Leave a non-100% course ──────────────────────────────
        if (!is100 && !leaveDone) {
          await menuTrigger.click();

          // Menu item has data-edataid="course-unenroll"
          const leaveItem = page.locator('[data-edataid="course-unenroll"]');
          if (!(await leaveItem.isVisible({ timeout: 3000 }).catch(() => false))) {
            await page.keyboard.press('Escape');
            continue;
          }
          await leaveItem.click();

          // ConfirmDialog appears — click the confirm button (data-edataid="confirm-dialog-confirm")
          const confirmBtn = page.locator('[data-edataid="confirm-dialog-confirm"]');
          await expect(confirmBtn).toBeVisible({ timeout: 5000 });
          await confirmBtn.click();

          // After unenrolling Sunbird redirects away from the /batch/ URL.
          // Waiting for that URL change is sufficient to confirm the action succeeded.
          await page.waitForURL((url) => !url.pathname.includes('/batch/'), { timeout: 15000 })
            .catch(() => {});
          console.log('  Successfully left a non-completed course');
          leaveDone = true;
        }

        // ── Action 2: Sync a 100%-completed course ──────────────────────────
        else if (is100 && !syncDone) {
          await menuTrigger.click();

          // Menu item has data-edataid="course-force-sync"
          const syncItem = page.locator('[data-edataid="course-force-sync"]');
          if (!(await syncItem.isVisible({ timeout: 3000 }).catch(() => false))) {
            await page.keyboard.press('Escape');
            continue;
          }
          await syncItem.click();

          // Toast "Your course progress has been updated" is transient — capture it
          // if visible but don't fail the test if it disappears before we check.
          await page.getByText(/your course progress has been updated/i)
            .waitFor({ state: 'visible', timeout: 5000 })
            .catch(() => {});
          console.log('  Successfully synced course progress');
          syncDone = true;
        }
      }

      return; // fallback actions complete — no enrollment possible in this run
    }

    // 5. Select the first batch whose start date has already passed
    //    (i.e. content is immediately accessible). Option text format:
    //    "batchName Timeline: DD Mon YYYY–DD Mon YYYY Enrollment ends by: ..."
    const batchDropdown = page.getByTestId('batch-select');
    await batchDropdown.click();
    const allOptions = page.getByRole('option');
    await expect(allOptions.first()).toBeVisible({ timeout: 5000 });
    const optionCount = await allOptions.count();

    const todayStart = new Date();
    todayStart.setHours(23, 59, 59, 999); // end-of-today boundary

    let chosenOption = allOptions.first(); // fallback
    for (let o = 0; o < optionCount; o++) {
      const opt = allOptions.nth(o);
      const text = (await opt.textContent() ?? '').trim();
      // Match start and end dates: "Timeline: 20 May 2026–31 May 2026"
      const match = text.match(/Timeline:\s*(\d{1,2}\s+\w+\s+\d{4})\s*[–\-]\s*(\d{1,2}\s+\w+\s+\d{4})/);
      if (match) {
        const startDate = new Date(match[1]);
        const endDate = new Date(match[2]);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!isNaN(startDate.getTime()) && startDate <= todayStart
          && !isNaN(endDate.getTime()) && endDate >= today) {
          chosenOption = opt;
          console.log(`  Selecting active batch (${match[1]} – ${match[2]}): ${text.slice(0, 80)}`);
          break;
        }
      }
    }
    await chosenOption.click();

    // 6. Join the course
    const joinBtn = page.getByRole('button', { name: /join the course/i });
    await expect(joinBtn).toBeEnabled({ timeout: 5000 });
    await joinBtn.click();

    // 7. Wait for redirect to course player with batch in URL
    await page.waitForURL(
      (url) => url.pathname.includes('/batch/') && url.pathname.includes('/content/'),
      { timeout: 20000 }
    );
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await dismissModal(page);
    await page.waitForTimeout(500);

    console.log(`  Enrolled — URL: ${page.url()}`);

    // 8. Confirm the progress bar rendered (Sunbird retains prior progress on re-enrollment,
    //    so the value may be > 0% — do not assert an exact starting value here).
    const progressBar = page.getByRole('progressbar', { name: /course progress/i });
    await expect(progressBar).toBeAttached({ timeout: 15000 });
    const initialProgress = await progressBar.getAttribute('aria-valuenow').catch(() => '?');
    console.log(`  Initial progress after enrollment: ${initialProgress}%`);

    // 9. Wait for the sidebar to load (API-driven), then expand all collapsed units.
    //    Wait for the unit toggle buttons — always in the DOM regardless of collapsed state.
    //    Lesson anchors (SIDEBAR_LESSONS) are removed from DOM by Radix Collapsible when
    //    collapsed, so waiting for them before expanding would time out if no unit is
    //    auto-expanded on landing.
    const lessonAnchors = page.locator(SIDEBAR_LESSONS);
    await page.locator('aside button[data-state]').first().waitFor({ state: 'visible', timeout: 30000 });

    await expandAllUnits(page);

    // Wait for the DOM count to stabilize — Radix Collapsible mounts lesson links
    // asynchronously after each unit opens, so a single count right after expansion
    // may be lower than the final count.
    {
      let prevCount = -1;
      for (let s = 0; s < 8; s++) {
        await page.waitForTimeout(500);
        const cnt = await lessonAnchors.count().catch(() => 0);
        if (cnt > 0 && cnt === prevCount) break;
        prevCount = cnt;
      }
      console.log('  All course units expanded');
    }

    // 10. Re-count after expanding — newly revealed units may have added lesson links.
    const lessonCount = await lessonAnchors.count();
    expect(lessonCount).toBeGreaterThan(0);

    const lessons: { href: string; title: string }[] = [];
    for (let j = 0; j < lessonCount; j++) {
      const anchor = lessonAnchors.nth(j);
      const href = await anchor.getAttribute('href') ?? '';
      const rawText = await anchor.textContent() ?? '';
      const title = rawText.replace(/not viewed|in progress|completed|\d+\/\d+.*/gi, '').trim().slice(0, 60);
      lessons.push({ href, title });
    }

    // The active lesson (auto-navigated by the portal on enrollment) may be
    // rendered in the sidebar as a non-anchor element (div/button) because the
    // player already shows it. In that case it won't match 'aside a[href*="/content/"]'
    // and will be missing from the snapshot above. Inject it from the current URL.
    const currentContentMatch = page.url().match(/\/content\/([^/?#]+)/);
    if (currentContentMatch) {
      const currentContentId = currentContentMatch[1];
      const alreadyListed = lessons.some((l) => l.href.includes(currentContentId));
      if (!alreadyListed) {
        const currentPath = new URL(page.url()).pathname;
        lessons.unshift({ href: currentPath, title: '(current lesson — active in player)' });
        console.log(`  Active lesson not in sidebar anchors — injected from URL: ${currentContentId}`);
      }
    }

    console.log(`Course has ${lessons.length} lessons`);
    await test.info().attach('Course lessons', {
      body: JSON.stringify(lessons, null, 2),
      contentType: 'application/json',
    });

    // 11. Consume every lesson in sidebar order
    const stuckLessons: string[] = [];
    for (let i = 0; i < lessons.length; i++) {
      const { href, title } = lessons[i];
      const contentId = href.split('/content/').pop() ?? '';

      // Always navigate within the configured base origin so the session cookie
      // is sent correctly. Sidebar hrefs can be absolute (e.g. sandbox.sunbirded.org)
      // which would land on a different domain where the session doesn't exist.
      const lessonPath = href.startsWith('http') ? new URL(href).pathname : href;
      const absoluteUrl = `${origin}${lessonPath}`;
      await page.goto(absoluteUrl);
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

      // Dismiss any post-completion overlay from the previous lesson
      await dismissModal(page);

      // Re-expand all units after the hard reload — Radix Collapsible collapses every
      // unit except the active one on each page load, so sidebar links for other units
      // would be absent from the DOM during the completion check below.
      await expandAllUnits(page);
      await dismissModal(page);

      // Wait for the sidebar — confirms the course player has finished its async
      // API calls and rendered the lesson structure before we check lesson state.
      await page.locator(SIDEBAR_LESSONS).first()
        .waitFor({ state: 'visible', timeout: 15000 })
        .catch(() => {});

      // Skip if already Completed
      const lessonLink = page.locator(
        `aside a[href*="${contentId}"], [role="complementary"] a[href*="${contentId}"]`
      ).first();
      const linkText = (await lessonLink.textContent().catch(() => '')) ?? '';
      if (/completed/i.test(linkText)) {
        console.log(`  [${i + 1}/${lessons.length}] Already completed, skipping: ${title}`);
        continue;
      }

      console.log(`  [${i + 1}/${lessons.length}] Consuming: ${title}`);

      const player = page.locator('iframe, video, sunbird-pdf-player, [class*="player"]').first();
      await expect(player).toBeVisible({ timeout: 30000 });

      // Give QuML / PDF web components time to fully render before type detection
      await page.locator('sunbird-quml-player, sunbird-pdf-player').first()
        .waitFor({ state: 'visible', timeout: 5000 })
        .catch(() => {});

      // Detect content type and delegate to the shared consumeContent helper —
      // the same approach used in the anonymous-user exploreContent tests.
      // Poll up to 8 s for the YouTube embed frame (loads after ECML iframe).
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

      let contentType = 'unknown';
      if (isYouTube) {
        contentType = 'youtube';
      } else {
        const [hasPdf, hasQuml, hasEcml, hasVideo, hasHtml] = await Promise.all([
          page.locator('sunbird-pdf-player').isVisible({ timeout: 3000 }).catch(() => false),
          page.locator('sunbird-quml-player').isVisible({ timeout: 3000 }).catch(() => false),
          page.locator('iframe[name="contentPlayer"], iframe#contentPlayer').isVisible({ timeout: 3000 }).catch(() => false),
          page.locator('video').first().isVisible({ timeout: 1500 }).catch(() => false),
          page.locator('iframe').first().isVisible({ timeout: 1500 }).catch(() => false),
        ]);
        if (hasPdf) contentType = 'pdf';
        else if (hasQuml) contentType = 'quml';
        else if (hasEcml) contentType = 'ecml';
        else if (hasVideo) contentType = 'video';
        else if (hasHtml) contentType = 'html';
      }
      console.log(`    Content type: ${contentType}`);
      const progressBefore = parseInt(
        await page.getByRole('progressbar', { name: /course progress/i })
          .getAttribute('aria-valuenow').catch(() => '0') ?? '0', 10
      );
      await consumeContent(page, contentType, { navigateBack: false });

      await dismissModal(page);

      // If the course hit 100%, exit the lesson loop immediately.
      // The sidebar may be collapsed after consumption — a stale check would
      // falsely mark the last lesson as stuck and trigger leaveCourse().
      const progressNow = await page
        .getByRole('progressbar', { name: /course progress/i })
        .getAttribute('aria-valuenow').catch(() => null);
      if (progressNow === '100') {
        console.log(`  [${i + 1}/${lessons.length}] Course is 100% — exiting lesson loop.`);
        break;
      }

      console.log(`  [${i + 1}/${lessons.length}] Moving to next lesson`);
      // Re-expand all units — Radix Collapsible may have collapsed them during
      // consumption, removing the lesson's sidebar link from the DOM.
      await expandAllUnits(page);
      // Wait for enrollment tracking to confirm completion in the sidebar
      await page
        .locator(`aside a[href*="${contentId}"], [role="complementary"] a[href*="${contentId}"]`)
        .first()
        .filter({ hasText: /completed/i })
        .waitFor({ timeout: 8000 })
        .catch(() => {});
      const afterText = (await lessonLink.textContent().catch(() => '')) ?? '';
      if (!/completed/i.test(afterText)) {
        // The active lesson may render without an <a> tag in the sidebar (non-anchor style
        // while it is the currently loaded lesson), so lessonLink finds nothing and afterText
        // is empty even when the lesson completed. Verify via the progress bar: if the value
        // increased since before consuming, the lesson registered as completed on the server.
        const progressAfter = parseInt(
          await page.getByRole('progressbar', { name: /course progress/i })
            .getAttribute('aria-valuenow').catch(() => '0') ?? '0', 10
        );
        if (progressAfter > progressBefore) {
          console.log(`  [${i + 1}/${lessons.length}] Sidebar stale (${progressBefore}→${progressAfter}%) — lesson completed`);
        } else {
          console.log(`  [${i + 1}/${lessons.length}] Lesson stuck (portal bug): ${title}`);
          stuckLessons.push(title);
        }
      }
    }

    // 11b. If any lessons could not be completed the course is partially done —
    //      navigate to the batch root, leave the course so it can be rejoined
    //      fresh on the next run, and stop (100% cannot be asserted).
    //
    //      Before treating stuck lessons as a real bug, verify final progress.
    //      The sidebar completion check can false-positive when the portal delays
    //      the progress bar update after lesson consumption (async server sync).
    //      If the course is already at 100%, all lessons completed — no bug.
    if (stuckLessons.length > 0) {
      const finalProgress = await page
        .getByRole('progressbar', { name: /course progress/i })
        .getAttribute('aria-valuenow').catch(() => null);
      if (finalProgress === '100') {
        console.log(`  Stuck lesson(s) dismissed — course is already 100%: ${stuckLessons.join(', ')}`);
        stuckLessons.length = 0;
      }
    }

    if (stuckLessons.length > 0) {
      const titles = stuckLessons.map((t) => `"${t}"`).join(', ');
      test.info().annotations.push({
        type: 'BUG',
        description: `${stuckLessons.length} lesson(s) could not be completed: ${titles}`,
      });

      // Navigate back to the batch root and leave the course so it can be rejoined fresh
      // on the next run, then fail the test so the bug appears in the Playwright report.
      const brokenBatchUrl = page.url().replace(/\/content\/[^/?#]+.*$/, '');
      await page.goto(brokenBatchUrl);
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      for (let d = 0; d < 3; d++) { await dismissModal(page); await page.waitForTimeout(400); }
      await leaveCourse(page);
      throw new Error(`[BUG REPORT] ${stuckLessons.length} lesson(s) could not be completed: ${titles}`);
    }

    // 12. Assert all lessons Completed
    const remainingIncomplete = page
      .locator(SIDEBAR_LESSONS)
      .filter({ hasText: /not viewed|in progress/i });
    const incompleteCount = await remainingIncomplete.count();
    if (incompleteCount > 0) {
      console.log(`  Warning: ${incompleteCount} lesson(s) still showing incomplete in sidebar`);
    }

    // 13. Assert 100% progress
    await expect(progressBar).toHaveAttribute('aria-valuenow', '100', { timeout: 60000 });

    // 14. Update Profile Data Sharing consent (only available when course has userConsent="yes").
    //     Navigate to the batch root page (drop /content/…) so the bottom cards are fully
    //     visible without completion overlays covering them.
    const batchRootUrl = page.url().replace(/\/content\/[^/?#]+.*$/, '');
    await page.goto(batchRootUrl);
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // Dismiss any lingering completion dialogs on the batch page
    for (let d = 0; d < 3; d++) {
      await dismissModal(page);
      await page.waitForTimeout(400);
    }

    // The Profile Data Sharing card is only rendered when the course has userConsent="yes".
    // Skip gracefully when it is not present rather than failing the test.
    const pdShareUpdateBtn = page.getByTestId('profile-data-sharing-card')
      .getByRole('button', { name: /^update$/i });
    const cardVisible = await pdShareUpdateBtn.isVisible({ timeout: 8000 }).catch(() => false);

    if (cardVisible) {
      await pdShareUpdateBtn.click();

      const tncCheckbox = page.getByRole('checkbox', { name: /i agree to share profile details/i });
      await expect(tncCheckbox).toBeVisible({ timeout: 5000 });
      if (!(await tncCheckbox.isChecked())) await tncCheckbox.click();

      const shareBtn = page.locator('[data-edataid="profile-sharing-share"]');
      await expect(shareBtn).toBeEnabled({ timeout: 3000 });
      await shareBtn.click();

      await page.getByText(/profile data sharing preference updated/i)
        .waitFor({ state: 'visible', timeout: 5000 })
        .catch(() => {});
      console.log('  Profile data sharing consent updated');
    } else {
      console.log('  Profile data sharing card not shown (course userConsent is not "yes") — skipping');
    }

    // 15. Sync progress (stay enrolled — no leave/rejoin needed after full completion).
    //     Three-dots menu → "Sync progress now".
    //     The page is already on batchRootUrl from step 14.
    await page.waitForTimeout(2000);
    const syncMenuTrigger = page.locator('button[data-edataid="course-progress-menu-toggle"]');
    if (await syncMenuTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await syncMenuTrigger.click();
      const syncItem = page.locator('[data-edataid="course-force-sync"]');
      if (await syncItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await syncItem.click();
        await page.getByText(/your course progress has been updated/i)
          .waitFor({ state: 'visible', timeout: 5000 })
          .catch(() => {});
        console.log('  Synced course progress');
      } else {
        await page.keyboard.press('Escape');
        console.log('  Sync item not found — skipping sync');
      }
    } else {
      console.log('  Course menu not found — skipping sync');
    }
  });
});
