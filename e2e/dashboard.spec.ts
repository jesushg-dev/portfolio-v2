import { test } from "./authenticated-test";
import { expectAdminDashboard } from "./helpers/fill-register-form";

test.describe("dashboard", () => {
  test("loads the admin dashboard with an authenticated session", async ({
    page,
  }) => {
    await page.goto("/admin");

    await expectAdminDashboard(page);
  });
});
