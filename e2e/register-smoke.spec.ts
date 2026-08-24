import { test, expect } from "@playwright/test";

import {
  ensureOwnerAccount,
  expectAdminDashboard,
} from "./helpers/fill-register-form";

test.describe("register smoke", () => {
  test("ensures the owner account exists via sign-in or register UI", async ({
    page,
  }) => {
    await ensureOwnerAccount(page);

    await expectAdminDashboard(page);
  });
});
