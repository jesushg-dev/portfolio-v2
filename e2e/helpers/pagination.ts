import { expect, type Locator, type Page } from "@playwright/test";

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
  const response = await page.request.get(trpcGetInput(procedure, {}));
  if (!response.ok()) {
    throw new Error(`tRPC query failed: ${response.status()}`);
  }

  const payload = (await response.json()) as TrpcResponse[] | TrpcResponse;
  if (Array.isArray(payload)) {
    return payload[0]?.result?.data?.json?.totalCount ?? 0;
  }
  return payload?.result?.data?.json?.totalCount ?? 0;
}

function lastPageRowCount(totalCount: number, perPage: number): number {
  const remainder = totalCount % perPage;
  return remainder === 0 ? perPage : remainder;
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

  const expectedFirstPage = Math.min(perPage, totalCount);
  await expect(rows).toHaveCount(expectedFirstPage);

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
    await expect(rows).toHaveCount(expectedFirstPage);

    await paginationLast.click();
    const lastCount = await rows.count();
    expect(lastCount).toBeGreaterThan(0);
    expect(lastCount).toBeLessThanOrEqual(perPage);

    await paginationFirst.click();
    await expect(rows).toHaveCount(expectedFirstPage);
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
    await expect(rows).toHaveCount(Math.min(largerPerPage, totalCount));
  }
}
