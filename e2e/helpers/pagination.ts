import { expect, type Locator, type Page } from "@playwright/test";

import { ensureAdminOrigin } from "./admin-origin";

interface TrpcResponse {
  result?: {
    data?: {
      json?: {
        totalCount?: number;
      };
    };
  };
}

export function trpcGetInput(procedure: string, input: unknown = {}): string {
  return `/api/trpc/${procedure}?batch=1&input=${encodeURIComponent(
    JSON.stringify({ "0": { json: input } }),
  )}`;
}

export async function fetchAdminTotalCount(
  page: Page,
  procedure: string,
): Promise<number> {
  await ensureAdminOrigin(page);
  const response = await page.request.get(
    trpcGetInput(procedure, { page: 1, perPage: 1, sort: [], filters: [] }),
  );
  if (!response.ok()) {
    throw new Error(`tRPC query failed: ${response.status()}`);
  }

  const payload = (await response.json()) as TrpcResponse[] | TrpcResponse;
  if (Array.isArray(payload)) {
    return payload[0]?.result?.data?.json?.totalCount ?? 0;
  }
  return payload?.result?.data?.json?.totalCount ?? 0;
}

export async function assertPaginationBehavior(options: {
  page: Page;
  rows: Locator;
  totalCount: number;
  perPage?: number;
}): Promise<void> {
  const perPage = options.perPage ?? 10;
  const { page, rows, totalCount } = options;

  expect(totalCount).toBeGreaterThan(0);

  const firstPageCount = await rows.count();
  expect(firstPageCount).toBeGreaterThan(0);
  expect(firstPageCount).toBeLessThanOrEqual(perPage);

  const canPaginate = totalCount > perPage;
  const paginationNext = page.getByTestId("pagination-next");
  const paginationFirst = page.getByTestId("pagination-first");
  const paginationLast = page.getByTestId("pagination-last");

  if (canPaginate) {
    await expect(paginationNext).toBeEnabled();

    await paginationNext.click();
    const page2Count = await rows.count();
    expect(page2Count).toBeGreaterThan(0);
    expect(page2Count).toBeLessThanOrEqual(perPage);

    await paginationFirst.click();
    const backToFirstCount = await rows.count();
    expect(backToFirstCount).toBeGreaterThan(0);
    expect(backToFirstCount).toBeLessThanOrEqual(perPage);

    await paginationLast.click();
    const lastCount = await rows.count();
    expect(lastCount).toBeGreaterThan(0);
    expect(lastCount).toBeLessThanOrEqual(perPage);

    await paginationFirst.click();
    const finalCount = await rows.count();
    expect(finalCount).toBeGreaterThan(0);
    expect(finalCount).toBeLessThanOrEqual(perPage);
  } else {
    await expect(paginationNext).toBeDisabled();
    await expect(paginationLast).toBeDisabled();
  }

  const largerPerPage = 20;
  if (totalCount > perPage || perPage < largerPerPage) {
    await page
      .getByRole("combobox")
      .filter({ hasText: String(perPage) })
      .click();
    await page.getByRole("option", { name: String(largerPerPage) }).click();
    const largerPageCount = await rows.count();
    expect(largerPageCount).toBeGreaterThan(0);
    expect(largerPageCount).toBeLessThanOrEqual(largerPerPage);
  }
}
