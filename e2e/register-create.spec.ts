import { test, expect } from "@playwright/test";

import {
  buildOwnerAccountInput,
  expectAdminDashboard,
  fillRegisterOwnerForm,
  portfolioProfile,
  signInOwner,
} from "./helpers/fill-register-form";

test.describe("register create", () => {
  test("registers the owner account through the UI from the shared fixture", async ({
    page,
  }) => {
    const input = buildOwnerAccountInput();
    const alreadyRegistered = await signInOwner(
      page,
      input.email,
      input.password,
    );

    if (!alreadyRegistered) {
      await fillRegisterOwnerForm(page, input);
    }

    await expectAdminDashboard(page);

    expect(input.name).toBe(portfolioProfile.name);
    expect(input.username).toBe(portfolioProfile.username);
  });
});
