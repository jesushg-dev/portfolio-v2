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

      await page.locator("#about").scrollIntoViewIfNeeded();
      await expect(page.locator("#about")).toContainText(snapshot.aboutSnippet);
    }
  });

  test("skills backend tab shows stack technologies", async ({ page }) => {
    await page.goto("/");
    const skills = page.locator("#skills");
    await skills.scrollIntoViewIfNeeded();

    const backendTab = skills.getByRole("button", { name: /^Backend/i });
    await expect(backendTab).toBeVisible();

    // Tabs hydrate after ViewportSection mounts; retry the click until the
    // backend list actually replaces the default frontend skills.
    await expect(async () => {
      await backendTab.click();
      await expect(
        skills.getByRole("link", { name: "C#" }).first(),
      ).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 15_000 });

    await expect(
      skills.getByRole("link", { name: "Node.js" }).first(),
    ).toBeVisible();
  });
});
