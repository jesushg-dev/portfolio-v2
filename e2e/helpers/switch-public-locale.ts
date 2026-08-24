import type { Page } from "@playwright/test";

import type { Locale } from "../../src/i18n/config";
import { localeNativeLabels } from "../fixtures/locale-snapshots";

export async function switchPublicLocale(
  page: Page,
  locale: Locale,
): Promise<void> {
  const selector = page.getByTestId("locale-selector");
  await selector.click();
  await page.getByRole("option", { name: localeNativeLabels[locale] }).click();

  if (locale === "en") {
    await page.waitForURL(
      (url) =>
        !url.pathname.startsWith("/es") && !url.pathname.startsWith("/nl"),
      { timeout: 15_000 },
    );
    return;
  }

  await page.waitForURL(new RegExp(`/${locale}(/|$)`), { timeout: 15_000 });
}
