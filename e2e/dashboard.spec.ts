import { test, expect } from "@playwright/test";

test.describe("dashboard", () => {
  test("loads the admin dashboard with an authenticated session", async ({
    page,
  }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(
      page.getByRole("heading", {
        name: /Welcome to your Portfolio Admin|Bienvenido a tu administrador de portafolio|Welkom in je Portfolio Admin/,
      }),
    ).toBeVisible();
  });
});
