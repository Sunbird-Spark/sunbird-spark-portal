import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import { scrollElementToCenter } from './helpers/scroll';

// If an authenticated storageState exists, use it so we can skip guest onboarding.
if (fs.existsSync('auth.json')) {
  test.use({ storageState: 'auth.json' });
} else {
  // auth.json not present — tests will attempt guest flow / onboarding handlers as before
  console.warn('auth.json not found — run `npm run save-auth` to create it and skip onboarding.');
}

const START_URL =
  process.env.START_URL ??
  'https://sandbox.sunbirded.org/resources?board=CBSE&medium=English&gradeLevel=Class%201&subject=English&id=NCF&selectedTab=home';

const USER_EMAIL = (process.env.USER_EMAIL ?? '').trim();
const USER_PASSWORD = (process.env.USER_PASSWORD ?? '').trim();

const COURSE_TITLE = (process.env.COURSE_TITLE ?? '').trim();
const COURSE_TITLE_PATTERN_RAW = (process.env.COURSE_TITLE_PATTERN ?? '').trim();
const COURSE_TITLE_PATTERN = buildCourseTitlePattern();

function buildCourseTitlePattern(): RegExp | null {
  if (COURSE_TITLE_PATTERN_RAW) {
    const m = COURSE_TITLE_PATTERN_RAW.match(/^\/([\s\S]+)\/([gimsuy]*)$/);
    if (m) return new RegExp(m[1], m[2]);
    return new RegExp(COURSE_TITLE_PATTERN_RAW, 'i');
  }
  if (COURSE_TITLE) {
    return new RegExp(COURSE_TITLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }
  return null;
}

test.describe('Course join, consume and certificate download', () => {
  test.setTimeout(12 * 60 * 1000);

  test('join assessment course, complete units and download certificate', async ({ page }) => {
    // Navigate with retry for unstable environments (Bad Gateway)
    let navigationSuccessful = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Navigating to start URL (Attempt ${attempt})...`);
        await page.goto(START_URL, { waitUntil: 'load', timeout: 60000 });

        // Check for server errors
        const content = await page.evaluate(() => document.body.innerText).catch(() => '');
        if (content.includes('Bad Gateway') || content.includes('502') || content.includes('Service Unavailable')) {
          throw new Error('Server error (502/503) detected on initial load.');
        }

        navigationSuccessful = true;
        break;
      } catch (e: any) {
        console.warn(`Attempt ${attempt} failed: ${e.message}`);
        await page.waitForTimeout(5000 * attempt);
      }
    }

    if (!navigationSuccessful) {
      const recovered = await handleServerErrors(page);
      if (!recovered) throw new Error('Failed to reach start URL after 3 attempts due to server errors.');
    }

    // Double check for any 502 after load
    await handleServerErrors(page);

    // If the app redirected to a login page, perform login first
    await handleAuthIfPresent(page);

    // Try to dismiss or complete onboarding if it appears
    await handleOnboardingIfPresent(page);

    // 1) Navigate to "Courses" tab
    await navigateToCoursesTab(page);

    // 2) Open a course (scan until a joinable/startable one is found)
    await openFirstJoinableCourse(page);

    // Confirm we actually navigated/opened the course details page
    console.log('Navigated to course page, waiting for idle...');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { });
    if (!page.isClosed()) await page.waitForTimeout(2000).catch(() => { });

    // Capture course name for searching later in passbook
    console.log('Extracting course name...');
    let courseName = await extractCourseName(page);
    console.log(`Course name identified: "${courseName}"`);

    // 4) Join the course if not already joined
    await joinCourseIfRequired(page);

    // If joining triggered an auth page, handle it
    await handleAuthIfPresent(page);

    if (!page.isClosed()) await page.waitForTimeout(2000).catch(() => { }); // Wait for progress UI to stabilize

    // --- Conditional: Proceed only if not 100% complete ---
    console.log('Verifying course progress...');
    let progressText = await getProgressValue(page);
    console.log(`Current progress: ${progressText}`);

    if (progressText !== '100%') {
      console.log('Course not 100% complete. Starting consumption flow...');
      await completeCourseByModules(page);

      // Wait for overall course progress to show 100%
      console.log('Waiting for final 100% progress...');
      const progressOk = await waitForOverallProgress(page, 5 * 60_000);
      expect(progressOk, 'Expected course progress to reach 100% after learning').toBeTruthy();
    } else {
      console.log('Course is confirmed 100% complete.');
    }

    // 5) Go to profile via 'U' icon and open Learner passbook
    await goToProfile(page);

    // 6) Verify and download certificate
    await verifyAndDownloadCertificate(page, courseName);
  });
});

// --- Navigation & Core Flow Helpers ---

async function navigateToCoursesTab(page: Page) {
  if (page.isClosed()) return;
  try {
    let coursesTrigger = page.getByRole('link', { name: /Courses/i }).first();
    if (await coursesTrigger.count() === 0) coursesTrigger = page.getByRole('button', { name: /Courses/i }).first();
    if (await coursesTrigger.count() === 0) coursesTrigger = page.getByRole('tab', { name: /Courses/i }).first();
    if (await coursesTrigger.count() === 0) coursesTrigger = page.getByText(/Courses/i).first();

    if (await coursesTrigger.count() > 0) {
      const triggerHandle = await coursesTrigger.elementHandle();
      if (triggerHandle) {
        await triggerHandle.scrollIntoViewIfNeeded().catch(() => { });
        await page.evaluate((el: Element) => {
          let node: Element | null = el;
          while (node && !(['A', 'BUTTON'].includes(node.tagName) || node.getAttribute('role') === 'tab')) {
            node = node.parentElement;
          }
          (node ?? el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        }, triggerHandle).catch(() => { });
      } else {
        await coursesTrigger.click().catch(() => { });
      }
      await page.waitForLoadState('networkidle').catch(() => { });
      await page.waitForTimeout(1000).catch(() => { });
    }
  } catch {
    // If we fail here, maybe we are already on courses or it's not needed.
  }
}

async function extractCourseName(page: Page): Promise<string> {
  const courseHeading = page.locator('h1, .course-title, .content-header__title, .sb-course-details__title, .course-name, h2').first();
  let name = '';
  if (await courseHeading.count() > 0) {
    name = (await courseHeading.textContent().catch(() => ''))?.trim() || '';
  }
  if (!name) {
    name = (await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      if (h1) return h1.innerText;
      const firstHeading = document.querySelector('main h1, main h2, h3');
      if (firstHeading) return (firstHeading as HTMLElement).innerText;
      return '';
    }))?.trim() || '';
  }
  return name;
}

async function joinCourseIfRequired(page: Page) {
  console.log('Checking for Join/Start buttons...');
  const joinBtn = page.getByRole('button', { name: /Join Course|Join batch|Join|Enroll|Open batch/i }).first();
  const startBtn = page.getByRole('button', { name: /Start learning|Start Learning|Continue learning|Continue Learning|Resume/i }).first();

  try {
    if (await joinBtn.count() > 0 && await joinBtn.isVisible()) {
      console.log('Clicking Join Course button...');
      await joinBtn.scrollIntoViewIfNeeded().catch(() => { });
      await joinBtn.click().catch(() => { });
      await page.waitForLoadState('networkidle').catch(() => { });
      if (!page.isClosed()) await page.waitForTimeout(2000).catch(() => { });
      await handleConsentIfPresent(page);
    } else if (await startBtn.count() > 0 && await startBtn.isVisible()) {
      console.log('Course already joined, found Start/Continue button.');
    }
  } catch (e: any) {
    console.warn('Error during join/start check:', e.message || e);
  }
}

async function goToProfile(page: Page) {
  // 1) Click 'U' icon on the top right
  console.log('Clicking the "U" icon...');
  const uIcon = page.locator('button:has-text("U"), .avatar-container, [data-testid="profile-icon"], .profile-icon').first();
  await uIcon.scrollIntoViewIfNeeded().catch(() => { });
  await uIcon.click({ force: true }).catch(() => { });
  if (!page.isClosed()) await page.waitForTimeout(1500).catch(() => { });

  // 2) Click Profile
  console.log('Clicking Profile...');
  const profileLink = page.locator('text=Profile, [role="menuitem"]:has-text("Profile"), a:has-text("Profile")').first();
  await profileLink.click({ force: true }).catch(async () => {
    await page.getByText('Profile').first().click().catch(() => { });
  });

  await page.waitForLoadState('networkidle').catch(() => { });
  if (!page.isClosed()) await page.waitForTimeout(2500).catch(() => { });

  // 3) Scroll down to Learner passbook
  console.log('Scrolling to Learner passbook...');
  const passbookHeader = page.getByText(/Learner passbook|Passbook/i).first();
  for (let i = 0; i < 10; i++) {
    if (await passbookHeader.count() > 0 && await passbookHeader.isVisible()) {
      await passbookHeader.scrollIntoViewIfNeeded().catch(() => { });
      console.log('Found Learner passbook section.');
      // Click it to ensure it's expanded or navigated
      await passbookHeader.click().catch(() => { });
      await page.waitForTimeout(1000);
      return;
    }
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(500);
  }
}

async function verifyAndDownloadCertificate(page: Page, courseName?: string) {
  console.log('Checking for certificate...');

  if (courseName) {
    console.log(`Searching for course: "${courseName}" in passbook...`);
    const searchInput = page.locator('input[placeholder*="Search" i], .sb-search-input').first();
    if (await searchInput.count() > 0) {
      await searchInput.clear();
      await searchInput.fill(courseName);
      await page.keyboard.press('Enter').catch(() => { });
      if (!page.isClosed()) await page.waitForTimeout(2000).catch(() => { });
    }
  }

  // Look for download action
  const downloadCta = page.locator('button_or_link:has-text("Download"), .sb-btn-download, [aria-label*="Download" i]').filter({ hasText: /certificate|cert/i }).first();
  const row = courseName ? page.locator('tr, .card, .sb-table-row').filter({ hasText: courseName }).first() : null;

  const finalBtn = row ? row.locator('button, a, [role="button"]').filter({ hasText: /Download|Certificate/i }).first() : downloadCta;

  if (await finalBtn.count() > 0) {
    console.log('Found download button, clicking...');
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 40000 }),
      finalBtn.click({ force: true })
    ]);
    const filename = await download.suggestedFilename();
    console.log(`Certificate downloaded: ${filename}`);
    return;
  }

  // Generic fallback
  const genericCert = page.getByRole('button', { name: /Download certificate|Get certificate/i }).first();
  if (await genericCert.count() > 0) {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 40000 }),
      genericCert.click()
    ]);
    console.log('Generic certificate downloaded.');
    return;
  }

  throw new Error('Could not find download certificate link for ' + (courseName || 'completed course'));
}

// --- Interaction & Consumption Helpers ---

async function completeCourseByModules(page: Page) {
  console.log('Starting module-by-module consumption...');

  // 1) Clear any initial popups or overlays
  await dismissRatingPopup(page);

  // 2) Aggressively try to start learning
  let started = await clickLearningCtaIfPresent(page);
  if (!started) {
    console.warn('Could not find a clear "Start/Continue" button. Attempting to click the first unit link...');
    // Fallback: look for unit/lesson headers or content items
    const fallbackUnit = page.locator('.sb-course-details__content, .toc-item, .lesson-link, a:has-text("Module"), a:has-text("Unit")').first();
    if (await fallbackUnit.count() > 0) {
      await fallbackUnit.click().catch(() => { });
      if (!page.isClosed()) await page.waitForTimeout(2000).catch(() => { });
      started = await clickLearningCtaIfPresent(page);
    }
  }

  // 3) Loop through modules
  for (let step = 0; step < 30; step++) {
    console.log(`Step ${step + 1}: Handling content...`);

    // Check for bad gateway during consumption
    const errorText = await page.evaluate(() => document.body.innerText).catch(() => '');
    if (errorText.includes('Bad Gateway') || errorText.includes('502')) {
      console.error('Server error encountered during consumption. Retrying click...');
      await page.reload().catch(() => { });
      await page.waitForTimeout(3000);
    }

    // Attempt to handle current module content
    const handledSomething = (await handleQuizIfPresent(page))
      || (await handleVideoIfPresent(page))
      || (await handlePdfOrDocumentIfPresent(page));

    if (!handledSomething) {
      console.log('No obvious content (video/quiz/pdf) found. Waiting a bit or checking for CTAs...');
      if (!page.isClosed()) await page.waitForTimeout(3000).catch(() => { });
      await clickLearningCtaIfPresent(page);
    }

    await clickMarkCompleteIfPresent(page);
    await dismissRatingPopup(page);

    // Look for Next Module / Next button
    console.log('Looking for "Next" button...');
    const nextBtn = page.getByRole('button', { name: /Next module|Next Module|Next|Proceed|Forward/i }).filter({ visible: true }).first();

    if (await nextBtn.count() > 0) {
      console.log('Found Next button. Clicking...');
      await nextBtn.scrollIntoViewIfNeeded().catch(() => { });
      await Promise.all([
        page.waitForLoadState('networkidle').catch(() => { }),
        nextBtn.click().catch(() => { }),
      ]);
      if (!page.isClosed()) await page.waitForTimeout(2000).catch(() => { });
    } else {
      console.log('No "Next" button found at this point.');
      // Final check: did we miss a "Continue learning" button?
      if (!await clickLearningCtaIfPresent(page)) {
        console.log('No more modules detected. Exiting consumption loop.');
        break;
      }
    }
  }
}

async function clickLearningCtaIfPresent(page: Page): Promise<boolean> {
  const ctas = [
    page.getByRole('button', { name: /Continue learning|Continue Learning|Resume|Resume learning|Start learning|Start Learning|Start course|Start/i }),
    page.getByRole('link', { name: /Continue learning|Resume|Start learning/i }),
    page.locator('button:has-text("Continue"), button:has-text("Resume"), button:has-text("Start"), button:has-text("Start learning")'),
    page.locator('.sb-btn:has-text("Start"), .sb-btn:has-text("Continue"), .sb-btn:has-text("Resume")')
  ];

  for (const ctaLocator of ctas) {
    const cta = ctaLocator.first();
    if (await cta.count() > 0 && await cta.isVisible()) {
      console.log('Found learning CTA, clicking...');
      await cta.scrollIntoViewIfNeeded().catch(() => { });
      await cta.click({ timeout: 5000 }).catch(() => { });
      await page.waitForLoadState('networkidle').catch(() => { });
      if (!page.isClosed()) await page.waitForTimeout(1500).catch(() => { });
      return true;
    }
  }
  return false;
}

async function getProgressValue(page: Page): Promise<string> {
  try {
    // Priority: Right-side progress bar
    const rightPanel = page.locator('.right-side, .side-panel, .sb-course-details__info, .course-details-panel').first();
    const rightProgress = rightPanel.locator('text=/\\b\\d{1,3}\\s*%\\b/, [aria-label*="progress" i]').first();
    if (await rightProgress.count() > 0 && await rightProgress.isVisible()) {
      const text = await rightProgress.textContent();
      const match = text?.match(/(\d{1,3})\s*%/);
      if (match) return `${match[1]}%`;
    }

    // General percentage
    const percentageLocator = page.locator('text=/\\b\\d{1,3}\\s*%\\b/').first();
    if (await percentageLocator.count() > 0) {
      const text = await percentageLocator.textContent();
      const match = text?.match(/(\d{1,3})\s*%/);
      if (match) return `${match[1]}%`;
    }

    // Completed text
    const completed = page.locator('text=/\\b(Completed|Course completed|Course Progress: 100%)\\b/i').first();
    if (await completed.count() > 0 && await completed.isVisible()) return '100%';

  } catch (e) {
    console.warn('Error reading progress:', e);
  }
  return '0%';
}

async function waitForOverallProgress(page: Page, timeout = 60_000): Promise<boolean> {
  const start = Date.now();
  console.log(`Monitoring progress (timeout ${timeout / 1000}s)...`);
  while (Date.now() - start < timeout) {
    const progress = await getProgressValue(page);
    if (progress === '100%') return true;
    if (!page.isClosed()) await page.waitForTimeout(3000).catch(() => { });
  }
  return false;
}

// --- Content Handlers ---

async function handleVideoIfPresent(page: Page): Promise<boolean> {
  const video = page.locator('video').first();
  if (await video.count() === 0) return false;

  await page.evaluate((v: any) => {
    try {
      v.muted = true;
      v.play();
      v.currentTime = v.duration - 1 || 0;
    } catch { }
  }, await video.elementHandle()).catch(() => { });
  if (!page.isClosed()) await page.waitForTimeout(5000).catch(() => { });
  return true;
}

async function handlePdfOrDocumentIfPresent(page: Page): Promise<boolean> {
  const pdf = page.locator('iframe, .pdf-viewer, .document-viewer').first();
  if (await pdf.count() === 0) return false;

  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(200);
  }
  return true;
}

async function handleQuizIfPresent(page: Page): Promise<boolean> {
  const hasOptions = await page.locator('input[type="radio"], [role="radio"]').count() > 0;
  if (!hasOptions) return false;

  for (let question = 0; question < 20; question++) {
    const option = page.locator('input[type="radio"], [role="radio"], .option, .mcq-option').first();
    if (await option.count() > 0) {
      await option.click({ force: true }).catch(() => { });
      await page.waitForTimeout(300);
    }

    const nextSubmit = page.getByRole('button', { name: /Next|Submit|Finish|Complete/i }).first();
    if (await nextSubmit.count() > 0) {
      await nextSubmit.click().catch(() => { });
      await page.waitForTimeout(800);
      // check for confirm
      const confirm = page.getByRole('button', { name: /Confirm|Yes|Proceed/i }).first();
      if (await confirm.count() > 0) {
        await confirm.click().catch(() => { });
        await page.waitForTimeout(1000);
        break;
      }
    } else {
      break;
    }
  }
  return true;
}

async function clickMarkCompleteIfPresent(page: Page) {
  const btn = page.getByRole('button', { name: /Mark as complete|Complete|Finish/i }).first();
  if (await btn.count() > 0 && await btn.isVisible()) {
    await btn.click().catch(() => { });
    if (!page.isClosed()) await page.waitForTimeout(1000).catch(() => { });
  }
}

async function dismissRatingPopup(page: Page) {
  const close = page.locator('button[aria-label="Close"], button:has-text("Close"), button:has-text("×")').first();
  if (await close.count() > 0 && await close.isVisible()) {
    await close.click().catch(() => { });
    if (!page.isClosed()) await page.waitForTimeout(500).catch(() => { });
  }
}

// --- Onboarding & Auth Helpers ---

async function handleOnboardingIfPresent(page: Page) {
  if (page.isClosed()) return;
  const modal = page.locator('[role="dialog"], .onboarding, .welcome-modal').first();
  try {
    if (await modal.count() === 0) return;
  } catch { return; }

  // Student role
  const student = modal.locator('text=Student, button:has-text("Student")').first();
  if (await student.count() > 0) await student.click().catch(() => { });

  // Continue
  const cont = modal.getByRole('button', { name: /Continue|Next/i }).first();
  if (await cont.count() > 0) await cont.click().catch(() => { });

  // Final submit
  if (!page.isClosed()) await page.waitForTimeout(1000).catch(() => { });
  const submit = modal.getByRole('button', { name: /Submit|Finish|Done/i }).first();
  if (await submit.count() > 0) await submit.click().catch(() => { });
}

async function handleAuthIfPresent(page: Page) {
  const emailField = page.locator('input[type="email"], input[name="username"]').first();
  if (await emailField.count() === 0 || !(await emailField.isVisible())) return;

  if (!USER_EMAIL || !USER_PASSWORD) {
    console.warn('Auth requested but credentials missing.');
    return;
  }

  await emailField.fill(USER_EMAIL);
  const passField = page.locator('input[type="password"]').first();
  if (await passField.count() > 0) await passField.fill(USER_PASSWORD);

  const loginBtn = page.getByRole('button', { name: /LOGIN|Sign in/i }).first();
  await loginBtn.click().catch(() => page.keyboard.press('Enter'));
  await page.waitForLoadState('networkidle').catch(() => { });
}

async function handleConsentIfPresent(page: Page) {
  const share = page.getByRole('button', { name: /Share/i }).first();
  if (await share.count() === 0) return;

  const checkbox = page.locator('input[type="checkbox"], [role="checkbox"]').last();
  if (await checkbox.count() > 0) await checkbox.click().catch(() => { });

  await share.click().catch(() => { });
  if (!page.isClosed()) await page.waitForTimeout(1000).catch(() => { });
}

async function openFirstJoinableCourse(page: Page) {
  console.log('Searching for an openable course...');
  try {
    if (page.isClosed()) return;
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => { });
    await page.waitForTimeout(2000).catch(() => { });
  } catch { return; }

  const maxScrolls = 20;
  const seen = new Set<string>();
  const initialUrl = page.url();

  for (let i = 0; i < maxScrolls; i++) {
    if (page.isClosed()) return;

    // Check for server errors on the list page
    const recoveredList = await handleServerErrors(page);
    if (!recoveredList) {
      console.warn('Sandbox list page unstable, refreshing...');
      await page.reload().catch(() => { });
      await page.waitForTimeout(3000).catch(() => { });
    }

    const cardSelector = '.sb-course-card, .sb-card, .course-card, [role="link"]:has-text("Course"), .sb-card-course';
    let count = 0;
    try {
      count = await page.locator(cardSelector).count();
    } catch {
      if (page.isClosed()) return;
    }

    console.log(`Scroll ${i + 1}: Found ${count} potential course cards.`);

    if (count === 0 && i < 5) {
      console.log('Waiting for course list to populate...');
      await page.waitForTimeout(4000).catch(() => { });
      try { count = await page.locator(cardSelector).count(); } catch { }
    }

    for (let j = 0; j < count; j++) {
      if (page.isClosed()) return;

      const card = page.locator(cardSelector).nth(j);
      let isVisible = false;
      try { isVisible = await card.isVisible(); } catch { }
      if (!isVisible) continue;

      let text = '';
      try { text = (await card.textContent().catch(() => ''))?.trim() || ''; } catch { }
      if (!text || seen.has(text)) continue;
      seen.add(text);

      if (COURSE_TITLE_PATTERN && !COURSE_TITLE_PATTERN.test(text)) {
        continue;
      }

      console.log(`Checking card ${j + 1}: "${text.split('\n')[0].substring(0, 50)}..."`);
      try {
        await card.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => { });
      } catch { continue; }

      if (page.isClosed()) return;

      const link = card.locator('a, [role="link"]').first();
      try {
        console.log('Navigating to course detail page...');
        await link.click({ timeout: 10000 }).catch(() => card.click({ force: true }));

        // Wait for URL change or state change
        await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
      } catch (e: any) {
        console.warn('Navigation attempt took too long or failed:', e.message);
      }

      if (page.isClosed()) return;

      // Ensure we actually moved to a different page or it finished loading
      await page.waitForLoadState('load', { timeout: 20000 }).catch(() => { });

      // Handle potential 502/server error on the target page
      const detailRecovered = await handleServerErrors(page);
      if (!detailRecovered) {
        console.warn('Could not recover from server error on course detail page. Skipping.');
        await page.goto(initialUrl).catch(() => { });
        continue;
      }

      await page.waitForTimeout(3000).catch(() => { });
      if (page.isClosed()) return;

      // Identify joinable/startable content
      const actionButtons = page.locator('button_or_link:has-text("Join"), button_or_link:has-text("Start"), button_or_link:has-text("Continue"), button_or_link:has-text("Resume"), button_or_link:has-text("Open batch")').first();

      let canStart = false;
      try {
        canStart = await actionButtons.count() > 0 && await actionButtons.isVisible();
      } catch { }

      if (canStart) {
        console.log(`Successfully reached a valid course page.`);
        return;
      }

      console.log('No Join/Start options found on this page, returning to list...');
      try {
        await page.goto(initialUrl, { timeout: 30000 }).catch(() => page.goBack());
        await page.waitForLoadState('load').catch(() => { });
      } catch { }
    }

    console.log('Scrolling down for more courses...');
    try {
      if (!page.isClosed()) {
        await page.mouse.wheel(0, 1000).catch(() => { });
        await page.waitForTimeout(2500).catch(() => { });
      }
    } catch { }
  }

  throw new Error('Course discovery failed after ' + maxScrolls + ' scrolls. Sandbox might be unstable.');
}

/**
 * Global helper to detect and recover from server errors (502/503/504)
 */
async function handleServerErrors(page: Page, maxRetries = 4): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    if (page.isClosed()) return true;

    const errorDetected = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('502') || text.includes('Bad Gateway') ||
        text.includes('503') || text.includes('Service Unavailable') ||
        text.includes('504') || text.includes('Gateway Timeout') ||
        text.includes('Bad gateway');
    }).catch(() => false);

    if (errorDetected) {
      console.warn(`Server Error (50x) detected. Attempt ${i + 1}/${maxRetries}. Refreshing in 10s...`);
      await page.waitForTimeout(10000).catch(() => { });
      if (page.isClosed()) return true;
      await page.reload({ waitUntil: 'load', timeout: 60000 }).catch(() => { });
    } else {
      return true;
    }
  }
  return false;
}
