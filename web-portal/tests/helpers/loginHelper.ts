import { Page, expect } from '@playwright/test';
import { urls } from '../../data/urls';

// Performs a full email+password login on the Sunbird portal.
// Handles both modal-based and Keycloak-redirect login flows.
export async function loginAsUser(page: Page, email: string, password: string) {
  await page.goto(urls.main);
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

  // ── Step 1: Click the "Login" button in the header ────────────────────────
  // Try button role first, then link role (the header button is sometimes an <a>)
  const headerLogin = page.getByRole('button', { name: /^login$/i })
    .or(page.getByRole('link', { name: /^login$/i }))
    .or(page.locator('header a:has-text("Login"), nav a:has-text("Login"), [class*="header"] a:has-text("Login")'))
    .first();

  await headerLogin.waitFor({ state: 'visible', timeout: 15000 });
  await headerLogin.click();

  // ── Step 2: Wait for a username/email input to appear ─────────────────────
  // Could be on the portal's own modal OR after a Keycloak redirect
  const usernameInput = page.locator(
    '#username, ' +
    'input[name="username"], ' +
    'input[name="userName"], ' +
    'input[type="email"], ' +
    'input[placeholder*="email" i], ' +
    'input[placeholder*="username" i]'
  ).first();

  await usernameInput.waitFor({ state: 'visible', timeout: 20000 });
  await usernameInput.fill(email);

  // ── Step 3: Fill password (might appear only after submitting username) ────
  const passwordInput = page.locator('input[type="password"]').first();

  // If password isn't visible yet, submit the username step first
  if (!(await passwordInput.isVisible({ timeout: 3000 }).catch(() => false))) {
    const continueBtn = page.locator(
      'button[type="submit"], input[type="submit"], ' +
      'button:has-text("Continue"), button:has-text("Next"), ' +
      'button:has-text("Sign in")'
    ).first();
    if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await continueBtn.click();
      await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    }
  }

  await passwordInput.fill(password);
  await page.waitForTimeout(500); // let Angular/Keycloak enable the submit button

  // ── Step 4: Submit the login form ─────────────────────────────────────────
  // Priority: Keycloak IDs (#kc-login, #login) → any form submit → text match.
  // Avoid text-only selectors like "button:has-text('Login')" since they can
  // accidentally match the header Login button on portal modals.
  const submitBtn = page.locator([
    '#kc-login',
    '#login',
    'form button[type="submit"]',
    'form input[type="submit"]',
    '[class*="login"] button[type="submit"]',
    '[class*="login"] input[type="submit"]',
    'button[type="submit"]',
    'input[type="submit"]',
  ].join(', ')).first();

  await submitBtn.waitFor({ state: 'visible', timeout: 10000 });
  await submitBtn.click();

  // ── Step 5: Wait to land back on the portal ───────────────────────────────
  await page.waitForURL(
    (url) => url.hostname.includes('sunbirded.org'),
    { timeout: 30000 }
  );
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  await page.waitForTimeout(2000);

  // ── Step 6: Click the second "Log in" button if the portal shows one ──────
  // Some Sunbird portals redirect back to the landing page after Keycloak and
  // require a second "Log in" click to finalise the portal session.
  const secondLogInBtn = page.getByRole('button', { name: /log.?in/i })
    .or(page.getByRole('link', { name: /log.?in/i }))
    .or(page.locator('button:has-text("Log in"), a:has-text("Log in")'))
    .first();

  if (await secondLogInBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    console.log('  Clicking post-redirect "Log in" button...');
    await secondLogInBtn.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);
  }

  // ── Step 7: Confirm login succeeded ──────────────────────────────────────
  const loginBtn = page.getByRole('button', { name: /^log.?in$/i })
    .or(page.getByRole('link', { name: /^log.?in$/i }));
  await expect(loginBtn.first()).not.toBeVisible({ timeout: 10000 });

  console.log(`Logged in as ${email}`);
}
