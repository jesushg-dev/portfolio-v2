import { test as base } from "@playwright/test";

import { getWorkerAuthFile } from "./helpers/auth-state";

/**
 * Admin specs must import `test` from this module so each Playwright worker
 * uses its own auth file.
 *
 * `storageState` must be a fixture (not `getWorkerAuthFile()` at module load).
 * Resolve the parallel slot inside the fixture; workerIndex increases on
 * replacement and would lose the slot's account after a failed test.
 */
export const test = base.extend({
  storageState: async ({}, provideStorageState, testInfo) => {
    await provideStorageState(getWorkerAuthFile(testInfo.parallelIndex));
  },
});

export { expect } from "@playwright/test";
