import fs from "node:fs";
import path from "node:path";

/**
 * Returns the path to the worker-specific storageState auth file,
 * falling back to `e2e/.auth/user.json` if the worker file does not exist.
 */
export function getWorkerAuthFile(workerIndex?: number): string {
  const index =
    workerIndex ??
    Number.parseInt(process.env.TEST_WORKER_INDEX ?? "0", 10);

  const workerAuthFile = path.join(
    process.cwd(),
    `e2e/.auth/user-worker-${index}.json`,
  );

  if (fs.existsSync(workerAuthFile)) {
    return workerAuthFile;
  }

  return path.join(process.cwd(), "e2e/.auth/user.json");
}
