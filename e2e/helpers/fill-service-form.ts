import type { Page } from "@playwright/test";

export interface ServiceFixture {
  title: string;
  description: string;
  image: string;
  type: string;
}

export async function goToServicesList(page: Page): Promise<void> {
  if (/\/admin\/services(\?|$)/.test(page.url())) {
    return;
  }
  await page.goto("/admin/services");
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

  await page.locator("#service-title-en").waitFor({ state: "visible" });
  await page.locator("#service-title-en").fill(service.title);

  const descField = page.locator("#service-description-en");
  if (await descField.isVisible()) {
    await descField.fill(service.description);
  }

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

  await goToServicesList(page);
}

export async function deleteServiceByTitle(
  page: Page,
  title: string,
): Promise<void> {
  await goToServicesList(page);
  const rowCell = page.getByRole("cell", { name: title }).first();
  if (await rowCell.isVisible()) {
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
  }
}
