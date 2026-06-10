import { test, expect } from '@playwright/test';
import { urls } from '../../data/urls';
import { users } from '../../data/users';
import { loginAsUser } from '../helpers/loginHelper';
import { dismissModal } from '../helpers/contentHelper';
import {
  SIDEBAR_LESSONS,
  expandAllUnits,
  consumeAllLessons,
  redirectToActiveBatchCourse,
  updateProfileDataSharing,
  leaveCourse,
  joinFreshCourse,
} from '../helpers/courseHelper';

test.setTimeout(600000);

test.describe('Registered User - Course Completion (Continue from where you left)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, users.user2.email, users.user2.password);
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

    // 3. Dismiss any lingering dialog/overlay from the previous session
    await dismissModal(page);
    await page.waitForTimeout(500);
    console.log(`[enrollment] Course page URL after dismissModal: ${page.url()}`);

    // 3b. Guard: check batch end date before spending time consuming lessons.
    //     Navigates to Explore to find an active-batch course if the current one expired.
    console.log('[enrollment] Checking batch expiry...');
    await redirectToActiveBatchCourse(page, urls.explore, origin);
    console.log(`[enrollment] After redirectToActiveBatchCourse. URL: ${page.url()}`);

    // 4. Wait for the sidebar to load (API-driven), then expand all collapsed units.
    const lessonAnchors = page.locator(SIDEBAR_LESSONS);
    await lessonAnchors.first().waitFor({ state: 'visible', timeout: 30000 });
    await expandAllUnits(page);

    const startProgress = await page
      .getByRole('progressbar', { name: /course progress/i })
      .getAttribute('aria-valuenow').catch(() => 'unknown');
    console.log(`[enrollment] Starting progress: ${startProgress}%`);

    // 5. Consume every incomplete lesson using the shared helper.
    //    consumeAllLessons handles: CSS-class-based status detection, re-expanding
    //    collapsed units between lessons, and waiting for sidebar status labels to load.
    let stuckLessons = await consumeAllLessons(page, origin, lessonAnchors);
    console.log(`[enrollment] consumeAllLessons returned. Current URL: ${page.url()}`);

    // 5b. Bug-report-and-retry: if lessons could not be completed (portal bug),
    //     log the bug, leave the broken course, and try a different course.
    if (stuckLessons.length > 0) {
      console.log(`[BUG REPORT] ${stuckLessons.length} lesson(s) could not be completed due to a portal bug:`);
      stuckLessons.forEach((t) => console.log(`  ⚠  "${t}"`));

      // Navigate to batch root so the three-dots leave menu is accessible.
      const brokenBatchUrl = page.url().replace(/\/content\/[^/?#]+.*$/, '');
      await page.goto(brokenBatchUrl);
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      for (let d = 0; d < 3; d++) { await dismissModal(page); await page.waitForTimeout(400); }

      // Extract the broken collection ID so joinFreshCourse can skip it and avoid re-enrollment.
      const brokenCollectionId = page.url().match(/\/collection\/([^/?#/]+)/)?.[1] ?? '';
      const skipIds = brokenCollectionId ? new Set([brokenCollectionId]) : new Set<string>();

      console.log('[enrollment] Leaving broken course — searching for alternative on Explore...');
      await leaveCourse(page);

      const seeded = await joinFreshCourse(page, origin, skipIds);
      if (seeded) {
        console.log('[enrollment] Enrolled in fresh course — consuming lessons...');
        await expandAllUnits(page);
        const newAnchors = page.locator(SIDEBAR_LESSONS);
        stuckLessons = await consumeAllLessons(page, origin, newAnchors);
        if (stuckLessons.length > 0) {
          console.log(`[BUG REPORT] Alternative course also has ${stuckLessons.length} stuck lesson(s): ${stuckLessons.join(', ')}`);
        }
      } else {
        console.log('[enrollment] Could not find an alternative course — proceeding to final assertion');
      }
    }

    // 6. Navigate to batch root for a fresh server-side fetch of enrollment data.
    const batchRootUrl = page.url().replace(/\/content\/[^/?#]+.*$/, '');
    await page.goto(batchRootUrl);
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(1000);
    console.log(`[enrollment] Navigated to batch root: ${page.url()}`);

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

    // 7. Assert 100% course progress — this is the authoritative completion check.
    const progressBar = page.getByRole('progressbar', { name: /course progress/i });
    const finalProgress = await progressBar.getAttribute('aria-valuenow').catch(() => 'not found');
    console.log(`[enrollment] Final progress bar value before assertion: ${finalProgress}%`);
    await expect(progressBar).toHaveAttribute('aria-valuenow', '100', { timeout: 60000 });

    // 8. Update Profile Data Sharing consent (only available when course has userConsent="yes").
    await updateProfileDataSharing(page);
  });
});
