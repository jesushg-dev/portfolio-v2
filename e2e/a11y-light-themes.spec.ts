import { expect, test } from "@playwright/test";

import { runAxeAudit, summarizeAxeViolations } from "./helpers/a11y-audit";

const LIGHT_THEMES = ["main-light", "orange-light", "christmas-light"] as const;
const WHITE_SURFACES = [
  "#top",
  "#main-content",
  ".home-tech-marquee",
  ".home-section",
  ".site-footer",
] as const;

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

      const surfaceStyles = await page.evaluate(
        (selectors) =>
          selectors.map((selector) => {
            const element = document.querySelector(selector);
            if (!element) return { selector, color: null, image: null };
            const style = getComputedStyle(element);
            return {
              selector,
              color: style.backgroundColor,
              image: style.backgroundImage,
            };
          }),
        WHITE_SURFACES,
      );
      expect(surfaceStyles).toEqual(
        WHITE_SURFACES.map((selector) => ({
          selector,
          color: "rgb(255, 255, 255)",
          image: "none",
        })),
      );
      await expect(page.locator(".home-hero-backdrop").first()).toBeHidden();

      const { violations } = await runAxeAudit(page);
      expect(summarizeAxeViolations(violations)).toEqual([]);
    });
  }
});
