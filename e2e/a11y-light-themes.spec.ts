import { expect, test } from "@playwright/test";

import { runAxeAudit, summarizeAxeViolations } from "./helpers/a11y-audit";

const LIGHT_THEMES = ["main-light", "orange-light", "christmas-light"] as const;

test.describe("light theme accessibility", () => {
  test.use({ colorScheme: "light", reducedMotion: "reduce" });

  for (const theme of LIGHT_THEMES) {
    test(`${theme} home`, async ({ page }) => {
      await page.addInitScript((selectedTheme) => {
        localStorage.setItem("theme", selectedTheme);
        localStorage.setItem("color-mode", "light");
      }, theme);

      await page.goto("/", { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

      const { violations } = await runAxeAudit(page);
      expect(summarizeAxeViolations(violations)).toEqual([]);
    });
  }
});
