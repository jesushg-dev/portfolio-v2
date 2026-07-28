import { expect, test } from "@playwright/test";
import { getWorkerAuthFile } from "./helpers/auth-state";

import {
  deleteServiceByTitle,
  fillServiceForm,
  goToServicesList,
} from "./helpers/fill-service-form";

test.describe("services edit and restore data integrity", () => {
  test.use({ storageState: getWorkerAuthFile() });

  const uniqueId = Date.now();
  const testService = {
    title: `E2E Service ${uniqueId}`,
    description: "Original service description",
    image: "https://example.com/service.png",
    type: "BACKEND",
  };

  test("creates a service, edits it, verifies updated title, restores original title, and cleans up", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    // 0. Go to admin base first so sidebar nav is loaded
    await page.goto("/admin");

    // 1. Create initial service
    await fillServiceForm(page, testService);
    await goToServicesList(page);

    // 2. Find row & click edit link
    const cell = page.getByRole("cell", { name: testService.title }).first();
    await expect(cell).toBeVisible();

    const row = page.locator("tr").filter({ has: cell }).first();
    await row
      .getByRole("link", { name: /edit|editar/i })
      .first()
      .click();
    await page.waitForURL(/\/admin\/services\/.*\/edit/, { timeout: 15_000 });

    // 3. Edit title to updated title and submit
    const titleInput = page.locator("#service-title-en");
    await expect(titleInput).toHaveValue(testService.title);

    const modifiedTitle = `${testService.title} (Updated)`;
    await titleInput.fill(modifiedTitle);

    const updateResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/trpc/servicesAdmin.updateItem") &&
        response.request().method() === "POST" &&
        response.ok(),
      { timeout: 30_000 },
    );

    await page.locator('button[type="submit"]').first().click();
    await updateResponse;

    // 4. Verify modified title in list
    await goToServicesList(page);
    await expect(
      page.getByRole("cell", { name: modifiedTitle }).first(),
    ).toBeVisible();

    // 5. Restore original title
    const modCell = page.getByRole("cell", { name: modifiedTitle }).first();
    const modRow = page.locator("tr").filter({ has: modCell }).first();
    await modRow
      .getByRole("link", { name: /edit|editar/i })
      .first()
      .click();
    await page.waitForURL(/\/admin\/services\/.*\/edit/, { timeout: 15_000 });

    const modInput = page.locator("#service-title-en");
    await modInput.fill(testService.title);

    const restoreResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/trpc/servicesAdmin.updateItem") &&
        response.request().method() === "POST" &&
        response.ok(),
      { timeout: 30_000 },
    );

    await page.locator('button[type="submit"]').first().click();
    await restoreResponse;

    // 6. Cleanup item
    await deleteServiceByTitle(page, testService.title);
  });
});
