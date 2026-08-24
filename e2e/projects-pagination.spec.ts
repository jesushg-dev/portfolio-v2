import { test } from "./authenticated-test";
import { goToProjectsList } from "./helpers/fill-project-form";
import {
  assertPaginationBehavior,
  fetchAdminTotalCount,
} from "./helpers/pagination";
import { assertFilterAndColumnVisibility } from "./helpers/table-filters";

test.setTimeout(60_000);

test.describe("projects pagination", () => {
  test("should navigate through pagination and respect rows per page settings", async ({
    page,
  }) => {
    const totalCount = await fetchAdminTotalCount(
      page,
      "projectsAdmin.getMine",
    );
    test.skip(totalCount === 0, "No projects seeded yet — skipping pagination");

    await page.goto("/admin");
    await goToProjectsList(page);

    const rows = page.locator("table tbody tr");
    await assertPaginationBehavior({ page, rows, totalCount });
  });

  test("should filter items and toggle column visibility", async ({ page }) => {
    const totalCount = await fetchAdminTotalCount(
      page,
      "projectsAdmin.getMine",
    );
    test.skip(totalCount === 0, "No projects seeded yet — skipping filters");

    await page.goto("/admin");
    await goToProjectsList(page);

    await assertFilterAndColumnVisibility({
      page,
      rows: page.locator("table tbody tr"),
      filterTestId: "filter-title",
      toggleColumnTestId: "toggle-column-type",
      searchCellIndex: 0,
      hiddenColumnCellIndex: 1,
      noResultsTerm: "NonExistentProjectXYZ123",
    });
  });
});
