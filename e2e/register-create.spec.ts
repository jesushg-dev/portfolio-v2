import { test, expect } from "@playwright/test";

import {
  buildRegisterOwnerInput,
  fillRegisterOwnerForm,
  portfolioProfile,
  signInOwner,
} from "./helpers/fill-register-form";

test.describe("register create", () => {
  test("registers the owner account through the UI from the shared fixture", async ({
    page,
  }) => {
    const input = buildRegisterOwnerInput();
    const alreadyRegistered = await signInOwner(
      page,
      input.email,
      input.password,
    );

    if (!alreadyRegistered) {
      await fillRegisterOwnerForm(page, input);
    }

    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(
      page.getByRole("heading", {
        name: /Welcome to your Portfolio Admin|Bienvenido a tu administrador de portafolio|Welkom in je Portfolio Admin/,
      }),
    ).toBeVisible();

    expect(input.name).toBe(portfolioProfile.name);
    expect(input.username).toBe(portfolioProfile.username);
  });
});
