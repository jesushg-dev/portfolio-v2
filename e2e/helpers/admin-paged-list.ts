import { expect, type Page } from "@playwright/test";

import { gotoAdminPath } from "./admin-origin";

/** Largest page size offered by the admin data-table pagination control. */
export const ADMIN_TABLE_MAX_PAGE_SIZE = 50;

function isPagedListUrl(url: URL, listPath: string, perPage: number): boolean {
  const pathname = url.pathname.replace(/\/$/, "");
  return (
    pathname.endsWith(listPath) &&
    url.searchParams.get("perPage") === String(perPage)
  );
}

function pageUrl(page: Page): URL | null {
  try {
    return new URL(page.url());
  } catch {
    return null;
  }
}

/**
 * Open an admin collection list with a large page size.
 * Default tables show 10 rows; bulk-create specs need every fixture row visible.
 */
export async function openAdminPagedList(
  page: Page,
  listPath: string,
  addButtonId: string,
  perPage = ADMIN_TABLE_MAX_PAGE_SIZE,
): Promise<void> {
  const listUrl = `${listPath}?perPage=${perPage}`;
  const matches = (url: URL) => isPagedListUrl(url, listPath, perPage);
  const current = pageUrl(page);

  if (!current || !matches(current)) {
    await gotoAdminPath(page, listUrl);
  }

  try {
    await expect(page).toHaveURL(matches, { timeout: 20_000 });
  } catch {
    await gotoAdminPath(page, listUrl);
    await expect(page).toHaveURL(matches, { timeout: 15_000 });
  }

  await page
    .locator(`#${addButtonId}`)
    .waitFor({ state: "visible", timeout: 15_000 });
}

/** Walk table pages until every title appears, or fail with the missing ones. */
export async function expectTitlesAcrossAdminPages(
  page: Page,
  titles: string[],
): Promise<void> {
  const remaining = new Set(titles);
  const rows = page.locator("table tbody tr");

  const collectVisible = async () => {
    const count = await rows.count();
    for (let index = 0; index < count; index += 1) {
      const text = await rows.nth(index).innerText();
      for (const title of remaining) {
        if (text.includes(title)) remaining.delete(title);
      }
    }
  };

  await collectVisible();

  while (remaining.size > 0) {
    const next = page.getByTestId("pagination-next");
    if (!(await next.isEnabled())) break;
    await next.click();
    await collectVisible();
  }

  if (remaining.size > 0) {
    throw new Error(`Admin table is missing: ${[...remaining].join(", ")}`);
  }
}
