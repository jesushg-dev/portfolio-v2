import type { Locator, Page } from "@playwright/test";

import type { PortfolioSkillFixture } from "../fixtures/portfolio-skills";

export function toSkillSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function resetSkillPickerFilters(page: Page): Promise<void> {
  await page.locator("#skill-picker-search").waitFor({ state: "visible" });

  const allTypesButton = page
    .getByRole("button", {
      name: /all types|todos los tipos|alle types/i,
    })
    .first();

  if (await allTypesButton.isVisible()) {
    await allTypesButton.click();
  }

  await page.locator("#skill-picker-search").fill("");
}

/** Scroll the picker section and tile into view inside nested scroll containers. */
async function scrollSkillTileIntoView(
  page: Page,
  pickerButton: Locator,
): Promise<void> {
  await page.locator("#skill-picker").scrollIntoViewIfNeeded();
  await page.locator("#skill-picker-grid").scrollIntoViewIfNeeded();

  await pickerButton.evaluate((element) => {
    element.scrollIntoView({ block: "center", inline: "nearest" });
  });
}

async function clickSkillTile(
  page: Page,
  pickerButton: Locator,
): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await scrollSkillTileIntoView(page, pickerButton);

    try {
      await pickerButton.click({ timeout: 5_000 });
      return;
    } catch {
      if (attempt === 2) {
        throw new Error("Failed to click skill tile after scrolling into view");
      }
    }
  }
}

/** Wait until skill tiles are rendered in the picker grid. */
export async function waitForSkillPickerReady(page: Page): Promise<void> {
  await resetSkillPickerFilters(page);
  await page.locator("#skill-picker").scrollIntoViewIfNeeded();
  await page
    .locator("#skill-picker-grid [id^='skill-picker-']")
    .first()
    .waitFor({ state: "visible", timeout: 20_000 });
}

export async function selectSkillsInPicker(
  page: Page,
  skillKeys: string[],
  skillsByKey: Record<string, PortfolioSkillFixture>,
): Promise<void> {
  if (skillKeys.length === 0) return;

  await waitForSkillPickerReady(page);

  for (const skillKey of skillKeys) {
    const skill = skillsByKey[skillKey];
    if (!skill) {
      throw new Error(`Unknown skill key "${skillKey}"`);
    }

    await page.locator("#skill-picker-search").fill(skill.title);

    const pickerButton = page.locator(
      `#skill-picker-${toSkillSlug(skill.title)}`,
    );
    await pickerButton.waitFor({ state: "visible", timeout: 15_000 });
    await clickSkillTile(page, pickerButton);
    await page.locator("#skill-picker-search").fill("");
  }
}
