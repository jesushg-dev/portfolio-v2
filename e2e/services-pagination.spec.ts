import type { Page } from "@playwright/test";
import { test } from "./authenticated-test";
import {
  assertPaginationBehavior,
  fetchAdminTotalCount,
} from "./helpers/pagination";
import { assertFilterAndColumnVisibility } from "./helpers/table-filters";

test.setTimeout(60_000);

async function goToServicesList(page: Page) {
  const link = page.locator('a[href*="/admin/services"]').first();
  await link.click();
  await page.waitForURL(/\/admin\/services(\?|$)/, { timeout: 20_000 });
}

test.describe("services pagination", () => {
  test("should navigate through pagination and respect rows per page settings", async ({
    page,
  }) => {
    const totalCount = await fetchAdminTotalCount(
      page,
      "servicesAdmin.getMine",
    );
    test.skip(totalCount === 0, "No services seeded yet — skipping pagination");

    await page.goto("/admin");
    await goToServicesList(page);

    const rows = page.locator("table tbody tr");
    await assertPaginationBehavior({ page, rows, totalCount });
  });

  test("should filter items and toggle column visibility", async ({ page }) => {
    const totalCount = await fetchAdminTotalCount(
      page,
      "servicesAdmin.getMine",
    );
    test.skip(totalCount === 0, "No services seeded yet — skipping filters");

    await page.goto("/admin");
    await goToServicesList(page);

    await assertFilterAndColumnVisibility({
      page,
      rows: page.locator("table tbody tr"),
      filterTestId: "filter-title",
      toggleColumnTestId: "toggle-column-type",
      searchCellIndex: 0,
      hiddenColumnCellIndex: 1,
      noResultsTerm: "NonExistentServiceXYZ123",
    });
  });
});
