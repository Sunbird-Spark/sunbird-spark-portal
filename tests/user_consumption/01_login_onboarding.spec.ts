// import { test, expect } from '@playwright/test';
// import { handleServerErrors, handleLogin } from './helpers';

// const START_URL = 'https://sandbox.sunbirded.org/resources?board=CBSE&medium=English&gradeLevel=Class%201&subject=English&id=NCF&selectedTab=home';

// test('Test 1: Login + Onboarding', async ({ page }) => {
//   test.setTimeout(8 * 60 * 1000); // 8 minutes

//   console.log('Navigating to root to initialize session...');
//   await page.goto('https://sandbox.sunbirded.org/', { waitUntil: 'load', timeout: 60000 }).catch(() => { });

//   console.log('Navigating to deep link start URL...');
//   await page.goto(START_URL, { waitUntil: 'load', timeout: 90000 }).catch(() => { });

//   await handleServerErrors(page);

//   // Specific Check for 'Failed to load resource'
//   const resourceError = page.locator('text=/Failed to load resource/i').first();
//   if (await resourceError.count() > 0 && await resourceError.isVisible()) {
//     console.warn('Initial resource load error detected. Refreshing...');
//     await page.reload().catch(() => { });
//     await page.waitForTimeout(5000);
//   }

//   // Login
//   await handleLogin(page);
//   await handleServerErrors(page);

//   // Onboarding Popup Handling
//   const modal = page.locator('[role="dialog"], .onboarding, .welcome-modal').first();
//   try {
//     if (await modal.count() > 0 && await modal.isVisible()) {
//       console.log('Onboarding popup detected. Handling...');
//       await page.waitForTimeout(3000).catch(() => { });

//       // Refined Role Selection: Find any element containing role keywords and click it
//       const roles = ['Student', 'Teacher', 'Parent', 'Other', 'Admin'];
//       let roleClicked = false;

//       // Diagnostic: Log all text in modal to see what we are dealing with
//       const modalText = await modal.innerText().catch(() => '');
//       console.log('Modal content detected:', modalText.substring(0, 200).replace(/\n/g, ' '));

//       for (const role of roles) {
//         // Try multiple ways to find the role button/card
//         const roleLocators = [
//           modal.locator(`text=${role}`).first(),
//           modal.locator(`[title*="${role}" i]`).first(),
//           modal.locator(`.sb-card:has-text("${role}")`).first(),
//           modal.locator(`button:has-text("${role}")`).first()
//         ];

//         for (const loc of roleLocators) {
//           if (await loc.count() > 0 && await loc.isVisible()) {
//             console.log(`Attempting to click role ${role} using locator: ${loc}`);
//             await loc.scrollIntoViewIfNeeded().catch(() => { });
//             await loc.click({ force: true, timeout: 5000 }).catch(() => { });
//             roleClicked = true;
//             break;
//           }
//         }
//         if (roleClicked) break;
//       }
//       if (!roleClicked) console.warn('Could not find a matching role to click in the modal.');

//       const continueBtn = modal.getByRole('button', { name: /Continue|Next/i }).first();
//       await continueBtn.click({ force: true, timeout: 10000 }).catch(() => { });
//       if (!page.isClosed()) await page.waitForTimeout(4000).catch(() => { });

//       // Second Slide: Scroll to Bottom within the modal
//       console.log('Scrolling down inside the onboarding popup...');
//       await page.evaluate(() => {
//         const d = document.querySelector('[role="dialog"], .onboarding-modal, .modal-content');
//         if (d) {
//           d.scrollTop = d.scrollHeight;
//           // Some elements use overflow on a child
//           const scrollable = d.querySelector('.sb-modal-content, .modal-body') || d;
//           scrollable.scrollTop = scrollable.scrollHeight;
//         }
//       }).catch(() => { });
//       if (!page.isClosed()) await page.waitForTimeout(2000).catch(() => { });

//       const submitBtn = modal.getByRole('button', { name: /Submit|Finish|Done/i }).first();
//       if (await submitBtn.count() > 0) {
//         console.log('Clicking Submit button...');
//         await submitBtn.click({ force: true, timeout: 10000 }).catch(() => { });
//       }
//       if (!page.isClosed()) await page.waitForTimeout(5000).catch(() => { });
//     }
//   } catch (e) {
//     console.warn('Onboarding handling skipped due to error:', e);
//   }

//   // Save authentication state
//   await page.context().storageState({ path: 'tests/user_consumption/auth.json' });
//   console.log('Login and Onboarding complete. Storage state saved.');
// });
import { test, expect } from '@playwright/test';
import { handleServerErrors, handleLogin } from './helpers';

// const BASE_URL = 'https://sandbox.sunbirded.org/';
const START_URL =
  'https://sandbox.sunbirded.org/resources?board=CBSE&medium=English&gradeLevel=Class%201&subject=English&id=NCF&selectedTab=home';

test('Login + Onboarding', async ({ page }) => {
  test.setTimeout(5 * 60 * 1000);

  console.log('Navigating to start URL...');
  await page.goto(START_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  async function handleOnboarding(page) {
    console.log('Waiting for onboarding modal to appear...');
    const modal = page.locator('[role="dialog"], .sb-modal-main-container, .welcome-modal').first();

    // Actually wait for it to be visible
    try {
      await modal.waitFor({ state: 'visible', timeout: 15000 });
      console.log('Onboarding modal detected. Handling role selection...');
    } catch (e) {
      console.log('Onboarding modal did not appear within 15s. Checking if already on home page...');
      return;
    }

    // Capture modal text for debugging
    const text = await modal.innerText();
    console.log('Modal text content:', text.slice(0, 100).replace(/\n/g, ' '));

    // -----------------------------
    // Slide 1: Role Selection
    // -----------------------------
    // We look for 'Teacher' or 'Student' specifically inside the modal
    const roles = ['Teacher', 'Student', 'Parent'];
    let clicked = false;

    for (const role of roles) {
      const roleCard = modal.locator(`text=${role}`).first();
      if (await roleCard.isVisible()) {
        console.log(`Clicking role: ${role}`);
        await roleCard.click({ force: true });
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      console.error('Failed to find and click a role card!');
      throw new Error('Onboarding failed: Role card not found');
    }

    const continueBtn = modal.locator('button').filter({ hasText: /Continue|Next/i }).first();
    await expect(continueBtn).toBeEnabled({ timeout: 10000 });
    await continueBtn.click({ force: true });
    console.log('Clicked Continue.');

    // -----------------------------
    // Slide 2: Selection/Location
    // -----------------------------
    await page.waitForTimeout(2000); // Animation buffer

    const submitBtn = modal.locator('button').filter({ hasText: /Submit|Finish|Done/i }).first();

    // If submit is not visible, it might need a scroll or it might be the 'Continue' again
    if (!await submitBtn.isVisible()) {
      console.log('Submit button not found, checking for second Continue/Submit...');
      const altSubmit = modal.locator('button').last();
      await altSubmit.click({ force: true });
    } else {
      await submitBtn.click({ force: true });
    }
    console.log('Submitted final onboarding slide.');

    // CRITICAL: The test must wait for the modal to be gone
    await expect(modal).toBeHidden({ timeout: 15000 });
    console.log('Onboarding successfully completed and modal closed.');
  }

  await handleServerErrors(page);

  // LOGIN
  await handleLogin(page);

  // Wait for the URL to change or the page to settle
  await page.waitForLoadState('networkidle').catch(() => { });
  await handleServerErrors(page);

  // ONBOARDING
  await handleOnboarding(page);

  // Final check to make sure we are on the dashboard/resources page
  await expect(page).not.toHaveURL(/login/);

  // Save auth state
  await page.context().storageState({ path: 'tests/user_consumption/auth.json' });

  console.log('Done! Auth saved to auth.json');
  await page.waitForTimeout(3000);
});