import { Page, Locator, expect } from '@playwright/test';

export class OnboardingPage {
  readonly page: Page;
  readonly termsCheckbox: Locator;
  readonly acceptButton: Locator;
  readonly roleTeacher: Locator;
  readonly roleStudent: Locator;
  readonly languageSelect: Locator;
  readonly stateSelect: Locator;
  readonly districtSelect: Locator;
  readonly skillsInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // T&C Locators (Robustly defined using .or() to avoid syntax errors)
    this.termsCheckbox = page.locator('input[type="checkbox"]')
        .or(page.locator('.mat-checkbox-inner-container'))
        .or(page.locator('.mat-checkbox-layout'))
        .or(page.locator('[role="checkbox"]'))
        .or(page.locator('text=/I accept the Terms/i'))
        .first();
        
    this.acceptButton = page.locator('button')
        .filter({ hasText: /^Accept$/i })
        .or(page.locator('button:has-text("Continue")'))
        .or(page.locator('button:has-text("Proceed")'))
        .filter({ visible: true })
        .first();
 
    // Onboarding Form Locators (Using .or() for stability)
    this.roleTeacher = page.locator('[data-testid*="role"]').or(page.locator('.role-card')).or(page.locator('.mat-card')).first();
    this.roleStudent = page.locator('[data-testid*="role"]').or(page.locator('.role-card')).or(page.locator('.mat-card')).nth(1);
    
    this.languageSelect = page.locator('mat-select[placeholder*="Language"]')
        .or(page.locator('select[name="language"]'))
        .or(page.locator('.language-select'))
        .first();
        
    this.stateSelect = page.locator('mat-select[placeholder*="State"]')
        .or(page.locator('select[name="state"]'))
        .or(page.locator('.state-select'))
        .first();
        
    this.districtSelect = page.locator('mat-select[placeholder*="District"]')
        .or(page.locator('select[name="district"]'))
        .or(page.locator('.district-select'))
        .first();
        
    this.skillsInput = page.locator('input[placeholder*="Skills"]')
        .or(page.locator('.skills-input'))
        .or(page.locator('#skills'))
        .first();
        
    this.submitButton = page.locator('button:has-text("Save and Proceed")')
        .or(page.locator('button:has-text("Submit")'))
        .or(page.locator('button:has-text("Next")'))
        .or(page.locator('button:has-text("Continue")'))
        .or(page.locator('button:has-text("Save")'))
        .filter({ visible: true })
        .first();
  }

  async handleTermsAndConditions() {
    // 3. Wait for onboarding page to load
    await this.page.waitForURL(/.*onboarding.*/, { timeout: 30000 }).catch(() => {});
    
    // 4. Click the checkbox to agree to the Terms & Conditions.
    console.log('Accepting Terms & Conditions...');
    await this.page.waitForTimeout(2000); // Wait for modal to settle
    
    // Try multiple possible targets for the checkbox individually to avoid syntax errors
    const targets = [
        this.page.locator('input[type="checkbox"]').first(),
        this.page.locator('text=/I accept the Terms/i').first(),
        this.page.locator('.mat-checkbox-inner-container').first(),
        this.page.locator('.mat-checkbox-layout').first(),
        this.page.locator('.mat-checkbox-inner-container').first()
    ];

    for (const target of targets) {
        if (await target.isVisible().catch(() => false)) {
            console.log(`Clicking T&C target...`);
            await target.click({ force: true }).catch(() => {});
            await this.page.waitForTimeout(500);
        }
    }
    
    // 5. Click the "Accept" button.
    console.log('Attempting to click Accept button...');
    const actualAcceptButton = this.page.locator('button').filter({ hasText: /^Accept$/i }).first();
    
    // Wait for the button to potentially become enabled
    await this.page.waitForTimeout(3000);
    
    await actualAcceptButton.scrollIntoViewIfNeeded();
    await actualAcceptButton.click({ force: true });

    // Final check/wait to ensure the modal is gone
    await this.page.waitForTimeout(3000);
    if (await actualAcceptButton.isVisible()) {
        console.log('Accept button still there, clicking again...');
        await actualAcceptButton.click({ force: true }).catch(() => {});
    }
  }

  async fillOnboardingForm(role: string = 'Teacher') {
    // 1. Language preference (New UI with cards)
    console.log('Selecting language preference...');
    const englishCard = this.page.locator('div, button, span').filter({ hasText: /^English$/ }).first();
    if (await englishCard.isVisible()) {
        await englishCard.click();
        await this.page.waitForTimeout(1000);
        await this.submitButton.click();
        await this.page.waitForTimeout(2000);
    } else if (await this.languageSelect.isVisible()) {
        await this.languageSelect.click();
        await this.page.locator('mat-option, option').filter({ hasText: /English|Hindi/i }).first().click();
        await this.submitButton.click();
    }

    // 2. Role selection
    console.log(`Selecting role: ${role}...`);
    const roleCard = this.page.locator('.mat-card, .role-card, .mat-button, button, div.card, span').filter({ hasText: new RegExp(role, 'i') }).first();
    
    if (await roleCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await roleCard.click({ force: true });
        await this.page.waitForTimeout(1000);
        await this.submitButton.click();
        await this.page.waitForTimeout(2000);
    } else {
        console.log('Specific role card not found, skipping to next if possible...');
    }

    // 3. Skills selection (Curriculum Design / Building)
    console.log('Selecting skills...');
    const skillTarget = this.page.getByText('Curriculum Design', { exact: false })
      .or(this.page.getByText('Curriculum Building', { exact: false }))
      .or(this.page.locator('.mat-card, button, div.card').filter({ hasText: /Curriculum/i }))
      .first();

    // Explicitly wait for the skill cards or input to be visible
    console.log('Waiting for skills question to load...');
    await this.page.waitForTimeout(4000); // Give it more time for transition

    if (await skillTarget.isVisible({ timeout: 10000 }).catch(() => false)) {
      console.log('Clicking Curriculum Design card...');
      await skillTarget.click({ force: true });
      await this.page.waitForTimeout(1000);

      const submitBtn = this.page.locator('button').filter({ hasText: /Submit|Save/i }).filter({ visible: true }).first();
      await submitBtn.waitFor({ state: 'visible', timeout: 10000 });
      await submitBtn.click({ force: true });
      await this.page.waitForTimeout(2000);
    } else {
      console.log('Specific skill card not found, clicking the first available card as fallback...');
      const firstCard = this.page.locator('.mat-card, button, div.card').filter({ visible: true }).first();
      if (await firstCard.isVisible()) {
        await firstCard.click({ force: true });
        await this.page.locator('button').filter({ hasText: /Submit|Save/i }).first().click({ force: true });
      }
    }

    // 4. Location details (State/District) if they appear
    if (await this.stateSelect.isVisible()) {
      await this.stateSelect.click();
      await this.page.locator('mat-option, option').nth(1).click(); // Select first available state

      await this.districtSelect.click();
      await this.page.locator('mat-option, option').nth(1).click(); // Select first available district

      await this.submitButton.click();
    }
  }
}
