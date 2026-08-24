import type { Page } from "@playwright/test";

import { dismissDialogOverlay } from "./dismiss-dialog-overlay";

export function adminPathname(page: Page): string {
  try {
    return new URL(page.url()).pathname;
  } catch {
    return page.url();
  }
}

/** True when the URL is the collection list, not `/new` or `/edit`. */
export function isAdminCollectionListUrl(
  page: Page,
  resource: string,
): boolean {
  const pathname = adminPathname(page);
  const base = `/admin/${resource}`;
  return (
    pathname.includes(base) &&
    !pathname.includes(`${base}/new`) &&
    !pathname.includes("/edit")
  );
}

function pathMatchesTarget(pathname: string, path: string): boolean {
  const target = (path.split("?")[0] ?? path).replace(/\/$/, "") || "/";
  const current = pathname.replace(/\/$/, "") || "/";
  return current === target || current.endsWith(target);
}

/** SameSite=Lax session cookies are not sent by `page.request` until the origin is visited. */
export async function ensureAdminOrigin(page: Page): Promise<void> {
  if (page.url().startsWith("http://") || page.url().startsWith("https://")) {
    return;
  }

  await gotoAdminPath(page, "/admin");
}

/**
 * Navigate inside admin, retrying Next.js client-nav `ERR_ABORTED`.
 * Create forms call `router.back()` after save; a concurrent `page.goto` often aborts once.
 */
export async function gotoAdminPath(page: Page, path: string): Promise<void> {
  await dismissDialogOverlay(page);

  if (pathMatchesTarget(adminPathname(page), path)) {
    return;
  }

  let lastError: unknown;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!/ERR_ABORTED|interrupted|Navigation/i.test(message)) {
        throw error;
      }

      // Concurrent client navigation may already have landed on the target.
      if (pathMatchesTarget(adminPathname(page), path)) {
        return;
      }

      await page.waitForLoadState("domcontentloaded").catch(() => undefined);
    }
  }

  if (pathMatchesTarget(adminPathname(page), path)) {
    return;
  }

  throw lastError;
}

/**
 * After create, forms call `router.back()` to the list. Prefer waiting for that
 * instead of racing another `page.goto` (which causes `net::ERR_ABORTED` in CI).
 */
export async function waitForAdminListAfterSave(
  page: Page,
  resource: string,
  addButtonId: string,
): Promise<void> {
  const listPath = `/admin/${resource}`;
  const addButton = page.locator(`#${addButtonId}`);

  if (
    isAdminCollectionListUrl(page, resource) &&
    (await addButton.isVisible())
  ) {
    return;
  }

  try {
    await page.waitForURL(
      (url) => {
        const pathname = url.pathname;
        return (
          pathname.includes(listPath) &&
          !pathname.includes(`${listPath}/new`) &&
          !pathname.includes("/edit")
        );
      },
      { timeout: 30_000 },
    );
    await addButton.waitFor({ state: "visible", timeout: 15_000 });
  } catch {
    await gotoAdminPath(page, listPath);
    await addButton.waitFor({ state: "visible", timeout: 15_000 });
  }
}
