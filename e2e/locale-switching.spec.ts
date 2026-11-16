import { expect, test } from "@playwright/test";

import { localeSnapshots } from "./fixtures/locale-snapshots";
import { switchPublicLocale } from "./helpers/switch-public-locale";

test.describe("public locale switching", () => {
  test("nav and about content change across en, es, and nl", async ({
    page,
  }) => {
    await page.goto("/");

    for (const locale of ["en", "es", "nl"] as const) {
      if (locale !== "en") {
        await switchPublicLocale(page, locale);
      }

      const snapshot = localeSnapshots[locale];
      await expect(
        page.getByRole("button", { name: snapshot.navAbout, exact: true }),
      ).toBeVisible();

      const services = page.locator("#main-content #services:visible");
      await expect(services).toHaveCount(1);
      await services.scrollIntoViewIfNeeded();
      await expect(services).toContainText(snapshot.servicesSnippet);
    }
  });

  test("technical stack lists backend skills and links to their details", async ({
    page,
  }) => {
    await page.goto("/");
    const skills = page.locator("#skills");
    await skills.scrollIntoViewIfNeeded();

    const backend = skills.locator("dl > div").filter({
      has: page.locator("dt").filter({ hasText: /^"backend"$/ }),
    });
    const csharp = backend.getByRole("link", { name: "C#", exact: true });
    const node = backend.getByRole("link", { name: "Node.js", exact: true });

    await expect(csharp).toBeVisible();
    await expect(node).toBeVisible();
    await expect(node).toHaveAttribute("href", "/skills/node-js");

    await csharp.press("Enter");
    await expect(page).toHaveURL(/\/skills\/c$/);
    await expect(
      page.getByRole("heading", { name: "C#", exact: true }),
    ).toBeVisible();
  });
});
