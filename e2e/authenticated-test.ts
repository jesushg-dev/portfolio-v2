import { test as base } from "@playwright/test";

import { getWorkerAuthFile } from "./helpers/auth-state";

/**
 * Admin specs must import `test` from this module so each Playwright worker
 * uses its own auth file. Config-level `storageState` is evaluated once in the
 * host process (always worker 0); this `test.use` runs in the worker where
 * TEST_WORKER_INDEX is set.
 */
export const test = base;

test.use({
  storageState: getWorkerAuthFile(),
});

export { expect } from "@playwright/test";
