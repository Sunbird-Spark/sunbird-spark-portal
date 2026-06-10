import { Page } from '@playwright/test';

export async function dismissModal(page: Page, timeout = 2000) {
  // -1. RatingDialog — custom overlay div (not Radix). role="dialog" is on the inner
  //     card. Strategies 0c (overlay click) and 0d (Escape) have no effect because
  //     there is no onInteractOutside handler and no Escape key handler.
  //     The close button is the FIRST button inside `.rating-dialog-overlay`.
  const ratingOverlay = page.locator('.rating-dialog-overlay');
  if (await ratingOverlay.isVisible({ timeout: 300 }).catch(() => false)) {
    const ratingClose = ratingOverlay.getByRole('button', { name: /close/i });
    if (await ratingClose.isVisible({ timeout: 500 }).catch(() => false)) {
      await ratingClose.click({ force: true });
      return;
    }
    // Fallback: first button in overlay is always the × close button
    const firstBtn = ratingOverlay.locator('button').first();
    if (await firstBtn.isVisible({ timeout: 300 }).catch(() => false)) {
      await firstBtn.click({ force: true });
      return;
    }
  }

  // 0. Target any open Radix UI / accessible dialog — find its close button first.
  //    This handles the "Congratulations!" course-completion dialog and any other
  //    <Dialog> component that uses role="dialog" with a close button inside.
  const dialog = page.locator('[role="dialog"]').first();
  if (await dialog.isVisible({ timeout }).catch(() => false)) {
    // 0a. Close button by accessible name (sr-only "Close" span inside Radix DialogContent)
    const dialogClose = dialog.getByRole('button', { name: /close/i });
    if (await dialogClose.isVisible({ timeout: 500 }).catch(() => false)) {
      await dialogClose.click({ force: true });
      return;
    }
    // 0b. Last button in dialog — DialogContent always renders the close button last
    const dialogBtn = dialog.locator('button').last();
    if (await dialogBtn.isVisible({ timeout: 300 }).catch(() => false)) {
      await dialogBtn.click({ force: true });
      return;
    }
    // 0c. Click the Radix overlay at the top-left corner (10, 10) — always outside
    //     the centred dialog box. Triggers onInteractOutside → onOpenChange(false).
    //     This is the "click anywhere on screen" fallback the user expects.
    await page.mouse.click(10, 10).catch(() => {});
    await page.waitForTimeout(300);
    if (!(await dialog.isVisible({ timeout: 300 }).catch(() => false))) return;
    // 0d. Escape key — Radix Dialog handles onKeyDown('Escape') via onOpenChange.
    await page.keyboard.press('Escape').catch(() => {});
    return;
  }
  // 1. getByRole resolves accessible names from aria-label, aria-labelledby, and
  //    text content — catches "Close" buttons regardless of how the name is set.
  const closeByRole = page.getByRole('button', { name: /close/i }).last();
  if (await closeByRole.isVisible({ timeout: 500 }).catch(() => false)) {
    await closeByRole.click();
    return;
  }
  // 2. Fallback: dialog/modal buttons with a ✕ character as text.
  const closeBtn = page.locator('[role="dialog"] button, [class*="modal"] button, [class*="overlay"] button')
    .filter({ hasText: /^[×✕x]$/i })
    .first();
  if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await closeBtn.click();
    return;
  }
  // 3. Last resort: any visible ✕ button anywhere on the page.
  const anyX = page.locator('button').filter({ hasText: /^[×✕x]$/i }).last();
  if (await anyX.isVisible({ timeout: 500 }).catch(() => false)) {
    await anyX.click();
  }
}

// Loops until no [role="dialog"] is visible or maxRounds is exhausted.
// firstTimeout: how long to wait on the first check — use 5000 after consumeAllLessons
// so the congratulations dialog has time to appear after the server confirms 100%.
// Subsequent rounds use 500 ms to stop quickly once the page is clear.
export async function dismissAllModals(page: Page, firstTimeout = 2000): Promise<void> {
  for (let i = 0; i < 8; i++) {
    // Use 2000 ms for every round after the first so that a second dialog triggered
    // by a different API response (e.g. BatchExpiryDialog arriving after
    // CourseCompletionDialog was dismissed) is still caught within the window.
    const timeout = i === 0 ? firstTimeout : 2000;
    const dialog = page.locator('[role="dialog"]').first();
    if (!(await dialog.isVisible({ timeout }).catch(() => false))) break;
    await dismissModal(page, 1500);
    await page.waitForTimeout(400);
  }
}
