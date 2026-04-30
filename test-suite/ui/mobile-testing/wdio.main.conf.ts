import { config as baseConfig } from "./wdio.android.conf.ts";
import type { Options } from "@wdio/types";

// @ts-nocheck
import * as dotenv from "dotenv";
dotenv.config();

import { $, $$, browser, expect } from "@wdio/globals";

// Track results across all spec files
const suiteResults: {
  spec: string;
  passed: number;
  failed: number;
  tests: { name: string; passed: boolean; error?: string }[];
}[] = [];

export const config: WebdriverIO.Config = {
  ...baseConfig,

  // ── Run all 3 scripts sequentially ────────────────────────────────────────
  specs: [
    "./test/specs/education-certificate-download.e2e.ts",
    "./test/specs/course-sync-progress-menu.e2e.ts",
    "./test/specs/course-consumption-any-content.e2e.ts",
  ],

  // Never stop on failure — run all tests regardless
  bail: 0,

  // ── Reporters ─────────────────────────────────────────────────────────────
  reporters: ["spec"],

  // ── Mocha options ─────────────────────────────────────────────────────────
  mochaOpts: {
    ui: "bdd",
    timeout: 300000, // 5 minutes per test
  },

  // ── Hooks ─────────────────────────────────────────────────────────────────

  afterTest: function (test, context, { error, passed }) {
    // Track each test result as it runs
    const specName = test.file?.split(/[\\/]/).pop() || "unknown";

    let suite = suiteResults.find((s) => s.spec === specName);
    if (!suite) {
      suite = { spec: specName, passed: 0, failed: 0, tests: [] };
      suiteResults.push(suite);
    }

    if (passed) {
      suite.passed++;
    } else {
      suite.failed++;
    }

    suite.tests.push({
      name: test.fullName || test.title,
      passed,
      error: error?.message,
    });
  },

  // ── Final Summary ─────────────────────────────────────────────────────────
  onComplete: function (exitCode) {
    const divider  = "═".repeat(62);
    const thinLine = "─".repeat(62);

    console.log("\n");
    console.log(divider);
    console.log("         SUNBIRD E2E TEST SUITE — FINAL SUMMARY");
    console.log(divider);

    const scriptLabels: Record<string, string> = {
      "education-certificate-download.e2e.ts": " Certificate Download Tests",
      "course-sync-progress-menu.e2e.ts":      " Sync Progress Menu Tests",
      "course-consumption-any-content.e2e.ts": " Course Consumption Tests",
    };

    let totalPassed = 0;
    let totalFailed = 0;

    for (const suite of suiteResults) {
      const label = scriptLabels[suite.spec] || suite.spec;
      const suiteTotal = suite.passed + suite.failed;
      const status = suite.failed === 0 ? "✅ ALL PASSED" : `❌ ${suite.failed} FAILED`;

      console.log("\n" + thinLine);
      console.log(` ${label}`);
      console.log(thinLine);
      console.log(`  Status  : ${status}`);
      console.log(`  Passed  : ${suite.passed}/${suiteTotal}`);
      console.log(`  Failed  : ${suite.failed}/${suiteTotal}`);

      if (suite.tests.length > 0) {
        console.log("\n  Test Cases:");
        for (const test of suite.tests) {
          const icon = test.passed ? "  ✅" : "  ❌";
          console.log(`${icon}  ${test.name}`);
          if (!test.passed && test.error) {
            console.log(`       ↳ ${test.error}`);
          }
        }
      }

      totalPassed += suite.passed;
      totalFailed += suite.failed;
    }

    const grandTotal = totalPassed + totalFailed;
    const passRate   = grandTotal > 0 ? Math.round((totalPassed / grandTotal) * 100) : 0;

    console.log("\n" + divider);
    console.log("  GRAND TOTAL");
    console.log(divider);
    console.log(`  Total Tests : ${grandTotal}`);
    console.log(`  ✅ Passed   : ${totalPassed}`);
    console.log(`  ❌ Failed   : ${totalFailed}`);
    console.log(`  Pass Rate   : ${passRate}%`);
    console.log(divider);

    if (totalFailed === 0) {
      console.log("  🎉  ALL TEST CASES PASSED!");
    } else {
      console.log(`  ⚠️   ${totalFailed} TEST CASE(S) NEED ATTENTION`);
    }

    console.log(divider + "\n");
  },
};