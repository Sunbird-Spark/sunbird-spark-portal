import { test, expect } from '@playwright/test';
import { urls } from '../../data/urls';
import { authPaths } from '../../data/authPaths';
import { dismissModal, consumeContent } from '../helpers/contentHelper';

test.setTimeout(600000);

// Sidebar lessons live inside <aside> (implicit complementary role) in the Sunbird SPA.
// Combine both the semantic tag and the explicit role attribute so the selector works
// regardless of how the Angular/React component renders it.
const SIDEBAR_LESSONS = 'aside a[href*="/content/"], [role="complementary"] a[href*="/content/"]';

test.describe('Registered User - Course Completion (Continue from where you left)', () => {
  // Restore the full browser state (cookies + localStorage tokens) saved by
  // user2Setup. No OIDC redirect chain is needed on each test.
  test.use({ storageState: authPaths.user2 });

  test.beforeEach(async ({ page }) => {
    // Session is already hydrated — just navigate and wait for all auth API
    // calls to resolve before the test interacts with any content.
    await page.goto(urls.home, { waitUntil: 'load' });

    const loginBtn = page.getByRole('button', { name: /^login$/i })
      .or(page.getByRole('link', { name: /^login$/i }));
    await expect(loginBtn.first()).not.toBeVisible({ timeout: 10000 });
  });

  test('Complete active course from Continue from where you left', async ({ page }) => {
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

    // 3. Dismiss any lingering dialog/overlay from the previous session
    await dismissModal(page);
    await page.waitForTimeout(500);

    // 3b. Guard: check batch end date before spending time consuming lessons.
    //     Sunbird discards completion events after the batch end date.
    {
      const batchEndText = await page.getByText(/Batch ends on/i).first().textContent().catch(() => '');
      const endMatch = batchEndText?.match(/Batch ends on[:\s]+(.+)/i);
      if (endMatch) {
        const batchEndDate = new Date(endMatch[1].trim());
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!isNaN(batchEndDate.getTime()) && batchEndDate < today) {
          console.log(`  Batch ended on ${endMatch[1].trim()} — finding an active-batch course on Explore`);

          const origin = new URL(urls.explore).origin;
          await page.goto(urls.explore);
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

            // Already enrolled — redirect to /batch/; check if batch still active
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
                  break;
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
            await opts.first().waitFor({ timeout: 3000 }).catch(() => {});
            const optCount = await opts.count().catch(() => 0);
            let activeBatchSelected = false;
            for (let o = 0; o < optCount; o++) {
              const optText = (await opts.nth(o).textContent() ?? '').trim();
              const bm = optText.match(/Timeline:\s*(\d{1,2}\s+\w+\s+\d{4})\s*[–\-]\s*(\d{1,2}\s+\w+\s+\d{4})/);
              if (bm) {
                const sd = new Date(bm[1]); const ed = new Date(bm[2]);
                const tod = new Date(); tod.setHours(0, 0, 0, 0);
                if (sd <= tod && ed >= tod) {
                  await opts.nth(o).click();
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
            break;
          }
        }
      }
    }

    // 4. Wait for the sidebar to load (API-driven), then expand all collapsed units.
    //    Must wait for the first lesson BEFORE expanding — the sidebar data arrives
    //    asynchronously after domcontentloaded, so expanding earlier finds 0 buttons.
    const lessonAnchors = page.locator(SIDEBAR_LESSONS);
    await expect(lessonAnchors.first()).toBeVisible({ timeout: 30000 });

    // Guard against a race condition: React renders Unit 1's lesson (making
    // lessonAnchors.first() visible) before Radix has stamped data-state on the
    // other unit buttons. Wait for at least one data-state button to be present
    // so that collapsed-button counting below never returns 0 prematurely.
    await page.locator('aside button[data-state]').first()
      .waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

    // Click every collapsed course-unit chevron until none remain.
    // CollapsibleTrigger (Radix UI asChild) merges data-state onto the <button>.
    {
      const collapsedBtns = page.locator('aside button[data-state="closed"]');
      let remaining = await collapsedBtns.count().catch(() => 0);
      while (remaining > 0) {
        await collapsedBtns.first().scrollIntoViewIfNeeded().catch(() => {});
        await collapsedBtns.first().click();
        await page.waitForTimeout(200); // wait for Radix animation to settle
        remaining = await collapsedBtns.count().catch(() => 0);
      }
      console.log('  All course units expanded');
    }

    // Re-count after expanding — newly revealed units may have added lesson links.
    const lessonCount = await lessonAnchors.count();
    expect(lessonCount).toBeGreaterThan(0);

    const lessons: { href: string; title: string; status: string }[] = [];
    for (let j = 0; j < lessonCount; j++) {
      const anchor = lessonAnchors.nth(j);
      const href = await anchor.getAttribute('href') ?? '';
      const rawText = await anchor.textContent() ?? '';
      const title = rawText.replace(/not viewed|in progress|completed|\d+\/\d+.*/gi, '').trim().slice(0, 60);
      const status = /completed/i.test(rawText) ? 'completed'
        : /in progress/i.test(rawText) ? 'in-progress'
        : 'not-viewed';
      lessons.push({ href, title, status });
    }

    console.log(`  Course has ${lessons.length} lessons`);
    await test.info().attach('Course lessons', {
      body: JSON.stringify(lessons, null, 2),
      contentType: 'application/json',
    });

    // 5. Consume every lesson in sidebar order
    for (let i = 0; i < lessons.length; i++) {
      const { href, title, status } = lessons[i];

      // Skip lessons already marked Completed in the sidebar — no navigation needed.
      if (status === 'completed') {
        console.log(`  [${i + 1}/${lessons.length}] Already completed (sidebar), skipping: ${title}`);
        continue;
      }

      const contentId = href.split('/content/').pop() ?? '';

      // Always navigate within the configured base origin so the session cookie
      // is sent correctly. Sidebar hrefs can be absolute (e.g. sandbox.sunbirded.org)
      // which would land on a different domain where the session doesn't exist.
      const lessonPath = href.startsWith('http') ? new URL(href).pathname : href;
      const absoluteUrl = `${new URL(urls.home).origin}${lessonPath}`;
      await page.goto(absoluteUrl);
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

      // Dismiss any post-completion overlay from the previous lesson (two passes:
      // the first handles dialogs rendered before domcontentloaded, the second
      // handles overlays that the SPA injects slightly after).
      await dismissModal(page);

      // Wait for the sidebar to appear — this confirms the course player has
      // finished its async API calls and rendered the lesson structure.
      await page.locator(SIDEBAR_LESSONS).first()
        .waitFor({ state: 'visible', timeout: 15000 })
        .catch(() => {});

      // Skip this lesson if the sidebar already marks it as Completed
      const lessonLink = page.locator(`aside a[href*="${contentId}"], [role="complementary"] a[href*="${contentId}"]`).first();
      const linkText = (await lessonLink.textContent().catch(() => '')) ?? '';
      if (/completed/i.test(linkText)) {
        console.log(`  [${i + 1}/${lessons.length}] Already completed, skipping: ${title}`);
        continue;
      }

      console.log(`  [${i + 1}/${lessons.length}] Consuming: ${title}`);

      // Wait for the content player (any type)
      const player = page.locator(
        'iframe, video, sunbird-pdf-player, [class*="player"]'
      ).first();
      try {
        await expect(player).toBeVisible({ timeout: 30000 });
      } catch (err) {
        // If the page was closed or player never appeared, log and skip this lesson
        const closed = page.isClosed();
        console.log(`    Player not visible (page closed=${closed}) — skipping this lesson`);
        if (closed) continue;
        // otherwise continue to attempt consumption but avoid throwing here
      }

      // Give QuML / PDF web components extra time to fully render after the
      // generic player element appeared. These async web components may take
      // 2–5 s after domcontentloaded, causing misdetection if we check too early.
      await page.locator('sunbird-quml-player, sunbird-pdf-player').first()
        .waitFor({ state: 'visible', timeout: 5000 })
        .catch(() => {}); // fine if neither appears — ECML / video / HTML content

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
      await consumeContent(page, contentType, { navigateBack: false });

      await dismissModal(page);
      console.log(`  [${i + 1}/${lessons.length}] Moving to next lesson`);
      await page.waitForTimeout(1500);
    }

    // 6. Navigate to batch root for a fresh server-side fetch of enrollment data.
    const batchRootUrl = page.url().replace(/\/content\/[^/?#]+.*$/, '');
    await page.goto(batchRootUrl);
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // Dismiss any lingering completion dialogs on the batch page
    for (let d = 0; d < 3; d++) {
      await dismissModal(page);
      await page.waitForTimeout(400);
    }

    // Expand all units to reveal current lesson statuses
    await page.locator('aside button[data-state]').first()
      .waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    {
      const collapsedBtns = page.locator('aside button[data-state="closed"]');
      let remaining = await collapsedBtns.count().catch(() => 0);
      while (remaining > 0) {
        await collapsedBtns.first().scrollIntoViewIfNeeded().catch(() => {});
        await collapsedBtns.first().click();
        await page.waitForTimeout(200);
        remaining = await collapsedBtns.count().catch(() => 0);
      }
    }

    // Soft sidebar check — log any still-incomplete lessons but do not fail the test.
    // Some content types do not fire a Sunbird completion event; progress bar is the gate.
    const remainingIncomplete = page
      .locator(SIDEBAR_LESSONS)
      .filter({ hasText: /not viewed|in progress/i });
    const incompleteCount = await remainingIncomplete.count();
    if (incompleteCount > 0) {
      console.log(`  Warning: ${incompleteCount} lesson(s) still showing incomplete in sidebar`);
    }

    // 7. Assert 100% course progress — this is the authoritative completion check.
    const progressBar = page.getByRole('progressbar', { name: /course progress/i });
    await expect(progressBar).toHaveAttribute('aria-valuenow', '100', { timeout: 60000 });

    // 8. Update Profile Data Sharing consent (only available when course has userConsent="yes").

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
  });
});
