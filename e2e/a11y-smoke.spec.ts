import { expect, test } from "@playwright/test";

import {
  auditShieldHouseRules,
  formatA11yReport,
  runAxeAudit,
  summarizeAxeViolations,
} from "./helpers/a11y-audit";

const PUBLIC_ROUTES = [
  { path: "/", name: "home" },
  { path: "/login", name: "login" },
  { path: "/privacy", name: "privacy" },
  { path: "/certificates", name: "certificates" },
  { path: "/curriculum-vitae", name: "curriculum-vitae" },
] as const;

test.describe("accessibility — Shield (WCAG AAA)", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} (${route.path})`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      const axeResults = await runAxeAudit(page);
      const axeSummary = summarizeAxeViolations(axeResults.violations);
      const houseRuleIssues = await auditShieldHouseRules(page);

      const report = formatA11yReport({
        path: route.path,
        axeViolations: axeSummary,
        houseRuleIssues,
      });

      expect.soft(axeSummary, report).toEqual([]);
      expect.soft(houseRuleIssues, report).toEqual([]);
    });
  }
});
