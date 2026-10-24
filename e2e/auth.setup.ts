import { test as setup } from "@playwright/test";

import {
  buildRegisterOwnerInput,
  ensureOwnerAccount,
  expectAdminDashboard,
} from "./helpers/fill-register-form";
import {
  disconnectE2ePrisma,
  ensureAppLanguages,
  syncE2eWorkerPassword,
} from "./helpers/ensure-app-languages";

setup("authenticate workers", async ({ browser }, testInfo) => {
  setup.setTimeout(120_000);
  await ensureAppLanguages();

  const ownerInput = buildRegisterOwnerInput(0);
  await syncE2eWorkerPassword(ownerInput.password);

  const maxWorkers = testInfo.config.workers;

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

    await context.close();
  }

  await disconnectE2ePrisma();
});
