// @ts-nocheck
import * as dotenv from "dotenv";
dotenv.config();

import { $, $$, browser, expect } from "@wdio/globals";

function normalizeText(value: string) {
  return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function findVisibleElement(selectors: string[], timeout = 15000) {
  for (const selector of selectors) {
    const elements = await $$(selector);
    for (const element of elements) {
      try {
        if (await element.isDisplayed()) {
          await element.waitForDisplayed({ timeout });
          return element;
        }
      } catch {}
    }
    for (const element of elements) {
      try {
        if (await element.isExisting()) return element;
      } catch {}
    }
  }
  throw new Error(
    `Unable to find any matching element for selectors: ${selectors.join(", ")}`
  );
}

async function clickVisibleElement(selectors: string[], timeout = 15000) {
  const element = await findVisibleElement(selectors, timeout);
  try {
    await element.scrollIntoView({ block: "center", inline: "nearest" });
  } catch {}
  try {
    await element.click();
  } catch {
    await browser.execute((node) => (node as HTMLElement).click(), element);
  }
  return element;
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

  const usernameField = await findVisibleElement([
    "input[placeholder='Enter email']",
    "input[placeholder='Enter your username']",
    "input[placeholder='Username']",
    "input[placeholder='Email']",
    "input[type='email']",
    "input[formcontrolname='username']",
    "//input[contains(translate(@placeholder, 'EMAILUSERNAME', 'emailusername'), 'email')]",
    "//input[contains(translate(@placeholder, 'EMAILUSERNAME', 'emailusername'), 'username')]",
  ]);
  await usernameField.setValue(username);

  const passwordField = await findVisibleElement([
    "input[placeholder='Enter password']",
    "input[placeholder='Password']",
    "input[type='password']",
    "input[formcontrolname='password']",
  ]);
  await passwordField.setValue(password);

  await clickVisibleElement([
    "button=LOGIN", "button=Login", "button[type='submit']",
    "//button[contains(., 'LOGIN') or contains(., 'Login')]",
  ]);
  await browser.pause(3000);
}

// ─── SEARCH & OPEN COURSE ─────────────────────────────────────────────────────

async function searchAndOpenCourse(courseName: string) {
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
      "//*[contains(@aria-label, 'Search')]",
    ]);
    searchInput = await findVisibleElement([
      "input[placeholder='Search for content']",
      "input[type='search']",
      "//input[contains(@placeholder, 'Search')]",
    ]);
  }

  await searchInput.click();
  await searchInput.setValue(courseName);
  await browser.keys("Enter");
  await browser.pause(2000);

  const courseCard = await findVisibleElement([
    `//div[contains(@title, '${courseName}')]`,
    `//span[normalize-space()='${courseName}']`,
    `//h3[contains(., '${courseName}')]`,
    `//*[contains(normalize-space(), '${courseName}') and (self::span or self::div or self::h3)][1]`,
  ]);
  await courseCard.scrollIntoView({ block: "center" });
  await courseCard.click();
  await browser.pause(2500);
}

// ─── COURSE PAGE URL ─────────────────────────────────────────────────────────

let coursePageUrl = "";

async function saveCoursePageUrl() {
  coursePageUrl = await browser.getUrl();
  console.log(`📌 Course page URL saved: ${coursePageUrl}`);
}

async function returnToCoursePageUrl() {
  const currentUrl = await browser.getUrl();
  if (currentUrl !== coursePageUrl && coursePageUrl) {
    console.log("  🔙 Navigating back to course page...");
    await browser.url(coursePageUrl);
    await browser.pause(2500);
  }
}

// ─── ENROLLMENT STATUS ────────────────────────────────────────────────────────

type EnrollmentStatus = "enrolled" | "not-enrolled" | "no-batches";

async function checkEnrollmentStatus(): Promise<EnrollmentStatus> {
  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(500);
  for (let i = 0; i < 6; i++) {
    await browser.execute(() => window.scrollBy(0, 300));
    await browser.pause(300);
  }

  const status = await browser.execute(() => {
    const t = (document.body?.innerText || "").toLowerCase();
    if (
      t.includes("no batches available for enrollment") ||
      t.includes("no batches available")
    ) return "no-batches";

    if (
      t.includes("select a batch to start learning") ||
      t.includes("available batches") ||
      (t.includes("you must join the course") && t.includes("select a batch"))
    ) return "not-enrolled";

    if (
      t.includes("you must join the course to get complete access") &&
      !t.includes("select a batch") &&
      !t.includes("available batches")
    ) return "no-batches";

    return "enrolled";
  }) as EnrollmentStatus;

  console.log(`📋 Enrollment status: ${status}`);
  return status;
}

// ─── ENROLL INTO COURSE ───────────────────────────────────────────────────────

async function enrollIntoCourse(): Promise<boolean> {
  console.log("🔐 Attempting to enroll...");
  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(500);

  let found = false;
  for (let i = 0; i < 15; i++) {
    await browser.execute(() => window.scrollBy(0, 300));
    await browser.pause(300);
    found = await browser.execute(() => {
      const t = (document.body?.innerText || "").toLowerCase();
      return (
        t.includes("available batches") ||
        t.includes("select a batch to start learning")
      );
    });
    if (found) break;
  }
  if (!found) { console.warn("  ⚠️ Batch section not found"); return false; }

  const batchSelected = await browser.execute(() => {
    function norm(v: string) {
      return (v || "").replace(/\s+/g, " ").trim().toLowerCase();
    }
    for (const sel of Array.from(document.querySelectorAll("select"))) {
      const valid = Array.from(sel.options).filter(
        (o) =>
          !o.disabled &&
          o.value !== "" &&
          norm(o.text) !== "select a batch" &&
          norm(o.text) !== "select" &&
          norm(o.text) !== ""
      );
      if (valid.length > 0) {
        sel.value = valid[0].value;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        sel.dispatchEvent(new Event("input", { bubbles: true }));
        return valid[0].text;
      }
    }
    return null;
  });

  if (batchSelected) {
    console.log(`  ✅ Batch selected: "${batchSelected}"`);
  } else {
    try {
      await clickVisibleElement([
        "select",
        "//*[@role='combobox']",
        "//*[contains(normalize-space(), 'Select a Batch')]",
      ], 5000);
      await browser.pause(800);
      await clickVisibleElement([
        "//*[@role='option'][1]",
        "//option[not(@disabled) and normalize-space() != '' and normalize-space() != 'Select a Batch'][1]",
      ], 3000);
    } catch (e) {
      console.warn(`  ⚠️ Batch select failed: ${e.message}`);
      return false;
    }
  }

  await browser.pause(1000);

  const joinSelectors = [
    "//button[normalize-space()='Join The Course']",
    "//button[normalize-space()='Join the Course']",
    "//button[contains(normalize-space(), 'Join The Course')]",
    "//button[contains(normalize-space(), 'Join the Course')]",
    "//button[contains(normalize-space(), 'Join')]",
    "//*[self::button or self::a][contains(normalize-space(), 'Join')]",
  ];

  let joinClicked = false;
  try {
    const btn = await findVisibleElement(joinSelectors, 5000);
    await btn.scrollIntoView({ block: "center" });
    await browser.pause(500);
    await btn.click();
    joinClicked = true;
    console.log("  ✅ Clicked Join (WebDriver)");
  } catch {}

  if (!joinClicked) {
    try {
      const btn = await findVisibleElement(joinSelectors, 3000);
      const loc = await btn.getLocation();
      const size = await btn.getSize();
      await browser.action("pointer")
        .move({
          x: Math.round(loc.x + size.width / 2),
          y: Math.round(loc.y + size.height / 2),
        })
        .down().pause(100).up().perform();
      joinClicked = true;
      console.log("  ✅ Clicked Join (Actions)");
    } catch {}
  }

  if (!joinClicked) {
    const ok = await browser.execute(() => {
      for (const btn of Array.from(document.querySelectorAll("button, a"))) {
        if ((btn.textContent || "").toLowerCase().includes("join")) {
          (btn as HTMLElement).click();
          return true;
        }
      }
      return false;
    });
    if (ok) { joinClicked = true; console.log("  ✅ Clicked Join (JS)"); }
  }

  if (!joinClicked) return false;
  await browser.pause(4000);

  const confirmed = await browser.waitUntil(async () => {
    const t = (await browser.execute(
      () => (document.body?.innerText || "").toLowerCase()
    )) as string;
    return (
      t.includes("start learning") ||
      t.includes("continue learning") ||
      t.includes("course progress") ||
      t.includes("resume")
    ) && !t.includes("select a batch to start learning");
  }, {
    timeout: 15000,
    interval: 1500,
    timeoutMsg: "Enrollment not confirmed",
  }).catch(() => false);

  if (confirmed) { console.log("  ✅ Enrollment confirmed!"); return true; }

  const batchGone = await browser.execute(() => {
    const t = (document.body?.innerText || "").toLowerCase();
    return (
      !t.includes("select a batch to start learning") &&
      !t.includes("available batches")
    );
  });
  if (batchGone) { console.log("  ✅ Confirmed (batch UI gone)"); return true; }
  return false;
}

// ─── COURSE OVERVIEW ─────────────────────────────────────────────────────────

async function getCourseOverviewTotals(): Promise<{ units: number; lessons: number }> {
  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(500);
  for (let i = 0; i < 6; i++) {
    await browser.execute(() => window.scrollBy(0, 300));
    await browser.pause(300);
  }
  const totals = await browser.execute(() => {
    const t = document.body?.innerText || "";
    const unitMatch = t.match(/(\d+)\s*Units?/i);
    const lessonMatch = t.match(/(\d+)\s*Lessons?/i);
    return {
      units: unitMatch ? parseInt(unitMatch[1]) : 0,
      lessons: lessonMatch ? parseInt(lessonMatch[1]) : 0,
    };
  });
  console.log(`📊 Overview — Units: ${totals.units}, Lessons: ${totals.lessons}`);
  return totals;
}

// ─── PROGRESS ────────────────────────────────────────────────────────────────

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
      .map((m) => Number(m[1]))
      .filter((n) => n >= 0 && n <= 100);
    return all.length > 0 ? all[0] : 0;
  });
  return Number(progress) || 0;
}

// ─── EXPAND COURSE UNITS ─────────────────────────────────────────────────────

async function expandAllCourseUnits() {
  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(300);

  const expandedCount = await browser.execute(() => {
    let count = 0;
    for (const el of Array.from(document.querySelectorAll("*"))) {
      const ownText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => (n.textContent || "").replace(/\s+/g, " ").trim())
        .join(" ").trim().toLowerCase();
      if (!ownText.startsWith("course unit")) continue;

      const expandable =
        el.closest("[aria-expanded]") ||
        el.querySelector("[aria-expanded]") ||
        el.parentElement?.querySelector("[aria-expanded]");

      if (expandable && expandable.getAttribute("aria-expanded") === "false") {
        (expandable as HTMLElement).click();
        count++;
        continue;
      }

      const parent = el.parentElement;
      if (parent) {
        const cls = (parent.className || "").toLowerCase();
        if (cls.includes("collapsed") || cls.includes("closed")) {
          (el as HTMLElement).click();
          count++;
          continue;
        }
      }

      const next = el.parentElement?.nextElementSibling;
      if (next) {
        const s = window.getComputedStyle(next);
        if (
          s.display === "none" ||
          s.visibility === "hidden" ||
          s.maxHeight === "0px"
        ) {
          (el as HTMLElement).click();
          count++;
        }
      }
    }
    return count;
  });

  console.log(`  📂 Expanded ${expandedCount} unit(s)`);
  if (expandedCount > 0) await browser.pause(800);

  for (let i = 0; i < 5; i++) {
    await browser.execute(() => window.scrollBy(0, 400));
    await browser.pause(200);
  }
  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(300);
}

// ─── COLLECT CONTENT ITEMS ───────────────────────────────────────────────────

interface ContentItem {
  title: string;
  isCompleted: boolean;
  status: string;
  // Pre-detected content type hint from the course unit listing
  // Based on icon class and title keywords — avoids post-open detection failures
  contentTypeHint: string;
}

async function collectCourseUnitContentItems(): Promise<ContentItem[]> {
  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(300);
  for (let i = 0; i < 18; i++) {
    await browser.execute(() => window.scrollBy(0, 300));
    await browser.pause(150);
  }
  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(400);

  const items = await browser.execute(() => {
    const results: {
      title: string;
      isCompleted: boolean;
      status: string;
      contentTypeHint: string;
    }[] = [];

    const seen = new Set<string>();
    const allEls = Array.from(document.querySelectorAll("*"));

    // Find Related Content boundary — never scan past it
    let relatedBoundary: Element | null = null;
    for (const el of allEls) {
      const own = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => (n.textContent || "").trim())
        .join(" ").trim();
      if (own.toLowerCase() === "related content") {
        relatedBoundary = el;
        break;
      }
    }

    for (const el of allEls) {
      // Stop at Related Content boundary
      if (relatedBoundary) {
        const pos = relatedBoundary.compareDocumentPosition(el);
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) continue;
      }

      const ownText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => (n.textContent || "").replace(/\s+/g, " ").trim())
        .join(" ").trim();

      if (!ownText || ownText.length < 3 || ownText.length > 100) continue;

      const lower = ownText.toLowerCase();

      // Skip structural/UI text
      if (
        lower.startsWith("course unit") ||
        lower === "course unit" ||
        lower === "course overview" ||
        lower === "completed" ||
        lower === "in progress" ||
        lower === "not started" ||
        lower === "not viewed" ||
        lower === "best score" ||
        !!lower.match(/^\d+\/\d+$/) ||
        !!lower.match(/^page \d+ of \d+$/) ||
        lower.includes("best suited for") ||
        lower.includes("lessons") ||
        lower.includes("units") ||
        lower.includes("batch started") ||
        lower.includes("go back") ||
        lower.includes("course progress") ||
        lower.includes("no batches") ||
        lower.includes("select a batch") ||
        lower.includes("join the course") ||
        lower.includes("you must join") ||
        lower.includes("available batches") ||
        lower.includes("related content") ||
        lower.includes("start learning") ||
        lower.includes("continue learning") ||
        lower.includes("enter description") ||
        lower.includes("student")
      ) continue;

      if (seen.has(lower)) continue;

      // Must be inside a container that has an icon + status indicator
      let container: Element | null = el;
      let hasContext = false;
      for (let lvl = 0; lvl < 6; lvl++) {
        container = container?.parentElement ?? null;
        if (!container) break;
        const ct = (container.textContent || "").toLowerCase();
        const hasIcon =
          container.querySelector("mat-icon, svg, img, [class*='icon']") !== null;
        const hasStatus =
          ct.includes("completed") ||
          ct.includes("in progress") ||
          ct.includes("not viewed") ||
          ct.includes("not started");
        if (hasIcon && hasStatus) { hasContext = true; break; }
      }
      if (!hasContext) continue;

      // Determine completion status from container text
      const ct = (container?.textContent || "").toLowerCase();
      let status = "not started";
      if (ct.includes("completed") && !ct.includes("not completed")) {
        status = "completed";
      } else if (ct.includes("in progress")) {
        status = "in progress";
      } else if (ct.includes("not viewed")) {
        status = "not viewed";
      }

      // ── Detect content type from title only ────────────────────────────
      let contentTypeHint = "unknown";
      const titleLower = ownText.toLowerCase();

      const isVideoTitle =
        titleLower.includes("video") ||
        titleLower.includes("youtube") ||
        titleLower.includes("youtu") ||
        titleLower.includes(" yt ") ||
        titleLower.startsWith("yt ") ||
        titleLower.endsWith(" yt") ||
        titleLower.includes("yt-") ||
        titleLower.includes("-yt") ||
        titleLower.includes("watch") ||
        titleLower.includes("mp4") ||
        titleLower.includes("webm");

      const isAssessmentTitle =
        titleLower.includes("assessment") ||
        titleLower.includes("quiz") ||
        titleLower.includes("exam");

      const isPdfTitle =
        titleLower.includes("pdf") ||
        titleLower.includes("epub") ||
        titleLower.includes("document");

      const isH5pTitle =
        titleLower.includes("h5p") ||
        titleLower.includes("interactive") ||
        titleLower.includes("fill in");

      const isHtmlTitle =
        titleLower.includes("html") ||
        titleLower.includes("game");

      if (isVideoTitle) {
        // Distinguish YouTube vs regular video
        contentTypeHint =
          titleLower.includes("youtube") ||
          titleLower.includes("youtu") ||
          titleLower.includes("yt")
            ? "youtube"
            : "video";
      } else if (isAssessmentTitle) {
        contentTypeHint = "assessment";
      } else if (isPdfTitle) {
        contentTypeHint = "pdf";
      } else if (isH5pTitle) {
        contentTypeHint = "h5p";
      } else if (isHtmlTitle) {
        contentTypeHint = "html";
      }

      seen.add(lower);
      results.push({
        title: ownText,
        isCompleted: status === "completed",
        status,
        contentTypeHint,
      });
    }

    return results;
  });

  return items as ContentItem[];
}

// ─── COMPLETION CHECK ────────────────────────────────────────────────────────

async function isItemCompleted(title: string): Promise<boolean> {
  return await browser.execute((title: string) => {
    const lower = title.toLowerCase();
    for (const el of Array.from(document.querySelectorAll("*"))) {
      const own = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => (n.textContent || "").replace(/\s+/g, " ").trim())
        .join(" ").trim();
      if (own.toLowerCase() !== lower) continue;
      let c: Element | null = el;
      for (let i = 0; i < 5; i++) {
        c = c?.parentElement ?? null;
        if (!c) break;
        const t = (c.textContent || "").toLowerCase();
        if (t.includes("completed") && !t.includes("not completed")) return true;
      }
    }
    return false;
  }, title);
}

async function waitForItemCompleted(title: string, maxWaitMs = 8000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (await isItemCompleted(title)) return true;
    await browser.pause(1000);
  }
  return false;
}

// ─── CONTENT TYPE DETECTION (POST-OPEN FALLBACK) ─────────────────────────────
// This is now a FALLBACK only — primary detection happens via contentTypeHint
// from the course unit listing (icon + title keywords)

async function detectContentType(): Promise<string> {
  await browser.pause(2500);

  return await browser.execute(() => {
    const url = window.location.href.toLowerCase();
    const html = (document.body?.innerHTML || "").toLowerCase();
    const text = (document.body?.innerText || "").toLowerCase();

    if (document.querySelector("video")) return "video";

    // YouTube — check iframe id and src first
    if (document.querySelector("iframe#youtubeIframe")) return "youtube";

    const allIframes = Array.from(document.querySelectorAll("iframe"));
    for (const iframe of allIframes) {
      const src = (iframe.getAttribute("src") || "").toLowerCase();
      const id  = (iframe.getAttribute("id")  || "").toLowerCase();
      if (
        src.includes("youtube") || src.includes("youtu.be") ||
        id.includes("youtube")
      ) return "youtube";
    }

    if (
      html.includes("youtube.com/embed") ||
      html.includes("ytimg.com") ||
      text.includes("watch on youtube") ||
      document.querySelector("lite-youtube") !== null ||
      document.querySelector("[id*='youtube']") !== null
    ) return "youtube";

    if (url.includes(".mp4") || html.includes(".mp4")) return "video";
    if (url.includes(".webm") || html.includes(".webm")) return "video";

    if (
      document.querySelector("iframe[src*='h5p']") !== null ||
      html.includes("/h5p/") ||
      (document.querySelectorAll("input[type='text']").length > 0 &&
        !html.includes("questionset") && !html.includes("self-assess"))
    ) return "h5p";

    if (
      text.includes("best score") || html.includes("questionset") ||
      html.includes("self-assess") || html.includes("selfassess") ||
      url.includes("assessment") || url.includes("quiz")
    ) return "assessment";

    if (
      !!text.match(/page\s+\d+\s+of\s+\d+/) ||
      (!!text.match(/\d+\s*\/\s*\d+/) &&
        (html.includes("pdf") || text.includes("page"))) ||
      document.querySelector("pdf-viewer") !== null ||
      html.includes("pdfviewer") || html.includes("pdf-viewer") ||
      html.includes("pdf.js") || url.includes(".pdf") ||
      url.includes("epub") || html.includes("epub-container")
    ) return "pdf";

    if (allIframes.length > 0) return "html";

    const hasButtons = document.querySelectorAll("button").length > 0;
    const hasHeading  = document.querySelectorAll("h1, h2, h3").length > 0;
    if (hasButtons && hasHeading) return "html";

    return "unknown";
  }) as string;
}

// ─── VIDEO CONSUMER ──────────────────────────────────────────────────────────

async function consumeVideoContent() {
  console.log("  🎬 Consuming HTML5 video...");
  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(1000);

  const ok = await browser.execute(() => {
    const videos = Array.from(document.querySelectorAll("video"));
    if (!videos.length) return false;
    for (const v of videos) {
      try {
        v.muted = true;
        v.playbackRate = 16;
        if (Number.isFinite(v.duration) && v.duration > 3)
          v.currentTime = Math.max(0, v.duration - 1);
        void v.play();
      } catch {}
    }
    return true;
  });

  if (ok) {
    await browser.pause(3000);
    await browser.waitUntil(
      async () =>
        await browser.execute(() => {
          const vids = Array.from(document.querySelectorAll("video"));
          return vids.every((v) => v.ended || v.currentTime >= v.duration - 2);
        }),
      { timeout: 10000, interval: 500 }
    ).catch(() => {});
  }
  await browser.pause(2000);
}

// ─── YOUTUBE CONSUMER ────────────────────────────────────────────────────────

async function consumeYouTubeContent() {
  console.log("  📺 Consuming YouTube video...");
  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(2000);

  // Scroll YouTube embed into viewport
  await browser.execute(() => {
    const host =
      document.querySelector("iframe#youtubeIframe") ||
      document.querySelector("lite-youtube") ||
      document.querySelector("iframe[src*='youtube']") ||
      document.querySelector("[class*='youtube']") ||
      Array.from(document.querySelectorAll("*")).find((el) => {
        const text = (el.textContent || "").toLowerCase();
        const rect = (el as HTMLElement).getBoundingClientRect();
        return text.includes("watch on youtube") && rect.width > 100 && rect.height > 100;
      });
    if (host) (host as HTMLElement).scrollIntoView({ block: "center" });
  });
  await browser.pause(1500);

  const screenSize = await browser.getWindowSize();

  // Get bounds of the YouTube element
  const ytBounds = await browser.execute(() => {
    const host =
      document.querySelector("iframe#youtubeIframe") ||
      document.querySelector("lite-youtube") ||
      document.querySelector("[class*='youtube']") ||
      Array.from(document.querySelectorAll("*")).find((el) => {
        const text = (el.textContent || "").toLowerCase();
        const rect = (el as HTMLElement).getBoundingClientRect();
        return text.includes("watch on youtube") && rect.width > 100 && rect.height > 100;
      });

    if (!host) return null;
    const rect = (host as HTMLElement).getBoundingClientRect();
    return {
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height * 0.42),
    };
  });

  const tapX = ytBounds?.x ?? Math.round(screenSize.width / 2);
  const tapY = ytBounds?.y ?? Math.round(screenSize.height / 2);

  // Click to activate embed
  await browser.action("pointer")
    .move({ x: tapX, y: tapY, origin: "viewport" })
    .down().pause(150).up()
    .perform();
  await browser.pause(3000);
  console.log(`  📺 Clicked embed at ${tapX},${tapY}`);

  // ── Switch into iframe and click play button ───────────────────────────────
  let switchedToFrame = false;
  try {
    // Try id=youtubeIframe first (confirmed from inspect)
    let ytIframe;
    try {
      ytIframe = await $("iframe#youtubeIframe");
      if (!(await ytIframe.isExisting())) throw new Error("not found");
    } catch {
      ytIframe = await $("iframe[src*='youtube'], iframe[src*='youtu']");
    }

    if (await ytIframe.isExisting()) {
      await browser.switchToFrame(ytIframe);
      switchedToFrame = true;
      console.log("  📺 ✅ Switched into YouTube iframe");
    }
  } catch (e) {
    console.warn(`  📺 Frame switch failed: ${e.message}`);
  }

  if (switchedToFrame) {
    // Click play button inside iframe
    let playClicked = false;
    for (const selector of [
      "//button[@aria-label='Play']",
      "//button[@aria-label='Play (k)']",
      "//button[contains(@aria-label,'Play')]",
      ".ytp-large-play-button",
      ".ytp-play-button",
    ]) {
      if (playClicked) break;
      try {
        const btn = await $(selector);
        if (await btn.isDisplayed()) {
          await btn.click();
          playClicked = true;
          console.log(`  📺 ✅ Clicked play inside iframe: ${selector}`);
          await browser.pause(2000);
        }
      } catch {}
    }

    if (!playClicked) {
      // Tap center of iframe body as fallback
      try {
        const body = await $("body");
        await body.click();
        console.log("  📺 Tapped iframe body");
        await browser.pause(2000);
      } catch {}
    }

    // Switch back to main content
    await browser.switchToFrame(null);
    console.log("  📺 ✅ Switched back to main content");
  } else {
    // postMessage fallback
    await browser.execute(() => {
      for (const iframe of Array.from(document.querySelectorAll("iframe"))) {
        try {
          iframe.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*"
          );
          iframe.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "seekTo", args: [99999, true] }), "*"
          );
        } catch {}
      }
    });
    await browser.pause(2000);
  }

  // Poll every 3s for completion (up to 3 minutes)
  console.log("  📺 Polling for completion...");
  const deadline = Date.now() + 3 * 60 * 1000;

  while (Date.now() < deadline) {
    await browser.pause(3000);

    const completed = await browser.execute(() => {
      return (
        (document.body?.innerText || "").toLowerCase().includes("completed") ||
        document.querySelector("[class*='completed']") !== null
      );
    });

    if (completed) {
      console.log("  📺 ✅ Content completed!");
      break;
    }

    await browser.execute(() => {
      for (const iframe of Array.from(document.querySelectorAll("iframe"))) {
        try {
          iframe.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "seekTo", args: [99999, true] }), "*"
          );
        } catch {}
      }
    });

    console.log(`  📺 Waiting... ${Math.round((deadline - Date.now()) / 1000)}s left`);
  }

  await returnToCoursePageUrl();
  await browser.pause(2000);
  await browser.url(coursePageUrl);
  await browser.pause(3000);

  const progressAfter = await getCourseProgressPercentage();
  console.log(`  📺 Progress after YouTube: ${progressAfter}%`);
}

// ─── PDF PAGE INFO ────────────────────────────────────────────────────────────

async function getPdfPageInfo(): Promise<{ current: number; total: number }> {
  return await browser.execute(() => {
    const text = document.body?.innerText || "";
    const pageOfMatch = text.match(/[Pp]age\s+(\d+)\s+of\s+(\d+)/);
    if (pageOfMatch) {
      return { current: parseInt(pageOfMatch[1]), total: parseInt(pageOfMatch[2]) };
    }
    for (const input of Array.from(document.querySelectorAll("input"))) {
      const val = parseInt(input.value);
      if (!isNaN(val) && val > 0) {
        const parent = input.parentElement;
        if (parent) {
          const slashMatch = (parent.textContent || "").match(/\/\s*(\d+)/);
          if (slashMatch) return { current: val, total: parseInt(slashMatch[1]) };
        }
      }
    }
    const slashMatch = text.match(/(\d+)\s*\/\s*(\d+)/);
    if (slashMatch) {
      return { current: parseInt(slashMatch[1]), total: parseInt(slashMatch[2]) };
    }
    return { current: 1, total: 1 };
  });
}

// ─── FIND & CLICK NEXT PDF BUTTON ────────────────────────────────────────────

async function findAndClickNextPdfButton(): Promise<boolean> {
  const jsResult = await browser.execute(() => {
    const allBtns = Array.from(
      document.querySelectorAll("button, a, [role='button']")
    ) as HTMLElement[];

    const visibleBtns = allBtns.filter((btn) => {
      const style = window.getComputedStyle(btn);
      const rect = btn.getBoundingClientRect();
      return (
        style.display !== "none" && style.visibility !== "hidden" &&
        style.opacity !== "0" && rect.width > 0 && rect.height > 0 &&
        rect.top >= 0 && rect.bottom <= window.innerHeight + 100
      );
    });

    for (const btn of visibleBtns) {
      const text = (btn.textContent || "").replace(/\s+/g, "").trim();
      const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();
      const cls = (btn.className || "").toLowerCase();
      const title = (btn.getAttribute("title") || "").toLowerCase();

      const isNext =
        text === ">" || text === "›" || text === "→" || text === "▶" ||
        ariaLabel.includes("next") || ariaLabel.includes("forward") ||
        title.includes("next") || title.includes("forward") ||
        cls.includes("next") || cls.includes("forward") ||
        cls.includes("right-arrow") || cls.includes("arrow-right") ||
        cls.includes("chevron-right");

      if (isNext) { btn.click(); return { clicked: true, method: `match: ${text || ariaLabel}` }; }
    }

    for (const btn of visibleBtns) {
      const style = window.getComputedStyle(btn);
      const bg = style.backgroundColor;
      const m = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (m) {
        const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
        if (b > 100 && b > r + 40 && b > g + 10) {
          const btnText = (btn.textContent || "").replace(/\s+/g, "").trim();
          if (btnText !== "<" && btnText !== "‹" && btnText !== "←" && btnText !== "◀") {
            btn.click();
            return { clicked: true, method: `blue-btn: ${bg}` };
          }
        }
      }
    }

    const pageInfoEl = Array.from(document.querySelectorAll("*")).find((el) => {
      const text = (el.textContent || "").trim();
      return (
        !!text.match(/[Pp]age\s+\d+\s+of\s+\d+/) || !!text.match(/\d+\s*\/\s*\d+/)
      ) && el.children.length <= 5;
    });

    if (pageInfoEl) {
      const parent = pageInfoEl.parentElement;
      if (parent) {
        const nearbyBtns = Array.from(
          parent.querySelectorAll("button, a, [role='button']")
        ) as HTMLElement[];
        if (nearbyBtns.length > 0) {
          nearbyBtns.sort(
            (a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right
          );
          const rightmost = nearbyBtns[0];
          const text = (rightmost.textContent || "").replace(/\s+/g, "").trim();
          if (text !== "<" && text !== "‹" && text !== "←") {
            rightmost.click();
            return { clicked: true, method: `rightmost: ${text}` };
          }
          if (nearbyBtns.length >= 2) {
            nearbyBtns[1].click();
            return { clicked: true, method: "second-rightmost" };
          }
        }
      }
    }

    return { clicked: false, method: "not found" };
  });

  if (jsResult.clicked) {
    console.log(`  📄 Next clicked (JS): ${jsResult.method}`);
    return true;
  }

  const xpathSelectors = [
    "//button[normalize-space()='>']",
    "//button[normalize-space()='›']",
    "//button[@aria-label='Next page']",
    "//button[@aria-label='Next']",
    "//button[contains(@aria-label,'next') or contains(@aria-label,'Next')]",
    "//*[contains(@class,'next') and (self::button or self::a)]",
    "//*[contains(@class,'arrow-right') and (self::button or self::a)]",
  ];

  for (const selector of xpathSelectors) {
    try {
      const btns = await $$(selector);
      for (const btn of btns) {
        if (await btn.isDisplayed()) {
          try {
            const loc = await btn.getLocation();
            const size = await btn.getSize();
            await browser.action("pointer", { parameters: { pointerType: "touch" } })
              .move({ x: Math.round(loc.x + size.width / 2), y: Math.round(loc.y + size.height / 2) })
              .down().pause(80).up().perform();
          } catch { await btn.click(); }
          console.log(`  📄 Next clicked (WebDriver): ${selector}`);
          return true;
        }
      }
    } catch {}
  }

  try {
    const coords = await browser.execute(() => {
      const pageInfoEl = Array.from(document.querySelectorAll("*")).find((el) => {
        const text = (el.textContent || "").trim();
        const rect = (el as HTMLElement).getBoundingClientRect();
        return (
          (!!text.match(/[Pp]age\s+\d+\s+of\s+\d+/) || !!text.match(/\d+\s*\/\s*\d+/)) &&
          rect.width > 0 && rect.top >= 0 &&
          rect.bottom <= window.innerHeight + 100 &&
          (el as Element).children.length <= 6
        );
      });
      if (pageInfoEl) {
        const rect = (pageInfoEl as HTMLElement).getBoundingClientRect();
        return { x: Math.round(rect.right + 30), y: Math.round(rect.top + rect.height / 2) };
      }
      return null;
    });

    if (coords) {
      await browser.action("pointer", { parameters: { pointerType: "touch" } })
        .move({ x: coords.x, y: coords.y })
        .down().pause(80).up().perform();
      await browser.pause(500);
      console.log(`  📄 Next clicked (coord): ${coords.x},${coords.y}`);
      return true;
    }
  } catch {}

  console.log("  📄 ❌ Next button not found");
  return false;
}

// ─── PDF CONSUMER (also used for EPUB) ───────────────────────────────────────

async function consumePdfContent() {
  console.log("  📄 Consuming PDF/EPUB...");

  const currentUrl = await browser.getUrl();
  await browser.url(currentUrl);
  await browser.pause(3000);

  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(500);

  const pageInfo = await getPdfPageInfo();
  console.log(`  📄 Pages: ${pageInfo.current} of ${pageInfo.total}`);
  const totalPages = pageInfo.total || 1;

  for (let page = 1; page <= totalPages; page++) {
    console.log(`  📄 Viewing page ${page} of ${totalPages}`);
    await browser.execute(() => window.scrollTo(0, 0));
    await browser.pause(800);

    let navVisible = false;
    for (let step = 0; step < 25; step++) {
      navVisible = await browser.execute(() => {
        const navEl = Array.from(document.querySelectorAll("*")).find((el) => {
          const text = (el.textContent || "").trim();
          const rect = (el as HTMLElement).getBoundingClientRect();
          return (
            (!!text.match(/[Pp]age\s+\d+\s+of\s+\d+/) || !!text.match(/\d+\s*\/\s*\d+/)) &&
            rect.width > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight
          );
        });
        return !!navEl;
      });

      if (navVisible) break;
      await browser.execute(() => window.scrollBy(0, 120));
      await browser.pause(250);
    }

    if (!navVisible) {
      await browser.execute(() => {
        const navEl = Array.from(document.querySelectorAll("*")).find((el) => {
          const text = (el.textContent || "").trim();
          return (
            !!text.match(/[Pp]age\s+\d+\s+of\s+\d+/) || !!text.match(/\d+\s*\/\s*\d+/)
          ) && (el as HTMLElement).getBoundingClientRect().width > 0;
        });
        if (navEl) (navEl as HTMLElement).scrollIntoView({ block: "center" });
      });
      await browser.pause(600);
    }

    if (page < totalPages) {
      const clicked = await findAndClickNextPdfButton();
      if (clicked) {
        await browser.pause(2000);
        const newInfo = await getPdfPageInfo();
        console.log(`  📄 → page ${newInfo.current} of ${newInfo.total}`);
        await browser.execute(() => window.scrollTo(0, 0));
        await browser.pause(500);
      }
    } else {
      await browser.pause(1500);
    }
  }

  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(500);
  console.log(`  📄 PDF/EPUB done — ${totalPages} page(s)`);
}

// ─── H5P CONSUMER ────────────────────────────────────────────────────────────

async function consumeH5PContent() {
  console.log("  🎮 Consuming H5P interactive content...");
  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(2000);

  const randomWords = [
    "apple", "blue", "forest", "river", "mountain",
    "cloud", "green", "stone", "water", "tree",
    "berry", "field", "arctic", "alpine", "edible",
  ];

  let wordIndex = 0;
  let totalFilled = 0;

  for (let pass = 0; pass < 10; pass++) {
    const filled = await browser.execute((words: string[], startIdx: number) => {
      const inputs = Array.from(document.querySelectorAll(
        "input[type='text'], input:not([type='hidden']):not([type='radio']):not([type='checkbox']):not([type='submit']):not([type='button']):not([type='password'])"
      )) as HTMLInputElement[];

      let count = 0;
      for (const input of inputs) {
        const style = window.getComputedStyle(input);
        const rect = input.getBoundingClientRect();
        if (
          style.display === "none" || style.visibility === "hidden" ||
          rect.width === 0 || rect.height === 0
        ) continue;
        if (input.value && input.value.trim().length > 0) continue;

        const word = words[(startIdx + count) % words.length];
        input.focus();
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, "value"
        )?.set;
        if (nativeSetter) { nativeSetter.call(input, word); }
        else { input.value = word; }
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
        input.blur();
        count++;
      }
      return count;
    }, randomWords, wordIndex);

    if (filled > 0) {
      totalFilled += filled;
      wordIndex += filled;
      console.log(`  🎮 Filled ${filled} input(s) on pass ${pass + 1} (total: ${totalFilled})`);
    }

    await browser.execute(() => window.scrollBy(0, 250));
    await browser.pause(600);

    const atBottom = await browser.execute(() => {
      return window.scrollY + window.innerHeight >= document.body.scrollHeight - 50;
    });
    if (atBottom && pass > 2) break;
  }

  console.log(`  🎮 Total inputs filled: ${totalFilled}`);
  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(500);

  // WebDriver fallback if JS fill didn't work
  if (totalFilled === 0) {
    console.log("  🎮 JS fill failed — trying WebDriver...");
    for (let scroll = 0; scroll < 15; scroll++) {
      try {
        const inputs = await $$("input[type='text'], input:not([type])");
        for (const input of inputs) {
          if (await input.isDisplayed()) {
            await input.scrollIntoView({ block: "center" });
            await input.click();
            await browser.pause(300);
            const word = randomWords[wordIndex++ % randomWords.length];
            await input.setValue(word);
            await browser.pause(300);
            totalFilled++;
          }
        }
      } catch {}
      await browser.execute(() => window.scrollBy(0, 250));
      await browser.pause(400);
      const atBottom = await browser.execute(() => {
        return window.scrollY + window.innerHeight >= document.body.scrollHeight - 50;
      });
      if (atBottom) break;
    }
  }

  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(500);

  // Try Check/Submit button
  let submitted = false;
  for (const selector of [
    "//button[normalize-space()='Check']",
    "//button[normalize-space()='Submit']",
    "//button[normalize-space()='Done']",
    "//button[normalize-space()='Finish']",
    "//button[contains(normalize-space(), 'Check')]",
    "//button[contains(normalize-space(), 'Submit')]",
  ]) {
    if (submitted) break;
    try {
      const btns = await $$(selector);
      for (const btn of btns) {
        if (await btn.isDisplayed()) {
          await btn.scrollIntoView({ block: "center" });
          await btn.click();
          await browser.pause(1000);
          submitted = true;
          console.log(`  🎮 Submitted: ${selector}`);
          break;
        }
      }
    } catch {}
  }

  await browser.pause(2000);
  console.log(`  🎮 H5P done — ${totalFilled} input(s), submitted: ${submitted}`);
}

// ─── HTML CONSUMER ───────────────────────────────────────────────────────────

async function consumeHtmlContent() {
  console.log("  🌐 Consuming HTML content...");
  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(1500);

  for (let i = 0; i < 5; i++) {
    await browser.execute(() => window.scrollBy(0, 400));
    await browser.pause(200);
  }
  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(300);

  const clicked = await browser.execute(() => {
    const buttons = Array.from(document.querySelectorAll(
      "button, input[type='button'], input[type='submit'], [role='button']"
    )) as HTMLElement[];

    let count = 0;
    for (const btn of buttons) {
      const style = window.getComputedStyle(btn);
      const rect = btn.getBoundingClientRect();
      const text = (btn.textContent || "").trim().toLowerCase();
      if (
        style.display === "none" || style.visibility === "hidden" ||
        rect.width === 0 || rect.height === 0
      ) continue;
      if (
        text.includes("go back") || text.includes("login") ||
        text.includes("logout") || text.includes("sign in")
      ) continue;
      (btn as HTMLElement).click();
      count++;
    }
    return count;
  });

  console.log(`  🌐 HTML done — ${clicked} button(s) clicked`);
  await browser.pause(1000);
}

// ─── ASSESSMENT CONSUMER ─────────────────────────────────────────────────────

async function consumeAssessmentContent() {
  console.log("  📝 Consuming assessment/quiz...");
  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(1500);

  const totalQuestions = await browser.execute(() => {
    const text = document.body?.innerText || "";
    const m = text.match(/(\d+)\s*\/\s*(\d+)/);
    return m ? parseInt(m[2]) : 10;
  });
  console.log(`  📝 Total questions: ${totalQuestions}`);

  for (let attempt = 0; attempt < totalQuestions + 10; attempt++) {
    await browser.execute(() => window.scrollTo(0, 0));
    await browser.pause(500);

    let answered = false;
    for (const selector of [
      "input[type='radio']", "input[type='checkbox']",
      "//*[@role='radio']", "//*[@role='checkbox']",
      "//*[contains(@class,'mcq-option')]",
    ]) {
      if (answered) break;
      try {
        const opts = await $$(selector);
        for (const opt of opts) {
          if (await opt.isDisplayed()) {
            await opt.scrollIntoView({ block: "center" });
            await opt.click();
            await browser.pause(400);
            answered = true;
            break;
          }
        }
      } catch {}
    }

    if (!answered) {
      answered = await browser.execute(() => {
        for (const cls of ["option", "choice", "mcq-option", "answer-option"]) {
          const els = Array.from(document.querySelectorAll(`[class*='${cls}']`))
            .filter((el) => {
              const s = window.getComputedStyle(el);
              return s.display !== "none" && s.visibility !== "hidden" &&
                !(el.className || "").toLowerCase().includes("disabled");
            });
          if (els.length > 0) { (els[0] as HTMLElement).click(); return true; }
        }
        return false;
      }) as boolean;
    }

    let advanced = false;
    for (const selector of [
      "//button[normalize-space()='Submit']", "//button[normalize-space()='Check']",
      "//button[normalize-space()='Next']", "//button[normalize-space()='Continue']",
      "//button[normalize-space()='Finish']",
      "//button[contains(normalize-space(), 'Submit')]",
      "//button[contains(normalize-space(), 'Check')]",
      "//button[contains(normalize-space(), 'Next')]",
    ]) {
      if (advanced) break;
      try {
        const btns = await $$(selector);
        for (const btn of btns) {
          if (await btn.isDisplayed()) {
            await btn.click();
            await browser.pause(1200);
            advanced = true;
            break;
          }
        }
      } catch {}
    }

    const isDone = await browser.execute(() => {
      const t = (document.body?.innerText || "").toLowerCase();
      return (
        t.includes("your score") || t.includes("assessment completed") ||
        t.includes("quiz completed") || t.includes("you scored") ||
        t.includes("well done") || t.includes("congratulations")
      );
    });
    if (isDone) { console.log("  📝 Assessment done!"); break; }
    if (!answered && !advanced) { console.log("  📝 No more options — exit"); break; }
  }
  await browser.pause(1500);
}

// ─── UNKNOWN CONSUMER ────────────────────────────────────────────────────────

async function consumeUnknownContent() {
  console.log("  ❓ Unknown — scrolling...");
  await browser.execute(() => window.scrollTo(0, 0));
  await browser.pause(1000);
  for (let i = 0; i < 8; i++) {
    await browser.execute(() => window.scrollBy(0, 400));
    await browser.pause(400);
  }
  await browser.pause(2000);
}

// ─── MARK AS COMPLETE ────────────────────────────────────────────────────────

async function tryMarkAsComplete() {
  try {
    await clickVisibleElement([
      "//button[normalize-space()='Mark as read']",
      "//button[normalize-space()='Mark as complete']",
      "//button[normalize-space()='Mark as completed']",
      "//button[contains(normalize-space(), 'Mark as read')]",
      "//button[contains(normalize-space(), 'Mark as complete')]",
    ], 3000);
    await browser.pause(1500);
    console.log("  ✅ Marked as complete");
  } catch {}
}

// ─── CLICK CONTENT ITEM ──────────────────────────────────────────────────────

async function clickContentItem(title: string): Promise<boolean> {
  try {
    await browser.execute(() => window.scrollTo(0, 0));
    await browser.pause(300);

    for (let scroll = 0; scroll < 20; scroll++) {
      const found = await browser.execute((title: string) => {
        const lower = title.toLowerCase();
        const relatedEl = Array.from(document.querySelectorAll("*")).find((el) => {
          const own = Array.from(el.childNodes)
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => (n.textContent || "").trim()).join(" ").trim();
          return own.toLowerCase() === "related content";
        });
        for (const el of Array.from(document.querySelectorAll("*"))) {
          if (relatedEl) {
            const pos = relatedEl.compareDocumentPosition(el);
            if (pos & Node.DOCUMENT_POSITION_FOLLOWING) continue;
          }
          const own = Array.from(el.childNodes)
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => (n.textContent || "").replace(/\s+/g, " ").trim())
            .join(" ").trim();
          if (own.toLowerCase() === lower) {
            (el as HTMLElement).scrollIntoView({ block: "center" });
            return true;
          }
        }
        return false;
      }, title);

      if (found) break;

      const pastRelated = await browser.execute(() => {
        const rel = Array.from(document.querySelectorAll("*")).find((el) => {
          const own = Array.from(el.childNodes)
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => (n.textContent || "").trim()).join(" ").trim();
          return own.toLowerCase() === "related content";
        });
        if (!rel) return false;
        return rel.getBoundingClientRect().top < window.innerHeight;
      });

      if (pastRelated) {
        console.warn(`  ⚠️ Reached Related Content — "${title}" not found`);
        return false;
      }

      await browser.execute(() => window.scrollBy(0, 300));
      await browser.pause(250);
    }

    await browser.pause(400);

    try {
      const el = await findVisibleElement([
        `//*[normalize-space()='${title}']`,
        `//*[contains(normalize-space(), '${title}')]`,
      ], 5000);

      const isSafe = await browser.execute((el: Element) => {
        let p = el.parentElement;
        while (p) {
          const own = Array.from(p.childNodes)
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => (n.textContent || "").trim()).join(" ").trim().toLowerCase();
          if (own === "related content") return false;
          p = p.parentElement;
        }
        return true;
      }, el);

      if (!isSafe) {
        console.warn(`  ⚠️ "${title}" is inside Related Content — skipping`);
        return false;
      }

      await el.click();
      console.log(`  ▶️ Clicked (WebDriver): "${title}"`);
    } catch {
      const clicked = await browser.execute((title: string) => {
        const lower = title.toLowerCase();
        const relatedEl = Array.from(document.querySelectorAll("*")).find((el) => {
          const own = Array.from(el.childNodes)
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => (n.textContent || "").trim()).join(" ").trim();
          return own.toLowerCase() === "related content";
        });
        for (const el of Array.from(document.querySelectorAll("*"))) {
          if (relatedEl) {
            const pos = relatedEl.compareDocumentPosition(el);
            if (pos & Node.DOCUMENT_POSITION_FOLLOWING) continue;
          }
          const own = Array.from(el.childNodes)
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => (n.textContent || "").replace(/\s+/g, " ").trim())
            .join(" ").trim();
          if (own.toLowerCase() === lower) { (el as HTMLElement).click(); return true; }
        }
        return false;
      }, title);

      if (clicked) {
        console.log(`  ▶️ Clicked (JS): "${title}"`);
      } else {
        console.warn(`  ⚠️ Could not click "${title}"`);
        return false;
      }
    }

    await browser.pause(2500);
    return true;
  } catch (e) {
    console.warn(`  ⚠️ Error clicking "${title}": ${e.message}`);
    return false;
  }
}

// ─── RESOLVE CONTENT TYPE ─────────────────────────────────────────────────────
// Combines the pre-open hint (from icon/title) with post-open detection
// The hint takes priority for video/youtube — avoids iframe detection failures

async function resolveContentType(hint: string): Promise<string> {
  // If hint already identified as video/youtube from title — trust it
  if (hint === "youtube" || hint === "video") {
    console.log(`  🎬 Using title hint: ${hint}`);
    return hint;
  }

  // Post-open detection
  const detected = await detectContentType();
  console.log(`  🎬 Post-open detected: ${detected} (hint: ${hint})`);

  // If detected as html — redirect to youtube
  // YouTube iframes load lazily and always appear as html before loading
  if (detected === "html") {
    console.log(`  🎬 "html" detected — redirecting to youtube consumer`);
    return "youtube";
  }

  // If detected is specific — trust it
  return detected;
}
// ```

// **That's the only change.** Now the flow is:
// ```
// detectContentType() = "html"  →  consumeYouTubeContent()
// detectContentType() = "video" →  consumeVideoContent()
// detectContentType() = "pdf"   →  consumePdfContent()
// detectContentType() = "h5p"   →  consumeH5PContent()
// etc.

// ─── MAIN CONSUMPTION LOOP ───────────────────────────────────────────────────

async function consumeAllCourseContent(totalLessons: number) {
  const consumed = new Set<string>();
  let completedCount = 0;
  const maxCycles = totalLessons * 4 + 15;

  for (let cycle = 0; cycle < maxCycles; cycle++) {
    await returnToCoursePageUrl();

    const progress = await getCourseProgressPercentage();
    console.log(
      `\n🔄 Cycle ${cycle + 1} — Progress: ${progress}% — Done: ${completedCount}/${totalLessons}`
    );
    if (progress >= 100) { console.log("🎉 100%!"); return; }

    await expandAllCourseUnits();

    // Items now include contentTypeHint from icon + title analysis
    const allItems = await collectCourseUnitContentItems();
    console.log(`  📋 ${allItems.length} items found:`);
    allItems.forEach((i) =>
      console.log(`    - "${i.title}" [${i.status}] hint:${i.contentTypeHint}`)
    );

    const nextItem = 
    allItems.find((i) => !i.isCompleted && !consumed.has(normalizeText(i.title)));

    if (!nextItem) {
      const allDone = allItems.length > 0 && allItems.every((i) => i.isCompleted);
      if (allDone) { console.log("✅ All items completed!"); break; }
      if (cycle > totalLessons + 5) { console.log("  ⚠️ Exhausted cycles"); break; }
      console.log("  ⬇️ No new items — retrying...");
      await browser.execute(() => window.scrollBy(0, 400));
      await browser.pause(1000);
      continue;
    }

    console.log(
      `\n  ▶️ Processing: "${nextItem.title}" [${nextItem.status}] hint:${nextItem.contentTypeHint}`
    );
    consumed.add(normalizeText(nextItem.title));

    const clicked = await clickContentItem(nextItem.title);
    if (!clicked) { console.warn(`  ⚠️ Skipping "${nextItem.title}"`); continue; }

    await browser.execute(() => window.scrollTo(0, 0));
    await browser.pause(1000);
    console.log("  ⬆️ Scrolled to top");

    // Resolve content type — hint takes priority for video/youtube
    const contentType = await resolveContentType(nextItem.contentTypeHint);
    console.log(`  🎬 Final content type: ${contentType}`);

    switch (contentType) {
      case "video":      await consumeVideoContent();      break;
      case "youtube":    await consumeYouTubeContent();    break;
      case "pdf":        await consumePdfContent();        break;
      case "epub":       await consumePdfContent();        break;
      case "assessment": await consumeAssessmentContent(); break;
      case "h5p":        await consumeH5PContent();        break;
      case "html":       await consumeHtmlContent();       break;
      default:           await consumeUnknownContent();    break;
    }

    await tryMarkAsComplete();

    // YouTube: already returned to course page internally
    if (contentType === "youtube") {
      await browser.pause(1000);
      await returnToCoursePageUrl();
      await browser.pause(1000);

      const progressNow = await getCourseProgressPercentage();
      if (progressNow >= 100) { console.log("  🎉 100%!"); return; }

      const ticked = await waitForItemCompleted(nextItem.title, 5000);
      if (ticked || progressNow > progress) {
        completedCount++;
        console.log(`  ✅ "${nextItem.title}" ✓ (${completedCount}/${totalLessons})`);
      } else {
        completedCount++;
        console.log(`  ⏭️ "${nextItem.title}" — counting as done (${completedCount}/${totalLessons})`);
      }
      continue;
    }

    // All other types — normal tick check
    await returnToCoursePageUrl();
    await browser.pause(1500);
    await browser.execute(() => window.scrollTo(0, 0));
    await browser.pause(300);

    const progressBeforeTick = await getCourseProgressPercentage();
    const ticked = await waitForItemCompleted(nextItem.title, 8000);

    if (ticked) {
      completedCount++;
      console.log(`  ✅ "${nextItem.title}" ✓ (${completedCount}/${totalLessons})`);
    } else {
      const progressAfterTick = await getCourseProgressPercentage();
      if (progressAfterTick > progressBeforeTick) {
        completedCount++;
        console.log(
          `  ✅ "${nextItem.title}" — ${progressBeforeTick}%→${progressAfterTick}% (${completedCount}/${totalLessons})`
        );
      } else {
        console.log(`  ⏭️ "${nextItem.title}" — tick not visible`);
      }
    }
  }
}

// ─── TEST ─────────────────────────────────────────────────────────────────────

describe("Multi-Type Course Consumption", () => {
  it("should handle enrollment and consume all content to reach 100%", async function () {
    this.timeout(480000);

    const baseUrl    = process.env.SUNBIRD_URL      || "https://test.sunbirded.org";
    const username   = process.env.SUNBIRD_USERNAME  || "user1@yopmail.com";
    const password   = process.env.SUNBIRD_PASSWORD  || "User1@123";
    const courseName = process.env.COURSE_NAME      

    await loginToPortal(username, password, baseUrl);
    console.log("✅ Logged in");

    await searchAndOpenCourse(courseName);
    console.log(`✅ Opened: ${courseName}`);

    // ── Validate correct course opened with retry ─────────────────────────
    let courseOpenedCorrectly = false;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const validation = await browser.execute((courseName: string) => {
        const bodyText = document.body?.innerText || "";
        const titleMatch = bodyText.toLowerCase().includes(courseName.toLowerCase());
        const url = window.location.href.toLowerCase();
        const isCoursePage =
          url.includes("/course") ||
          url.includes("/collection") ||
          url.includes("/learn");
        return { titleMatch, isCoursePage, url };
      }, courseName);

      if (validation.isCoursePage && validation.titleMatch) {
        console.log(`✅ Validated: correct course opened`);
        courseOpenedCorrectly = true;
        break;
      }

      console.warn(
        `⚠️ Attempt ${attempt} — isCoursePage:${validation.isCoursePage} titleMatch:${validation.titleMatch}`
      );

      if (attempt < maxRetries) {
        await browser.pause(2000);
        await browser.url(baseUrl);
        await browser.pause(2000);
        await searchAndOpenCourse(courseName);
      }
    }

    if (!courseOpenedCorrectly) {
      throw new Error(`❌ Could not open "${courseName}" after ${maxRetries} attempts`);
    }

    await saveCoursePageUrl();

    const enrollmentStatus = await checkEnrollmentStatus();

    if (enrollmentStatus === "no-batches") {
      console.log("⛔ No batches — skipping gracefully."); return;
    }

    if (enrollmentStatus === "not-enrolled") {
      console.log("🔐 Enrolling...");
      const enrolled = await enrollIntoCourse();
      if (!enrolled) throw new Error("Failed to enroll");

      const t = (await browser.execute(
        () => (document.body?.innerText || "").toLowerCase()
      )) as string;
      const ok =
        t.includes("start learning") || t.includes("continue learning") ||
        t.includes("course progress") || t.includes("resume") ||
        (!t.includes("select a batch to start learning") && !t.includes("available batches"));
      if (!ok) throw new Error("Enrollment not verified");
      console.log("✅ Enrolled!");
      await saveCoursePageUrl();
      await browser.pause(1000);
    }

    const { lessons: totalLessons } = await getCourseOverviewTotals();
    console.log(`✅ Total lessons: ${totalLessons}`);

    try {
      await clickVisibleElement([
        "button=Start Learning", "button=Continue Learning", "button=Resume",
        "//*[self::button or self::a][contains(normalize-space(), 'Start Learning')]",
        "//*[self::button or self::a][contains(normalize-space(), 'Continue Learning')]",
        "//*[self::button or self::a][contains(normalize-space(), 'Resume')]",
      ], 5000);
      await browser.pause(2000);
      console.log("✅ Started/Resumed");
    } catch {
      console.log("ℹ️ Already on course page");
    }

    await saveCoursePageUrl();
    await consumeAllCourseContent(totalLessons || 10);

    console.log("\n⏳ Waiting for 100%...");
    await returnToCoursePageUrl();

    await browser.waitUntil(
      async () => {
        await returnToCoursePageUrl();
        const p = await getCourseProgressPercentage();
        console.log(`  Progress: ${p}%`);
        return p >= 100;
      },
      { timeout: 60000, interval: 3000, timeoutMsg: "Did not reach 100%" }
    );

    const final = await getCourseProgressPercentage();
    console.log(`\n🎉 Final: ${final}%`);
    expect(final >= 100).toBe(true);
  });
});