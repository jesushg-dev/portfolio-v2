import { test } from "@playwright/test";

import {
  buildRegisterOwnerInput,
  ensureOwnerAccount,
  expectAdminDashboard,
  signInOwner,
} from "./helpers/fill-register-form";

test.describe("login", () => {
  const account = buildRegisterOwnerInput();
  test.setTimeout(150_000);
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await ensureOwnerAccount(page, account);
    await context.close();
  });

  test("signs in with email and password and lands on the dashboard", async ({
    page,
  }) => {
    await signInOwner(page, account.email, account.password);

    await expectAdminDashboard(page);
  });
});
