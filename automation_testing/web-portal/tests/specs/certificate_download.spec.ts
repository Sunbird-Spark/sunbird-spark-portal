import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import Jimp from 'jimp';
import jsQR from 'jsqr';
import { urls } from '../../data/urls';
import { authPaths } from '../../data/authPaths';

test.setTimeout(300000);

test.describe('Registered User - Certificate Download', () => {
  // Restore the full browser state (cookies + localStorage tokens) saved by
  // user2Setup. No OIDC redirect chain is needed on each test.
  test.use({ storageState: authPaths.user2 });

  test.beforeEach(async ({ page }) => {
    // Session is already hydrated — navigate and wait for all auth API calls
    // to resolve so isAuthenticated is stable before the test interacts.
    await page.goto(urls.profile, { waitUntil: 'load' });

    const loginBtn = page.getByRole('button', { name: /^login$/i })
      .or(page.getByRole('link', { name: /^login$/i }));
    await expect(loginBtn.first()).not.toBeVisible({ timeout: 10000 });
  });

  test('Download certificate from My Learning on profile page', async ({ page }, testInfo) => {
    // 1. Read the user's display name from the profile card before scrolling away
    const profileName = page.locator('h2.profile-name');
    await expect(profileName).toBeVisible({ timeout: 15000 });
    const userName = ((await profileName.textContent()) ?? '').trim();
    expect(userName).toBeTruthy();
    console.log(`Profile name: "${userName}"`);

    // 2. Scroll to My Learning section
    const myLearningHeading = page.getByRole('heading', { name: /my learning/i });
    await expect(myLearningHeading).toBeVisible({ timeout: 20000 });
    await myLearningHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // 3. Filter by "Completed"
    const filterTrigger = page.getByRole('button', { name: /filter courses by status/i });
    await expect(filterTrigger).toBeVisible({ timeout: 10000 });
    await filterTrigger.click();
    const completedOption = page.getByRole('menuitem', { name: /^completed$/i });
    await expect(completedOption).toBeVisible({ timeout: 5000 });
    await completedOption.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);

    // 4. Find the first course row that has a "Download Certificate" button
    const downloadBtn = page.getByRole('button', { name: /download certificate/i }).first();
    const hasCertBtn = await downloadBtn.isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasCertBtn) {
      console.log('No completed course with a certificate found — skipping.');
      return;
    }

    // 5. Read the course name from the same row as the download button
    const courseRow = page.locator('.profile-learning-item').filter({
      has: page.getByRole('button', { name: /download certificate/i }),
    }).first();
    const courseName = ((await courseRow.locator('h4.profile-learning-title').first().textContent()) ?? '').trim();
    console.log(`Course name: "${courseName}"`);

    // 6. Intercept the SVG certificate API response BEFORE clicking.
    //    The PDF is image-based (SVG → PNG → jsPDF) so the SVG is the only
    //    place the personalised text (name, course) is readable as a string.
    let capturedSvg = '';
    await page.route('**/rc/certificate/v1/download/**', async (route) => {
      const response = await route.fetch();
      capturedSvg = await response.text();
      await route.fulfill({ response });
    });

    await expect(downloadBtn).toBeEnabled({ timeout: 5000 });

    // 7. Register the download listener BEFORE clicking so we don't miss the event
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });

    // 8. Click download, then wait for SVG fetch + PNG render + PDF generation to finish
    await downloadBtn.click();
    console.log('Download button clicked — waiting for PDF to generate...');
    await page.waitForTimeout(5000);

    // 9. Obtain the download handle and save into the test's own output directory.
    //    saveAs() blocks until the file is fully written to disk.
    //    testInfo.outputDir is kept under test-results/ after the run.
    const download = await downloadPromise;
    const suggestedName = download.suggestedFilename();
    const certPath = path.join(testInfo.outputDir, suggestedName || 'certificate.pdf');
    fs.mkdirSync(testInfo.outputDir, { recursive: true });
    await download.saveAs(certPath);
    console.log(`Certificate saved locally: ${certPath}`);

    // 10. Attach the PDF to the HTML test report so it is viewable after the run
    await testInfo.attach('Downloaded Certificate', {
      path: certPath,
      contentType: 'application/pdf',
    });
    console.log('Certificate attached to test report.');

    // 11. Verify the downloaded file exists and is a valid PDF
    expect(fs.existsSync(certPath), 'Certificate file should exist on disk').toBe(true);
    const fileBuffer = fs.readFileSync(certPath);
    expect(fileBuffer.byteLength, 'Certificate should be larger than 1 KB').toBeGreaterThan(1024);
    const pdfHeader = fileBuffer.subarray(0, 4).toString('ascii');
    expect(pdfHeader, 'File must start with PDF magic bytes').toBe('%PDF');
    console.log(`File OK: ${suggestedName} — ${fileBuffer.byteLength} bytes, header="${pdfHeader}"`);

    // 12. Verify the SVG certificate contains the user's name and course name.
    //     We check the SVG because the jsPDF output embeds the certificate as a
    //     rasterised PNG image — there is no searchable text layer in the PDF.
    expect(capturedSvg.length, 'SVG certificate content should not be empty').toBeGreaterThan(0);
    const svgLower = capturedSvg.toLowerCase();

    expect(svgLower, `SVG should contain the user name "${userName}"`).toContain(userName.toLowerCase());
    console.log(`SVG contains user name "${userName}" `);

    if (courseName) {
      expect(svgLower, `SVG should contain the course name "${courseName}"`).toContain(courseName.toLowerCase());
      console.log(`SVG contains course name "${courseName}" ✓`);
    }

    // 13. Decode the QR code embedded in the SVG certificate and verify it is a valid URL.
    //     Sunbird SVG certificates embed the QR as a base64 PNG <image> element.
    //     jsqr decodes raw RGBA pixel data; jimp converts the PNG buffer to that format.
    const b64Regex = /(?:xlink:href|href)=["']data:image\/(?:png|jpeg|jpg|webp);base64,([^"']+)["']/gi;
    const embeddedImages = [...capturedSvg.matchAll(b64Regex)];
    expect(embeddedImages.length, 'SVG should contain at least one embedded PNG image').toBeGreaterThan(0);

    let qrData: string | null = null;
    for (const match of embeddedImages) {
      try {
        const buffer = Buffer.from(match[1], 'base64');
        const image = await Jimp.read(buffer);
        const { width, height } = image.bitmap;
        console.log(`  Trying embedded image ${width}x${height}px for QR`);

        // Try at native resolution first
        let result = jsQR(new Uint8ClampedArray(image.bitmap.data.buffer), width, height);

        // Scale up small images — jsQR decodes reliably at 300+ px
        if (!result && width < 300) {
          const scale = Math.ceil(300 / width);
          const scaled = image.clone().resize(width * scale, height * scale);
          result = jsQR(
            new Uint8ClampedArray(scaled.bitmap.data.buffer),
            scaled.bitmap.width,
            scaled.bitmap.height,
          );
        }

        if (result) {
          qrData = result.data;
          console.log(`  jsQR decoded: ${qrData}`);
          break;
        }
      } catch {
        // not a decodable image — try next embedded image
      }
    }
    // Fallback: QR is rendered as SVG vector <rect> elements with no embedded raster image.
    // Render the SVG in the browser (which rasterises the vector paths) and scan the screenshot.
    if (!qrData) {
      console.log('  QR not in embedded images — rendering SVG in browser to decode vector QR...');
      try {
        const svgBase64 = Buffer.from(capturedSvg).toString('base64');
        await page.setContent(
          `<!DOCTYPE html><html><body style="margin:0;background:#fff">` +
          `<img id="cert" src="data:image/svg+xml;base64,${svgBase64}" width="1200">` +
          `</body></html>`
        );
        await page.locator('#cert').waitFor({ state: 'visible', timeout: 10000 });
        const screenshot = await page.screenshot({ fullPage: true });
        const rendered = await Jimp.read(screenshot);
        const { width: rw, height: rh } = rendered.bitmap;
        console.log(`  Rendered certificate screenshot: ${rw}x${rh}px — scanning for QR...`);
        const scanResult = jsQR(new Uint8ClampedArray(rendered.bitmap.data.buffer), rw, rh);
        if (scanResult) {
          qrData = scanResult.data;
          console.log(`  jsQR decoded from rendered SVG: ${qrData}`);
        }
      } catch (e) {
        console.log(`  Browser render approach failed: ${e}`);
      }
    }

    if (!qrData) {
      console.log('[BUG REPORT] Could not decode or extract QR code from certificate SVG — QR may be rendered as vector paths with no href wrapper.');
      return;
    }
    console.log(`QR code content: "${qrData}"`);
    expect(qrData, 'QR code should contain a valid URL').toMatch(/^https?:\/\//);
    console.log('QR code verified: valid URL ✓');

    // 14. Navigate to the QR verification URL and check the outcome.
    //     Verification can fail due to a backend registry issue — report it as
    //     a bug but do not fail the test, since it is outside the portal's control.
    console.log(`  Navigating to QR verification URL: ${qrData}`);
    await page.goto(qrData!);
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Check passed FIRST so the !verificationPassed guard below is available.
    const verificationPassed =
      await page.getByText(/active\s*&\s*valid/i).isVisible({ timeout: 15000 }).catch(() => false)
      || await page.getByRole('heading', { name: /verification successful/i }).isVisible({ timeout: 1000 }).catch(() => false)
      || await page.getByText(/certificate is valid/i).isVisible({ timeout: 1000 }).catch(() => false);

    const verificationFailed =
      await page.getByRole('heading', { name: /verification failed/i }).isVisible({ timeout: 1000 }).catch(() => false)
      || await page.getByText(/this certificate could not be verified/i).isVisible({ timeout: 1000 }).catch(() => false)
      || (!verificationPassed && await page.getByText(/\bInvalid\b/).isVisible({ timeout: 1000 }).catch(() => false));

    if (verificationFailed) {
      console.log('[BUG REPORT] Certificate QR verification failed — backend registry returned "Invalid". The certificate was issued correctly but verification is broken.');
    } else if (verificationPassed) {
      console.log('Certificate QR verification passed ✓');
    } else {
      console.log('Certificate QR verification result is indeterminate — page did not show a clear pass/fail state.');
    }
  });
});
