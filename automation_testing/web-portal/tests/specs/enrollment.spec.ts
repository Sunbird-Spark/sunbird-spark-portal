import { test, expect } from '@playwright/test';
import { urls } from '../../data/urls';
import { authPaths } from '../../data/authPaths';
import { dismissModal, registerAutoDialogHandlers } from '../helpers/contentHelper';
import {
  SIDEBAR_LESSONS,
  expandAllUnits,
  consumeAllLessons,
  redirectToActiveBatchCourse,
  updateProfileDataSharing,
  syncCourseProgress,
} from '../helpers/courseHelper';

test.setTimeout(600000);

test.describe('Registered User - Course Completion (Continue from where you left)', () => {
  test.use({ storageState: authPaths.user2 });

  test.beforeEach(async ({ page }) => {
    await registerAutoDialogHandlers(page);
    await page.goto(urls.home, { waitUntil: 'load' });
  });

  test('Complete active course from Continue from where you left', async ({ page }) => {
    const origin = new URL(urls.home).origin;

    // 1. Find and click the "Continue from where you left" button
    const continueBtn = page.getByRole('button', { name: /continue from where you left/i });
    await expect(continueBtn).toBeVisible({ timeout: 15000 });
    await continueBtn.click();

    // 2. Wait for course player URL: /collection/{courseId}/batch/{batchId}/content/{contentId}
    await page.waitForURL(
      (url) => url.pathname.includes('/collection/') && url.pathname.includes('/content/'),
      { timeout: 20000 }
    );
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    console.log(`[enrollment] Landed on: ${page.url()}`);

    // 3. Dismiss any lingering dialog/overlay from the previous session.
    //    If the Congratulations dialog appears here — before any lesson is consumed —
    //    it means the course is already 100% complete. That is a portal bug: a fully
    //    completed course should not appear in "Continue from where you left".
    const congratsOnLoad = page.getByRole('heading', { name: /congratulations/i });
    const courseAlreadyComplete = await congratsOnLoad.isVisible({ timeout: 3000 }).catch(() => false);
    await dismissModal(page);
    await page.waitForTimeout(500);
    console.log(`[enrollment] Course page URL after dismissModal: ${page.url()}`);

    if (courseAlreadyComplete) {
      test.info().annotations.push({
        type: 'BUG',
        description: 'Congratulations dialog appeared on initial course load — course was already 100% complete yet still shown in "Continue from where you left". User progress was not reset between test runs.',
      });
      throw new Error('[BUG REPORT] Course was already complete when the test started. "Continue from where you left" should not surface a fully completed course.');
    }

    // 3b. Guard: check batch end date before spending time consuming lessons.
    //     Navigates to Explore to find an active-batch course if the current one expired.
    console.log('[enrollment] Checking batch expiry...');
    await redirectToActiveBatchCourse(page, urls.explore, origin);
    console.log(`[enrollment] After redirectToActiveBatchCourse. URL: ${page.url()}`);

    // 4. Wait for the sidebar to load (API-driven), then expand all collapsed units.
    //    Wait for unit toggle buttons — always in DOM regardless of collapsed state.
    //    Lesson anchors (SIDEBAR_LESSONS) are removed from DOM by Radix Collapsible when
    //    a unit is collapsed, and the active lesson itself may not be an <a> element,
    //    so waiting for anchors can time out even when the sidebar has fully loaded.
    const lessonAnchors = page.locator(SIDEBAR_LESSONS);
    await page.locator('aside button[data-state]').first().waitFor({ state: 'visible', timeout: 30000 });
    await expandAllUnits(page);

    const startProgress = await page
      .getByRole('progressbar', { name: /course progress/i })
      .getAttribute('aria-valuenow').catch(() => 'unknown');
    console.log(`[enrollment] Starting progress: ${startProgress}%`);

    // Bug guard: if the course is already at 100% when the test starts, the user's
    // progress was never reset between runs. There is nothing left to consume and the
    // test cannot verify fresh completion — report it and fail visibly.
    if (startProgress === '100') {
      test.info().annotations.push({
        type: 'BUG',
        description: 'Course progress was already 100% at test start — user progress was not reset between runs. Cannot verify fresh course consumption.',
      });
      throw new Error('[BUG REPORT] Course progress is already 100% before consumption started. User progress was not reset between test runs.');
    }

    // 5. Consume every incomplete lesson using the shared helper.
    //    consumeAllLessons handles: CSS-class-based status detection, re-expanding
    //    collapsed units between lessons, and waiting for sidebar status labels to load.
    let stuckLessons = await consumeAllLessons(page, origin, lessonAnchors);
    console.log(`[enrollment] consumeAllLessons returned. Current URL: ${page.url()}`);

    // 5b. Bug-report: if lessons could not be completed, fail the test visibly.
    if (stuckLessons.length > 0) {
      const titles = stuckLessons.map((t) => `"${t}"`).join(', ');
      test.info().annotations.push({
        type: 'BUG',
        description: `${stuckLessons.length} lesson(s) could not be completed: ${titles}`,
      });
      throw new Error(`[BUG REPORT] ${stuckLessons.length} lesson(s) could not be completed: ${titles}`);
    }

    // 6. Navigate to batch root for a fresh server-side fetch of enrollment data.
    const batchRootUrl = page.url().replace(/\/content\/[^/?#]+.*$/, '');
    await page.goto(batchRootUrl);
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(1000);
    console.log(`[enrollment] Navigated to batch root: ${page.url()}`);

    // The portal's auto-continue guard can redirect from the batch root to the
    // last-accessed lesson. When that happens skip expand/sidebar steps — the
    // progress bar is still readable on a lesson page.
    if (!page.url().includes('/content/')) {
      // Dismiss any lingering completion dialogs on the batch page
      for (let d = 0; d < 3; d++) {
        await dismissModal(page);
        await page.waitForTimeout(400);
      }

      // Expand all units to reveal current lesson statuses
      await expandAllUnits(page);

      // Soft sidebar check — log any still-incomplete lessons but do not fail the test.
      const remainingIncomplete = page
        .locator(SIDEBAR_LESSONS)
        .filter({ hasText: /not viewed|in progress/i });
      const incompleteCount = await remainingIncomplete.count();
      if (incompleteCount > 0) {
        console.log(`  Warning: ${incompleteCount} lesson(s) still showing incomplete in sidebar`);
      }
    } else {
      console.log('[enrollment] Portal redirected to lesson — skipping expand/sidebar check');
    }

    // 7. Assert 100% course progress — this is the authoritative completion check.
    const progressBar = page.getByRole('progressbar', { name: /course progress/i });
    const finalProgress = await progressBar.getAttribute('aria-valuenow').catch(() => 'not found');
    console.log(`[enrollment] Final progress bar value before assertion: ${finalProgress}%`);
    await expect(progressBar).toHaveAttribute('aria-valuenow', '100', { timeout: 60000 });

    // 8. Update Profile Data Sharing consent (only available when course has userConsent="yes").
    await updateProfileDataSharing(page);

    // 9. Force-sync course progress so the server-side record matches the UI.
    await syncCourseProgress(page);
  });
});
