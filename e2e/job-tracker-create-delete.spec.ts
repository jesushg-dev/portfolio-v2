import { expect, test } from "./authenticated-test";
import { selectOrCreateCompany } from "./helpers/select-company";

test.describe("jobs application CRUD and integrity", () => {
  const uniqueId = Date.now();
  const testPosition = `E2E Senior Fullstack ${uniqueId}`;

  test("creates a new job application, verifies Kanban card, opens detail view, and cleans up", async ({
    page,
    request,
  }) => {
    // 1. Navigate to Job Tracker admin base page
    await page.goto("/admin/job-tracker");
    await page.waitForURL(/\/admin\/job-tracker(\?|$)/, { timeout: 15_000 });

    // 2. Click Add / New Application link
    const newLink = page
      .locator('a[href*="/admin/job-tracker/applications/new"]')
      .first();
    await expect(newLink).toBeVisible({ timeout: 15_000 });
    await newLink.click();
    await page.waitForURL(/\/admin\/job-tracker\/applications\/new/, {
      timeout: 15_000,
    });

    // 3. Fill Position input
    const positionInput = page.locator("#position");
    await positionInput.fill(testPosition);

    await selectOrCreateCompany(page, `E2E Tech Corp ${uniqueId}`);

    // 5. Submit form and capture created id from response
    let createdId = "";
    const createResponse = page.waitForResponse(
      async (response) => {
        if (
          response
            .url()
            .includes("/api/trpc/jobTrackerAdmin.createApplication") &&
          response.request().method() === "POST" &&
          response.ok()
        ) {
          try {
            const json = (await response.json()) as {
              result?: {
                data?: {
                  json?: {
                    id?: string;
                  };
                };
              };
            }[];
            createdId = json[0]?.result?.data?.json?.id ?? "";
          } catch {
            // ignore
          }
          return true;
        }
        return false;
      },
      { timeout: 30_000 },
    );

    await page.locator('button[type="submit"]').first().click();
    await createResponse;
    await page.waitForURL(
      (url) => !url.pathname.includes("/applications/new"),
      { timeout: 20_000 },
    );

    // 6. Navigate back to list and verify Kanban card presence
    await page.goto("/admin/job-tracker");
    const cardTitle = page.getByText(testPosition, { exact: false }).first();
    await expect(cardTitle).toBeVisible({ timeout: 15_000 });

    // 7. Click card to verify detail view loads
    await cardTitle.click();
    await page.waitForURL(/\/admin\/job-tracker\/applications\/.*/, {
      timeout: 15_000,
    });
    await expect(page.getByText(testPosition).first()).toBeVisible();

    // 8. Clean up created application via tRPC
    if (createdId) {
      await request.post(
        "/api/trpc/jobTrackerAdmin.deleteApplication?batch=1",
        {
          data: { "0": { json: { id: createdId } } },
        },
      );
    }
  });
});
