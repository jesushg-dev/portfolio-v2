import { test } from "@playwright/test";
import { goToSkillsList } from "./helpers/fill-skill-form";
import {
  assertPaginationBehavior,
  fetchAdminTotalCount,
} from "./helpers/pagination";
import { assertFilterAndColumnVisibility } from "./helpers/table-filters";

test.setTimeout(60_000);

test.describe("skills pagination", () => {
  test("should navigate through pagination and respect rows per page settings", async ({
    page,
  }) => {
    const totalCount = await fetchAdminTotalCount(page, "skillsAdmin.getMine");

    await page.goto("/admin");
    await goToSkillsList(page);

    const rows = page.locator("table tbody tr");
    await assertPaginationBehavior({ page, rows, totalCount });
  });

  test("should filter items and toggle column visibility", async ({ page }) => {
    await page.goto("/admin");
    await goToSkillsList(page);

    await assertFilterAndColumnVisibility({
      page,
      rows: page.locator("table tbody tr"),
      filterTestId: "filter-title",
      toggleColumnTestId: "toggle-column-type",
      searchCellIndex: 1,
      hiddenColumnCellIndex: 2,
      noResultsTerm: "NonExistentSkillXYZ123",
    });
  });
});
