import { test, expect, Page, Locator } from '@playwright/test';

const BASE = 'https://sandbox.sunbirded.org/';
const USER_EMAIL = 'user2@yopmail.com';
const USER_PASSWORD = 'User2@123';

test.describe('Join and complete a course end-to-end', () => {
  test.setTimeout(5 * 60 * 1000); // allow up to 5 minutes for long flows

  test('Join and complete course then download certificate', async ({ page }) => {
    // 1. Go to application
    await page.goto(BASE);

    // Handle onboarding pop-ups: select role = Student and pick Board/Medium/Grade/Subject and district
    await handleOnboarding(page);

    // 2. Open profile menu (G icon) and go to login
    await openProfileSidebarAndLogin(page);

    // 3. Go to Courses
    await navigateToCourses(page);

    // 4. Find a course with a "Join Course" or enroll/open batch button
    const courseOpened = await openCourseWithJoin(page);
    expect(courseOpened, 'Expected to find a course with a join/enroll action').toBeTruthy();

    // 5. Join course (if needed) and consume content unit-by-unit
    await joinCourseIfNeeded(page);
    await consumeAllUnits(page);

    // 6. After completion, go to profile and check certificate
    await goToProfile(page);

    // 7. Verify certificate is present and can be downloaded
    await verifyAndDownloadCertificate(page);
  });
});

// Helper implementations follow. These use tolerant selectors because the site structure may vary.

async function login(page: Page) {
  // Wait for typical login input fields to appear; try a few fallbacks
  const emailLocator = page.locator('input[type="email"], input[name="username"], input[name="email"], input[placeholder*="Email"], input[aria-label*="Email"]').first();
  const passwordLocator = page.locator('input[type="password"], input[name="password"], input[placeholder*="Password"], input[aria-label*="Password"]').first();

  await emailLocator.waitFor({ state: 'visible', timeout: 20000 });
  await emailLocator.fill(USER_EMAIL);
  await passwordLocator.fill(USER_PASSWORD);

  // submit - try typical buttons
  const submitButtons = [
    'button:has-text("Login")',
    'button:has-text("Log in")',
    'button:has-text("Sign in")',
    'button[type="submit"]',
  ];
  for (const b of submitButtons) {
    const btn = page.locator(b).first();
    if (await btn.count() > 0) {
      await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {}), btn.click()]);
      break;
    }
  }

  // If login didn't redirect, wait a bit for authenticated UI to appear (profile/avatar)
  await page.waitForTimeout(2000);
}


// New helper: handle onboarding popups
async function handleOnboarding(page: Page) {
  // Wait for onboarding modal/dialog to appear (best-effort). If none appears, continue.
  const modal = page.locator('[role="dialog"], .onboarding, .welcome-modal, .onboarding-modal').first();
  try {
    await modal.waitFor({ state: 'visible', timeout: 5000 });
  } catch (e) {
    // no onboarding modal found quickly - nothing to do
    return;
  }

  // Within the modal, select Student role if present
  const studentBtn = modal.getByRole('button', { name: /student/i }).first();
  if (await studentBtn.count() > 0) {
    await studentBtn.click();
    await page.waitForTimeout(400);
  }

  // Try to select Board/Medium/Grade/Subject. Prefer native <select> if present, otherwise click option lists.
  const selects = modal.locator('select');
  const selectCount = await selects.count();
  if (selectCount > 0) {
    for (let i = 0; i < selectCount; i++) {
      const sel = selects.nth(i);
      // select the second option if available (index 1) otherwise first
      try {
        await sel.selectOption({ index: 1 });
      } catch {
        try {
          await sel.selectOption({ index: 0 });
        } catch {
          // ignore
        }
      }
      await page.waitForTimeout(200);
    }
  } else {
    // fallback: interact with label-based dropdowns
    const preferenceLabels = ['Board', 'Medium', 'Grade', 'Subject'];
    for (const label of preferenceLabels) {
      const labelEl = modal.getByText(new RegExp(label, 'i')).first();
      if (await labelEl.count() > 0) {
        await labelEl.click().catch(() => {});
        // pick first option in dropdown
        const option = page.locator('li[role="option"], .rc-virtual-list .ant-select-item, .dropdown-item').first();
        if (await option.count() > 0) {
          await option.click().catch(() => {});
        }
        await page.waitForTimeout(200);
      }
    }
  }

  // District selection (try select element or label)
  const districtSelect = modal.locator('select[name="district"], select[placeholder*="District"]').first();
  if (await districtSelect.count() > 0) {
    try {
      await districtSelect.selectOption({ index: 1 });
    } catch {
      // ignore
    }
  } else {
    const districtLabel = modal.getByText(/District/i).first();
    if (await districtLabel.count() > 0) {
      await districtLabel.click().catch(() => {});
      const districtOption = page.locator('li[role="option"], .ant-select-item, .dropdown-item').nth(1).first();
      if (await districtOption.count() > 0) {
        await districtOption.click().catch(() => {});
      }
    }
  }

  // Submit the onboarding form if submit button exists inside modal
  const submitBtn = modal.getByRole('button', { name: /Submit|Continue|Done|Next/i }).first();
  if (await submitBtn.count() > 0) {
    await Promise.all([page.waitForLoadState('networkidle').catch(() => {}), submitBtn.click().catch(() => {})]);
    // wait for modal to close
    try {
      await modal.waitFor({ state: 'detached', timeout: 5000 });
    } catch {
      await page.waitForTimeout(800);
    }
  }
}

// New helper: open profile sidebar (G icon) and navigate to login
async function openProfileSidebarAndLogin(page: Page) {
  // Click the 'G' icon top-right
  // Take a screenshot after onboarding to inspect the top-right UI
  try {
    await page.screenshot({ path: 'debug-after-onboarding.png', fullPage: true });
  } catch {}

  // Try strict locators for the 'G' icon (exact text, aria-labels, test ids, avatar classes)
  let gIcon = page.getByRole('button', { name: /^G$/ }).first();
  if (await gIcon.count() === 0) {
    gIcon = page.locator('button[aria-label*="profile"i], button[aria-label*="account"i], [data-testid="profile-button"]').first();
  }
  if (await gIcon.count() === 0) {
    gIcon = page.locator('.user-avatar, .avatar, .profile-btn').first();
  }

  if (await gIcon.count() > 0) {
    try {
      await gIcon.click();
      await page.waitForTimeout(500);
    } catch (err) {
      // On failure, capture screenshot + rethrow to make debugging easier
      await page.screenshot({ path: 'debug-gclick-failure.png', fullPage: true }).catch(() => {});
      console.error('Failed clicking G icon:', err);
      throw err;
    }
  } else {
    // if we couldn't find a good G icon locator, save a screenshot for debugging
    await page.screenshot({ path: 'debug-gicon-not-found.png', fullPage: true }).catch(() => {});
    console.warn('G icon not found with strict locators');
  }

  // In the sidebar, click Login / Sign in
  const loginBtn = page.getByRole('button', { name: /Login|Log in|Sign in|Sign In/i }).first();
  if (await loginBtn.count() > 0) {
    await loginBtn.click().catch(() => {});
    // Wait for the auth page to load
    await page.waitForLoadState('networkidle');
  }

  // perform login (fills inputs and submits)
  await login(page);
}

// Update: after login we need to more carefully navigate to the course and join
async function navigateToCourses(page: Page) {
  // Try a tab or nav link named 'Courses'
  const coursesLink = page.getByRole('link', { name: /Courses|Library/i }).first();
  if (await coursesLink.count() > 0) {
    await coursesLink.click();
    await page.waitForLoadState('networkidle');
    return;
  }

  // sometimes the site has tabs; look for tab labelled 'Courses' or 'COURSES'
  const tab = page.locator('text=Courses').first();
  if (await tab.count() > 0) {
    await tab.click();
    await page.waitForLoadState('networkidle');
    return;
  }
}

// Update openCourseWithJoin to navigate under English -> specific course
async function openCourseWithJoin(page: Page) {
  // Ensure we are in Courses page
  await navigateToCourses(page);

  // Filter by 'English' section if present
  const englishSection = page.locator('text=English').first();
  if (await englishSection.count() > 0) {
    await englishSection.scrollIntoViewIfNeeded();
    await englishSection.click().catch(() => {});
    await page.waitForLoadState('networkidle');
  }

  // Find the specific course
  const course = page.getByText('19th Jan Course', { exact: false }).first();
  if (await course.count() > 0) {
    await course.scrollIntoViewIfNeeded();
    await course.click().catch(() => {});
    await page.waitForLoadState('networkidle');

    // Look for Join Course button now
    const joinBtn = page.getByRole('button', { name: /Join Course|Join|Enroll|Open batch/i }).first();
    if (await joinBtn.count() > 0) {
      await joinBtn.click().catch(() => {});
      await page.waitForLoadState('networkidle');
      return true;
    }
  }

  // fallback: try global join buttons
  const joinButton = page.getByRole('button', { name: /Join Course|Join|Enroll|Open batch/i }).first();
  if (await joinButton.count() > 0) {
    await joinButton.click().catch(() => {});
    await page.waitForLoadState('networkidle');
    return true;
  }
  return false;
}

async function joinCourseIfNeeded(page: Page) {
  // If a Join button is present on the course page, click it.
  const joinBtn = page.getByRole('button', { name: /Join Course|Join|Enroll|Open batch/i }).first();
  if (await joinBtn.count() > 0) {
    await joinBtn.click().catch(() => {});
    // wait for join confirmation / navigation
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  }
}

async function consumeAllUnits(page: Page) {
  // Find unit links: try patterns like 'Unit', 'Lesson', 'Chapter' or list of content links
  const unitLocators = page.locator('a:has-text("Unit"), a:has-text("Lesson"), a:has-text("Chapter"), a.course-content, li.content a');
  const count = await unitLocators.count();
  if (count === 0) {
    // Fallback: try to find any content link inside a table/list
    const fallback = page.locator('a[href*="/content/"], a[href*="/course/"], .content-list a').first();
    if (await fallback.count() > 0) {
      await fallback.click();
      await page.waitForLoadState('networkidle');
    }
    // Nothing more we can do reliably
    return;
  }

  for (let i = 0; i < count; i++) {
    const unit = unitLocators.nth(i);
    await unit.scrollIntoViewIfNeeded();
    // open unit
    await Promise.all([page.waitForLoadState('networkidle').catch(() => {}), unit.click().catch(() => {})]);

    // Try to click a 'Start' or 'Continue' button inside the unit
    const startBtn = page.getByRole('button', { name: /Start|Continue|Begin|Resume/i }).first();
    if (await startBtn.count() > 0) {
      await startBtn.click().catch(() => {});
    }

    // Wait for the content to load and attempt to mark complete if button exists
    await page.waitForTimeout(1500);
    const markComplete = page.getByRole('button', { name: /Mark as complete|Mark complete|Complete|Finish/i }).first();
    if (await markComplete.count() > 0) {
      await markComplete.click().catch(() => {});
    }

    // Some content auto-advances; give it a short wait
    await page.waitForTimeout(1000);

    // If there's a progress indicator, wait until this unit is complete (best-effort)
    const progress = page.locator('text=100%').first();
    if (await progress.count() > 0) {
      // unit completed
    }

    // navigate back to course contents if available
    const backToContents = page.getByRole('link', { name: /Contents|Course contents|Back to course/i }).first();
    if (await backToContents.count() > 0) {
      await backToContents.click().catch(() => {});
      await page.waitForLoadState('networkidle');
    } else {
      // small pause before next iteration
      await page.waitForTimeout(500);
    }
  }

  // Wait and attempt to verify overall course progress shows 100%
  await page.waitForTimeout(2000);
  const overallProgress = page.locator('text=100%').first();
  if (await overallProgress.count() === 0) {
    // Try other common indicators
    await page.waitForTimeout(2000);
  }
}

async function goToProfile(page: Page) {
  // Click the 'U' icon top-right to open user menu/profile
  // Try button with U text first then text-based locator
  let uIcon = page.locator('button:has-text("U")').first();
  if (await uIcon.count() === 0) {
    uIcon = page.locator('text=U').first();
  }
  if (await uIcon.count() > 0) {
    await uIcon.click().catch(() => {});
    await page.waitForTimeout(500);
  }

  // Click Profile / View profile link
  const profileLink = page.getByRole('link', { name: /Profile|My Profile|View profile|Learner passbook/i }).first();
  if (await profileLink.count() > 0) {
    await profileLink.click().catch(() => {});
    await page.waitForLoadState('networkidle');
  }
}

async function verifyAndDownloadCertificate(page: Page) {
  // Scroll to Learner passbook area
  await page.waitForTimeout(500);
  const passbook = page.getByText(/Learner passbook|Passbook/i).first();
  if (await passbook.count() > 0) {
    await passbook.scrollIntoViewIfNeeded();
    await passbook.click().catch(() => {});
    await page.waitForLoadState('networkidle');
  }

  // Look for 'Download certificate' button/link
  const downloadBtn = page.getByRole('button', { name: /Download certificate|Download|Get certificate|Download PDF/i }).first();
  if (await downloadBtn.count() > 0) {
    const [download] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), downloadBtn.click()]);
    expect(download).toBeTruthy();
    const filename = await download.suggestedFilename();
    expect(filename).toBeTruthy();
    // Optionally save the file locally (not required here)
    return;
  }

  // fallback: link-based download
  const downloadLink = page.locator('a:has-text("Download certificate"), a:has-text("Download")').first();
  if (await downloadLink.count() > 0) {
    const [download] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), downloadLink.click()]);
    expect(download).toBeTruthy();
    const filename = await download.suggestedFilename();
    expect(filename).toBeTruthy();
    return;
  }

  throw new Error('Certificate download control not found in Learner passbook');
}
