import {
  selectFormLanguage,
  selectFormTab,
  translationField,
} from "./admin-form";
import type { Page } from "@playwright/test";
import { dismissDialogOverlay } from "./dismiss-dialog-overlay";

export interface ServiceFixture {
  title: string;
  description: string;
  image: string;
  type: string;
}

export async function goToServicesList(page: Page): Promise<void> {
  await dismissDialogOverlay(page);
  const currentUrl = page.url();
  if (
    /\/admin\/services(\?|$)/.test(currentUrl) &&
    currentUrl.includes("perPage=100")
  ) {
    return;
  }
  await page.goto("/admin/services?perPage=100");
  await page.waitForURL(/\/admin\/services(\?|$)/, { timeout: 15_000 });
}

export async function openNewServiceForm(page: Page): Promise<void> {
  await goToServicesList(page);
  const addBtn = page.locator('a[href="/admin/services/new"]').first();
  await addBtn.click();
  await page.waitForURL(/\/admin\/services\/new\/?$/, { timeout: 15_000 });
}

export async function fillServiceForm(
  page: Page,
  service: ServiceFixture,
): Promise<void> {
  await openNewServiceForm(page);

  await selectFormLanguage(page, "en");
  await translationField(page, "title").waitFor({ state: "visible" });
  await translationField(page, "title").fill(service.title);

  const descField = translationField(page, "description");
  if (await descField.isVisible()) {
    await descField.fill(service.description);
  }

  await selectFormTab(page, "General");
  await page.locator("#service-image").fill(service.image);

  const createResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/trpc/servicesAdmin.createItem") &&
      response.request().method() === "POST" &&
      response.ok(),
    { timeout: 30_000 },
  );

  await page.locator('button[type="submit"]').first().click();
  await createResponse;

  await page
    .waitForURL((url) => !url.pathname.endsWith("/new"), { timeout: 10_000 })
    .catch(() => {
      /* ignore if router.back did not change URL */
    });
  await dismissDialogOverlay(page);

  await goToServicesList(page);
}

export async function deleteServiceByTitle(
  page: Page,
  title: string,
): Promise<void> {
  await goToServicesList(page);
  const rowCell = page
    .getByRole("cell")
    .filter({ has: page.getByText(title, { exact: true }) })
    .first();
  if (await rowCell.isVisible({ timeout: 5_000 }).catch(() => false)) {
    const row = page.locator("tr").filter({ has: rowCell }).first();
    const deleteBtn = row
      .getByRole("button", { name: /delete|eliminar/i })
      .first();

    const deleteResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/trpc/servicesAdmin.deleteItem") &&
        response.request().method() === "POST" &&
        response.ok(),
      { timeout: 30_000 },
    );

    await deleteBtn.click();
    await deleteResponse;
    await rowCell.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => {
      /* ignore if row already unmounted */
    });
  }
}
