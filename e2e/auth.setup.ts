import { test as setup, expect } from "@playwright/test";

import {
  buildRegisterOwnerInput,
  ensureOwnerAccount,
} from "./helpers/fill-register-form";
import {
  disconnectE2ePrisma,
  ensureAppLanguages,
} from "./helpers/ensure-app-languages";

setup("authenticate workers", async ({ browser }) => {
  setup.setTimeout(120_000);
  await ensureAppLanguages();

  const maxWorkers = Number.parseInt(
    process.env.E2E_WORKERS ?? (process.env.CI ? "2" : "4"),
    10,
  );

  for (let i = 0; i < maxWorkers; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();

    const input = buildRegisterOwnerInput(i);
    await ensureOwnerAccount(page, input);

    await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 60_000 });
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 30_000 });

    const workerAuthFile = `e2e/.auth/user-worker-${i}.json`;
    await page.context().storageState({ path: workerAuthFile });

    if (i === 0) {
      await page.context().storageState({ path: "e2e/.auth/user.json" });
    }

    await context.close();
  }

  await disconnectE2ePrisma();
});
