import { test } from "@playwright/test";
import { goToCertificationsList } from "./helpers/fill-certification-form";
import {
  assertPaginationBehavior,
  fetchAdminTotalCount,
} from "./helpers/pagination";
import { assertFilterAndColumnVisibility } from "./helpers/table-filters";

test.setTimeout(60_000);

test.describe("certifications pagination", () => {
  test("should navigate through pagination and respect rows per page settings", async ({
    page,
  }) => {
    const totalCount = await fetchAdminTotalCount(
      page,
      "certificationsAdmin.getMine",
    );

    await page.goto("/admin");
    await goToCertificationsList(page);

    const rows = page.locator("table tbody tr");
    await assertPaginationBehavior({ page, rows, totalCount });
  });

  test("should filter items and toggle column visibility", async ({ page }) => {
    await page.goto("/admin");
    await goToCertificationsList(page);

    await assertFilterAndColumnVisibility({
      page,
      rows: page.locator("table tbody tr"),
      filterTestId: "filter-company",
      toggleColumnTestId: "toggle-column-company",
      searchCellIndex: 1,
      hiddenColumnCellIndex: 1,
      noResultsTerm: "NonExistentCompanyXYZ123",
    });
  });
});
