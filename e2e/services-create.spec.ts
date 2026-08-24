import { expect, test } from "./authenticated-test";

import {
  deleteServiceByTitle,
  fillServiceForm,
  goToServicesList,
} from "./helpers/fill-service-form";

test.describe("services create and cleanup", () => {
  const tempService = {
    title: "E2E Temp Custom Service",
    description: "Temporary service created during automated test run",
    image: "https://example.com/service-icon.png",
    type: "FRONTEND",
  };

  test.afterEach(async ({ page }) => {
    await deleteServiceByTitle(page, tempService.title);
  });

  test("creates a new service, verifies it in the table list, and deletes it", async ({
    page,
  }) => {
    await fillServiceForm(page, tempService);
    await goToServicesList(page);

    await expect(
      page.getByRole("cell", { name: tempService.title }).first(),
    ).toBeVisible();
  });
});
