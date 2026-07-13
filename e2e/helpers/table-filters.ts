import { expect, type Locator, type Page } from "@playwright/test";

export interface FilterAndColumnVisibilityOptions {
  page: Page;
  rows: Locator;
  filterTestId: string;
  toggleColumnTestId: string;
  /** Cell index in the first row used to read an existing search term. */
  searchCellIndex?: number;
  /** Cell index of the column being hidden (verifies content disappears/reappears). */
  hiddenColumnCellIndex?: number;
  noResultsTerm?: string;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Picks a stable substring from visible cell text for partial iLike/json search. */
export function pickSearchTerm(text: string): string {
  const firstLine = text.split("\n")[0]?.trim() ?? text.trim();
  const words = firstLine.split(/\s+/).filter((word) => word.length >= 3);

  if (words[0] && words[0].length >= 4) {
    return words[0];
  }

  const minLength = Math.min(8, firstLine.length);
  return firstLine.slice(0, Math.max(minLength, 3));
}

async function waitForRowCount(
  rows: Locator,
  predicate: (count: number) => boolean,
): Promise<number> {
  let count = 0;
  await expect
    .poll(async () => {
      count = await rows.count();
      return predicate(count);
    })
    .toBe(true);
  return count;
}

export async function assertFilterAndColumnVisibility(
  options: FilterAndColumnVisibilityOptions,
): Promise<void> {
  const {
    page,
    rows,
    filterTestId,
    toggleColumnTestId,
    searchCellIndex = 0,
    hiddenColumnCellIndex,
    noResultsTerm = "NonExistentFilterXYZ123",
  } = options;

  await expect(rows.first()).toBeVisible();
  const initialCount = await rows.count();
  expect(initialCount).toBeGreaterThan(0);

  const searchCell = rows.first().locator("td").nth(searchCellIndex);
  const cellText = (await searchCell.innerText()).trim();
  expect(cellText.length).toBeGreaterThan(0);

  const existingTerm = pickSearchTerm(cellText);
  const filter = page.getByTestId(filterTestId);

  await filter.fill(existingTerm);
  const filteredCount = await waitForRowCount(
    rows,
    (count) => count >= 1 && count <= initialCount,
  );
  expect(filteredCount).toBeGreaterThanOrEqual(1);
  expect(filteredCount).toBeLessThanOrEqual(initialCount);
  await expect(rows.first()).toContainText(
    new RegExp(escapeRegex(existingTerm), "i"),
  );

  await page.getByTestId("reset-filters-btn").click();
  await waitForRowCount(rows, (count) => count === initialCount);

  await filter.fill(noResultsTerm);
  await expect(rows).toHaveCount(1);
  await expect(
    page.locator("td").filter({ hasText: /No results/i }),
  ).toBeVisible();

  await page.getByTestId("reset-filters-btn").click();
  await expect(
    page.locator("td").filter({ hasText: /No results/i }),
  ).not.toBeVisible();
  await expect(rows).toHaveCount(initialCount);

  const firstRowCells = rows.first().locator("td");
  const initialCellsCount = await firstRowCells.count();
  expect(initialCellsCount).toBeGreaterThan(2);

  let hiddenColumnPattern: RegExp | undefined;
  if (hiddenColumnCellIndex !== undefined) {
    const hiddenCellText = (
      await rows.first().locator("td").nth(hiddenColumnCellIndex).innerText()
    ).trim();
    expect(hiddenCellText.length).toBeGreaterThan(0);
    hiddenColumnPattern = new RegExp(escapeRegex(hiddenCellText), "i");
  }

  const hiddenCell = () =>
    rows
      .first()
      .locator("td")
      .nth(hiddenColumnCellIndex ?? 0);

  await page.getByTestId("toggle-columns-btn").click();
  await page.getByTestId(toggleColumnTestId).click();
  await page.keyboard.press("Escape");

  await expect(firstRowCells).toHaveCount(initialCellsCount - 1);
  if (hiddenColumnPattern) {
    await expect(hiddenCell()).not.toHaveText(hiddenColumnPattern);
  }

  await page.getByTestId("toggle-columns-btn").click();
  await page.getByTestId(toggleColumnTestId).click();
  await page.keyboard.press("Escape");

  await expect(firstRowCells).toHaveCount(initialCellsCount);
  if (hiddenColumnPattern) {
    await expect(hiddenCell()).toHaveText(hiddenColumnPattern);
  }
}
