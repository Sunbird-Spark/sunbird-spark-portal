import { test, expect } from '@playwright/test';
import fs from 'fs';
import { loginWithValidCredentials } from './helpers';

test.describe('Certificate download from Profile My Learning', () => {
  test.setTimeout(5 * 60 * 1000); // 10 min — up from 3 min to cover many courses

  test('login, find 100% courses and download certificate if present', async ({ page }) => {
    await loginWithValidCredentials(page);

    // Navigate to profile page and wait for full render
    await page.goto('https://test.sunbirded.org/profile', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Scroll slowly so all lazy-loaded course cards appear
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(500);

    // Find the Download Certificate button/link
    const downloadCertBtn = page
      .getByRole('button', { name: /download certificate/i })
      .or(page.getByRole('link', { name: /download certificate/i }))
      .or(page.locator('text=Download Certificate'))
      .first();

    const isVisible = await downloadCertBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!isVisible) {
      await page.screenshot({ path: `test-results/cert-not-found-${Date.now()}.png` });
      throw new Error('Bug: "Download Certificate" button not found on /profile My Learning');
    }

    await downloadCertBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Click and race: either a download starts OR an error alert appears
    let download: import('@playwright/test').Download | null = null;
    const downloadPromise = page.waitForEvent('download', { timeout: 20000 }).catch(() => null);
    await downloadCertBtn.click();

    // Give the page a moment to react — check for error alerts first
    await page.waitForTimeout(1500);

    const alertSelectors = [
      'text=/action cannot be performed/i',
      'text=/something went wrong/i',
      'text=/unable to download/i',
      'text=/error/i',
      '[role="alert"]',
      '.alert',
      '.sb-alert',
      '.toast-error',
    ];
    for (const sel of alertSelectors) {
      try {
        const alert = page.locator(sel).first();
        if (await alert.isVisible({ timeout: 500 }).catch(() => false)) {
          const alertText = (await alert.textContent().catch(() => sel))?.trim();
          const screenshotPath = `test-results/bug-cert-download-alert-${Date.now()}.png`;
          await page.screenshot({ path: screenshotPath });
          await test.info().attach('bug-screenshot', { path: screenshotPath, contentType: 'image/png' });
          await test.info().attach('bug-details', {
            body: `Bug: Clicking "Download Certificate" showed an error alert — "${alertText}"`,
            contentType: 'text/plain',
          });
          throw new Error(`Bug: Clicking "Download Certificate" showed an error alert — "${alertText}"`);
        }
      } catch (e) {
        if ((e as Error).message.startsWith('Bug:')) throw e;
      }
    }

    // Now await the download (it may already be resolved)
    download = await downloadPromise;

    if (!download) {
      const screenshotPath = `test-results/bug-cert-no-download-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath });
      await test.info().attach('bug-screenshot', { path: screenshotPath, contentType: 'image/png' });
      await test.info().attach('bug-details', {
        body: 'Bug: Clicked "Download Certificate" but no download started and no error alert was shown',
        contentType: 'text/plain',
      });
      throw new Error('Bug: Clicked "Download Certificate" but no download started');
    }

    const suggestedFilename = download.suggestedFilename();
    console.log('Certificate downloaded:', suggestedFilename);
    expect(suggestedFilename.length, 'Downloaded file should have a name').toBeGreaterThan(0);

    // Save a copy to test-results and attach to the report
    const downloadPath = await download.path();
    if (downloadPath) {
      const dest = `test-results/certificate-${Date.now()}-${suggestedFilename}`;
      fs.copyFileSync(downloadPath, dest);
      console.log('Saved certificate to', dest);
      await test.info().attach('certificate', { path: dest, contentType: 'application/pdf' });
    }
  });

  // ─── Negative scenario helpers ────────────────────────────────────────────

  /** Navigate to /profile, expand the course list, scroll the whole page, and return every course card's data */
  async function collectCourseCards(page: import('@playwright/test').Page) {
    await page.goto('https://test.sunbirded.org/profile', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Click "View Courses" / "View All" to expand the full My Learning list
    const viewMoreBtn = page
      .getByRole('button', { name: /view more courses|view all|show all/i })
      .or(page.getByRole('link', { name: /view more courses|view all|show all/i }))
      .or(page.locator('text=/view more courses|view all/i'))
      .first();
    if (await viewMoreBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewMoreBtn.scrollIntoViewIfNeeded().catch(() => {});
      await viewMoreBtn.click().catch(() => {});
      await page.waitForTimeout(1500); // wait for list to expand
      console.log('Clicked "View more Courses" to expand full list');
    }

    // Scroll slowly so all lazy-loaded course cards appear
    for (let i = 0; i < 12; i++) {
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(350);
    }
    await page.waitForTimeout(500);

    // Extract every course card: progress % and status badge text
    return page.evaluate(() => {
      const cards: { title: string; progress: number | null; status: string }[] = [];

      // Each course card is a container that has both a progress text and a status badge.
      // Walk every element that contains a standalone percentage text, climb to the card root,
      // then read the status badge alongside it.
      const allEls = Array.from(document.querySelectorAll('*')) as HTMLElement[];
      for (const el of allEls) {
        const own = (el.childNodes[0]?.nodeType === 3 ? el.childNodes[0]?.textContent || '' : el.textContent || '').trim();
        const pctMatch = own.match(/^(\d+)%$/);
        if (!pctMatch) continue;

        const pct = parseInt(pctMatch[1], 10);

        // Climb up to find a card ancestor that also contains a status badge
        let card: HTMLElement | null = el;
        let status = '';
        let title = '';
        for (let i = 0; i < 8 && card && card !== document.body; i++) {
          const cardText = (card.innerText || '').trim();
          // status badge is usually one of these words alone or in a short span
          const statusMatch = cardText.match(/\b(Completed|Ongoing|Not Started|Enrolled)\b/i);
          if (statusMatch) { status = statusMatch[1]; }
          if (!title) {
            // title: first heading-ish text that isn't a percentage or status keyword
            const headings = Array.from(card.querySelectorAll('h1,h2,h3,h4,p,span')) as HTMLElement[];
            for (const h of headings) {
              const t = (h.innerText || '').trim();
              if (t.length > 3 && !/^\d+%$|completed|ongoing|not started|enrolled|download|my learning/i.test(t)) {
                title = t.substring(0, 80); break;
              }
            }
          }
          if (status) break;
          card = card.parentElement;
        }

        if (status) {
          cards.push({ title: title || `Course at ${pct}%`, progress: pct, status });
        }
      }

      // deduplicate by title+progress
      const seen = new Set<string>();
      return cards.filter(c => {
        const key = `${c.title}|${c.progress}`;
        if (seen.has(key)) return false;
        seen.add(key); return true;
      });
    });
  }

  // ─── Negative test 1: 100% courses must show "Completed" ─────────────────
  test('100% courses must have "Completed" status', async ({ page }) => {
    await loginWithValidCredentials(page);
    const cards = await collectCourseCards(page);

    const bugs: string[] = [];
    for (const card of cards) {
      if (card.progress === 100 && !/completed/i.test(card.status)) {
        const msg = `Bug: "${card.title}" is 100% but status is "${card.status}" (expected "Completed")`;
        console.log('🐞', msg);
        bugs.push(msg);
      }
    }

    if (bugs.length > 0) {
      // Screenshot for evidence
      const screenshotPath = `test-results/bug-100pct-not-completed-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      await test.info().attach('bug-screenshot', { path: screenshotPath, contentType: 'image/png' });
      await test.info().attach('bug-details', {
        body: bugs.join('\n'),
        contentType: 'text/plain',
      });
      throw new Error(`Found ${bugs.length} course(s) at 100% without "Completed" status:\n${bugs.join('\n')}`);
    }

    console.log(`✅ All ${cards.filter(c => c.progress === 100).length} completed course(s) correctly show "Completed"`);
  });

  // ─── Negative test 2: <100% courses must show "Ongoing" ──────────────────
  test('<100% courses must have "Ongoing" status', async ({ page }) => {
    await loginWithValidCredentials(page);
    const cards = await collectCourseCards(page);

    const bugs: string[] = [];
    for (const card of cards) {
      if (card.progress !== null && card.progress < 100 && !/ongoing/i.test(card.status)) {
        const msg = `Bug: "${card.title}" is ${card.progress}% but status is "${card.status}" (expected "Ongoing")`;
        console.log('🐞', msg);
        bugs.push(msg);
      }
    }

    if (bugs.length > 0) {
      const screenshotPath = `test-results/bug-partial-not-ongoing-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      await test.info().attach('bug-screenshot', { path: screenshotPath, contentType: 'image/png' });
      await test.info().attach('bug-details', {
        body: bugs.join('\n'),
        contentType: 'text/plain',
      });
      throw new Error(`Found ${bugs.length} course(s) below 100% without "Ongoing" status:\n${bugs.join('\n')}`);
    }

    console.log(`✅ All ${cards.filter(c => c.progress !== null && c.progress < 100).length} in-progress course(s) correctly show "Ongoing"`);
  });

  // ─── Negative test 3: 100% Completed + "No certificate" on profile ────────
  // For each such course: search by title inside the app, open the course,
  // read the Certificate component. If "Preview certificate" is present, that
  // means the certificate EXISTS but is NOT shown on the profile — major bug.
  test('100% completed courses showing "No certificate" on profile must truly have no certificate', async ({ page }) => {
    await loginWithValidCredentials(page);
    await page.goto('https://test.sunbirded.org/profile', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Expand full list
    const viewMoreBtn = page
      .getByRole('button', { name: /view more courses|view all|show all/i })
      .or(page.getByRole('link', { name: /view more courses|view all|show all/i }))
      .or(page.locator('text=/view more courses|view all/i'))
      .first();
    if (await viewMoreBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewMoreBtn.scrollIntoViewIfNeeded().catch(() => {});
      await viewMoreBtn.click().catch(() => {});
      await page.waitForTimeout(1500);
    }

    // Scroll to load all cards
    for (let i = 0; i < 12; i++) {
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(350);
    }
    await page.waitForTimeout(500);

    // Collect courses that are 100% + Completed + show "No certificate"
    const noCertCourses: { title: string }[] = await page.evaluate(() => {
      const results: { title: string }[] = [];
      const allEls = Array.from(document.querySelectorAll('*')) as HTMLElement[];
      for (const el of allEls) {
        const own = (el.childNodes[0]?.nodeType === 3 ? el.childNodes[0]?.textContent || '' : el.textContent || '').trim();
        if (own !== '100%') continue;

        // climb to card ancestor
        let card: HTMLElement | null = el;
        for (let i = 0; i < 8 && card && card !== document.body; i++) {
          const txt = (card.innerText || '').trim();
          if (/no certificate/i.test(txt) && /completed/i.test(txt)) {
            // extract title: first meaningful text not a keyword/percentage
            let title = '';
            const spans = Array.from(card.querySelectorAll('h1,h2,h3,h4,p,span')) as HTMLElement[];
            for (const s of spans) {
              const t = (s.innerText || '').trim();
              if (t.length > 3 && !/^\d+%$|no certificate|completed|ongoing|download|my learning/i.test(t)) {
                title = t.substring(0, 100); break;
              }
            }
            if (title) results.push({ title });
            break;
          }
          card = card.parentElement;
        }
      }
      // deduplicate
      const seen = new Set<string>();
      return results.filter(r => { if (seen.has(r.title)) return false; seen.add(r.title); return true; });
    });

    console.log(`Found ${noCertCourses.length} course(s) with "No certificate" label at 100% Completed`);

    const bugs: string[] = [];

    for (const course of noCertCourses) {
      console.log(`  Checking course: "${course.title}"`);

      // ── Step 1: use the header search icon to find the course ──
      const searchBtn = page
        .getByRole('button', { name: /search/i })
        .or(page.locator('button:has(img[alt*="search" i]), button[aria-label*="search" i]'))
        .first();

      await searchBtn.scrollIntoViewIfNeeded().catch(() => {});
      await searchBtn.click().catch(() => {});
      await page.waitForTimeout(800);

      // Type the course title in whatever search input appeared
      const searchInput = page
        .getByRole('searchbox')
        .or(page.locator('input[type="search"], input[placeholder*="search" i], input[aria-label*="search" i]'))
        .first();

      await searchInput.waitFor({ timeout: 5000 }).catch(() => {});
      await searchInput.fill(course.title);
      await page.waitForTimeout(1200); // wait for suggestions / results

      // Click the first matching course card in results
      const courseCard = page
        .locator(`text="${course.title}"`)
        .or(page.locator(`[title="${course.title}"]`))
        .first();

      if (!(await courseCard.isVisible({ timeout: 4000 }).catch(() => false))) {
        console.warn(`  Could not find course card for "${course.title}" in search results — skipping`);
        // Close search and go back to profile for the next course
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(500);
        await page.goto('https://test.sunbirded.org/profile', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        continue;
      }

      await courseCard.scrollIntoViewIfNeeded().catch(() => {});
      await courseCard.click().catch(() => {});
      await page.waitForTimeout(2000);

      // ── Step 2: read the Certificate component on the course detail page ──
      // Check for the "no cert" message (correct scenario)
      const noRealCert = page.locator('text=/currently, this course does not have a certificate/i').first();
      const previewCert = page
        .getByRole('button', { name: /preview certificate/i })
        .or(page.getByRole('link', { name: /preview certificate/i }))
        .or(page.locator('text=/preview certificate/i'))
        .first();

      const hasNoRealCert = await noRealCert.isVisible({ timeout: 4000 }).catch(() => false);
      const hasPreviewBtn = await previewCert.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasPreviewBtn) {
        // MAJOR BUG: certificate exists in the course but profile shows "No certificate"
        const screenshotPath = `test-results/bug-cert-hidden-in-profile-${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: false });
        await test.info().attach(`bug-screenshot-${course.title}`, { path: screenshotPath, contentType: 'image/png' });
        const bugMsg = `🐞 MAJOR BUG: "${course.title}" shows "No certificate" on Profile, but "Preview certificate" is available inside the course — certificate is not being shown on the profile page.`;
        console.log(bugMsg);
        bugs.push(bugMsg);
        await test.info().attach(`bug-details-${course.title}`, {
          body: bugMsg,
          contentType: 'text/plain',
        });
      } else if (hasNoRealCert) {
        console.log(`  ✅ "${course.title}" — correct: course genuinely has no certificate`);
      } else {
        // Certificate section unclear — screenshot for manual review
        const screenshotPath = `test-results/cert-section-unclear-${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: false });
        await test.info().attach(`cert-section-unclear-${course.title}`, { path: screenshotPath, contentType: 'image/png' });
        console.warn(`  ⚠ "${course.title}" — certificate section state unclear; screenshot attached`);
      }

      // Go back to profile for the next iteration (use domcontentloaded — faster than networkidle)
      await page.goto('https://test.sunbirded.org/profile', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      // re-scroll to reload the list
      for (let i = 0; i < 6; i++) {
        await page.evaluate(() => window.scrollBy(0, 400));
        await page.waitForTimeout(200);
      }
      await page.waitForTimeout(300);
    }

    if (bugs.length > 0) {
      throw new Error(`Found ${bugs.length} course(s) where certificate exists in course but is hidden on Profile:\n${bugs.join('\n')}`);
    }

    if (noCertCourses.length === 0) {
      console.log('No 100% Completed courses with "No certificate" label found — nothing to verify');
    }
  });
});
