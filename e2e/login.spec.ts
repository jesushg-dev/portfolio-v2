import { test } from "@playwright/test";

import { requireE2eCredentials } from "./env";
import {
  buildOwnerAccountInput,
  ensureOwnerAccount,
  expectAdminDashboard,
  signInOwner,
} from "./helpers/fill-register-form";

test.describe("login", () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await ensureOwnerAccount(page, buildOwnerAccountInput());
    await context.close();
  });

  test("signs in with email and password and lands on the dashboard", async ({
    page,
  }) => {
    const { email, password } = requireE2eCredentials();

    await signInOwner(page, email, password);

    await expectAdminDashboard(page);
  });
});
