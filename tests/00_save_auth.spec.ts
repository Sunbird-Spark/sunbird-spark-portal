import { test } from '@playwright/test';
import fs from 'fs';

const USER_EMAIL = 'user2@yopmail.com';
const USER_PASSWORD = 'User2@123';

test('save auth storageState', async ({ browser }) => {
  // Create a fresh context and page to perform login and persist storage state
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the site - we'll try to open the login form and sign in
  await page.goto('https://sandbox.sunbirded.org', { waitUntil: 'load' });

  // Try to open a login form via profile/login buttons
  try {
    const profileBtn = page.getByRole('button', { name: /Profile|Login|Sign in|Sign In|Sign in/i }).first();
    if (await profileBtn.count() > 0) {
      await profileBtn.click().catch(() => { });
    } else {
      const loginLink = page.getByRole('link', { name: /Login|Sign in|Sign In|Sign in/i }).first();
      if (await loginLink.count() > 0) await loginLink.click().catch(() => { });
    }
  } catch (e) {
    // best-effort, continue
  }

  // Wait for email input to appear; if not, attempt to open a known login URL
  const email = page.locator('input[type="email"], input[name="username"], input[name="email"], input[placeholder*="Email"], input[aria-label*="Email"]').first();
  try {
    await email.waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    // try clicking a prominent sign-in button to reveal the form
    const signIn = page.getByRole('button', { name: /Login|Log in|Sign in|Sign In/i }).first();
    if (await signIn.count() > 0) await signIn.click().catch(() => { });
    try { await email.waitFor({ state: 'visible', timeout: 5000 }); } catch { }
  }

  if (await email.count() > 0) {
    await email.fill(USER_EMAIL).catch(() => { });
    const pass = page.locator('input[type="password"], input[name="password"], input[placeholder*="Password"]').first();
    if (await pass.count() > 0) await pass.fill(USER_PASSWORD).catch(() => { });
    const submit = page.locator('button:has-text("Login"), button:has-text("Log in"), button:has-text("Sign in"), button[type="submit"]').first();
    if (await submit.count() > 0) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => { }),
        submit.click().catch(() => { }),
      ]);
    }
  } else {
    // Fallback: go directly to a /login path (best-effort)
    await page.goto('https://sandbox.sunbirded.org/auth/realms/sunbird/protocol/openid-connect/auth?client_id=portal&state=8009fa52-ade1-435f-bd1d-f8cd084e3e83&redirect_uri=https%3A%2F%2Fsandbox.sunbirded.org%2Fresources%3Fauth_callback%3D1&scope=openid&response_type=code&version=4', { waitUntil: 'load' }).catch(() => { });
    const email2 = page.locator('input[type="email"]').first();
    if (await email2.count() > 0) {
      await email2.fill(USER_EMAIL).catch(() => { });
      const pass2 = page.locator('input[type="password"]').first();
      if (await pass2.count() > 0) await pass2.fill(USER_PASSWORD).catch(() => { });
      const submit2 = page.locator('button[type="submit"]').first();
      if (await submit2.count() > 0) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => { }),
          submit2.click().catch(() => { }),
        ]);
      }
    }
  }

  // After login attempt, wait for a clear authenticated indicator.
  // Prefer an element that's only visible to logged-in users (profile / learner passbook / sign out)
  const authIndicator = page.locator('button[aria-label*="profile"i], text=My Profile, text=Profile, text=Learner passbook, text=Sign out').first();
  try {
    await authIndicator.waitFor({ state: 'visible', timeout: 15000 });
  } catch (err) {
    // Not found — as a fallback check cookies for a session cookie
    const cookies = await context.cookies();
    const hasSession = cookies.some(c => /connect.sid|AUTH_SESSION_ID|KC_RESTART/.test(c.name));
    if (!hasSession) {
      console.error('Login did not complete: no profile element and no session cookie found. Cookies:', cookies.map(c => ({ name: c.name, domain: c.domain })));
      await context.close();
      throw new Error('Failed to sign in - see logs for details');
    }
  }

  // Persist storage state to a file that other tests can consume
  await context.storageState({ path: 'auth.json' });
  console.log('Saved auth storageState to auth.json — please re-run course tests to use it.');

  await context.close();
});
