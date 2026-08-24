import type { Page } from "@playwright/test";

/** Select an existing company or create one from the job application combobox. */
export async function selectOrCreateCompany(
  page: Page,
  companyName: string,
): Promise<void> {
  const combobox = page.locator("#companyId");
  await combobox.click();

  const search = page.locator('[data-slot="command-input"]');
  await search.waitFor({ state: "visible", timeout: 10_000 });

  const existing = page
    .locator("[data-slot='command-item']")
    .filter({ hasNotText: /create/i })
    .first();

  if (await existing.isVisible().catch(() => false)) {
    await existing.click();
    return;
  }

  await search.fill(companyName);
  await page.locator("[data-slot='command-item']").first().click();
}
