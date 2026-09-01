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

  // Disable autocomplete so the browser dropdown doesn't swallow keystrokes mid-type.
  await usernameInput.evaluate((el: HTMLInputElement) => {
    el.setAttribute('autocomplete', 'off');
  });

  // Triple-click to select any pre-filled text, then type character-by-character.
  // pressSequentially fires real key events (keydown → beforeinput → input → keyup)
  // which React's synthetic event system requires — fill() alone can be silently ignored.
  await usernameInput.click({ clickCount: 3 });
  await usernameInput.pressSequentially(email, { delay: 60 });

  // Guard: if autocomplete still intercepted keystrokes, correct the value via fill().
  // fill() works on plain HTML inputs (Keycloak); on React inputs the dispatchEvent
  // below triggers the synthetic onChange so the controlled component picks up the value.
  const typedValue = await usernameInput.inputValue().catch(() => '');
  if (typedValue !== email) {
    await usernameInput.click({ clickCount: 3 });
    await usernameInput.fill(email);
    await usernameInput.dispatchEvent('input');
  }

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

  // ── Step 4b: Detect Keycloak / portal login errors early ─────────────────
  // If credentials are wrong, the form stays on the login page with an error
  // message. Detect this before the 30 s redirect timeout fires.
  await page.waitForTimeout(2000);
  const kcError = page.locator(
    '#kc-feedback-text, #kc-error-message, [class*="alert-error"], [class*="error-message"], ' +
    '[class*="login-error"], .alert.alert-danger'
  ).filter({ visible: true }).first();
  if (await kcError.isVisible({ timeout: 1000 }).catch(() => false)) {
    const errText = (await kcError.innerText().catch(() => '')).trim();
    throw new Error(`Login failed for ${email} — Keycloak error: "${errText}"`);
  }

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
    await Promise.all([
      page.waitForLoadState('domcontentloaded', { timeout: 30000 }),
      secondLogInBtn.click(),
    ]);
    // Wait for any OIDC redirect chain to complete before checking session state.
    await page.waitForURL(
      (url) => !url.pathname.includes('/login') && !url.pathname.includes('/auth/callback'),
      { timeout: 30000 }
    ).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  }

  // ── Step 7: Confirm login succeeded ──────────────────────────────────────
  const loginBtn = page.getByRole('button', { name: /^log.?in$/i })
    .or(page.getByRole('link', { name: /^log.?in$/i }));
  await expect(loginBtn.first()).not.toBeVisible({ timeout: 15000 });
  // Let the SPA finish any post-login API calls before the test navigates.
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
}
