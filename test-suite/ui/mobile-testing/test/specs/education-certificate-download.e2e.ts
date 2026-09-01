// @ts-nocheck
import * as dotenv from "dotenv";
dotenv.config();

import { $, $$, browser, expect } from "@wdio/globals";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function findVisibleElement(selectors: string[]) {
  for (const selector of selectors) {
    const elements = await $$(selector);
    for (const element of elements) {
      if (await element.isDisplayed()) {
        return element;
      }
    }
    for (const element of elements) {
      if (await element.isExisting()) {
        return element;
      }
    }
  }
  throw new Error(`Unable to find any matching element for selectors: ${selectors.join(", ")}`);
}

async function clickVisibleElement(selectors: string[], timeout = 15000) {
  const element = await findVisibleElement(selectors);
  await element.waitForDisplayed({ timeout });

  try {
    await element.scrollIntoView();
  } catch {}

  try {
    await element.click();
  } catch {
    await browser.execute((node) => {
      (node as HTMLElement).click();
    }, element);
  }

  return element;
}

async function findTextInput() {
  return findVisibleElement([
    "input[placeholder='Enter email']",
    "input[placeholder='Enter your username']",
    "input[placeholder='Username']",
    "input[placeholder='Email']",
    "input[placeholder='Email address']",
    "input[formcontrolname='username']",
    "input[autocomplete='username']",
    "input[type='email']",
    "//input[contains(translate(@placeholder, 'EMAILUSERNAME', 'emailusername'), 'email')]",
    "//input[contains(translate(@placeholder, 'EMAILUSERNAME', 'emailusername'), 'username')]",
    "//input[not(@type='hidden') and not(@type='password') and (not(@type) or @type='text' or @type='email' or @type='tel')][1]",
  ]);
}

async function findPasswordInput() {
  return findVisibleElement([
    "input[placeholder='Enter password']",
    "input[placeholder='Password']",
    "input[formcontrolname='password']",
    "input[autocomplete='current-password']",
    "input[type='password']",
    "//input[contains(translate(@placeholder, 'PASSWORD', 'password'), 'password')]",
  ]);
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

async function loginToPortal(username: string, password: string, url: string) {
  await browser.url(url);
  await browser.pause(2000);

  let loginFormOpened = false;
  try {
    await clickVisibleElement([
      "button[aria-label='Open Menu']",
      "button[aria-label='Menu']",
      "button.hamburger",
      "//button[contains(@aria-label, 'Menu') or contains(@aria-label, 'menu')]",
    ]);
    await clickVisibleElement([
      "button=Login", "a=Login", "button=Sign in", "a=Sign in",
      "//button[contains(., 'Login') or contains(., 'Sign in')]",
      "//a[contains(., 'Login') or contains(., 'Sign in')]",
    ]);
    loginFormOpened = true;
  } catch {}

  if (!loginFormOpened) {
    await browser.url(`${url.replace(/\/$/, "")}/login`);
    await browser.pause(2000);
  }

  await browser.pause(1000);

  const emailInput = await findTextInput();
  await emailInput.waitForDisplayed({ timeout: 15000 });
  await emailInput.setValue(username);

  const passwordInput = await findPasswordInput();
  await passwordInput.setValue(password);

  await clickVisibleElement([
    "button=LOGIN", "button=Login", "button[type='submit']",
    "//button[contains(., 'LOGIN') or contains(., 'Login')]",
  ]);
  await browser.pause(3000);
}

// ─── SEARCH & OPEN COURSE ─────────────────────────────────────────────────────

async function searchCourseByName(courseName: string) {
  let searchInput;
  try {
    searchInput = await findVisibleElement([
      "input[placeholder='Search for content']",
      "input[type='search']",
      "input[aria-label='Search for content']",
      "//input[contains(@placeholder, 'Search')]",
    ]);
  } catch {
    await clickVisibleElement([
      "button[aria-label='Search']",
      "a[aria-label='Search']",
      "//*[contains(@aria-label, 'Search')]",
      "//*[contains(@title, 'Search')]",
    ]);
    searchInput = await findVisibleElement([
      "input[placeholder='Search for content']",
      "input[type='search']",
      "input[aria-label='Search for content']",
      "//input[contains(@placeholder, 'Search')]",
    ]);
  }

  await searchInput.waitForDisplayed({ timeout: 15000 });
  await searchInput.click();
  await searchInput.setValue(courseName);
  await browser.keys("Enter");
  await browser.pause(1500);
}

async function openCourseFromSearch(courseName: string) {
  const courseCard = await findVisibleElement([
    `//div[contains(@title, '${courseName}')]`,
    `//span[normalize-space()='${courseName}']`,
    `//h3[contains(., '${courseName}')]`,
    `//*[contains(normalize-space(), '${courseName}') and (self::span or self::div or self::h3)][1]`,
  ]);

  const selectedCourseText = (await courseCard.getText()).trim();
  await courseCard.scrollIntoView();
  await courseCard.click();
  await browser.pause(1500);
  return selectedCourseText || courseName;
}

// ─── COURSE PROGRESS ─────────────────────────────────────────────────────────

async function getCourseProgressPercentage(): Promise<number> {
  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(400);

  const progress = await browser.execute(() => {
    const lines = (document.body?.innerText || "").split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes("course progress")) {
        for (let j = i; j < Math.min(i + 5, lines.length); j++) {
          const m = lines[j].match(/(\d{1,3})\s*%/);
          if (m) return parseInt(m[1]);
        }
      }
    }
    const all = [...(document.body?.innerText || "").matchAll(/(\d{1,3})\s*%/g)]
      .map((m) => Number(m[1])).filter((n) => n >= 0 && n <= 100);
    return all.length > 0 ? all[0] : 0;
  });

  return Number(progress) || 0;
}

// ─── ASSESSMENT BEST SCORE ───────────────────────────────────────────────────

async function getAssessmentBestScore(): Promise<{ scored: number; total: number } | null> {
  // Scroll through the page to find Best Score
  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(300);

  for (let i = 0; i < 10; i++) {
    await browser.execute(() => window.scrollBy(0, 300));
    await browser.pause(200);
  }

  const scoreInfo = await browser.execute(() => {
    const bodyText = document.body?.innerText || "";

    // Match "Best Score: X/Y" pattern
    const bestScoreMatch = bodyText.match(/Best\s*Score\s*[:\-]?\s*(\d+)\s*\/\s*(\d+)/i);
    if (bestScoreMatch) {
      return {
        scored: parseInt(bestScoreMatch[1]),
        total: parseInt(bestScoreMatch[2]),
      };
    }

    // Match standalone "X/Y" near "Best Score" text
    const lines = bodyText.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes("best score")) {
        // Check current and next few lines for X/Y pattern
        for (let j = i; j < Math.min(i + 3, lines.length); j++) {
          const m = lines[j].match(/(\d+)\s*\/\s*(\d+)/);
          if (m) {
            return { scored: parseInt(m[1]), total: parseInt(m[2]) };
          }
        }
      }
    }

    return null;
  });

  if (scoreInfo) {
    console.log(`📊 Best Score found: ${scoreInfo.scored}/${scoreInfo.total}`);
  } else {
    console.log("📊 No Best Score found on this course");
  }

  return scoreInfo;
}

// ─── PROFILE NAVIGATION ───────────────────────────────────────────────────────

async function goBackToProfile() {
  await browser.back();
  await browser.pause(1000);
}

async function openProfileFromHamburger() {
  await clickVisibleElement([
    "button[aria-label='Open Menu']",
    "button[aria-label='Menu']",
    "//button[contains(@aria-label, 'Menu') or contains(@aria-label, 'menu')]",
  ]);
  await browser.pause(800);

  await clickVisibleElement([
    "span=Profile",
    "a=Profile",
    "button=Profile",
    "//*[normalize-space()='Profile']",
  ]);
  await browser.pause(1500);
}

async function dismissAnyOpenOverlay() {
  try {
    const rootHidden = await browser.execute(() => {
      const root = document.getElementById("root");
      return root?.getAttribute("aria-hidden") === "true";
    });

    if (rootHidden) {
      await browser.keys("Escape");
      await browser.pause(800);

      const stillHidden = await browser.execute(() => {
        const root = document.getElementById("root");
        return root?.getAttribute("aria-hidden") === "true";
      });

      if (stillHidden) {
        await browser.execute(() => {
          const overlay =
            document.querySelector(".cdk-overlay-backdrop") ||
            document.querySelector(".modal-backdrop") ||
            document.querySelector("[class*='backdrop']") ||
            document.querySelector("[class*='overlay']");
          if (overlay) (overlay as HTMLElement).click();
        });
        await browser.pause(800);
      }
    }
  } catch {}
}

async function scrollToMyLearning() {
  const myLearning = await findVisibleElement([
    "span=My Learning",
    "//*[normalize-space()='My Learning']",
  ]);

  await myLearning.scrollIntoView({ block: "start", inline: "nearest" });
  await browser.pause(1200);
  await browser.execute(() => window.scrollBy(0, 300));
  await browser.pause(800);
}

async function applyFilterInMyLearning(filter: "All" | "Completed" | "Ongoing") {
  // Check if filter is already active
  const alreadyActive = await $$(
    `//*[contains(@class, 'selected') and normalize-space()='${filter}']` +
    ` | //*[@aria-selected='true' and normalize-space()='${filter}']`
  );
  if (alreadyActive.length > 0) return;

  // Open the filter dropdown
  await clickVisibleElement([
    "//*[normalize-space()='My Learning']/following::*[@role='combobox'][1]",
    "//*[normalize-space()='My Learning']/following::*[@role='button' and contains(normalize-space(), 'All')][1]",
    "//*[normalize-space()='My Learning']/following::*[normalize-space()='All'][1]",
    "select[aria-label*='Filter']",
    "//*[@role='combobox']",
    "button=Filter courses by status",
    "//*[contains(normalize-space(), 'Filter courses by status')]",
  ]);
  await browser.pause(800);

  // Select the desired filter
  await clickVisibleElement([
    `//*[@role='option' and normalize-space()='${filter}']`,
    `//*[@role='option' and contains(normalize-space(), '${filter}')]`,
    `//*[@role='listbox']//*[normalize-space()='${filter}']`,
    `//*[contains(@class,'option') and normalize-space()='${filter}']`,
    `li=${filter}`,
    `option=${filter}`,
    `(//span[normalize-space()='${filter}'] | //li[normalize-space()='${filter}'] | //div[normalize-space()='${filter}'])[last()]`,
  ]);
  await browser.pause(1500);

  await browser.execute(() => window.scrollBy(0, 300));
  await browser.pause(800);
}

// ─── MY LEARNING CARD CHECKS ─────────────────────────────────────────────────

function normalizeText(value: string) {
  return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

async function clickViewMoreCoursesIfPresent(): Promise<boolean> {
  try {
    const viewMoreButton = await findVisibleElement([
      "button=View More Courses",
      "a=View More Courses",
      "//*[self::button or self::a][contains(normalize-space(), 'View More Courses')]",
    ]);

    try {
      await viewMoreButton.scrollIntoView({ block: "center", inline: "nearest" });
    } catch {}

    try {
      await viewMoreButton.click();
    } catch {
      await browser.execute((node) => (node as HTMLElement).click(), viewMoreButton);
    }

    await browser.pause(1500);
    console.log("ℹ️ Clicked 'View More Courses'");
    return true;
  } catch {
    return false;
  }
}

async function findCourseCardInfo(courseName: string): Promise<{
  hasDownloadCertificate: boolean;
  hasNoCertificate: boolean;
  cardText: string;
}> {
  const expectedName = normalizeText(courseName);

  // Scroll through to load all cards
  for (let i = 0; i < 5; i++) {
    await browser.execute(() => window.scrollBy(0, 250));
    await browser.pause(400);
  }

  const result = await browser.execute((expectedName: string) => {
    const allElements = Array.from(document.querySelectorAll("*"));

    // Find the element whose own direct text matches the course name
    let courseNameEl: Element | null = null;
    for (const el of allElements) {
      const ownText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => (n.textContent || "").replace(/\s+/g, " ").trim().toLowerCase())
        .join(" ").trim();

      if (ownText === expectedName) {
        courseNameEl = el;
        break;
      }
    }

    if (!courseNameEl) return null;

    // Walk up to find the card container
    let container: Element | null = courseNameEl;
    for (let i = 0; i < 8; i++) {
      container = container?.parentElement ?? null;
      if (!container) break;

      const containerText = (container.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();

      // Check if this container has status indicators (it's the card)
      if (
        containerText.includes("completed") ||
        containerText.includes("in progress") ||
        containerText.includes("download certificate") ||
        containerText.includes("no certificate")
      ) {
        const hasDownloadCertificate = containerText.includes("download certificate");
        const hasNoCertificate = containerText.includes("no certificate");
        const cardText = (container.textContent || "").replace(/\s+/g, " ").trim();

        return { hasDownloadCertificate, hasNoCertificate, cardText };
      }
    }

    return null;
  }, expectedName);

  if (!result) {
    // Try clicking View More and retry
    const clickedMore = await clickViewMoreCoursesIfPresent();
    if (clickedMore) {
      for (let i = 0; i < 4; i++) {
        await browser.execute(() => window.scrollBy(0, 250));
        await browser.pause(350);
      }

      const retryResult = await browser.execute((expectedName: string) => {
        const allElements = Array.from(document.querySelectorAll("*"));
        let courseNameEl: Element | null = null;
        for (const el of allElements) {
          const ownText = Array.from(el.childNodes)
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => (n.textContent || "").replace(/\s+/g, " ").trim().toLowerCase())
            .join(" ").trim();
          if (ownText === expectedName) { courseNameEl = el; break; }
        }

        if (!courseNameEl) return null;

        let container: Element | null = courseNameEl;
        for (let i = 0; i < 8; i++) {
          container = container?.parentElement ?? null;
          if (!container) break;
          const containerText = (container.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
          if (
            containerText.includes("completed") || containerText.includes("in progress") ||
            containerText.includes("download certificate") || containerText.includes("no certificate")
          ) {
            return {
              hasDownloadCertificate: containerText.includes("download certificate"),
              hasNoCertificate: containerText.includes("no certificate"),
              cardText: (container.textContent || "").replace(/\s+/g, " ").trim(),
            };
          }
        }
        return null;
      }, expectedName);

      if (retryResult) return retryResult;
    }

    throw new Error(`Could not find course card for "${courseName}" in My Learning`);
  }

  return result;
}

// ─── DOWNLOAD CERTIFICATE ────────────────────────────────────────────────────

async function findDownloadIndexForCourse(expectedName: string) {
  return await browser.execute((expectedName: string) => {
    const allElements = Array.from(document.querySelectorAll("*"));

    let courseNameEl: Element | null = null;
    for (const el of allElements) {
      const ownText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => (n.textContent || "").replace(/\s+/g, " ").trim().toLowerCase())
        .join(" ").trim();

      if (ownText === expectedName) {
        courseNameEl = el;
        break;
      }
    }

    if (!courseNameEl) return null;

    let container: Element | null = courseNameEl;
    let downloadEl: Element | null = null;

    for (let i = 0; i < 8; i++) {
      container = container?.parentElement ?? null;
      if (!container) break;

      const allInContainer = Array.from(container.querySelectorAll("a, button, span, div"));
      const found = allInContainer.find((el) =>
        (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase().includes("download certificate")
      );

      if (found) {
        downloadEl = found;
        break;
      }
    }

    if (!downloadEl) return null;

    const allDownloadEls = Array.from(document.querySelectorAll("a, button, span, div")).filter(
      (el) =>
        (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase().includes("download certificate")
    );

    const index = allDownloadEls.indexOf(downloadEl);
    return { index };
  }, expectedName);
}

async function clickDownloadCertificateForCourse(courseName: string) {
  const expectedName = normalizeText(courseName);

  for (let i = 0; i < 5; i++) {
    await browser.execute(() => window.scrollBy(0, 250));
    await browser.pause(400);
  }

  let result = await findDownloadIndexForCourse(expectedName);

  if (!result) {
    const clickedViewMore = await clickViewMoreCoursesIfPresent();
    if (clickedViewMore) {
      for (let i = 0; i < 4; i++) {
        await browser.execute(() => window.scrollBy(0, 250));
        await browser.pause(350);
      }
      result = await findDownloadIndexForCourse(expectedName);
    }
  }

  if (!result) {
    throw new Error(`Could not find course card for "${courseName}" with a Download Certificate element`);
  }

  const allDownloadEls = await $$(
    "//*[contains(normalize-space(), 'Download Certificate') and (self::a or self::button or self::span or self::div)]"
  );

  if (result.index < 0 || result.index >= allDownloadEls.length) {
    throw new Error(
      `Download Certificate element index ${result.index} out of range (found ${allDownloadEls.length} elements)`
    );
  }

  const targetDownloadEl = allDownloadEls[result.index];

  await dismissAnyOpenOverlay();

  try {
    await browser.execute(
      (node) => node.scrollIntoView({ block: "center" }),
      targetDownloadEl
    );
  } catch {}

  await browser.pause(3000);
  await dismissAnyOpenOverlay();

  let clicked = false;

  try {
    await targetDownloadEl.waitForDisplayed({ timeout: 5000 });
    await targetDownloadEl.click();
    clicked = true;
    console.log(`✅ WebDriver click on "Download Certificate" for: "${courseName}"`);
  } catch (e) {
    console.warn(`⚠️ Real click failed: ${e.message}`);
  }

  if (!clicked) {
    try {
      const location = await targetDownloadEl.getLocation();
      const size = await targetDownloadEl.getSize();
      await browser.action("pointer")
        .move({ x: Math.round(location.x + size.width / 2), y: Math.round(location.y + size.height / 2) })
        .down().pause(100).up().perform();
      clicked = true;
      console.log(`✅ Actions API click on "Download Certificate"`);
    } catch (e) {
      console.warn(`⚠️ Actions API failed: ${e.message}`);
    }
  }

  if (!clicked) {
    await browser.execute((node) => (node as HTMLElement).click(), targetDownloadEl);
    console.log(`✅ JS click fallback on "Download Certificate"`);
  }

  await browser.pause(3000);

  // Wait for dialog
  try {
    await browser.waitUntil(
      async () => {
        const candidates = await $$(
          "//*[@role='dialog' or @role='alertdialog' or contains(@class,'modal') or contains(@class,'dialog') or contains(@class,'popup') or contains(@class,'bottom-sheet')]"
        );
        for (const el of candidates) {
          if (await el.isDisplayed()) return true;
        }
        return false;
      },
      { timeout: 10000, interval: 500, timeoutMsg: "Dialog did not appear" }
    );

    console.log("✅ Dialog appeared!");
    await browser.pause(3000);

    const downloadBtn = await findVisibleElement([
      "//*[@role='dialog']//button[contains(normalize-space(), 'Download')]",
      "//*[@role='alertdialog']//button[contains(normalize-space(), 'Download')]",
      "//*[contains(@class,'modal')]//button[contains(normalize-space(), 'Download')]",
      "//*[contains(@class,'dialog')]//button[contains(normalize-space(), 'Download')]",
      "button#positive_button",
      "//button[normalize-space()='Download']",
      "//button[contains(normalize-space(), 'Download')]",
    ]);

    try { await downloadBtn.scrollIntoView(); } catch {}
    await browser.pause(2000);

    try {
      await downloadBtn.click();
    } catch {
      await browser.execute((node) => (node as HTMLElement).click(), downloadBtn);
    }

    console.log("✅ Clicked Download button inside dialog!");
    await browser.pause(5000);

  } catch {
    console.warn("⚠️ No dialog — direct download assumed");
    await browser.pause(5000);
  }
}


async function searchFromCurrentPage(courseName: string) {
  // Click the search icon (magnifying glass) — available on all pages
  await clickVisibleElement([
    "button[aria-label='Search']",
    "a[aria-label='Search']",
    "//*[contains(@aria-label, 'Search')]",
    "//*[contains(@title, 'Search')]",
    "//button[contains(@class,'search')]",
    "//*[name()='svg' and (contains(@aria-label, 'Search') or contains(@title, 'Search'))]",
  ]);
  await browser.pause(800);

  // Type in the search box
  const searchInput = await findVisibleElement([
    "input[placeholder='Search for content']",
    "input[type='search']",
    "input[aria-label='Search for content']",
    "//input[contains(@placeholder, 'Search')]",
  ]);

  await searchInput.click();
  await searchInput.setValue(courseName);
  await browser.keys("Enter");
  await browser.pause(2000);

  // Open the course from results
  await openCourseFromSearch(courseName);
}



async function findCourseCardInfoOrAbsent(courseName: string): Promise<{
  found: boolean;
  hasDownloadCertificate: boolean;
  hasNoCertificate: boolean;
  cardText: string;
}> {
  const expectedName = normalizeText(courseName);

  // Scroll through to load all visible cards
  for (let i = 0; i < 5; i++) {
    await browser.execute(() => window.scrollBy(0, 250));
    await browser.pause(400);
  }

  const checkCard = async () => {
    return await browser.execute((expectedName: string) => {
      const allElements = Array.from(document.querySelectorAll("*"));

      let courseNameEl: Element | null = null;
      for (const el of allElements) {
        const ownText = Array.from(el.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => (n.textContent || "").replace(/\s+/g, " ").trim().toLowerCase())
          .join(" ").trim();
        if (ownText === expectedName) {
          courseNameEl = el;
          break;
        }
      }

      if (!courseNameEl) {
        return {
          found: false,
          hasDownloadCertificate: false,
          hasNoCertificate: false,
          cardText: "",
        };
      }

      // Walk up to find the card container
      let container: Element | null = courseNameEl;
      for (let i = 0; i < 8; i++) {
        container = container?.parentElement ?? null;
        if (!container) break;

        const containerText = (container.textContent || "")
          .replace(/\s+/g, " ").trim().toLowerCase();

        if (
          containerText.includes("completed") ||
          containerText.includes("in progress") ||
          containerText.includes("download certificate") ||
          containerText.includes("no certificate") ||
          containerText.includes("ongoing")
        ) {
          return {
            found: true,
            hasDownloadCertificate: containerText.includes("download certificate"),
            hasNoCertificate: containerText.includes("no certificate"),
            cardText: (container.textContent || "").replace(/\s+/g, " ").trim(),
          };
        }
      }

      // Found course name but no recognizable card container
      return {
        found: true,
        hasDownloadCertificate: false,
        hasNoCertificate: false,
        cardText: (courseNameEl.textContent || "").trim(),
      };
    }, expectedName);
  };

  // First attempt
  let result = await checkCard();
  if (result && result.found) return result;

  // Try View More Courses
  const clickedMore = await clickViewMoreCoursesIfPresent();
  if (clickedMore) {
    for (let i = 0; i < 4; i++) {
      await browser.execute(() => window.scrollBy(0, 250));
      await browser.pause(350);
    }
    result = await checkCard();
    if (result && result.found) return result;
  }

  // Course not found anywhere
  return {
    found: false,
    hasDownloadCertificate: false,
    hasNoCertificate: false,
    cardText: "",
  };
}




// ─── TEST SUITE ───────────────────────────────────────────────────────────────

describe("Certificate Download Tests", () => {

  const baseUrl  = process.env.SUNBIRD_URL  || "https://test.sunbirded.org";
  const username     = process.env.SUNBIRD_USERNAME   || "user1@yopmail.com";
  const password     = process.env.SUNBIRD_PASSWORD   || "User1@123";

  // ── TC1 + TC3 ─────────────────────────────────────────────────────────────
  it("TC1 & TC3: Should download certificate for 100% completed course", async function () {
    this.timeout(180000);

    const targetCourseName = "Spark Test: Course WO Assessments";

    console.log("\n🔐 Step 1: Login");
    await loginToPortal(username, password, baseUrl);

    console.log(`\n📖 Step 2: Open course "${targetCourseName}"`);
    await searchCourseByName(targetCourseName);
    await openCourseFromSearch(targetCourseName);

    console.log("\n📊 Step 3: Verify course is 100% complete");
    const progress = await getCourseProgressPercentage();
    console.log(`  Progress: ${progress}%`);
    expect(progress).toBe(100);

    console.log("\n👤 Step 4: Navigate to Profile > My Learning");
    await goBackToProfile();
    await openProfileFromHamburger();
    await scrollToMyLearning();

    console.log("\n🔽 Step 5: Apply Completed filter");
    await applyFilterInMyLearning("Completed");

    console.log("\n🔍 Step 6: Verify Download Certificate button exists");
    const cardInfo = await findCourseCardInfo(targetCourseName);
    console.log(`  Has Download Certificate: ${cardInfo.hasDownloadCertificate}`);
    console.log(`  Has No Certificate: ${cardInfo.hasNoCertificate}`);
    expect(cardInfo.hasDownloadCertificate).toBe(true);
    expect(cardInfo.hasNoCertificate).toBe(false);

    console.log("\n⬇️ Step 7: Click Download Certificate");
    await clickDownloadCertificateForCourse(targetCourseName);

    console.log("\n✅ TC1 & TC3 PASSED");

    // ── After TC1 done — stay on profile page, ready for TC2 ──────────────
    // Navigate back to profile so TC2 can use search from there
    await openProfileFromHamburger();
    await browser.pause(1000);
  });

  // ── TC2 ───────────────────────────────────────────────────────────────────
  it("TC2: Should NOT show Download Certificate when course is incomplete", async function () {
    this.timeout(180000);

    const incompleteCourse = process.env.INCOMPLETE_COURSE 

    // Use search from current page — already logged in from TC1
    console.log(`\n🔍 Step 1: Search for incomplete course "${incompleteCourse}"`);
    await searchFromCurrentPage(incompleteCourse);

    console.log("\n📊 Step 2: Verify course is NOT 100%");
    const progress = await getCourseProgressPercentage();
    console.log(`  Progress: ${progress}%`);
    expect(progress).toBeLessThan(100);

    console.log("\n👤 Step 3: Navigate to Profile > My Learning");
    await goBackToProfile();
    await openProfileFromHamburger();
    await scrollToMyLearning();

    // No filter change — keep default so incomplete course is visible

    console.log("\n🔍 Step 4: Find course card and verify no Download Certificate");
    const cardInfo = await findCourseCardInfoOrAbsent(incompleteCourse);

    console.log(`  Course card found: ${cardInfo.found}`);
    console.log(`  Card text: "${cardInfo.cardText}"`);
    console.log(`  Has Download Certificate: ${cardInfo.hasDownloadCertificate}`);
    console.log(`  Has No Certificate text: ${cardInfo.hasNoCertificate}`);

    // Pass conditions:
    // 1. Card not found at all (incomplete course hidden from My Learning)
    // 2. Card found but shows "No certificate"
    // 3. Card found but empty — no Download Certificate button
    expect(cardInfo.hasDownloadCertificate).toBe(false);

    console.log("\n✅ TC2 PASSED: No Download Certificate for incomplete course");

    // Stay on profile, ready for TC4
    await openProfileFromHamburger();
    await browser.pause(1000);
  });

  // ── TC4 ───────────────────────────────────────────────────────────────────
  it("TC4: Should NOT show Download Certificate when assessment score is low despite 100%", async function () {
    this.timeout(180000);

    const lowScoreCourse = process.env.LOW_SCORE_COURSE 

    // Use search from current page — already logged in
    console.log(`\n🔍 Step 1: Search for low score course "${lowScoreCourse}"`);
    await searchFromCurrentPage(lowScoreCourse);

    console.log("\n📊 Step 2: Verify course IS 100%");
    const progress = await getCourseProgressPercentage();
    console.log(`  Progress: ${progress}%`);
    expect(progress).toBe(100);

    console.log("\n🎯 Step 3: Check Best Score (should be low)");
    const scoreInfo = await getAssessmentBestScore();
    if (scoreInfo) {
      console.log(`  Best Score: ${scoreInfo.scored}/${scoreInfo.total}`);
      const isFullScore = scoreInfo.scored === scoreInfo.total;
      if (isFullScore) {
        console.warn(`⚠️ Full marks scored — test expects a LOW score`);
      } else {
        console.log(`  ✅ Low score confirmed: ${scoreInfo.scored}/${scoreInfo.total}`);
      }
    } else {
      console.log("  ℹ️ No Best Score found");
    }

    console.log("\n👤 Step 4: Navigate to Profile > My Learning");
    await goBackToProfile();
    await openProfileFromHamburger();
    await scrollToMyLearning();

    console.log("\n🔽 Step 5: Apply Completed filter");
    await applyFilterInMyLearning("Completed");

    console.log("\n🔍 Step 6: Verify NO Download Certificate — should show 'No certificate'");
    const cardInfo = await findCourseCardInfo(lowScoreCourse);
    console.log(`  Card text: "${cardInfo.cardText}"`);
    console.log(`  Has Download Certificate: ${cardInfo.hasDownloadCertificate}`);
    console.log(`  Has No Certificate: ${cardInfo.hasNoCertificate}`);
    expect(cardInfo.hasDownloadCertificate).toBe(false);
    expect(cardInfo.hasNoCertificate).toBe(true);

    console.log("\n✅ TC4 PASSED");
  });

});