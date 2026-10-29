import { expect, type Locator, type Page } from "@playwright/test";

export interface FilterAndColumnVisibilityOptions {
  page: Page;
  rows: Locator;
  filterTestId: string;
  toggleColumnTestId: string;
  noResultsTerm?: string;
  searchDialog?: boolean;
}

export async function searchTable(page: Page, term: string): Promise<void> {
  await page.getByRole("button", { name: /^Search(?::|$)/ }).click();
  const dialog = page.getByRole("dialog", { name: "Search records" });
  await dialog.getByRole("searchbox", { name: "Search text" }).fill(term);
  await dialog.getByRole("button", { name: "Search", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(
    (url) => (url.searchParams.get("search") ?? "") === term.trim(),
  );
}

async function clearTableSearch(page: Page): Promise<void> {
  await page.getByRole("button", { name: /^Search:/ }).click();
  const dialog = page.getByRole("dialog", { name: "Search records" });
  await dialog.getByRole("button", { name: "Clear search" }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL((url) => !url.searchParams.has("search"));
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
    .poll(
      async () => {
        count = await rows.count();
        return predicate(count);
      },
      { timeout: 30_000 },
    )
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
    noResultsTerm = "NonExistentFilterXYZ123",
    searchDialog = false,
  } = options;

  const dataRows = rows.filter({
    has: page.locator("td:nth-child(3)"),
  });

  await expect(
    searchDialog
      ? page.getByRole("button", { name: "Search", exact: true })
      : page.getByTestId(filterTestId),
  ).toBeVisible();
  await expect(dataRows.first()).toBeVisible({ timeout: 30_000 });

  await expect
    .poll(async () => dataRows.first().locator("td").count(), {
      timeout: 30_000,
    })
    .toBeGreaterThan(2);

  const searchColumnId = filterTestId.replace(/^filter-/, "");
  const searchCell = dataRows
    .first()
    .locator(`[data-column-id="${searchColumnId}"]`);
  let existingTerm = "";
  await expect
    .poll(
      async () => {
        try {
          const cellText = (
            await searchCell.innerText({ timeout: 1_000 })
          ).trim();
          const firstLine = cellText.split("\n")[0]?.trim() ?? "";
          if (!firstLine || /^untitled$/i.test(firstLine)) return "";
          const term = pickSearchTerm(firstLine);
          if (!term) return "";
          existingTerm = term;
          return term;
        } catch {
          return "";
        }
      },
      { timeout: 30_000 },
    )
    .not.toBe("");
  expect(existingTerm.length).toBeGreaterThan(0);

  const initialCount = await dataRows.count();
  expect(initialCount).toBeGreaterThan(0);
  const filter = page.getByTestId(filterTestId);

  if (searchDialog) await searchTable(page, existingTerm);
  else await filter.fill(existingTerm);
  await expect(dataRows.first()).toContainText(
    new RegExp(escapeRegex(existingTerm), "i"),
    { timeout: 30_000 },
  );
  const filteredCount = await dataRows.count();
  expect(filteredCount).toBeGreaterThanOrEqual(1);
  expect(filteredCount).toBeLessThanOrEqual(initialCount);

  if (searchDialog) await clearTableSearch(page);
  else await page.getByTestId("reset-filters-btn").click();
  await waitForRowCount(dataRows, (count) => count >= 1);

  if (searchDialog) await searchTable(page, noResultsTerm);
  else await filter.fill(noResultsTerm);
  await expect(rows).toHaveCount(1);
  await expect(
    page.locator("td").filter({ hasText: /No results/i }),
  ).toBeVisible();

  if (searchDialog) await clearTableSearch(page);
  else {
    await page.getByTestId("reset-filters-btn").click();
    await filter.fill("");
  }
  await expect
    .poll(
      async () => {
        const noResults = page.locator("td").filter({ hasText: /No results/i });
        return (await noResults.isVisible()) ? "empty" : "rows";
      },
      { timeout: 30_000 },
    )
    .toBe("rows");
  const resetCount = await waitForRowCount(dataRows, (count) => count >= 1);
  expect(resetCount).toBeGreaterThan(0);

  const firstRowCells = dataRows.first().locator("td");
  const initialCellsCount = await firstRowCells.count();
  expect(initialCellsCount).toBeGreaterThan(2);

  const hiddenColumnId = toggleColumnTestId.replace(/^toggle-column-/, "");
  const hiddenCell = dataRows
    .first()
    .locator(`[data-column-id="${hiddenColumnId}"]`);
  const hiddenCellText = await hiddenCell.innerText();
  expect(hiddenCellText.trim().length).toBeGreaterThan(0);

  await page.getByTestId("toggle-columns-btn").click();
  await page.getByTestId(toggleColumnTestId).click();
  await page.keyboard.press("Escape");

  await expect(firstRowCells).toHaveCount(initialCellsCount - 1);
  await expect(hiddenCell).toHaveCount(0);

  await page.getByTestId("toggle-columns-btn").click();
  await page.getByTestId(toggleColumnTestId).click();
  await page.keyboard.press("Escape");

  await expect(firstRowCells).toHaveCount(initialCellsCount);
  await expect(hiddenCell).toHaveText(hiddenCellText, { useInnerText: true });
}
