import { test as setup, expect } from "@playwright/test";

import {
  buildRegisterOwnerInput,
  ensureOwnerAccount,
  expectAdminDashboard,
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

    await expectAdminDashboard(page);

    const cookies = await page.context().cookies();
    if (cookies.length === 0) {
      throw new Error(
        `Worker ${i} reached /admin but the browser stored no cookies. ` +
          "Session cookies must be captured for storageState (check BETTER_AUTH_URL vs E2E_BASE_URL).",
      );
    }

    const workerAuthFile = `e2e/.auth/user-worker-${i}.json`;
    await page.context().storageState({ path: workerAuthFile });

    if (i === 0) {
      await page.context().storageState({ path: "e2e/.auth/user.json" });
    }

    await context.close();
  }

  await disconnectE2ePrisma();
});
