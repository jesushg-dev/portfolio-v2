import { expect, test } from "@playwright/test";
import { getWorkerAuthFile } from "./helpers/auth-state";

import {
  cleanupUserTimeline,
  fillTimelineItemForm,
  goToTimelineList,
} from "./helpers/fill-timeline-form";

test.describe("timeline edit and data integrity", () => {
  test.use({ storageState: getWorkerAuthFile() });

  const uniqueId = Date.now();
  const tempTimelineItem = {
    key: `e2e-timeline-${uniqueId}`,
    category: "WORK" as const,
    organization: `Acme Corp ${uniqueId}`,
    location: "Madrid, Spain",
    startDate: "2021-01-01",
    endDate: "",
    current: true,
    title: {
      en: `Senior Engineer ${uniqueId}`,
      es: `Ingeniero Senior ${uniqueId}`,
      nl: `Senior Engineer ${uniqueId}`,
    },
    description: {
      en: "Leading web team",
      es: "Liderando equipo web",
      nl: "Leidinggevende webteam",
    },
  };

  test("creates a timeline item, edits organization, verifies saved state, and cleans up", async ({
    page,
  }) => {
    // 0. Go to admin base first so sidebar is loaded
    await page.goto("/admin");

    // 1. Create item
    await fillTimelineItemForm(page, tempTimelineItem);
    await goToTimelineList(page);

    // 2. Open edit form
    const cell = page
      .getByText(tempTimelineItem.title.en, { exact: true })
      .first();
    await expect(cell).toBeVisible();

    const row = page.locator("tr").filter({ has: cell }).first();
    await row
      .getByRole("link", { name: /edit|editar/i })
      .first()
      .click();
    await page.waitForURL(/\/admin\/timeline\/.*\/edit/, { timeout: 15_000 });

    // 3. Edit organization and submit
    const orgInput = page.locator("#timeline-organization");
    await expect(orgInput).toHaveValue(tempTimelineItem.organization);

    const updatedOrg = `${tempTimelineItem.organization} (Updated)`;
    await orgInput.fill(updatedOrg);
    await orgInput.press("Tab");

    const updateResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/trpc/timelineAdmin.updateItem") &&
        response.request().method() === "POST",
      { timeout: 30_000 },
    );

    await page.locator("#timeline-form-submit").click();
    await updateResponse;

    // 4. Verify updated organization in list
    await page.goto("/admin/timeline");
    await expect(page.getByText(updatedOrg).first()).toBeVisible();

    // 5. Cleanup
    await cleanupUserTimeline(page);
  });
});
