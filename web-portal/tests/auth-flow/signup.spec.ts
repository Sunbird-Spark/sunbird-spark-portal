import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/loginPage';
import { urls } from '../../data/urls';
import { saveTempUser } from '../../data/temp_user_util';
import { OnboardingPage } from '../../pages/onboardingPage';

test.describe('Authentication Flow - Signup', () => {
  test('Verify that a new user can successfully register and complete onboarding', async ({ page }) => {
    test.setTimeout(420000); // 7 minutes total timeout
    const loginPage = new LoginPage(page);
    const onboardingPage = new OnboardingPage(page);

    // Generate a unique Yopmail address
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const yopmailUser = `sunbirdtest${randomSuffix}`;
    const newUserEmail = `${yopmailUser}@yopmail.com`;

    // Navigate to the portal homepage
    await loginPage.navigateTo(urls.main);

    // Human-like mouse movement on the homepage
    await page.mouse.move(100, 100);
    await page.mouse.move(400, 300, { steps: 10 });

    // 1. Click on the "Login" button on the homepage.
    await loginPage.clickLoginHeader();

    // 2. Click on the "Signup" below the login button.
    await loginPage.clickSignup();

    const newPassword = 'StrongPassword@123';

    // 4. Fill the form with the dynamic yopmail and the requested name 'Test User'
    await loginPage.fillSignupForm('Test User', newUserEmail, newPassword);

    // Wait for the async validation message "This email address is available."
    console.log('Waiting for email availability validation...');
    await expect(page.getByText('This email address is available.')).toBeVisible({ timeout: 15000 });

    // --- CAPTCHA HANDLING (Automatic Attempt) ---
    console.log('Attempting to detect and click reCAPTCHA checkbox...');
    const recaptchaFrame = page.frameLocator('iframe[title*="reCAPTCHA"]').first();
    const checkbox = recaptchaFrame.locator('#recaptcha-anchor');
    
    if (await checkbox.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('reCAPTCHA checkbox found, clicking...');
        await checkbox.click();
        // Give it a moment to solve
        await page.waitForTimeout(3000);
    } else {
        console.log('reCAPTCHA checkbox not found or already solved.');
    }

    // Short pause for safety/manual intervention if an image challenge appears
    console.log('Short pause for CAPTCHA verification...');
    await page.waitForTimeout(5000); 
    // --------------------------------------------

    // 5. Click on the "Continue" button.
    await loginPage.continueButton.scrollIntoViewIfNeeded();
    await loginPage.clickContinue();
    
    // Fallback: If we are still on the same page after 3 seconds, try a forced click
    await page.waitForTimeout(3000);
    const otpVisible = await loginPage.otpInput.isVisible();
    if (!otpVisible) {
      console.log('OTP field not visible, retrying with a forced click on Continue...');
      await loginPage.continueButton.click({ force: true }).catch(() => {});
    }

    // Wait for the OTP screen or the "OTP Sent" notification to appear
    console.log('Waiting for OTP screen to load...');
    await Promise.any([
        page.getByText('Enter the code').waitFor({ state: 'visible', timeout: 30000 }),
        page.getByText('OTP Sent').waitFor({ state: 'visible', timeout: 30000 }),
        loginPage.otpInput.waitFor({ state: 'visible', timeout: 30000 })
    ]).catch(() => console.log('Proceeding to Yopmail (OTP screen might be partially loaded)'));

    // 6. Open Yopmail in a new tab to fetch the OTP
    console.log('Opening Yopmail to fetch OTP...');
    const yopPage = await page.context().newPage();
    await yopPage.goto('https://yopmail.com/en/');

    // Handle potential Google Vignette (Ad overlay)
    const vignette = yopPage.locator('ins, iframe').filter({ hasText: /Close|Dismiss/i }).first();
    if (await vignette.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('Ad vignette detected, attempting to close...');
        await yopPage.keyboard.press('Escape');
        await yopPage.mouse.click(10, 10); // Click outside to dismiss
    }

    // Enter the email ID into the Yopmail login field
    const yopLoginInput = yopPage.locator('input#login');
    await yopLoginInput.waitFor({ state: 'visible', timeout: 30000 });
    await yopLoginInput.fill(yopmailUser);
    
    // Click the arrow button to access the inbox
    console.log(`Checking inbox for ${yopmailUser}...`);
    await yopPage.keyboard.press('Enter');

    // --- HANDLE YOPMAIL CAPTCHA IF IT APPEARS ---
    const yopCaptcha = yopPage.frameLocator('iframe[title*="reCAPTCHA"]').first();
    if (await yopCaptcha.locator('#recaptcha-anchor').isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('Yopmail CAPTCHA detected on inbox page, attempting auto-solve...');
        await yopCaptcha.locator('#recaptcha-anchor').click();
        await yopPage.waitForTimeout(3000);
    }
    // --------------------------------------------

    // Wait for the OTP email to arrive in the inbox iframe and extract it with retries
    const inboxFrame = yopPage.frameLocator('#ifinbox');
    const mailFrame = yopPage.frameLocator('#ifmail');
    let otp = '';

    console.log('Waiting for the latest OTP email...');
    for (let i = 0; i < 10; i++) { // Retry up to 10 times (approx 1-2 mins)
        const emailRow = inboxFrame.locator('div.m:has-text("OTP"), div.m:has-text("Verification")').first();
        if (await emailRow.isVisible()) {
            await emailRow.click();
            await yopPage.waitForTimeout(3000); // Wait for mail to load
            
            const emailBody = await mailFrame.locator('body').innerText();
            const otpMatch = emailBody.match(/\b\d{6}\b/);
            if (otpMatch) {
                otp = otpMatch[0];
                console.log(`Successfully fetched OTP: ${otp}`);
                break;
            }
        }
        // If the email hasn't arrived, click the refresh button or reload the page
        console.log('OTP not found yet, refreshing inbox...');
        const refreshButton = yopPage.locator('#refreshbut, #refresh, .refreshbut, button:has-text("Refresh")').first();
        if (await refreshButton.isVisible()) {
            await refreshButton.click();
        } else {
            await yopPage.reload();
        }
        await yopPage.waitForTimeout(5000);
    }

    if (!otp) {
        throw new Error('Failed to fetch OTP from Yopmail after multiple retries.');
    }

    // Close the yopmail tab and return to the main portal page
    await yopPage.close();
    await page.bringToFront();

    // 7. Enter the OTP and click on "Submit" to verify it.
    await loginPage.enterOtpAndSubmit(otp);

    // Expected Result: The user is successfully registered, a success message("Congratulations") is displayed
    await expect(loginPage.successMessage).toBeVisible({ timeout: 15000 });
    
    // Save the newly created user for other tests (like login.spec.ts)
    // We use the same name that would have been used in the form (Test User)
    saveTempUser(newUserEmail, newPassword, 'Test User');

    // Redirection to the login page upon clicking "Proceed to Login".
    await loginPage.clickProceedToLogin();

    // Verify redirection
    await expect(loginPage.loginButtonHeader).toBeVisible();

    // 8. Log in with the newly created account to verify it works
    await loginPage.login(newUserEmail, newPassword);
    
    // 9. Handle Onboarding Flow
    console.log('Starting onboarding flow...');
    
    // a. Terms & Conditions
    await onboardingPage.handleTermsAndConditions();
    
    // b. Onboarding Form (Role, Language, etc.)
    await onboardingPage.fillOnboardingForm('Teacher');

    // Final verification: we are on the dashboard
    await expect(page).not.toHaveURL(/.*login.*/);
    console.log(`Signup, Login, and Onboarding successful for: ${newUserEmail}`);
    
    // Add a significant pause here so you can see the final state before it closes
    console.log('Waiting 10 seconds before closing browser...');
    await page.waitForTimeout(10000);
  });
});
