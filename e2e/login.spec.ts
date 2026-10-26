import { expect, test } from "@playwright/test";

import {
  buildRegisterOwnerInput,
  ensureOwnerAccount,
  expectAdminDashboard,
  fillSignInCredentials,
  signInOwner,
  submitSignInRequest,
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

  test("signs in when an inactive login form remains in the DOM", async ({
    page,
  }) => {
    await page.goto("/login");
    const emailInput = page.locator("#login-email:visible");
    await expect(emailInput).toBeVisible();
    await emailInput.evaluate((input) => {
      const form = input.closest("form");
      if (!form) throw new Error("Login input must belong to a form");
      const inactiveForm = form.cloneNode(true) as HTMLFormElement;
      inactiveForm.hidden = true;
      inactiveForm.inert = true;
      document.body.append(inactiveForm);
    });
    await expect(page.locator("#login-email")).toHaveCount(2);

    await fillSignInCredentials(page, account.email, account.password);
    const response = await submitSignInRequest(page);
    expect(response.ok(), response.ok() ? "" : await response.text()).toBe(true);
    await expectAdminDashboard(page);
  });
});
