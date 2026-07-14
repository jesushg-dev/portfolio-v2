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
        page.getByRole("link", { name: snapshot.navHome, exact: true }),
      ).toBeVisible();

      await page.locator("#about").scrollIntoViewIfNeeded();
      await expect(page.locator("#about")).toContainText(snapshot.aboutSnippet);
    }
  });

  test("skills backend tab shows stack technologies", async ({ page }) => {
    await page.goto("/");
    await page.locator("#skills").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Backend", exact: true }).click();
    await expect(page.getByText("C#", { exact: true })).toBeVisible();
    await expect(page.getByText("Node.js", { exact: true })).toBeVisible();
  });
});
