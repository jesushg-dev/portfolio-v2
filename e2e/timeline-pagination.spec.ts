import { test } from "./authenticated-test";
import { goToTimelineList } from "./helpers/fill-timeline-form";
import {
  assertPaginationBehavior,
  fetchAdminTotalCount,
} from "./helpers/pagination";
import { assertFilterAndColumnVisibility } from "./helpers/table-filters";

test.setTimeout(60_000);

test.describe("timeline pagination", () => {
  test("should navigate through pagination and respect rows per page settings", async ({
    page,
  }) => {
    const totalCount = await fetchAdminTotalCount(
      page,
      "timelineAdmin.getMine",
    );
    test.skip(
      totalCount === 0,
      "No timeline items seeded yet — skipping pagination",
    );

    await page.goto("/admin");
    await goToTimelineList(page);

    const rows = page.locator("table tbody tr");
    await assertPaginationBehavior({ page, rows, totalCount });
  });

  test("should filter items and toggle column visibility", async ({ page }) => {
    const totalCount = await fetchAdminTotalCount(
      page,
      "timelineAdmin.getMine",
    );
    test.skip(
      totalCount === 0,
      "No timeline items seeded yet — skipping filters",
    );

    await page.goto("/admin");
    await goToTimelineList(page);

    await assertFilterAndColumnVisibility({
      page,
      rows: page.locator("table tbody tr"),
      filterTestId: "filter-title",
      toggleColumnTestId: "toggle-column-category",
      searchCellIndex: 0,
      hiddenColumnCellIndex: 2,
      noResultsTerm: "NonExistentTimelineXYZ123",
    });
  });
});
