import { defineConfig, devices } from "@playwright/test";

import { e2eEnv } from "./e2e/env";
import { getWorkerAuthFile } from "./e2e/helpers/auth-state";

const isLocalTarget =
  e2eEnv.baseURL.startsWith("http://localhost") ||
  e2eEnv.baseURL.startsWith("http://127.0.0.1");

const webServer = isLocalTarget
  ? process.env.CI
    ? {
        command: "pnpm build && pnpm start",
        url: "http://127.0.0.1:3000",
        timeout: 180_000,
      }
    : {
        command: "pnpm dev",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      }
  : undefined;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.E2E_WORKERS
    ? Number.parseInt(process.env.E2E_WORKERS, 10)
    : process.env.CI
      ? 2
      : 4,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: e2eEnv.baseURL,
    actionTimeout: 15_000,
    ...(e2eEnv.vercelBypassHeaders
      ? { extraHTTPHeaders: e2eEnv.vercelBypassHeaders }
      : {}),
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "login",
      testMatch: "**/login.spec.ts",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "public-locale",
      testMatch: "**/locale-switching.spec.ts",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "a11y",
      testMatch: "**/a11y-*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "skills",
      testMatch: "**/skills-*.spec.ts",
      dependencies: ["setup"],
      timeout: 45 * 60 * 1000,
      use: {
        ...devices["Desktop Chrome"],
        storageState: getWorkerAuthFile(),
      },
    },
    {
      name: "services",
      testMatch: "**/services-*.spec.ts",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: getWorkerAuthFile(),
      },
    },
    {
      name: "projects",
      testMatch: "**/projects-*.spec.ts",
      dependencies: ["setup"],
      timeout: 45 * 60 * 1000,
      use: {
        ...devices["Desktop Chrome"],
        storageState: getWorkerAuthFile(),
      },
    },
    {
      name: "certifications",
      testMatch: "**/certifications-*.spec.ts",
      dependencies: ["setup"],
      timeout: 60 * 60 * 1000,
      use: {
        ...devices["Desktop Chrome"],
        storageState: getWorkerAuthFile(),
      },
    },
    {
      name: "profile",
      testMatch: "**/profile-*.spec.ts",
      dependencies: ["setup"],
      timeout: 30 * 60 * 1000,
      use: {
        ...devices["Desktop Chrome"],
        storageState: getWorkerAuthFile(),
      },
    },
    {
      name: "timeline",
      testMatch: "**/timeline-*.spec.ts",
      dependencies: ["setup"],
      timeout: 45 * 60 * 1000,
      use: {
        ...devices["Desktop Chrome"],
        storageState: getWorkerAuthFile(),
      },
    },
    {
      name: "soft-skills",
      testMatch: "**/soft-skills-*.spec.ts",
      dependencies: ["setup"],
      timeout: 30 * 60 * 1000,
      use: {
        ...devices["Desktop Chrome"],
        storageState: getWorkerAuthFile(),
      },
    },
    {
      name: "cv",
      testMatch: "**/cv-*.spec.ts",
      dependencies: ["setup"],
      timeout: 60 * 60 * 1000,
      use: {
        ...devices["Desktop Chrome"],
        storageState: getWorkerAuthFile(),
      },
    },
    {
      name: "jobs",
      testMatch: "**/job*.spec.ts",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: getWorkerAuthFile(),
      },
    },
    {
      name: "credentials",
      testMatch: "**/credentials.spec.ts",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: getWorkerAuthFile(),
      },
    },
    {
      name: "dashboard",
      testMatch: "**/dashboard.spec.ts",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: getWorkerAuthFile(),
      },
    },
    {
      name: "register",
      testMatch: "**/register-*.spec.ts",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  ...(webServer ? { webServer } : {}),
});
