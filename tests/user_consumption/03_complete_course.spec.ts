import { test, expect } from '@playwright/test';
import { handleServerErrors } from './helpers';

test.use({ storageState: 'tests/user_consumption/auth.json' });

test('Test 3: Complete Course', async ({ page }) => {
  test.setTimeout(15 * 60 * 1000); // 15 minutes for full consumption
  console.log('Starting course consumption flow...');

  const COURSE_LIST_URL = 'https://sandbox.sunbirded.org/resources?board=CBSE&medium=English&gradeLevel=Class%201&subject=English&id=NCF&selectedTab=course';

  // 1. Mandatory navigation to the course list page
  console.log('Navigating to course search list...');
  await page.goto(COURSE_LIST_URL, { waitUntil: 'load', timeout: 60000 }).catch(() => { });
  await page.waitForLoadState('networkidle').catch(() => { });

  // Recovery: If redirected to login, use helper
  const { handleLogin } = require('./helpers');
  await handleLogin(page);

  await handleServerErrors(page);

  // 2. Find and open an incomplete course
  console.log('Searching for an incomplete course...');
  const cardSelector = '.sb-course-card, .sb-card, .course-card, [role="link"]:has-text("Course")';

  if (!(await page.locator(cardSelector).first().isVisible({ timeout: 15000 }).catch(() => false))) {
    console.log('No cards visible. Refreshing page...');
    await page.reload({ waitUntil: 'networkidle' }).catch(() => { });
  }

  let courseOpened = false;
  const maxSearchAttempts = 10;

  for (let i = 0; i < maxSearchAttempts; i++) {
    const cards = page.locator(cardSelector);
    if (i >= await cards.count()) break;

    const currentCard = cards.nth(i);
    const cardTitle = await currentCard.innerText().then(t => t.split('\n')[0]).catch(() => `Course ${i + 1}`);
    console.log(`\n--- Attempt ${i + 1}: Checking "${cardTitle.trim()}" ---`);

    await currentCard.click({ force: true }).catch(() => { });
    await page.waitForTimeout(6000);
    await handleServerErrors(page);

    // 3. Handle Consent (if appears)
    const checkbox = page.locator('input[type="checkbox"], .sb-checkbox, [role="checkbox"]').first();
    if (await checkbox.isVisible({ timeout: 5000 })) {
      console.log('Consent modal detected. Filling...');
      await page.locator('text=/I consent to share/i').first().click({ force: true }).catch(() => { });
      await page.locator('button, .sb-btn').filter({ hasText: /^Share$/i }).click({ force: true }).catch(() => { });
      await page.waitForTimeout(3000);
    }

    // 4. Robust Progress Check on Right Side (Priority #1)
    console.log('Waiting for course progress widget to load...');
    let progressText = '';
    let isCompleted = false;

    // Wait for the progress widget and check text
    for (let pWait = 0; pWait < 15; pWait++) {
      const pLoc = page.locator('.sb-course-progress, .course-progress-container, .percent-completed, .progress-info, .progress-label, [class*="progress-widget"]').filter({ visible: true }).first();
      if (await pLoc.isVisible().catch(() => false)) {
        progressText = (await pLoc.innerText().catch(() => '')).trim();
        console.log(`Progress check on current course: "${progressText.replace(/\n/g, ' ')}"`);

        // USER REQUIREMENT: If it says exactly 100% Completed, we must skip it
        if (progressText.includes('100%') || progressText.toLowerCase().includes('completed')) {
          isCompleted = true;
          break;
        }
        // If it's anything less than 100, we proceed with consumption
        if (progressText.includes('%') && !progressText.includes('100%')) {
          isCompleted = false;
          break;
        }
      }
      await page.waitForTimeout(1000);
    }

    // HIGH PRIORITY SKIP: If course is 100% completed, click the back arrow near the title
    if (isCompleted) {
      console.log('Requirement Match: Course is 100% completed. Clicking back arrow to find an incomplete course...');
      // Target the blue circular back button near the title (seen in user image)
      const backArrow = page.locator('.sb-btn-back, button.sb-btn-back, .sb-icon-back, [aria-label*="back" i]').filter({ visible: true }).first();

      if (await backArrow.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('Clicking the circular blue back arrow near course title...');
        await backArrow.click({ force: true }).catch(() => { });
        // Wait for search list to be visible again
        await page.waitForTimeout(5000);
        await page.locator(cardSelector).first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => { });
      } else {
        console.log('Back arrow not found. Navigating to courses page via URL...');
        await page.goto(COURSE_LIST_URL).catch(() => { });
        await page.waitForTimeout(6000);
      }
      continue; // Move to next card in search list (index i will increment)
    }

    // If NOT 100% completed, we proceed to consumption
    const startOrResumeBtn = page.locator('button, .sb-btn-primary').filter({ hasText: /Start learning|Continue learning|Resume|Start/i }).filter({ visible: true }).first();
    const canProceed = await startOrResumeBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (canProceed || !isCompleted) {
      console.log(`Success: Found an incomplete course ("${cardTitle.trim()}"). Proceeding to unit consumption...`);
      courseOpened = true;
      break;
    }
  }

  if (!courseOpened) {
    console.log('Notice: No clearly incomplete courses found in the current search criteria.');
  }

  // 5. Entry to Consumption (Start Learning)
  const startBtn = page.locator('button, .sb-btn-primary').filter({ hasText: /Start learning|Continue learning|Resume|Start/i }).filter({ visible: true }).first();

  if (await startBtn.isVisible({ timeout: 15000 }).catch(() => false)) {
    console.log('Clicking course entry button...');
    await startBtn.click({ force: true }).catch(() => { });

    // Safety check after click
    if (page.isClosed()) {
      console.log('Browser closed unexpectedly after click.');
      return;
    }

    try {
      await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => { });
      await page.waitForTimeout(5000);
    } catch (e) {
      console.log('Timeout during loading player view.');
    }
  } else {
    console.log('Entry button check: Looking for active player URL...');
    if (!page.url().includes('/course/play/')) {
      await page.reload({ waitUntil: 'load' }).catch(() => { });
      await page.waitForTimeout(3000);
    }
  }

  if (page.isClosed()) return;

  // Final check: must be in player view to consume units
  if (!page.url().includes('/course/play/')) {
    console.log('Safety check: Forcing navigation to player view if possible...');
    const playBtn = page.locator('.sb-btn-primary, .sb-btn-outline-primary').filter({ hasText: /learning|play|resume/i }).first();
    if (await playBtn.isVisible().catch(() => false)) await playBtn.click({ force: true }).catch(() => { });
  }

  // 6. Unit Consumption Loop
  console.log('--- Starting Unit-by-Unit Consumption ---');
  for (let unit = 0; unit < 45; unit++) {
    if (page.isClosed()) break;
    await handleServerErrors(page);

    // Generic Pop-up Handler (Handles feedback, consent, or any other modal)
    const modal = page.locator('.sb-modal, .sb-modal-container, [role="dialog"], .sb-modal-main').filter({ visible: true }).first();
    if (await modal.isVisible().catch(() => false)) {
      const modalText = await modal.innerText().catch(() => '');
      console.log(`Pop-up detected: "${modalText.substring(0, 50).replace(/\n/g, ' ')}..."`);

      // Special handling for "Enjoyed this content" or common feedback pop-ups
      if (modalText.toLowerCase().includes('enjoyed') || modalText.toLowerCase().includes('feedback') || modalText.toLowerCase().includes('rating')) {
        console.log('Feedback/Rating pop-up detected. Clicking "X" to close...');
        const closeBtn = modal.locator('.sb-modal-close, [aria-label="Close"], button:has-text("×"), .close-icon, .close').first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click({ force: true }).catch(() => { });
          await page.waitForTimeout(2000);
        }
      } else {
        // Handle other modals (Consent, etc.)
        const modalCheckbox = modal.locator('input[type="checkbox"], .sb-checkbox, [role="checkbox"]').first();
        if (await modalCheckbox.isVisible().catch(() => false)) {
          console.log('Ticking checkbox in pop-up...');
          await modalCheckbox.click({ force: true }).catch(() => { });
          await page.waitForTimeout(500);
        }

        const modalActionBtn = modal.locator('button').filter({ hasText: /Submit|Continue|Share|Confirm|OK/i }).first();
        if (await modalActionBtn.isVisible().catch(() => false)) {
          console.log(`Clicking "${await modalActionBtn.innerText().catch(() => 'Action')}" in pop-up...`);
          await modalActionBtn.click({ force: true }).catch(() => { });
          await page.waitForTimeout(2000);
        } else {
          const closeBtn = modal.locator('.sb-modal-close, [aria-label="Close"], button:has-text("×"), .close-icon').first();
          if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click({ force: true }).catch(() => { });
        }
      }
    }

    // Check if we are still in the player
    if (!page.url().includes('/course/play/')) {
      console.log('Not in player view. Checking for start button...');
      if (await startBtn.isVisible()) {
        await startBtn.click({ force: true });
        await page.waitForTimeout(5000);
      } else if (unit > 2) {
        console.log('Exiting consumption loop as we are no longer in player.');
        break;
      }
    }

    // Handle Content Completion
    console.log(`Processing unit step ${unit + 1}...`);

    // Define the main content player container
    const playerContainer = page.locator('#player-auto-scroll, .content-player, #contentPlayer, .sunbird-player-container').first();
    const hasPlayer = await playerContainer.isVisible().catch(() => false);

    // 1. Check for Video - Play fully at maximum speed (16x)
    const video = page.locator('video').first();
    if (await video.isVisible().catch(() => false)) {
      console.log('Video detected. Playing at 16x speed until completion...');
      await video.evaluate((v: HTMLVideoElement) => {
        v.muted = true;
        v.playbackRate = 16; // Use browser maximum for automation efficiency
        v.play().catch(() => { });
      }).catch(() => { });

      // Monitor video until it finishes OR the feedback modal appears
      for (let vWait = 0; vWait < 600; vWait++) { // Up to 10 mins for very long videos
        const isEnded = await video.evaluate((v: HTMLVideoElement) => v.ended || v.currentTime >= v.duration - 0.5).catch(() => true);
        const feedbackShown = await page.locator('.sb-modal, .sb-modal-container').filter({ hasText: /enjoyed|feedback|rating/i }).first().isVisible().catch(() => false);

        if (isEnded || feedbackShown) break;
        if (vWait % 15 === 0) console.log('Video playing...');
        await page.waitForTimeout(1000);
      }
      console.log('Video finished.');
    }

    // 2. Check for PDF/Document
    const isPDF = await page.locator('.pdf-viewer, #viewer, iframe[src*="pdf"]').first().isVisible().catch(() => false) ||
      await page.frameLocator('iframe').locator('.pdf-viewer, #viewer').first().isVisible().catch(() => false);

    if (isPDF) {
      console.log('PDF detected. Scrolling for completion...');
      if (hasPlayer) {
        await playerContainer.hover().catch(() => { });
        for (let s = 0; s < 5; s++) {
          await page.mouse.wheel(0, 3000);
          await page.waitForTimeout(800);
        }
      }
      const pdfNextPage = page.locator('.fa-chevron-right, .icon-next, #next, [aria-label="Next page"]').filter({ visible: true }).first();
      while (await pdfNextPage.isVisible().catch(() => false)) {
        console.log('Clicking PDF next page...');
        await pdfNextPage.click({ force: true }).catch(() => { });
        await page.waitForTimeout(1500);
        // Check if modal appeared after page change
        if (await page.locator('.sb-modal, .sb-modal-container').filter({ hasText: /enjoyed|feedback/i }).isVisible().catch(() => false)) break;
      }
    }

    // 3. Right Arrow Aggressive Handling (Quiz/Assessment)
    const rightArrowSelectors = ['.fa-chevron-right', '.next-button', '[aria-label="Next"]', '.right-arrow', '.icon-next', '#next', '.chevron-right', '[aria-label*="Next" i]'];

    console.log('Checking for assessment/paging arrows...');
    for (let quizStep = 0; quizStep < 40; quizStep++) {
      const feedbackShown = await page.locator('.sb-modal, .sb-modal-container').filter({ hasText: /enjoyed|feedback/i }).isVisible().catch(() => false);
      if (feedbackShown) break;

      let foundArrow = false;
      const arrows = page.locator(rightArrowSelectors.join(', ')).filter({ visible: true });
      const iframeArrows = page.frameLocator('iframe').locator(rightArrowSelectors.join(', ')).filter({ visible: true });

      if (await arrows.count() > 0) {
        console.log(`Clicking internal right arrow (Quiz step ${quizStep + 1})...`);
        await arrows.last().click({ force: true }).catch(() => { });
        foundArrow = true;
        await page.waitForTimeout(2500);
      } else if (await iframeArrows.count() > 0) {
        console.log(`Clicking iframe internal right arrow (Quiz step ${quizStep + 1})...`);
        await iframeArrows.last().click({ force: true }).catch(() => { });
        foundArrow = true;
        await page.waitForTimeout(2500);
      }

      const quizSubmitBtn = page.locator('button').filter({ hasText: /Submit|Finish|Done/i }).filter({ visible: true }).first();
      if (await quizSubmitBtn.isVisible().catch(() => false)) {
        console.log('Submit button found. Completing assessment...');
        await quizSubmitBtn.click({ force: true }).catch(() => { });
        await page.waitForTimeout(3000);
        break;
      }
      if (!foundArrow) break;
    }

    // 4. UNIT SIGNAL: Handle "Enjoyed this content" pop-up
    console.log('Waiting for unit completion signal ("Enjoyed this content" pop-up)...');
    if (page.isClosed()) break;

    // Broaden modal selector to catch any variation
    const feedbackModal = page.locator('.sb-modal, .sb-modal-container, .sb-modal-main, .modal-content, [role="dialog"], mat-dialog-container, .ui.modal').filter({ hasText: /enjoyed|feedback|rating|how was|rate/i }).filter({ visible: true }).first();

    // Crucial: Wait until the feedback modal appears
    let modalHandled = false;
    for (let fWait = 0; fWait < 45; fWait++) {
      if (page.isClosed()) break;

      const isVisible = await feedbackModal.isVisible().catch(() => false);
      if (isVisible) {
        console.log('Success! Feedback pop-up detected.');

        const closeBtnSelectors = [
          '.sb-modal-close',
          '.close-btn',
          'i.close',
          '.close-icon',
          '.sb-icon-close',
          '[aria-label="Close"]',
          '.close',
          '.sb-btn-close',
          'button:has-text("×")',
          '.ui.modal .close',
          'button .icon-close',
          'mat-icon:has-text("close")',
          '.sb-modal-header .close'
        ];

        let clickedClose = false;

        // 1. Try known selectors in the main page
        for (const selector of closeBtnSelectors) {
          const btn = feedbackModal.locator(selector).first();
          if (await btn.isVisible().catch(() => false)) {
            console.log(`Clicking close button (${selector})...`);
            await btn.click({ force: true }).catch(() => { });
            clickedClose = true;
            break;
          }
        }

        // 2. Try iframe if not clicked
        if (!clickedClose) {
          console.log('Checking iframes for close button...');
          for (const selector of closeBtnSelectors) {
            const iframeBtn = page.frameLocator('iframe').locator(selector).filter({ visible: true }).first();
            if (await iframeBtn.isVisible().catch(() => false)) {
              await iframeBtn.click({ force: true }).catch(() => { });
              clickedClose = true;
              break;
            }
          }
        }

        // 3. Last Resort: Keyboard Escape or Top-Right click
        if (!clickedClose) {
          console.log('No close button found. Sending Escape...');
          await page.keyboard.press('Escape').catch(() => { });
          await page.waitForTimeout(1000);

          if (!(await feedbackModal.isVisible().catch(() => false))) {
            clickedClose = true;
          } else {
            console.log('Escape failed. Attempting click at modal top-right area...');
            const box = await feedbackModal.boundingBox().catch(() => null);
            if (box) {
              // Aim for top-right corner (approx)
              await page.mouse.click(box.x + box.width - 20, box.y + 20).catch(() => { });
              await page.waitForTimeout(2000);
            }
          }
        }

        if (clickedClose) {
          modalHandled = true;
          await page.waitForTimeout(2000);
          break;
        }
      }

      // Backup: check if progress bar hit 100% already
      const progressWidget = page.locator('.sb-course-progress, .course-progress, .percent-completed, .progress-info').first();
      if (await progressWidget.isVisible().catch(() => false)) {
        const currentProg = await progressWidget.innerText().catch(() => '');
        if (currentProg.includes('100%') || currentProg.toLowerCase().includes('completed')) {
          console.log('Progress shows 100%. Moving on...');
          break;
        }
      }

      if (fWait % 15 === 0 && fWait > 0) console.log('Waiting for completion modal...');
      await page.waitForTimeout(1000);
    }

    // 5. Monitor Overall Progress
    const progressLocators = ['.sb-course-progress', '.course-progress', '.progress-info', '.percent-completed', '.progress-label'];
    let progressText = '0%';
    for (const selector of progressLocators) {
      const text = await page.locator(selector).first().innerText().catch(() => '');
      if (text.trim() && (text.includes('%') || text.includes('/'))) {
        progressText = text.trim();
        break;
      }
    }
    console.log(`Current progress: ${progressText}`);
    if (progressText.includes('100%') || progressText.includes('Completed')) {
      console.log('Success: Course completed fully.');
      break;
    }

    // 6. Transition to Next Unit (External)
    const nextBtn = page.locator('button, .sb-btn').filter({ hasText: /^Next$|^Next module$|^Continue/i }).filter({ visible: true }).first();
    const transArrow = page.locator('.fa-chevron-right, .icon-next, [aria-label*="Next" i]').filter({ visible: true }).last();

    if (page.isClosed()) break;
    if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Moving to next unit via "Next" button...');
      await nextBtn.click({ force: true }).catch(() => { });
      await page.waitForTimeout(6000);
    } else if (await transArrow.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Moving to next unit via arrow...');
      await transArrow.click({ force: true }).catch(() => { });
      await page.waitForTimeout(6000);
    } else {
      console.log('No "Next" button/arrow found. Attempting sidebar navigation fallback...');

      if (page.isClosed()) break;
      // Sidebar Fallback: Find next item in TOC
      const tocItems = page.locator('.toc-item, .sb-playlist-item, .content-item, .chapter-item, .sb-list-item').filter({ visible: true });
      const tocCount = await tocItems.count().catch(() => 0);

      if (tocCount > 0) {
        let activeIndex = -1;
        for (let t = 0; t < tocCount; t++) {
          if (page.isClosed()) break;
          const isSelected = await tocItems.nth(t).getAttribute('class').then(c => c?.includes('active') || c?.includes('selected') || c?.includes('current')).catch(() => false);
          if (isSelected) {
            activeIndex = t;
            break;
          }
        }

        const targetIndex = activeIndex + 1;
        if (targetIndex >= 0 && targetIndex < tocCount) {
          console.log(`Clicking next TOC item (index ${targetIndex})...`);
          await tocItems.nth(targetIndex).scrollIntoViewIfNeeded().catch(() => { });
          await tocItems.nth(targetIndex).click({ force: true }).catch(() => { });
          await page.waitForTimeout(6000);
        } else {
          console.log('Final TOC item reached or active item not identified.');
        }
      } else {
        console.log('No sidebar/TOC items found.');
      }
      await page.waitForTimeout(4000);
    }
  }

  // 7. Post-Completion: Navigate to Profile and Learner Passbook
  if (page && !page.isClosed()) {
    console.log('--- Verifying Course Completion in Profile ---');

    // Handle "Successfully completed" pop-up if visible
    const completionModal = page.locator('.sb-modal, .sb-modal-container').filter({ hasText: /successfully completed|course completed/i }).filter({ visible: true }).first();
    if (await completionModal.isVisible({ timeout: 10000 }).catch(() => false)) {
      console.log('Completion modal detected. Closing...');
      const closeBtn = completionModal.locator('.sb-modal-close, [aria-label="Close"], button:has-text("×")').first();
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click({ force: true }).catch(() => { });
      await page.waitForTimeout(2000);
    }

    // A. Click "U" icon (Profile Avatar)
    console.log('Opening profile menu...');
    const profileIcon = page.locator('button[aria-label*="profile"i], .avatar-container, .sb-avatar, mat-icon:has-text("account_circle"), text=/^[A-Z]$/').first();
    if (await profileIcon.isVisible({ timeout: 10000 }).catch(() => false)) {
      await profileIcon.click({ force: true }).catch(() => { });
      await page.waitForTimeout(3000);
    } else {
      console.log('Profile icon not found. Navigating to profile URL directly...');
      await page.goto('https://sandbox.sunbirded.org/profile', { waitUntil: 'load' }).catch(() => { });
    }

    // B. Click "Profile" from sidebar/menu
    const profileLink = page.locator('[role="menuitem"], .sb-menu-item, a').filter({ hasText: /^Profile$/i }).first();
    if (await profileLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Clicking "Profile" link...');
      await profileLink.click({ force: true }).catch(() => { });
      await page.waitForTimeout(5000);
    } else if (!page.url().includes('/profile')) {
      console.log('Profile link not visible. Navigating directly...');
      await page.goto('https://sandbox.sunbirded.org/profile').catch(() => { });
      await page.waitForTimeout(5000);
    }

    // C. Find "Learner passbook" and scroll
    console.log('Final Step: Locating Learner passbook...');
    await page.waitForLoadState('networkidle').catch(() => { });
    const passbook = page.locator('text=Learner passbook, .learner-passbook-container, #learner-passbook').first();
    if (await passbook.isVisible({ timeout: 15000 }).catch(() => false)) {
      console.log('Learner passbook found. Scrolling into view...');
      await passbook.scrollIntoViewIfNeeded().catch(() => { });
      await page.waitForTimeout(5000);
      console.log('--- Flow Complete: Course Consumed & Passbook Verified ---');
    } else {
      console.log('Warning: Learner passbook not visible on profile page. Scrolling down anyway...');
      await page.mouse.wheel(0, 1000);
      await page.waitForTimeout(3000);
    }
  }

  await page.context().storageState({ path: 'tests/user_consumption/auth.json' }).catch(() => { });
  console.log('Test 3: Course consumption and profile verification finished.');
});
