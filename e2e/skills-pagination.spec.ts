import { test } from "./authenticated-test";
import { ensurePortfolioSkills } from "./helpers/ensure-portfolio-skills";
import { goToSkillsList } from "./helpers/fill-skill-form";
import {
  assertPaginationBehavior,
  fetchAdminTotalCount,
} from "./helpers/pagination";
import { assertFilterAndColumnVisibility } from "./helpers/table-filters";

test.setTimeout(180_000);

test.describe("skills pagination", () => {
  test("should navigate through pagination and respect rows per page settings", async ({
    page,
  }) => {
    await ensurePortfolioSkills(page);
    const totalCount = await fetchAdminTotalCount(page, "skillsAdmin.getMine");
    test.skip(totalCount === 0, "No skills seeded yet — skipping pagination");

    await page.goto("/admin");
    await goToSkillsList(page);

    const rows = page.locator("table tbody tr");
    await assertPaginationBehavior({ page, rows, totalCount });
  });

  test("should filter items and toggle column visibility", async ({ page }) => {
    await ensurePortfolioSkills(page);
    const totalCount = await fetchAdminTotalCount(page, "skillsAdmin.getMine");
    test.skip(totalCount === 0, "No skills seeded yet — skipping filters");

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
