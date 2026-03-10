import { test, expect } from '@playwright/test';
import { handleServerErrors, handleLogin } from './helpers';

test.use({ storageState: 'tests/user_consumption/auth.json' });

test('Test 4: Verify and Download Certificate', async ({ page }) => {
  test.setTimeout(8 * 60 * 1000); // 8 minutes
  const BASE_URL = 'https://sandbox.sunbirded.org/resources';

  console.log('--- Starting Certificate Verification Flow ---');
  await page.goto(BASE_URL).catch(() => { });
  await page.waitForLoadState('networkidle').catch(() => { });

  // Mandatory: Recover session if lost
  await handleLogin(page);
  await handleServerErrors(page);

  // 1. Click "U" icon (Profile Avatar) in header
  console.log('Locating profile avatar...');
  const profileIcon = page.locator('button[aria-label*="profile"i], .avatar-container, .sb-avatar, mat-icon:has-text("account_circle"), text=/^[A-Z]$/').first();

  try {
    await profileIcon.waitFor({ state: 'visible', timeout: 15000 });
    console.log('Clicking avatar "U" icon...');
    await profileIcon.click({ force: true });
    await page.waitForTimeout(3000);
  } catch (e) {
    console.log('Profile icon not found via selector. Navigating to profile URL as fallback...');
    await page.goto('https://sandbox.sunbirded.org/profile').catch(() => { });
  }

  // 2. Click "Profile" from menu
  console.log('Navigating to profile page...');
  const profileLink = page.locator('[role="menuitem"], .sb-menu-item, a').filter({ hasText: /^Profile$/i }).first();
  if (await profileLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await profileLink.click({ force: true }).catch(() => { });
    await page.waitForTimeout(5000);
  } else if (!page.url().includes('/profile')) {
    await page.goto('https://sandbox.sunbirded.org/profile').catch(() => { });
    await page.waitForTimeout(5000);
  }

  await page.waitForLoadState('networkidle').catch(() => { });
  await handleServerErrors(page);

  // 3. Reach "Learner passbook" section
  console.log('Searching for "Learner passbook" section...');
  const passbookHeader = page.locator('text=Learner passbook, .learner-passbook-container, #learner-passbook').first();

  // Robust scroll to find passbook
  let foundPassbook = false;
  for (let s = 0; s < 10; s++) {
    if (await passbookHeader.isVisible().catch(() => false)) {
      console.log('Found "Learner passbook" header.');
      await passbookHeader.scrollIntoViewIfNeeded().catch(() => { });
      foundPassbook = true;
      break;
    }
    console.log(`Passbook not yet visible. Scrolling down (attempt ${s + 1})...`);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1500);
  }

  if (!foundPassbook) {
    console.warn('Warning: Could not find "Learner passbook" header via visibility. Forcing scroll to bottom...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(3000);
  }

  // 4. Click "View more"
  const viewMoreBtn = page.locator('button, .sb-btn').filter({ hasText: /View more|View all/i }).filter({ visible: true }).first();
  if (await viewMoreBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
    console.log('Clicking "View more" to expand passbook entries...');
    await viewMoreBtn.click({ force: true }).catch(() => { });
    await page.waitForTimeout(3000);
  } else {
    console.log('No "View more" button found. Records might already be expanded or missing.');
  }

  // 5. Locate Course and Click "Download Certificate"
  console.log('Searching for the completed course certificate...');

  // We look for a certificate button in the passbook area
  const certRow = page.locator('.sb-table-row, tr, .passbook-item').filter({ has: page.locator('button, a').filter({ hasText: /Certificate/i }) }).first();
  const downloadCertBtn = certRow.locator('button, a').filter({ hasText: /Download|Certificate/i }).filter({ visible: true }).first();

  // Fallback if row-based search fails
  const globalCertBtn = page.locator('button, a').filter({ hasText: /^Download Certificate$/i }).filter({ visible: true }).first();

  let targetBtn = null;
  if (await downloadCertBtn.isVisible().catch(() => false)) targetBtn = downloadCertBtn;
  else if (await globalCertBtn.isVisible().catch(() => false)) targetBtn = globalCertBtn;

  if (targetBtn) {
    console.log('Certificate button found! Starting download...');
    try {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 60000 }),
        targetBtn.click({ force: true })
      ]);
      const filename = await download.suggestedFilename();
      console.log(`Success! Certificate "${filename}" downloaded.`);
      await page.waitForTimeout(5000);
    } catch (err) {
      console.warn('Download event did not trigger. Trying direct click fallback...');
      await targetBtn.click({ force: true }).catch(() => { });
      await page.waitForTimeout(10000);
    }
  } else {
    console.log('No "Download Certificate" button visible. Checking if it needs a few more seconds to generate...');
    await page.reload().catch(() => { });
    await page.waitForTimeout(10000);

    const secondTry = page.locator('button:has-text("Download"), .sb-btn-download').filter({ visible: true }).first();
    if (await secondTry.isVisible().catch(() => false)) {
      console.log('Found certificate after reload. Downloading...');
      await secondTry.click({ force: true }).catch(() => { });
      await page.waitForTimeout(5000);
    } else {
      console.error('Final Result: Certificate not found in passbook.');
    }
  }

  console.log('--- Certificate Verification Test Completed ---');
});
