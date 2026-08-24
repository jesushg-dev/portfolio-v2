import { test } from "./authenticated-test";
import { goToSoftSkillsList } from "./helpers/fill-soft-skills-form";
import {
  assertPaginationBehavior,
  fetchAdminTotalCount,
} from "./helpers/pagination";
import { assertFilterAndColumnVisibility } from "./helpers/table-filters";

test.setTimeout(60_000);

test.describe("soft skills pagination", () => {
  test("should navigate through pagination and respect rows per page settings", async ({
    page,
  }) => {
    const totalCount = await fetchAdminTotalCount(
      page,
      "softSkillsAdmin.getMine",
    );
    test.skip(
      totalCount === 0,
      "No soft skills seeded yet — skipping pagination",
    );

    await page.goto("/admin");
    await goToSoftSkillsList(page);

    const rows = page.locator("table tbody tr");
    await assertPaginationBehavior({ page, rows, totalCount });
  });

  test("should filter items and toggle column visibility", async ({ page }) => {
    const totalCount = await fetchAdminTotalCount(
      page,
      "softSkillsAdmin.getMine",
    );
    test.skip(totalCount === 0, "No soft skills seeded yet — skipping filters");

    await page.goto("/admin");
    await goToSoftSkillsList(page);

    await assertFilterAndColumnVisibility({
      page,
      rows: page.locator("table tbody tr"),
      filterTestId: "filter-title",
      toggleColumnTestId: "toggle-column-isVisible",
      searchCellIndex: 1,
      hiddenColumnCellIndex: 2,
      noResultsTerm: "NonExistentSoftSkillXYZ123",
    });
  });
});
