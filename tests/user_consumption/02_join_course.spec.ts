import { test, expect } from '@playwright/test';
import { handleServerErrors } from './helpers';

test.use({ storageState: 'tests/user_consumption/auth.json' });

const START_URL = 'https://sandbox.sunbirded.org/resources?board=CBSE&medium=English&gradeLevel=Class%201&subject=English&id=NCF&selectedTab=home';

test('Test 2: Join Course', async ({ page }) => {
  test.setTimeout(8 * 60 * 1000);

  console.log('Navigating to portal...');
  await page.goto(START_URL, { waitUntil: 'load', timeout: 90000 }).catch(() => { });

  // Wait for potential content load alerts
  await handleServerErrors(page);
  const fetchError = page.locator('text=/Failed to fetch content|Not Found|404/i').first();
  if (await fetchError.count() > 0 && await fetchError.isVisible()) {
    console.warn('Load error (404/Fetch) detected. Refreshing...');
    await page.reload().catch(() => { });
    await page.waitForTimeout(5000);
  }

  // Go to "Courses" tab
  console.log('Navigating to Courses tab...');
  // For logged in users, the learner page usually has the sections
  const coursesLink = page.locator('a[href*="/learn"], a:has-text("Courses"), button:has-text("Courses")').first();

  try {
    await coursesLink.waitFor({ state: 'visible', timeout: 15000 });
    console.log('Found Courses link. Clicking...');
    await coursesLink.click({ force: true });
  } catch (e) {
    console.warn('Courses link not found. Trying direct navigation to /learn...');
    await page.goto('https://sandbox.sunbirded.org/learn', { waitUntil: 'networkidle' }).catch(() => { });
  }

  await page.waitForLoadState('networkidle').catch(() => { });
  await handleServerErrors(page);

  // Find and click a valid course card
  const cardSelector = '.sb-course-card, .sb-card, .course-card, [role="link"]:has-text("Course"), .sb-card-course, .sb-item';
  console.log('Waiting for course cards to appear...');

  async function ensureCardsLoaded() {
    for (let i = 0; i < 3; i++) {
      const count = await page.locator(cardSelector).count();
      if (count > 0) return true;

      console.log(`No cards found (Attempt ${i + 1}). Scrolling and waiting...`);
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(4000);
      await handleServerErrors(page);
    }
    return false;
  }

  const loaded = await ensureCardsLoaded();
  if (!loaded) {
    console.warn('No cards found via standard selectors. Taking screenshot and trying broad search...');
    await page.screenshot({ path: 'courses_debug.png' });
  }

  // Identify sections
  const sections = page.locator('app-quml-library-cards-grid, sb-library-cards-grid, .sb-grid-container');
  const sectionCount = await sections.count();
  console.log(`Found ${sectionCount} sections on the page.`);

  const COURSE_SEARCH_URL = 'https://sandbox.sunbirded.org/resources?board=CBSE&medium=English&gradeLevel=Class%201&subject=English&id=NCF&selectedTab=course';
  let joinedSuccessfully = false;

  console.log('Starting course search loop...');

  for (let s = 0; s < 15; s++) {
    // 1. Ensure we are on the course search page. If on a detail page, go back.
    if (page.url().includes('/course/do_')) {
      console.log('Detected detail page. Navigating back to search list...');
      const headerBackBtn = page.locator('.sb-item-header, .header, .back-arrow-container, .sb-back-btn-container').locator('button, .sb-back-btn, [aria-label*="back" i], .icon-back, .fa-arrow-left').first();
      if (await headerBackBtn.isVisible().catch(() => false)) {
        await headerBackBtn.click();
      } else {
        await page.goto(COURSE_SEARCH_URL, { waitUntil: 'networkidle' }).catch(() => { });
      }
      await page.waitForTimeout(3000);
    }

    // Refresh sections locators
    const sections = page.locator('app-quml-library-cards-grid, sb-library-cards-grid, .sb-grid-container, [class*="section"]');
    const sectionCount = await sections.count();

    if (s >= sectionCount) {
      console.log(`Searching for section ${s + 1}. Scrolling...`);
      await page.mouse.wheel(0, 1000);
      await page.waitForTimeout(3000);
      await handleServerErrors(page);
      if (s >= await sections.count()) break;
    }

    const section = sections.nth(s);
    const sectionTitle = await section.locator('.sb-label-name, .section-header, h4, .title, .name').first().innerText({ timeout: 2000 }).catch(() => 'Unnamed Section');

    if (sectionTitle.toLowerCase().includes('my courses') || sectionTitle.toLowerCase().includes('recently viewed')) {
      console.log(`Skipping section: "${sectionTitle}"`);
      continue;
    }

    console.log(`Processing section ${s + 1}: "${sectionTitle}"`);

    for (let c = 0; c < 10; c++) {
      // Re-fetch current section and cards list to avoid stale elements after 'goBack'
      const activeSection = page.locator('app-quml-library-cards-grid, sb-library-cards-grid, .sb-grid-container, [class*="section"]').nth(s);
      const activeCards = activeSection.locator(cardSelector);
      const sectionCardCount = await activeCards.count();

      if (c >= sectionCardCount) break;

      const card = activeCards.nth(c);
      await card.scrollIntoViewIfNeeded().catch(() => { });
      await card.waitFor({ state: 'visible', timeout: 4000 }).catch(() => { });
      const cardTitle = await card.innerText().catch(() => 'Unknown Course');

      if (cardTitle.toLowerCase().includes('view all')) continue;

      console.log(`Checking course ${c + 1} in section: "${cardTitle.split('\n')[0].trim()}"`);

      // Click the card and wait for the detail page
      await card.click({ force: true });
      await page.waitForTimeout(6000);
      await handleServerErrors(page);

      // Check for Join and Start buttons
      const joinBtn = page.locator('button, .sb-btn, [role="button"]').filter({ hasText: /Join Course|Join batch|Enroll|Join/i }).filter({ visible: true }).first();
      const startBtn = page.locator('button, .sb-btn, [role="button"]').filter({ hasText: /Start learning|Continue|Resume/i }).filter({ visible: true }).first();

      if (await joinBtn.isVisible().catch(() => false)) {
        console.log(`Found "Join Course" button! Attempting to join...`);
        await joinBtn.click({ force: true });

        // Consent Sharing Popup
        console.log('Checking for consent sharing popup...');
        // The checkbox often has a label or is just a square. Broadening the search.
        const modal = page.locator('.sb-modal, .sb-modal-container').filter({ visible: true }).first();
        const checkbox = modal.locator('input[type="checkbox"], .sb-checkbox, [role="checkbox"]').first();
        const shareBtn = modal.locator('button, .sb-btn').filter({ hasText: /Share|Confirm/i }).first();

        try {
          // Wait for modal to be stable
          await page.waitForTimeout(2000);

          if (await checkbox.isVisible()) {
            await checkbox.click({ force: true });
            console.log('Ticked consent checkbox.');
            await page.waitForTimeout(500);

            if (await shareBtn.isEnabled()) {
              await shareBtn.click({ force: true });
              console.log('Clicked "Share" button.');
            } else {
              console.warn('Share button not enabled after clicking checkbox.');
              // Try clicking checkbox again if it didn't register
              await checkbox.click({ force: true });
              await shareBtn.click({ force: true }).catch(() => { });
            }
          } else {
            console.log('No consent checkbox visible in modal.');
            // Try to find any button that might be "Share" or "Continue" in the modal
            const anyModalBtn = modal.locator('button').filter({ hasText: /Share|Continue|Join/i }).first();
            if (await anyModalBtn.isVisible()) await anyModalBtn.click({ force: true });
          }

          await page.waitForTimeout(5000);
          // Check if we are now on the course page with "Start Learning"
          if (await startBtn.isVisible()) {
            console.log('Successfully joined the course!');
            joinedSuccessfully = true;
            break;
          }
        } catch (e: any) {
          console.warn('Consent flow issue:', e.message);
        }
      } else if (await startBtn.isVisible()) {
        console.log('Course already joined (found Start/Resume button).');
        joinedSuccessfully = true; // Still counts as success as we can enter
        break;
      }

      if (joinedSuccessfully) break;

      // Navigate back to the list using the back arrow in the header
      console.log('Course not joinable. Returning to list view using header back arrow...');
      const headerBackBtn = page.locator('.sb-item-header, .header, .back-arrow-container, .sb-back-btn-container').locator('button, .sb-back-btn, [aria-label*="back" i], .icon-back, .fa-arrow-left').first();
      const genericBackBtn = page.locator('.sb-back-btn, .back-btn, [aria-label*="back" i], .fa-arrow-left').filter({ visible: true }).first();

      if (await headerBackBtn.count() > 0 && await headerBackBtn.isVisible()) {
        console.log('Clicking header back arrow.');
        await headerBackBtn.click();
      } else if (await genericBackBtn.isVisible()) {
        console.log('Clicking generic back button.');
        await genericBackBtn.click();
      } else {
        console.log('No UI back button found, navigating to search URL directly.');
        await page.goto(COURSE_SEARCH_URL, { waitUntil: 'networkidle' }).catch(() => { });
      }

      await page.waitForTimeout(4000);
      await page.waitForLoadState('networkidle').catch(() => { });

      // Safety check: if still on a detail page, force redirect
      if (page.url().includes('/course/do_')) {
        await page.goto(COURSE_SEARCH_URL, { waitUntil: 'networkidle' }).catch(() => { });
        await page.waitForTimeout(3000);
      }
    }

    if (joinedSuccessfully) break;
  }

  if (!joinedSuccessfully) {
    throw new Error('Finished checking sections but could not find a course with an active "Join Course" button.');
  }

  // Final step: click "Start Learning" to ensure we are actually in the consumption view
  const enterBtn = page.locator('button, .sb-btn').filter({ hasText: /Start learning|Continue|Resume/i }).filter({ visible: true }).first();
  if (await enterBtn.isVisible()) {
    console.log('Entering course consumption view...');
    await enterBtn.click({ force: true });
    await page.waitForLoadState('load').catch(() => { });
  } else {
    throw new Error('Could not find "Start learning" button even after successful join.');
  }

  // Update session state
  await page.context().storageState({ path: 'tests/user_consumption/auth.json' });
  console.log(`Success! Joined course and currently at: ${page.url()}`);
});
