import { test, expect } from "@playwright/test";

import { ensureOwnerAccount } from "./helpers/fill-register-form";

test.describe("register smoke", () => {
  test("ensures the owner account exists via sign-in or register UI", async ({
    page,
  }) => {
    await ensureOwnerAccount(page);

    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(
      page.getByRole("heading", {
        name: /Welcome to your Portfolio Admin|Bienvenido a tu administrador de portafolio|Welkom in je Portfolio Admin/,
      }),
    ).toBeVisible();
  });
});
