import { Page, Locator } from '@playwright/test';
import { dismissCaptchaIfPresent } from './captchaHelper';

export class ForgotPasswordPage {
  readonly page: Page;

  readonly forgotIdentifierInput: Locator;
  readonly forgotNameInput: Locator;
  readonly getOtpButton: Locator;
  readonly resetPasswordButton: Locator;

  constructor(page: Page) {
    this.page = page;

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
    if (await dismissCaptchaIfPresent(this.page)) {
      await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      await this.getOtpButton.waitFor({ state: 'visible', timeout: 10000 });
      await this.getOtpButton.scrollIntoViewIfNeeded();
      await this.getOtpButton.hover();
      await this.getOtpButton.click();
      await dismissCaptchaIfPresent(this.page);
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
