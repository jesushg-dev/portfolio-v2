import { test, expect } from "@playwright/test";

import { ensureOwnerAccount } from "./helpers/fill-register-form";

test.describe("register smoke", () => {
  test("ensures the owner account exists via sign-in or register UI", async ({
    page,
  }) => {
    await ensureOwnerAccount(page);

    await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 60_000 });
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 30_000 });
  });
});
