import { test as base } from "@playwright/test";

import { getWorkerAuthFile } from "./helpers/auth-state";

/**
 * Admin specs must import `test` from this module so each Playwright worker
 * uses its own auth file.
 *
 * `storageState` must be a fixture (not `getWorkerAuthFile()` at module load).
 * Module-level `test.use({ storageState: getWorkerAuthFile() })` runs in the
 * host during collection, when `TEST_WORKER_INDEX` is unset, so every worker
 * would share `user-worker-0.json` and race on unique skill titles.
 */
export const test = base.extend({
  storageState: async ({}, provideStorageState, testInfo) => {
    await provideStorageState(getWorkerAuthFile(testInfo.workerIndex));
  },
});

export { expect } from "@playwright/test";
