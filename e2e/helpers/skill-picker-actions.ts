import type { Locator, Page } from "@playwright/test";

import type { PortfolioSkillFixture } from "../fixtures/portfolio-skills";

export function toSkillSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function getSkillPickerRoot(page: Page): Promise<Locator> {
  const inItemModal = page.locator("#cv-item-modal #skill-picker");
  if (await inItemModal.isVisible()) {
    return inItemModal;
  }
  return page.locator("#skill-picker").first();
}

async function resetSkillPickerFilters(page: Page): Promise<void> {
  const picker = await getSkillPickerRoot(page);
  await picker.locator("#skill-picker-search").waitFor({ state: "visible" });

  const allTypesButton = picker
    .getByRole("button", {
      name: /all types|todos los tipos|alle types/i,
    })
    .first();

  if (await allTypesButton.isVisible()) {
    await allTypesButton.click();
  }

  await picker.locator("#skill-picker-search").fill("");
}

/** Scroll the picker section and tile into view inside nested scroll containers. */
async function scrollSkillTileIntoView(
  page: Page,
  picker: Locator,
  pickerButton: Locator,
): Promise<void> {
  await picker.scrollIntoViewIfNeeded();
  await picker.locator("#skill-picker-grid").scrollIntoViewIfNeeded();

  await pickerButton.evaluate((element) => {
    element.scrollIntoView({ block: "center", inline: "nearest" });
  });
}

async function clickSkillTile(
  page: Page,
  picker: Locator,
  pickerButton: Locator,
): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await scrollSkillTileIntoView(page, picker, pickerButton);

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

function skillTileByTitle(picker: Locator, title: string): Locator {
  return picker
    .locator("#skill-picker-grid button")
    .filter({ hasText: title })
    .first();
}

/** Wait until skill tiles are rendered in the picker grid. */
export async function waitForSkillPickerReady(page: Page): Promise<void> {
  await resetSkillPickerFilters(page);
  const picker = await getSkillPickerRoot(page);
  await picker.scrollIntoViewIfNeeded();
  await picker
    .locator("#skill-picker-grid [id^='skill-picker-']")
    .first()
    .waitFor({ state: "visible", timeout: 30_000 });
}

export async function selectSkillsInPicker(
  page: Page,
  skillKeys: string[],
  skillsByKey: Record<string, PortfolioSkillFixture>,
): Promise<void> {
  if (skillKeys.length === 0) return;

  await waitForSkillPickerReady(page);
  const picker = await getSkillPickerRoot(page);

  for (const skillKey of skillKeys) {
    const skill = skillsByKey[skillKey];
    if (!skill) {
      throw new Error(`Unknown skill key "${skillKey}"`);
    }

    await picker.locator("#skill-picker-search").fill(skill.title);

    const pickerButton = skillTileByTitle(picker, skill.title);
    await pickerButton.waitFor({ state: "visible", timeout: 15_000 });
    await clickSkillTile(page, picker, pickerButton);
    await picker.locator("#skill-picker-search").fill("");
  }
}
