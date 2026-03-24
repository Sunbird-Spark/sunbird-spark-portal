import { test, expect, Page } from '@playwright/test';
import { LOGIN_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD, checkForFailureAlerts, loginWithValidCredentials } from './helpers';

test('Login: Valid credentials', async ({ page }) => {
  await loginWithValidCredentials(page);
});

test('Login: Invalid credentials — error must be shown', async ({ page }) => {
  await page.goto(LOGIN_URL);
  await page.waitForSelector('#emailormobile', { timeout: 10000 });
  await page.fill('#emailormobile', 'invalid@yopmail.com');
  await page.fill('#password', 'wrongpass');
  await page.click('#kc-login');

  // Wait for the page to settle after form submission
  await page.waitForTimeout(3000);

  // Make sure we are still on the login page (not redirected to home)
  const currentUrl = page.url();
  if (currentUrl.includes('/home')) {
    expect(false, 'Bug Identifier: Invalid credentials were accepted — user was redirected to home page').toBeTruthy();
    return;
  }

  // These are Keycloak-specific error message selectors — scoped and precise
  const errorSelectors = [
    '#kc-content-wrapper .alert-error',   // Keycloak standard error block
    '#kc-content-wrapper .alert-danger',
    '.pf-c-alert',                         // PatternFly alert (newer Keycloak)
    '[id*="kc"] [class*="alert"]',         // Any Keycloak alert variant
    'span#input-error',                    // Keycloak inline field error
    '#kc-form-login ~ .alert',
  ];

  let errorFound = false;
  for (const selector of errorSelectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 2000 })) {
        const msg = await el.textContent().catch(() => selector);
        console.log(`✅ Error alert found via "${selector}": "${msg?.trim()}"`);
        errorFound = true;
        break;
      }
    } catch (e) {
      continue;
    }
  }

  // Fallback: check the page text for known Keycloak error phrases
  if (!errorFound) {
    const pageText = await page.locator('body').innerText().catch(() => '');
    const knownErrors = [
      'Invalid username or password',
      'Invalid credentials',
      'Account is disabled',
      'Account is not fully set up',
    ];
    for (const phrase of knownErrors) {
      if (pageText.includes(phrase)) {
        console.log(`✅ Error phrase found in page body: "${phrase}"`);
        errorFound = true;
        break;
      }
    }
  }

  expect(errorFound, 'Bug Identifier: No error/alert shown on page for invalid credentials').toBeTruthy();
});

test('Login: Sign in with Google button visible and working', async ({ page }) => {
  await page.goto(LOGIN_URL);
  const googleBtn = page.locator('button:has-text("Google"), a:has-text("Google")').first();
  const visible = await googleBtn.isVisible({ timeout: 5000 }).catch(() => false);
  expect(visible, 'Bug Identifier: Google sign-in button not visible on login page').toBeTruthy();

  // Click the Google button and check if it redirects to Google OAuth
  await googleBtn.click();
  try {
    await page.waitForURL(/accounts\.google\.com|google\.com\/signin/, { timeout: 10000 });
  } catch (e) {
    const currentUrl = page.url();
    expect(false, `Bug Identifier: Clicking Google sign-in did not redirect to Google. Current URL: ${currentUrl}`).toBeTruthy();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD FLOW
// Steps:
//   1. Click "Forgot password" on login page
//   2. Enter email and username on reset page
//   3. Check OTP checkbox → submit
//   4. Go to yopmail.com, open mail from support@test.sunbirded.org, copy OTP
//   5. Enter OTP in Sunbird, set new password "User1@123", confirm and continue
// ─────────────────────────────────────────────────────────────────────────────
test('Login: Forgot password — OTP reset flow', async ({ page, context }) => {
  test.setTimeout(3 * 60 * 1000); // 3 minutes for the full flow

  // ── Step 1: Go to login page and click Forgot Password ──────────────────
  await page.goto(LOGIN_URL);
  await page.waitForSelector('#emailormobile', { timeout: 10000 });

  const forgotBtn = page.locator('a:has-text("Forgot"), button:has-text("Forgot"), a:has-text("forgot")').first();
  const forgotVisible = await forgotBtn.isVisible({ timeout: 5000 }).catch(() => false);
  expect(forgotVisible, 'Bug Identifier [ForgotPassword]: "Forgot password" link not visible on login page').toBeTruthy();

  await forgotBtn.click();
  console.log('Clicked Forgot Password');

  // ── Step 2: Fill in email and username on the reset page ─────────────────
  await page.waitForTimeout(2000);
  const resetPageText = await page.locator('body').innerText().catch(() => '');
  console.log('Reset page loaded. URL:', page.url());

  // Fill email field
  const emailField = page.locator(
    'input[type="email"], input[name*="email"], input[placeholder*="Email"], input[id*="email"]'
  ).first();
  const emailVisible = await emailField.isVisible({ timeout: 5000 }).catch(() => false);
  expect(emailVisible, 'Bug Identifier [ForgotPassword]: Email input field not found on reset page').toBeTruthy();
  await emailField.fill(TEST_USER_EMAIL);
  console.log(`Filled email: ${TEST_USER_EMAIL}`);

  // Fill username field
  const usernameField = page.locator(
    'input[name*="name"], input[placeholder*="entername"], input[placeholder*="entername"], input[id*="name"]'
  ).first();
  const usernameVisible = await usernameField.isVisible({ timeout: 5000 }).catch(() => false);
  expect(usernameVisible, 'Bug Identifier [ForgotPassword]: Username input field not found on reset page').toBeTruthy();
  await usernameField.fill('User1');
  console.log('Filled username: User1');

  // ── Step 3: Check the OTP checkbox and submit ────────────────────────────
  const otpCheckbox = page.locator('input[type="checkbox"]').first();
  const checkboxVisible = await otpCheckbox.isVisible({ timeout: 5000 }).catch(() => false);
  if (checkboxVisible) {
    await otpCheckbox.check();
    console.log('Checked OTP checkbox');
  } else {
    console.warn('⚠ OTP checkbox not found — proceeding without it');
  }

  // Submit the reset form
  const submitBtn = page.locator(
    'button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Continue"), button:has-text("Send OTP")'
  ).first();
  const submitVisible = await submitBtn.isVisible({ timeout: 5000 }).catch(() => false);
  expect(submitVisible, 'Bug Identifier [ForgotPassword]: Submit button not found on reset page').toBeTruthy();
  await submitBtn.click();
  console.log(`Submitted reset form — OTP should be sent to ${TEST_USER_EMAIL}`);

  await page.waitForTimeout(5000); // Wait for OTP email to arrive

  // ── Step 4: Go to yopmail.com and fetch the OTP ──────────────────────────
  const yopmailPage = await context.newPage();
  await yopmailPage.goto('https://yopmail.com/en/');
  await yopmailPage.waitForSelector('#login', { timeout: 10000 });
  await yopmailPage.fill('#login', TEST_USER_EMAIL.split('@')[0]);
  await yopmailPage.press('#login', 'Enter');
  console.log(`Opened yopmail inbox for ${TEST_USER_EMAIL}`);

  await yopmailPage.waitForTimeout(3000);

  // Click the latest email from support@test.sunbirded.org
  const emailItem = yopmailPage.locator('button.lms, .mail, [class*="mail-item"]').first();
  try {
    await emailItem.waitFor({ state: 'visible', timeout: 10000 });
    await emailItem.click();
  } catch (e) {
    // Try clicking the first mail in the list by iframe
    const inboxFrame = yopmailPage.frameLocator('#ifinbox');
    const firstMail = inboxFrame.locator('.lms').first();
    await firstMail.waitFor({ state: 'visible', timeout: 10000 });
    await firstMail.click();
  }
  console.log('Opened latest email');
  await yopmailPage.waitForTimeout(2000);

  // Read the OTP from the email body (inside iframe #ifmail)
  const mailFrame = yopmailPage.frameLocator('#ifmail');
  const emailBody = await mailFrame.locator('body').innerText({ timeout: 10000 });
  console.log('Email body snippet:', emailBody.substring(0, 300));

  // Extract OTP — typically a 4–8 digit number
  const otpMatch = emailBody.match(/\b(\d{4,8})\b/);
  expect(otpMatch, 'Bug Identifier [ForgotPassword]: Could not extract OTP from yopmail email').toBeTruthy();
  const otp = otpMatch![1];
  console.log('Extracted OTP:', otp);

  await yopmailPage.close();

  // ── Step 5: Enter OTP on Sunbird reset page ───────────────────────────────
  const otpField = page.locator(
    'input[name*="otp"], input[placeholder*="OTP"], input[placeholder*="otp"], input[id*="otp"]'
  ).first();
  const otpFieldVisible = await otpField.isVisible({ timeout: 10000 }).catch(() => false);
  expect(otpFieldVisible, 'Bug Identifier [ForgotPassword]: OTP input field not found after submitting reset form').toBeTruthy();
  await otpField.fill(otp);
  console.log('Entered OTP:', otp);

  // Submit OTP
  const otpSubmitBtn = page.locator(
    'button[type="submit"], button:has-text("Verify"), button:has-text("Continue"), button:has-text("Submit")'
  ).first();
  await otpSubmitBtn.click();
  console.log('Submitted OTP');
  await page.waitForTimeout(3000);

  // ── Step 6: Set new password ──────────────────────────────────────────────
  const newPasswordField = page.locator(
    'input[type="password"][name*="new"], input[placeholder*="New password"], input[id*="new"]'
  ).first();
  const confirmPasswordField = page.locator(
    'input[type="password"][name*="confirm"], input[placeholder*="Confirm"], input[id*="confirm"]'
  ).first();

  const newPwdVisible = await newPasswordField.isVisible({ timeout: 10000 }).catch(() => false);
  expect(newPwdVisible, 'Bug Identifier [ForgotPassword]: New password field not found after OTP verification').toBeTruthy();

  await newPasswordField.fill(TEST_USER_PASSWORD);
  await confirmPasswordField.fill(TEST_USER_PASSWORD);
  console.log('Entered new password and confirmation');

  // Click Continue/Submit
  const continueBtn = page.locator(
    'button:has-text("Continue"), button[type="submit"], button:has-text("Reset"), button:has-text("Save")'
  ).first();
  await continueBtn.click();
  console.log('Clicked Continue on password reset');
  await page.waitForTimeout(4000);

  // Verify: either redirected to login or home
  const finalUrl = page.url();
  const success = finalUrl.includes('/home') || finalUrl.includes('login') || finalUrl.includes('auth');
  expect(success, `Bug Identifier [ForgotPassword]: Unexpected URL after password reset: ${finalUrl}`).toBeTruthy();
  console.log('✅ Password reset flow completed. Final URL:', finalUrl);
});

// ─────────────────────────────────────────────────────────────────────────────
// CREATE ACCOUNT FLOW
// Steps:
//   1. Click "Create account" / "Register" on login page
//   2. Fill name, email, password, confirm password
//   3. Check the terms/consent checkbox
//   4. Click Continue
// ─────────────────────────────────────────────────────────────────────────────
test('Login: Create account — registration flow', async ({ page }) => {
  test.setTimeout(2 * 60 * 1000);

  // ── Step 1: Go to login page and click Create Account ────────────────────
  await page.goto(LOGIN_URL);
  await page.waitForSelector('#emailormobile', { timeout: 10000 });

  const createAccountBtn = page.locator(
    'a:has-text("Create"), button:has-text("Create"), a:has-text("Register"), button:has-text("Register"), a:has-text("Sign up")'
  ).first();
  const createVisible = await createAccountBtn.isVisible({ timeout: 5000 }).catch(() => false);
  expect(createVisible, 'Bug Identifier [CreateAccount]: "Create account" / "Register" link not visible on login page').toBeTruthy();

  await createAccountBtn.click();
  console.log('Clicked Create Account');
  await page.waitForTimeout(2000);
  console.log('Registration page URL:', page.url());

  // ── Step 2: Fill in Name ──────────────────────────────────────────────────
  const nameField = page.locator(
    'input[name*="name"], input[placeholder*="Name"], input[placeholder*="name"], input[id*="name"]'
  ).first();
  const nameVisible = await nameField.isVisible({ timeout: 5000 }).catch(() => false);
  expect(nameVisible, 'Bug Identifier [CreateAccount]: Name input field not found on registration page').toBeTruthy();
  await nameField.fill('Karthika');
  console.log('Filled name: Karthika');

  // ── Step 3: Fill in Email ─────────────────────────────────────────────────
  const emailField = page.locator(
    'input[type="email"], input[name*="email"], input[placeholder*="Email"], input[placeholder*="email"], input[id*="email"]'
  ).first();
  const emailVisible = await emailField.isVisible({ timeout: 5000 }).catch(() => false);
  expect(emailVisible, 'Bug Identifier [CreateAccount]: Email input field not found on registration page').toBeTruthy();
  await emailField.fill('xijaji4432@indevgo.com');
  console.log('Filled email: xijaji4432@indevgo.com');

  // ── Step 4: Fill in Password ──────────────────────────────────────────────
  const passwordFields = page.locator('input[type="password"]');
  const passwordCount = await passwordFields.count();
  expect(passwordCount, 'Bug Identifier [CreateAccount]: Password fields not found on registration page').toBeGreaterThanOrEqual(1);

  await passwordFields.nth(0).fill(TEST_USER_PASSWORD);
  console.log('Filled password');

  // ── Step 5: Fill in Confirm Password (if separate field exists) ───────────
  if (passwordCount >= 2) {
    await passwordFields.nth(1).fill(TEST_USER_PASSWORD);
    console.log('Filled confirm password');
  }

  // ── Step 6: Check the terms/consent checkbox ──────────────────────────────
  const checkbox = page.locator('input[type="checkbox"]').first();
  const checkboxVisible = await checkbox.isVisible({ timeout: 5000 }).catch(() => false);
  if (checkboxVisible) {
    await checkbox.check();
    console.log('Checked terms/consent checkbox');
  } else {
    console.warn('⚠ Checkbox not found — proceeding without checking it');
  }

  // ── Step 7: Click Continue ────────────────────────────────────────────────
  const continueBtn = page.locator(
    'button:has-text("Continue"), button[type="submit"], button:has-text("Register"), button:has-text("Sign up"), button:has-text("Create")'
  ).first();
  const continueBtnVisible = await continueBtn.isVisible({ timeout: 5000 }).catch(() => false);
  expect(continueBtnVisible, 'Bug Identifier [CreateAccount]: Continue/Submit button not found on registration page').toBeTruthy();
  await continueBtn.click();
  console.log('Clicked Continue');
  await page.waitForTimeout(4000);

  // ── Step 8: Verify outcome ────────────────────────────────────────────────
  const finalUrl = page.url();
  console.log('Post-registration URL:', finalUrl);

  // Check for error alerts on the registration result page
  const errorOnPage = await page.locator(
    '#kc-content-wrapper .alert-error, .pf-c-alert, span#input-error'
  ).first().isVisible({ timeout: 2000 }).catch(() => false);
  expect(errorOnPage, `Bug Identifier [CreateAccount]: Error alert shown after registration attempt. URL: ${finalUrl}`).toBeFalsy();

  // Accept either a success page, OTP verification, or redirect to login/home
  const successUrls = ['/home', 'login', 'auth', 'register', 'verify', 'otp'];
  const isExpectedUrl = successUrls.some(u => finalUrl.includes(u));
  expect(isExpectedUrl, `Bug Identifier [CreateAccount]: Unexpected URL after registration: ${finalUrl}`).toBeTruthy();
  console.log('✅ Create account flow completed. Final URL:', finalUrl);
});
