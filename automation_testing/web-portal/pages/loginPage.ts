import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  private captchaWatcherActive = false;

  // Header locators
  readonly loginButtonHeader: Locator;

  // Login / Signup selection locators
  readonly signupLink: Locator;

  // Signup form locators
  readonly nameInput: Locator;
  readonly emailToggle: Locator;
  readonly phoneToggle: Locator;
  readonly contactInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly termsCheckbox: Locator;
  readonly continueButton: Locator;

  // OTP locators
  readonly otpInput: Locator;
  readonly submitOtpButton: Locator;

  // Success locators
  readonly successMessage: Locator;
  readonly proceedToLoginButton: Locator;

  // Login form specific locators
  readonly loginUsernameInput: Locator;
  readonly loginSubmitButton: Locator;
  readonly forgotPasswordLink: Locator;

  // Forgot Password form locators
  readonly forgotIdentifierInput: Locator;
  readonly forgotNameInput: Locator;
  readonly getOtpButton: Locator;
  readonly resetPasswordButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Locators (using general selectors, these can be adjusted to match the exact DOM of the portal)
    this.loginButtonHeader = page.getByRole('button', { name: 'Login', exact: true });
    this.signupLink = page.locator('text=/Sign\\s*up|Register/i').first();

    // Signup form locators — IDs are stable across React re-renders.
    this.nameInput = page.locator('#firstName');
    this.emailToggle = page.getByRole('radio', { name: 'Email' });
    this.phoneToggle = page.getByRole('radio', { name: 'Phone Number' });
    this.contactInput = page.locator('#emailOrMobile');
    this.passwordInput = page.locator('#password');
    this.confirmPasswordInput = page.locator('#confirmPassword');
    this.termsCheckbox = page.locator('input[type="checkbox"], .checkbox').first();
    this.continueButton = page.locator('[data-edataid="signup-continue-btn"]')
        .or(page.getByRole('button', { name: /Continue/i }))
        .first();

    // OTP locators (targeting the first of the 6 boxes shown in the screenshot)
    this.otpInput = page.locator('div:has-text("Enter the code") input, input[type="tel"], input[maxlength="1"]').filter({ visible: true }).first();
    this.submitOtpButton = page.locator('button:has-text("Submit"), .submit-button, button[type="submit"]').filter({ visible: true }).first();

    // Success locators
    this.successMessage = page.getByText('Congratulations');
    this.proceedToLoginButton = page.getByRole('button', { name: 'Proceed to Login' });

    // Login form locators — #emailOrMobile is the portal modal field; #username / input[name="username"] is Keycloak.
    this.loginUsernameInput = page.locator('#emailOrMobile, #username, input[name="username"], input[name="userName"]')
        .filter({ visible: true }).first();
    this.loginSubmitButton = page.locator('#kc-login, #login, form button[type="submit"]')
        .or(page.getByRole('button', { name: 'Login', exact: true }))
        .filter({ visible: true }).first();
    this.forgotPasswordLink = page.locator('#fgtPortalFlow, #fgtKeycloakFlow, [data-testid="forgot-password-link"]').filter({ visible: true }).first();

    // Forgot Password form locators
    this.forgotIdentifierInput = page.locator('[data-testid="identifier-input"]')
        .or(page.locator('#identifier'))
        .or(page.getByPlaceholder(/Enter Email ID|Mobile Number/i))
        .first();
    this.forgotNameInput = page.locator('[data-testid="name-input"]')
        .or(page.locator('#name'))
        .or(page.getByPlaceholder(/Enter name/i))
        .first();
    this.getOtpButton = page.locator('[data-testid="get-otp-btn"]')
        .or(page.getByRole('button', { name: /Get OTP|Send OTP|Request OTP|Submit/i }))
        .filter({ visible: true })
        .first();
    this.resetPasswordButton = page.locator('[data-testid="reset-password-btn"]')
        .or(page.getByRole('button', { name: /Reset Password|Submit/i }))
        .first();
  }

  async navigateTo(url: string) {
    await this.page.goto(url);
  }

  async clickLoginHeader() {
    await this.loginButtonHeader.hover();
    await this.page.waitForTimeout(Math.floor(Math.random() * 300 + 150));
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded', { timeout: 30000 }),
      this.loginButtonHeader.click(),
    ]);
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  }

  async clickSignup() {
    await this.signupLink.hover();
    await this.page.waitForTimeout(Math.floor(Math.random() * 300 + 150));
    await this.signupLink.click();
  }

  async selectContactMedium(medium: 'Email' | 'Phone') {
    if (medium === 'Email') {
      await this.emailToggle.click();
    } else {
      await this.phoneToggle.click();
    }
  }

  async fillSignupForm(name: string, contact: string, password: string) {
    await this.nameInput.fill(name);
    await this.contactInput.fill(contact);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);

    if (await this.termsCheckbox.isVisible()) {
      await this.termsCheckbox.check().catch(() => {});
    }
  }

  async dismissCaptchaIfPresent(): Promise<boolean> {
    // V2 reCAPTCHA challenge is rendered in an iframe whose src contains "bframe".
    // Wait briefly so the iframe has time to appear after a button click.
    const challengeFrame = this.page.locator('iframe[src*="bframe"]');
    const isChallengeVisible = await challengeFrame
      .waitFor({ state: 'visible', timeout: 2000 })
      .then(() => true)
      .catch(() => false);

    if (isChallengeVisible) {
      // Clicking outside the overlay dismisses it without solving it.
      await this.page.mouse.click(10, 10);
      // Wait until the overlay is fully gone before returning.
      await challengeFrame.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
      return true;
    }
    return false;
  }

  // Starts a background loop that dismisses any CAPTCHA that appears at any point.
  // Call stopCaptchaWatcher() when the test ends.
  startCaptchaWatcher() {
    this.captchaWatcherActive = true;
    this.runCaptchaWatcher().catch(() => { /* watcher stopped */ });
  }

  stopCaptchaWatcher() {
    this.captchaWatcherActive = false;
  }

  private async runCaptchaWatcher() {
    while (this.captchaWatcherActive) {
      try {
        // V2 image challenge: click outside to dismiss.
        const bframe = this.page.locator('iframe[src*="bframe"]');
        if (await bframe.isVisible().catch(() => false)) {
          await this.page.mouse.click(10, 10);
          await bframe.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
        }

        // reCAPTCHA checkbox: click it if unchecked.
        const anchor = this.page.frameLocator('iframe[src*="api2/anchor"]');
        const checkbox = anchor.locator('#recaptcha-anchor[aria-checked="false"]');
        if (await checkbox.isVisible().catch(() => false)) {
          await checkbox.click().catch(() => {});
        }
      } catch {
        // Ignore — page may be mid-navigation.
      }
      await this.page.waitForTimeout(1000).catch(() => {});
    }
  }

  async clickContinue() {
    await this.continueButton.hover();
    await this.page.waitForTimeout(Math.floor(Math.random() * 400 + 200));
    await this.continueButton.click({ force: true });
    // If CAPTCHA appeared and was dismissed, the original click was blocked — retry.
    if (await this.dismissCaptchaIfPresent()) {
      // Let the page settle after CAPTCHA dismissal, then re-hover so the button
      // receives proper focus before the retry click.
      await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      await this.continueButton.waitFor({ state: 'visible', timeout: 10000 });
      await this.continueButton.scrollIntoViewIfNeeded();
      await this.continueButton.hover();
      await this.continueButton.click({ force: true });
      await this.dismissCaptchaIfPresent();
    }
  }

  async enterOtpAndSubmit(otp: string) {
    // For 6 separate boxes, we click the first one and then type the entire code
    const firstBox = this.otpInput;
    await firstBox.click();
    await this.page.keyboard.type(otp, { delay: 100 });
    
    // Click submit
    await this.submitOtpButton.click();
  }

  async clickProceedToLogin() {
    await this.proceedToLoginButton.click();
  }

  async login(username: string, password: string) {
    await this.loginUsernameInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.loginUsernameInput.click({ clickCount: 3 });
    await this.loginUsernameInput.pressSequentially(username, { delay: 60 });
    // Use a visible password input — #password targets the signup form, not the login form.
    const loginPasswordInput = this.page.locator('input[type="password"]').filter({ visible: true }).first();
    await loginPasswordInput.click({ clickCount: 3 });
    await loginPasswordInput.pressSequentially(password, { delay: 60 });
    await this.loginSubmitButton.click();
  }

  async clickGoogleSignIn() {
    const googleBtn = this.page.getByRole('button', { name: /Sign in with Google/i })
      .or(this.page.getByRole('link', { name: /Sign in with Google/i }))
      .or(this.page.locator('text=Sign in with Google'))
      .first();
    await googleBtn.waitFor({ state: 'visible', timeout: 10000 });
    await googleBtn.click();
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async fillForgotPasswordForm(identifier: string, name: string) {
    await this.forgotIdentifierInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.forgotIdentifierInput.fill(identifier);
    await this.forgotNameInput.fill(name);
  }

  async selectEmailRadio() {
    const emailRadio = this.page.getByRole('radio').first();
    await emailRadio.waitFor({ state: 'visible', timeout: 10000 });
    await emailRadio.click();
  }

  async clickGetOtp() {
    await this.getOtpButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.getOtpButton.scrollIntoViewIfNeeded();
    await this.getOtpButton.hover();
    await this.getOtpButton.click();
    // If CAPTCHA appeared and was dismissed, the original click was blocked — retry.
    if (await this.dismissCaptchaIfPresent()) {
      await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      await this.getOtpButton.waitFor({ state: 'visible', timeout: 10000 });
      await this.getOtpButton.scrollIntoViewIfNeeded();
      await this.getOtpButton.hover();
      await this.getOtpButton.click();
      await this.dismissCaptchaIfPresent();
    }
  }

  async fillResetPassword(password: string) {
    const newPasswordInput = this.page.getByPlaceholder('Enter New Password');
    const confirmPasswordInput = this.page.getByPlaceholder('Confirm New Password');
    const resetBtn = this.page.getByRole('button', { name: 'Reset Password', exact: true });

    await newPasswordInput.waitFor({ state: 'visible', timeout: 15000 });
    await newPasswordInput.fill(password);
    await confirmPasswordInput.fill(password);
    await resetBtn.click();
  }
}
