import { Page, expect } from '@playwright/test';
import { urls } from '../../data/urls';

// Performs a full email+password login on the Sunbird portal.
// Handles both the portal's own React login modal and Keycloak-redirect flows.
export async function loginAsUser(page: Page, email: string, password: string) {
  await page.goto(urls.main);
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

  // ── Step 1: Click the "Login" button in the header ────────────────────────
  const headerLogin = page.getByRole('button', { name: /^login$/i })
    .or(page.getByRole('link', { name: /^login$/i }))
    .first();

  await headerLogin.waitFor({ state: 'visible', timeout: 15000 });

  // Navigation after this click is a full redirect to /portal/login → OIDC provider.
  // Wait for the network to settle so the login form is fully loaded before
  // looking for inputs — otherwise locators match stale pre-navigation elements.
  await Promise.all([
    page.waitForLoadState('domcontentloaded', { timeout: 30000 }),
    headerLogin.click(),
  ]);
  // Additional wait for any JS-driven redirects to finish.
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

  // ── Step 2: Wait for the email / username input to appear ─────────────────
  // #emailOrMobile — portal modal; #username — Keycloak; input[type="text"] — fallback.
  const usernameInput = page.locator(
    '#emailOrMobile, #username, input[name="username"], input[name="userName"], input[type="text"]'
  ).filter({ visible: true }).first();

  await usernameInput.waitFor({ state: 'visible', timeout: 20000 });

  // Triple-click to select any pre-filled text, then type character-by-character.
  // pressSequentially fires real key events (keydown → beforeinput → input → keyup)
  // which React's synthetic event system requires — fill() alone can be silently ignored.
  await usernameInput.click({ clickCount: 3 });
  await usernameInput.pressSequentially(email, { delay: 60 });

  // ── Step 3: Fill password (may only appear after submitting the username) ──
  const passwordInput = page.locator('input[type="password"]').filter({ visible: true }).first();

  if (!(await passwordInput.isVisible({ timeout: 3000 }).catch(() => false))) {
    const continueBtn = page.locator(
      'button[type="submit"], input[type="submit"], ' +
      'button:has-text("Continue"), button:has-text("Next"), ' +
      'button:has-text("Sign in")'
    ).filter({ visible: true }).first();
    if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await continueBtn.click();
      await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    }
  }

  await passwordInput.click({ clickCount: 3 });
  await passwordInput.pressSequentially(password, { delay: 60 });
  await page.waitForTimeout(500); // let validation enable the submit button

  // ── Step 4: Submit the login form ─────────────────────────────────────────
  const submitBtn = page.locator([
    '#kc-login',
    '#login',
    'form button[type="submit"]',
    'form input[type="submit"]',
    '[class*="login"] button[type="submit"]',
    'button[type="submit"]',
    'input[type="submit"]',
  ].join(', ')).filter({ visible: true }).first();

  await submitBtn.waitFor({ state: 'visible', timeout: 10000 });
  await submitBtn.click();

  // ── Step 5: Wait for the portal to finish the post-login redirect ──────────
  // The callback sets up the session and redirects to home/dashboard.
  // We wait until the URL is no longer an auth/login page.
  await page.waitForURL(
    (url) => !url.pathname.includes('/login') && !url.pathname.includes('/signup') && !url.pathname.includes('/auth/callback'),
    { timeout: 30000 }
  ).catch(() => {});
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  await page.waitForTimeout(1500);

  // ── Step 6: Click a second "Log in" if the portal shows one post-redirect ──
  const secondLogInBtn = page.getByRole('button', { name: /log.?in/i })
    .or(page.getByRole('link', { name: /log.?in/i }))
    .first();

  if (await secondLogInBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await secondLogInBtn.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(1500);
  }

  // ── Step 7: Confirm login succeeded ──────────────────────────────────────
  const loginBtn = page.getByRole('button', { name: /^log.?in$/i })
    .or(page.getByRole('link', { name: /^log.?in$/i }));
  await expect(loginBtn.first()).not.toBeVisible({ timeout: 10000 });
}
