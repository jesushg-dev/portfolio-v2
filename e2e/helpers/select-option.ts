import type { Page } from "@playwright/test";

/** Open a Select by trigger id and pick an option via its stable `data-option-id`. */
export async function clickSelectOption(
  page: Page,
  triggerId: string,
  optionId: string,
): Promise<void> {
  const trigger = page.locator(`#${triggerId}`);
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  await page
    .locator('[data-slot="select-content"]')
    .waitFor({ state: "visible", timeout: 10_000 });
  await page
    .locator(`[data-option-id="${optionId}"]`)
    .click({ timeout: 10_000 });
}
