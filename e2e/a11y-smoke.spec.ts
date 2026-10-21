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
  { path: "/two-factor", name: "two-factor" },
  { path: "/privacy", name: "privacy" },
  { path: "/stats", name: "stats" },
  { path: "/certificates", name: "certificates" },
  { path: "/curriculum-vitae", name: "curriculum-vitae" },
  { path: "/process/how-i-use-ai", name: "process-how-i-use-ai" },
  { path: "/process/qa-collaboration", name: "process-qa-collaboration" },
  { path: "/theme-customizer", name: "theme-customizer" },
] as const;

test.describe("accessibility — Shield (WCAG AAA)", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} (${route.path})`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);

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

test.describe("legacy process page redirects", () => {
  const redirects = [
    { from: "/how-i-use-ai", to: "/process/how-i-use-ai" },
    { from: "/qa-collaboration", to: "/process/qa-collaboration" },
    { from: "/es/como-uso-ia", to: "/es/proceso/how-i-use-ai" },
    { from: "/es/colaboracion-qa", to: "/es/proceso/qa-collaboration" },
    { from: "/nl/hoe-ik-ai-gebruik", to: "/nl/proces/how-i-use-ai" },
    { from: "/nl/qa-samenwerking", to: "/nl/proces/qa-collaboration" },
  ] as const;

  for (const { from, to } of redirects) {
    test(`301 ${from} → ${to}`, async ({ request }) => {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status()).toBe(301);
      const location = response.headers().location ?? "";
      expect(new URL(location, "http://127.0.0.1:3000").pathname).toBe(to);
    });
  }
});
