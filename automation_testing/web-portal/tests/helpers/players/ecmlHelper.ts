import { Page } from '@playwright/test';

export async function dismissEcmlUserSwitcher(page: Page): Promise<void> {
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    try {
      const popup = frame.locator('.popup-overlay');
      if (await popup.isVisible({ timeout: 500 }).catch(() => false)) {
        const firstCard = frame.locator('.userswitcher-card').first();
        if (await firstCard.isVisible({ timeout: 500 }).catch(() => false)) {
          await firstCard.click();
          await page.waitForTimeout(300);
          return;
        }
        await frame.locator('body').press('Escape').catch(() => {});
        return;
      }
    } catch { /* cross-origin or detached frame */ }
  }
}

export async function isEcmlComplete(page: Page): Promise<boolean> {
  const scoreRe    = /your score is/i;
  const redoRe     = /^redo$/i;
  const feedbackRe = /we would love to hear from you/i;

  if (await page.getByText(scoreRe).isVisible({ timeout: 500 }).catch(() => false)) return true;
  if (await page.getByRole('button', { name: redoRe }).isVisible({ timeout: 500 }).catch(() => false)) return true;
  if (await page.getByText(feedbackRe).isVisible({ timeout: 500 }).catch(() => false)) return true;

  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    try {
      if (await frame.getByText(scoreRe).isVisible({ timeout: 500 }).catch(() => false)) return true;
      if (await frame.getByRole('button', { name: redoRe }).isVisible({ timeout: 500 }).catch(() => false)) return true;
      if (await frame.getByText(feedbackRe).isVisible({ timeout: 500 }).catch(() => false)) return true;
    } catch { /* cross-origin or detached frame */ }
  }
  return false;
}
