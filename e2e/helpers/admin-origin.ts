import type { Page } from "@playwright/test";

/** SameSite=Lax session cookies are not sent by `page.request` until the origin is visited. */
export async function ensureAdminOrigin(page: Page): Promise<void> {
  if (/^https?:\/\//.test(page.url())) {
    return;
  }

  const gotoAdmin = () =>
    page.goto("/admin", { waitUntil: "domcontentloaded" });

  try {
    await gotoAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/ERR_ABORTED|interrupted/i.test(message)) {
      throw error;
    }
    await gotoAdmin();
  }
}

