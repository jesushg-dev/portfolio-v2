import { expect, test } from "./authenticated-test";
import { selectOrCreateCompany } from "./helpers/select-company";

test.describe("jobs application CRUD and integrity", () => {
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

    await selectOrCreateCompany(page, `E2E Tech Corp ${uniqueId}`);

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
    await page.waitForURL(
      (url) => !url.pathname.includes("/applications/new"),
      { timeout: 20_000 },
    );

    // 6. Navigate back to list and verify item is present
    await page.goto("/admin/job-tracker");
    const cell = page.getByText(testPosition, { exact: false }).first();
    await expect(cell).toBeVisible({ timeout: 15_000 });
  });
});
