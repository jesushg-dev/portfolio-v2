import { test, expect } from "@playwright/test";

import { requireE2eCredentials } from "./env";
import { ensureOwnerAccount, signInOwner } from "./helpers/fill-register-form";

test.describe("login", () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await ensureOwnerAccount(page);
    await context.close();
  });

  test("signs in with email and password and lands on the dashboard", async ({
    page,
  }) => {
    const { email, password } = requireE2eCredentials();

    await signInOwner(page, email, password);

    await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 60_000 });
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 30_000 });
  });
});
