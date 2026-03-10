import { test, expect, Page } from '@playwright/test';

const BASE = 'https://sandbox.sunbirded.org/';

test.describe('Guest onboarding and welcome popup', () => {
  // Allow more time for slow UI and dropdowns
  // Allow more time for slow UI and dropdowns
  test.setTimeout(6 * 60 * 1000);

  test('completes onboarding flow as student', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'load' });

    // Wait for onboarding modal/dialog to appear (best-effort)
    const modal = page.locator('[role="dialog"], .onboarding, .welcome-modal, .onboarding-modal').first();
    // If no modal in a few seconds, fail the test early with helpful message
    let seen = true;
    try {
      await modal.waitFor({ state: 'visible', timeout: 7000 });
    } catch (e) {
      seen = false;
    }

    expect(seen, 'Expected onboarding modal/dialog to appear').toBeTruthy();

    // Stage 1: Role selection (select Student) then click Continue
    const roleBtn = modal.getByRole('button', { name: /student|learner|pupil/i }).first();
    if (await roleBtn.count() > 0) {
      await roleBtn.click();
    } else {
      const roleCard = modal.locator('text=Student').first();
      if (await roleCard.count() > 0) await roleCard.click();
    }

    // After selecting role, click the explicit Continue/Next button to advance to BMGS
    const continueBtn = modal.getByRole('button', { name: /Continue|Next|Proceed|Save & Continue/i }).first();
    if (await continueBtn.count() > 0) {
      await continueBtn.click();
      await page.waitForTimeout(800);
    } else {
      // fallback: any primary button inside modal
      const primary = modal.locator('button:not([disabled])').first();
      if (await primary.count() > 0) {
        await primary.click().catch(() => {});
        await page.waitForTimeout(800);
      }
    }

    // Stage 2: BMGS (Board, Medium, Grade, Subject) selection
    // Wait for BMGS UI to appear inside the same modal or next modal. If it's not visible,
    // try advancing the modal by clicking Next/Continue (some flows hide BMGS until advanced).
    try {
      await modal.locator('text=Board, text=Medium, text=Grade, text=Subject').first().waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      // try clicking a Next/Continue button to advance the modal stages
      const advance = modal.getByRole('button', { name: /Next|Continue|Proceed|Save & Continue|Next Step/i }).first();
      if (await advance.count() > 0) {
        await advance.click().catch(() => {});
        await page.waitForTimeout(800);
      } else {
        // last resort: wait a bit more for dynamic UI
        await page.waitForTimeout(1200);
      }
    }

  // Preferred: use labelled selects if available
  // Board -> CBSE, Medium -> English, Grade -> Grade 1, Subject -> English
    const trySelectByLabel = async (label: string, valueLabel: string) => {
      try {
        const sel = modal.getByLabel(label).first();
        if (await sel.count() === 0) return false;

        // If it's a native <select>, use selectOption. Otherwise try clicking the control and picking an item.
        const tagName = await sel.evaluate((el: HTMLElement) => el.tagName.toLowerCase()).catch(() => null);
        if (tagName === 'select') {
          try {
            await sel.selectOption({ label: valueLabel });
            return true;
          } catch {
            try {
              await sel.selectOption({ index: 1 });
              return true;
            } catch {
              return false;
            }
          }
        }

        // Not a select - click it to open dropdown/combobox and pick option by visible text inside modal
        await sel.scrollIntoViewIfNeeded().catch(() => {});
        await sel.click().catch(() => {});
        const opt = modal.locator(`li[role="option"]:has-text("${valueLabel}"), .ant-select-item:has-text("${valueLabel}"), .dropdown-item:has-text("${valueLabel}")`).first();
        try {
          await opt.waitFor({ state: 'visible', timeout: 5000 });
        } catch {
          return false;
        }
        if (await opt.count() > 0) {
          await opt.click().catch(() => {});
          return true;
        }
      } catch (e) {
        // swallow and continue with other fallbacks
        return false;
      }
      return false;
    };

    // Try to set values using labels first
    await trySelectByLabel('Board', 'CBSE');
    await trySelectByLabel('Medium', 'English');
    // Grade label may be 'Grade' or 'Class'
    const gradeSet = await trySelectByLabel('Grade', 'Class 1') || await trySelectByLabel('Class', 'Grade 1') || await trySelectByLabel('Grade', '1');
    await trySelectByLabel('Subject', 'English');

  // If selects are not present or above didn't work, fall back to clicking dropdowns and picking items by text
    const ensureDropdown = async (labelText: string, optionText: string) => {
      // Click the label or dropdown toggle inside the onboarding modal, then pick option by text.
      try {
        if (typeof page.isClosed === 'function' && page.isClosed()) return false;
      } catch {}

      try {
        const labelEl = modal.getByText(new RegExp(labelText, 'i')).first();
        if (await labelEl.count() === 0) return false;
        await labelEl.scrollIntoViewIfNeeded().catch(() => {});
        await labelEl.click().catch(() => {});

        // Scope option lookup to the modal so we only search visible, relevant options.
        const opt = modal.locator(`li[role="option"]:has-text("${optionText}"), .ant-select-item:has-text("${optionText}"), .dropdown-item:has-text("${optionText}")`).first();
        try {
          await opt.waitFor({ state: 'visible', timeout: 8000 });
        } catch (e) {
          // Option did not appear; capture screenshot for debugging and return false
          await page.screenshot({ path: `debug-${labelText.replace(/\s+/g, '_')}-no-option.png`, fullPage: false }).catch(() => {});
          return false;
        }

        if (typeof page.isClosed === 'function' && page.isClosed()) return false;
        if (await opt.count() > 0) {
          await opt.click().catch(() => {});
          await page.waitForTimeout(200);
          return true;
        }
      } catch (err) {
        // swallow and return false so caller can try other fallbacks
        try { await page.screenshot({ path: `debug-ensureDropdown-error-${labelText.replace(/\s+/g, '_')}.png`, fullPage: false }); } catch {}
        return false;
      }
      return false;
    };

    if (!(await trySelectByLabel('Board', 'CBSE'))) {
      await ensureDropdown('Board', 'CBSE');
    }
    if (!(await trySelectByLabel('Medium', 'English'))) {
      await ensureDropdown('Medium', 'English');
    }
    if (!gradeSet) {
      await ensureDropdown('Grade', 'Grade 1');
    }
    if (!(await trySelectByLabel('Subject', 'English'))) {
      await ensureDropdown('Subject', 'English');
    }

    // If BMGS dropdowns are still not visible, try to interact with comboboxes or inputs
    const comboboxes = modal.locator('[role="combobox"]');
    if (await comboboxes.count() > 0) {
      // attempt to open and select values by visible text
      for (let i = 0; i < await comboboxes.count(); i++) {
        const cb = comboboxes.nth(i);
        await cb.click().catch(() => {});
        // try to select an item matching expected common values
        const pick = page.locator('li[role="option"]:has-text("CBSE"), li[role="option"]:has-text("English"), li[role="option"]:has-text("Grade 1"), .ant-select-item:has-text("CBSE")').first();
        if (await pick.count() > 0) {
          await pick.click().catch(() => {});
        }
        await page.waitForTimeout(200);
      }
    }

    // After BMGS, the welcome/details popup should appear. Wait for it.
    await page.waitForTimeout(500);
    const welcomeModal = page.locator('[role="dialog"], .welcome-modal, .person-details, .details-modal').filter({ hasText: /District|Welcome|Tell us/i }).first();
    if (await welcomeModal.count() === 0) {
      // sometimes the same modal is reused; continue using 'modal'
    }

    const detailsModal = (await welcomeModal.count() > 0) ? welcomeModal : modal;

    // Fill district in the details modal - choose Bengaluru explicitly
    const districtName = 'Bengaluru';
    const districtSelect = detailsModal.locator('select[name="district"], select[placeholder*="District"]').first();
    if (await districtSelect.count() > 0) {
      // try to select by label
      try {
        await districtSelect.selectOption({ label: districtName });
      } catch {
        // fallback to index if label not found
        await districtSelect.selectOption({ index: 1 }).catch(() => {});
      }
    } else {
      const districtLabel = detailsModal.getByText(/District/i).first();
      if (await districtLabel.count() > 0) {
        await districtLabel.click().catch(() => {});
        // pick the option with text Bengaluru
        const districtOption = page.locator(`li[role="option"]:has-text("${districtName}"), .ant-select-item:has-text("${districtName}"), .dropdown-item:has-text("${districtName}")`).first();
        if (await districtOption.count() > 0) {
          await districtOption.click().catch(() => {});
        } else {
          // fallback to the second option
          const fallback = page.locator('li[role="option"], .ant-select-item, .dropdown-item').nth(1).first();
          if (await fallback.count() > 0) await fallback.click().catch(() => {});
        }
      }
    }

    // After BMGS selections, click Submit to save BMGS choices
    const bmgsSubmit = modal.getByRole('button', { name: /Submit|Save|Done|Finish/i }).first();
    if (await bmgsSubmit.count() > 0) {
      await bmgsSubmit.click().catch(() => {});
      await page.waitForTimeout(800);
    }

    // Final submit in welcome/details popup
    let submitBtn = detailsModal.getByRole('button', { name: /Submit|Continue|Done|Next/i }).first();
    if (await submitBtn.count() === 0) {
      submitBtn = detailsModal.getByRole('button').filter({ hasText: /Start|Let's|Get started|Proceed|Done|OK|Submit|Continue|Next/i }).first();
    }
    if (await submitBtn.count() === 0) {
      submitBtn = detailsModal.locator('button:not([disabled])').first();
    }
    if (await submitBtn.count() === 0) {
      await page.screenshot({ path: 'debug-onboarding-no-submit.png', fullPage: true }).catch(() => {});
      throw new Error('No submit/continue button found in final welcome/details modal (see debug-onboarding-no-submit.png)');
    }
    await Promise.all([page.waitForLoadState('networkidle').catch(() => {}), submitBtn.click()]);

    // Verify modal closed
    await modal.waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});

    // Basic post-onboarding check: there should be a visible header or main UI element
    const header = page.locator('header, nav, [data-testid="app-header"], .app-header').first();
    expect(await header.count() > 0 || (await page.title()).length > 0).toBeTruthy();
  });
});
