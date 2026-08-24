import type { Page } from "@playwright/test";

/** Dismiss a form/dialog overlay that would intercept clicks or navigation. */
export async function dismissDialogOverlay(page: Page): Promise<void> {
  const overlay = page.locator('[data-slot="dialog-overlay"]');
  if (await overlay.isVisible({ timeout: 500 }).catch(() => false)) {
    await page.keyboard.press("Escape");
    await overlay.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {
      /* overlay may already be gone */
    });
  }
}
