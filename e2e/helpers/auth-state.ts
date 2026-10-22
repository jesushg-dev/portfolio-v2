import path from "node:path";

/**
 * Each parallel slot retains its account when Playwright replaces a worker.
 * Missing setup state must fail rather than sharing another account.
 */
export function getWorkerAuthFile(parallelIndex: number): string {
  return path.join(
    process.cwd(),
    `e2e/.auth/user-worker-${parallelIndex}.json`,
  );
}
