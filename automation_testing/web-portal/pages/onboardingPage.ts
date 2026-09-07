import { Page, Locator, expect } from '@playwright/test';

export class OnboardingPage {
  readonly page: Page;
  readonly termsCheckbox: Locator;
  readonly acceptButton: Locator;
  readonly roleTeacher: Locator;
  readonly roleStudent: Locator;
  // languageSelect and stateSelect/districtSelect are not used in the React portal
  // (language and role are chip buttons; location dropdowns may not exist)
  readonly skillsInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Radix UI Checkbox.Root renders with role="checkbox"; the label triggers it too.
    this.termsCheckbox = page.locator('[role="checkbox"]')
        .or(page.locator('label[for="tnc-accept-check"]'))
        .first();

    this.acceptButton = page.locator('button')
        .filter({ hasText: /^Accept$/i })
        .first();

    // Onboarding options are rendered as button.option-chip chips in the React portal.
    this.roleTeacher = page.locator('button.option-chip').first();
    this.roleStudent = page.locator('button.option-chip').nth(1);

    // Skills may be entered via a text input (input.onboarding-input) when no chips match.
    this.skillsInput = page.locator('input.onboarding-input').first();

    // The proceed button uses class onboarding-button / onboarding-button-rounded.
    this.submitButton = page.locator('button.onboarding-button, button.onboarding-button-rounded')
        .or(page.getByRole('button', { name: /Save and Proceed|Submit/i }))
        .filter({ visible: true })
        .first();
  }

  async handleTermsAndConditions() {
    // Wait for the onboarding page, then for the T&C dialog checkbox to appear.
    await this.page.waitForURL(/.*onboarding.*/, { timeout: 30000 }).catch(() => {});

    // [role="checkbox"] is the Radix UI Checkbox.Root — the actual interactive target.
    await this.page.waitForSelector('[role="checkbox"]', { state: 'visible', timeout: 15000 }).catch(() => {});

    const targets = [
        // Radix UI checkbox — the real interactive element.
        this.page.locator('[role="checkbox"]').first(),
        // Label also toggles the checkbox.
        this.page.locator('label[for="tnc-accept-check"]').first(),
    ];

    for (const target of targets) {
        if (await target.isVisible().catch(() => false)) {
            // Radix UI Checkbox.Root may have a layered hit-target; force ensures the click lands.
            await target.click({ force: true }).catch(() => {});
        }
    }

    const actualAcceptButton = this.page.locator('button').filter({ hasText: /^Accept$/i }).first();

    await expect(actualAcceptButton).toBeEnabled({ timeout: 10000 });

    await actualAcceptButton.scrollIntoViewIfNeeded();
    await actualAcceptButton.click();

    await actualAcceptButton.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    if (await actualAcceptButton.isVisible()) {
        // Defensive re-click — modal hasn't dismissed after the first attempt.
        await actualAcceptButton.click({ force: true }).catch(() => {});
    }
  }

  async fillOnboardingForm(preferredLabel: string = 'Teacher') {
    const MAX_STEPS = 10;

    for (let step = 0; step < MAX_STEPS; step++) {
        if (!this.page.url().includes('/onboarding')) break;

        // Wait for chips to appear (API may still be loading).
        const chipLocator = this.page.locator('button.option-chip').filter({ visible: true });
        const chipsLoaded = await chipLocator.first()
            .waitFor({ state: 'visible', timeout: 15000 })
            .then(() => true)
            .catch(() => false);

        if (!chipsLoaded) break;

        // Prefer a chip matching preferredLabel; fall back to the first available chip.
        const preferredChip = chipLocator.filter({ hasText: new RegExp(preferredLabel, 'i') }).first();
        const target = (await preferredChip.isVisible().catch(() => false))
            ? preferredChip
            : chipLocator.first();

        // Click without force; retry up to 3 times until option-chip-selected confirms React state updated.
        let selected = false;
        for (let attempt = 0; attempt < 3; attempt++) {
            await target.scrollIntoViewIfNeeded();
            await target.click();
            selected = await this.page.locator('button.option-chip-selected')
                .first()
                .waitFor({ state: 'visible', timeout: 3000 })
                .then(() => true)
                .catch(() => false);
            if (selected) break;
        }

        if (!selected) {
            console.warn(`Step ${step + 1}: chip selection not confirmed, attempting to proceed anyway`);
        }

        const btn = this.page
            .locator('button.onboarding-button, button.onboarding-button-rounded')
            .filter({ visible: true })
            .first();

        await btn.waitFor({ state: 'visible', timeout: 10000 });
        // Wait for the button to become enabled in the DOM rather than asserting.
        await this.page.waitForFunction(
            (sel: string) => {
                const el = document.querySelector(sel) as HTMLButtonElement | null;
                return el ? !el.disabled : false;
            },
            'button.onboarding-button:not([disabled]), button.onboarding-button-rounded:not([disabled])',
            { timeout: 10000 }
        );
        await btn.click();

        await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });
        await this.page.waitForTimeout(500);
    }
  }
}
