import { expect, test } from "@playwright/test";
import { getWorkerAuthFile } from "./helpers/auth-state";

test.describe("jobs application CRUD and integrity", () => {
  test.use({ storageState: getWorkerAuthFile() });

  const uniqueId = Date.now();
  const testPosition = `E2E Frontend Engineer ${uniqueId}`;

  test("creates a new job application, verifies it in list, and deletes it", async ({
    page,
  }) => {
    // 1. Navigate to Job Tracker admin page
    await page.goto("/admin/job-tracker");
    await page.waitForURL(/\/admin\/job-tracker(\?|$)/, { timeout: 15_000 });

    // 2. Click Add / New Application link
    const newLink = page
      .locator('a[href*="/admin/job-tracker/applications/new"]')
      .or(
        page.getByRole("link", {
          name: /nueva solicitud|new application|add/i,
        }),
      )
      .first();
    await newLink.click();
    await page.waitForURL(/\/admin\/job-tracker\/applications\/new/, {
      timeout: 15_000,
    });

    // 3. Fill Position
    const positionInput = page.locator("#position");
    await positionInput.fill(testPosition);

    // 4. Select or enter Company via Combobox
    const companyCombobox = page.locator('button[role="combobox"]').first();
    await companyCombobox.click();

    const firstCompanyItem = page
      .locator('[data-slot="command-item"], [role="option"]')
      .first();
    if (
      await firstCompanyItem.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await firstCompanyItem.click();
    } else {
      // Type new company name
      const commandInput = page
        .locator('input[placeholder*="empresa"], input[placeholder*="company"]')
        .first();
      await commandInput.fill(`E2E Tech Corp ${uniqueId}`);
      const createItem = page.locator('[data-slot="command-item"]').first();
      await createItem.click();
    }

    // 5. Intercept create application mutation and submit
    const createResponse = page.waitForResponse(
      (response) =>
        response
          .url()
          .includes("/api/trpc/jobTrackerAdmin.createApplication") &&
        response.request().method() === "POST" &&
        response.ok(),
      { timeout: 30_000 },
    );

    await page.locator('button[type="submit"]').first().click();
    await createResponse;

    // 6. Navigate back to list and verify item is present
    await page.goto("/admin/job-tracker");
    const cell = page.getByText(testPosition, { exact: false }).first();
    await expect(cell).toBeVisible({ timeout: 15_000 });

    // 7. Delete created application row
    const row = page.locator("tr").filter({ has: cell }).first();
    const deleteBtn = row
      .getByRole("button", { name: /delete|eliminar/i })
      .first();

    const deleteResponse = page.waitForResponse(
      (response) =>
        response
          .url()
          .includes("/api/trpc/jobTrackerAdmin.deleteApplication") &&
        response.request().method() === "POST" &&
        response.ok(),
      { timeout: 30_000 },
    );

    await deleteBtn.click();
    await deleteResponse;

    // 8. Confirm deletion in table
    await expect(cell).not.toBeVisible();
  });
});
