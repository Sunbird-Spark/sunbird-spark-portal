import { Page, expect } from '@playwright/test';
import { dismissModal, dismissAllModals } from './modal';
import { clickNextButton, clickRightArrow } from './navigation';
import { dismissEcmlUserSwitcher, isEcmlComplete } from './players/ecmlHelper';

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

// Consume all "In Progress" or "Not viewed" lessons inside a Content Playlist or
// Digital Textbook collection. Waits for status labels to load, skips already-completed
// lessons, and navigates to each remaining lesson via direct URL.
async function consumeAnonymousCollection(page: Page): Promise<void> {
  // If the collection auto-navigated into a lesson, go back to the overview so the
  // full sidebar is accessible for status-aware snapshotting.
  await page.waitForTimeout(3000);
  if (page.url().includes('/content/')) {
    await page.goBack();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);
  }

  const sidebarSel = 'aside a[href*="/content/"], [role="complementary"] a[href*="/content/"]';
  const lessonLinks = page.locator(sidebarSel);
  await lessonLinks.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

  // Wait for the async status labels to load before snapshotting completion state.
  await lessonLinks
    .filter({ hasText: /completed|in progress|not viewed/i })
    .first()
    .waitFor({ state: 'visible', timeout: 10000 })
    .catch(() => {});

  const lessonCount = await lessonLinks.count();
  const lessons: { href: string; status: string }[] = [];
  for (let i = 0; i < lessonCount; i++) {
    const anchor = lessonLinks.nth(i);
    const href = (await anchor.getAttribute('href')) ?? '';
    if (!href) continue;
    const rawText = (await anchor.textContent()) ?? '';
    if (/completed/i.test(rawText)) continue;
    const status = /in progress/i.test(rawText) ? 'in progress' : 'not viewed';
    lessons.push({ href, status });
  }
  console.log(`  Anonymous collection — ${lessons.length} incomplete lesson(s) to consume`);

  const origin = new URL(page.url()).origin;

  for (let i = 0; i < lessons.length; i++) {
    const { href, status } = lessons[i];
    const absUrl = href.startsWith('http') ? href : `${origin}${href}`;
    console.log(`  Lesson ${i + 1}/${lessons.length} (${status}): ${absUrl}`);

    await page.goto(absUrl);
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Detect the player type loaded for this lesson.
    const hasPdf    = await page.locator('sunbird-pdf-player').isVisible({ timeout: 3000 }).catch(() => false);
    const hasQuml   = await page.locator('sunbird-quml-player').isVisible({ timeout: 3000 }).catch(() => false);
    const hasYt     = page.frames().some(f => f.url().includes('youtube.com'));
    const hasVideo  = await page.locator('video').isVisible({ timeout: 2000 }).catch(() => false);
    const hasEcml   = await page.locator('iframe[name="contentPlayer"], iframe#contentPlayer').isVisible({ timeout: 2000 }).catch(() => false);
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
    await consumeContent(page, detected, { navigateBack: false });
    await dismissAllModals(page);
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
    // The Sunbird HTML/SCORM player wraps its content in an iframe that uses
    // AngularJS. The sidebar toggle (#sideBarBtn) and Replay div (#sideBar
    // [aria-label="Replay"]) must be triggered via the iframe's own AngularJS
    // scope — plain DOM clicks from the main-page context don't fire ng-click
    // handlers because the scope belongs to the iframe's window.
    console.log('  HTML/SCORM — opening sidebar → clicking Replay via AngularJS scope');

    let consumed = false;
    for (const frame of page.frames()) {
      if (frame === page.mainFrame()) continue;
      try {
        const hasPlayer = await frame.evaluate(() => !!document.querySelector('#sideBarBtn')).catch(() => false);
        if (!hasPlayer) continue;

        // Step 1: open sidebar
        await frame.evaluate(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const win = window as any;
          const btn = document.querySelector('#sideBarBtn');
          if (!btn || !win.angular) return;
          const scope = win.angular.element(btn).scope();
          if (scope?.openMenu) scope.$apply(() => { scope.openMenu(); });
        }).catch(() => {});
        await page.waitForTimeout(600);

        // Step 2: click Replay inside the open sidebar
        await frame.evaluate(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const win = window as any;
          const replayDiv = document.querySelector('#sideBar [aria-label="Replay"]');
          if (!replayDiv) return;
          const scope = win.angular?.element(replayDiv).scope();
          if (scope?.replayContent) {
            scope.$apply(() => { scope.replayContent(); });
          } else {
            replayDiv.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }
        }).catch(() => {});

        await page.waitForTimeout(3000);
        console.log('  HTML/SCORM — Replay triggered via sidebar');
        consumed = true;
        break;
      } catch { /* cross-origin or detached frame */ }
    }

    if (!consumed) {
      console.log('  HTML/SCORM — player frame not found; waiting 10 s');
      await page.waitForTimeout(10000);
    }

  } else if (lowerType === 'epub') {
    console.log('  EPUB — clicking right arrow through pages until completion');
    const lessonStart = Date.now();
    for (let i = 0; i < 200; i++) {
      if (Date.now() - lessonStart > 30_000) {
        console.log(`  EPUB — 30s limit reached after ${i} clicks`);
        break;
      }
      if (page.isClosed()) break;
      if (await completionBanner.isVisible({ timeout: 500 }).catch(() => false)) {
        console.log(`  EPUB — completion detected after ${i} clicks`);
        break;
      }
      await dismissModal(page, 300);
      const clicked = await clickRightArrow(page);
      if (!clicked) {
        // Give the EPUB player an extra second to render navigation controls, then retry.
        await page.waitForTimeout(1000);
        if (!(await clickRightArrow(page))) {
          console.log(`  EPUB — no right arrow found after ${i} clicks, stopping`);
          break;
        }
      }
      await page.waitForTimeout(500);
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
          if (video.duration && isFinite(video.duration) && video.duration > 3) {
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
  // Wait up to 6 s for the rating dialog — useRatingTimer fires after a 5 s delay,
  // so this is the correct place to absorb that wait (inside consumption, not between lessons).
  if (!page.isClosed()) await dismissAllModals(page, 6000);

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
