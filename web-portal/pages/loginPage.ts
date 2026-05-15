import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

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

    // Signup form locators
    this.nameInput = page.getByPlaceholder('Name', { exact: false });
    this.emailToggle = page.getByRole('radio', { name: 'Email' }); // Assuming radio buttons for medium of contact
    this.phoneToggle = page.getByRole('radio', { name: 'Phone Number' });
    this.contactInput = page.locator('input[type="email"], input[placeholder*="mail"], input[name="email"], input[formcontrolname="email"], input[placeholder*="Phone"]').first();
    this.passwordInput = page.locator('input[type="password"]').first();
    this.confirmPasswordInput = page.locator('input[type="password"]').nth(1);
    this.termsCheckbox = page.locator('input[type="checkbox"], .checkbox').first();
    this.continueButton = page.locator('button:has-text("Continue"), button.continue-btn, #continue').first();

    // OTP locators (targeting the first of the 6 boxes shown in the screenshot)
    this.otpInput = page.locator('div:has-text("Enter the code") input, input[type="tel"], input[maxlength="1"]').filter({ visible: true }).first();
    this.submitOtpButton = page.locator('button:has-text("Submit"), .submit-button, button[type="submit"]').filter({ visible: true }).first();

    // Success locators
    this.successMessage = page.getByText('Congratulations');
    this.proceedToLoginButton = page.getByRole('button', { name: 'Proceed to Login' });

    // Login form locators (using common IDs/Placeholders for Sunbird)
    this.loginUsernameInput = page.locator('#username, input[name="userName"], input[placeholder*="Email"]').first();
    this.loginSubmitButton = page.locator('#login').or(page.getByRole('button', { name: 'Login', exact: true })).last();
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
        .or(page.getByRole('button', { name: /Get OTP|Continue/i }))
        .first();
    this.resetPasswordButton = page.locator('[data-testid="reset-password-btn"]')
        .or(page.getByRole('button', { name: /Reset Password|Submit/i }))
        .first();
  }

  async navigateTo(url: string) {
    await this.page.goto(url);
  }

  async clickLoginHeader() {
    await this.loginButtonHeader.click();
  }

  async clickSignup() {
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
    await this.page.waitForTimeout(500);
    await this.contactInput.pressSequentially(contact, { delay: 100 });
    await this.page.waitForTimeout(500);
    await this.passwordInput.pressSequentially(password, { delay: 100 });
    await this.page.waitForTimeout(500);
    await this.confirmPasswordInput.pressSequentially(password, { delay: 100 });
    
    // Check the terms checkbox if it exists and is not checked
    if (await this.termsCheckbox.isVisible()) {
      await this.termsCheckbox.check().catch(() => {});
    }
  }

  async clickContinue() {
    await this.continueButton.click({ force: true });
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
    await this.loginUsernameInput.fill(username);
    await this.passwordInput.fill(password); // Reusing passwordInput which targets input[type="password"]
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
    await this.forgotIdentifierInput.fill(identifier);
    await this.forgotNameInput.fill(name);
  }

  async selectEmailRadio() {
    const emailRadio = this.page.getByRole('radio').first();
    await emailRadio.waitFor({ state: 'visible', timeout: 10000 });
    await emailRadio.click();
  }

  async clickGetOtp() {
    await this.getOtpButton.click();
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
