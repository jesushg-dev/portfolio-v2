import { test } from "@playwright/test";

import {
  buildRegisterOwnerInput,
  ensureOwnerAccount,
  expectAdminDashboard,
} from "./helpers/fill-register-form";

test.describe("register smoke", () => {
  test.setTimeout(150_000);
  test("ensures the E2E account exists via sign-in or register UI", async ({
    page,
  }) => {
    await ensureOwnerAccount(page, buildRegisterOwnerInput());

    await expectAdminDashboard(page);
  });
});
