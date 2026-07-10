import { test as setup, expect } from "@playwright/test";

import { ensureOwnerAccount } from "./helpers/fill-register-form";
import {
  disconnectE2ePrisma,
  ensureAppLanguages,
} from "./helpers/ensure-app-languages";

const authFile = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  await ensureAppLanguages();
  await ensureOwnerAccount(page);

  await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 60_000 });
  await expect(
    page.getByRole("heading", {
      name: /Welcome to your Portfolio Admin|Bienvenido a tu administrador de portafolio|Welkom in je Portfolio Admin/,
    }),
  ).toBeVisible();

  await page.context().storageState({ path: authFile });
  await disconnectE2ePrisma();
});
