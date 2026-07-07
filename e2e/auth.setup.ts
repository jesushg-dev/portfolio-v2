import { test as setup, expect } from "@playwright/test";

import { requireE2eCredentials } from "./env";

const authFile = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const { email, password } = requireE2eCredentials();

  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Welcome back!" }),
  ).toBeVisible();

  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);

  const signInResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/sign-in/email") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await signInResponse;

  await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 60_000 });
  await expect(
    page.getByRole("heading", {
      name: /Welcome to your Portfolio Admin|Bienvenido a tu administrador de portafolio|Welkom in je Portfolio Admin/,
    }),
  ).toBeVisible();

  await page.context().storageState({ path: authFile });
});
