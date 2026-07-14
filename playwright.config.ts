import { defineConfig, devices } from "@playwright/test";

import { e2eEnv } from "./e2e/env";

const authFile = "e2e/.auth/user.json";

const isLocalTarget =
  e2eEnv.baseURL.startsWith("http://localhost") ||
  e2eEnv.baseURL.startsWith("http://127.0.0.1");

const webServer = isLocalTarget
  ? process.env.CI
    ? {
        command: "pnpm build && pnpm start",
        url: "http://localhost:3000",
        timeout: 180_000,
      }
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      }
  : undefined;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
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
      testMatch: /login\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "public-locale",
      testMatch: /locale-switching\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "smoke",
      testMatch:
        /(dashboard|register-smoke|skills-smoke|projects-smoke|certifications-smoke|cv-smoke|profile-smoke|timeline-smoke|soft-skills-smoke|locale-switching)\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
    {
      name: "register",
      testMatch: /register-create\.spec\.ts/,
      timeout: 10 * 60 * 1000,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "skills",
      testMatch: "**/skills-create.spec.ts",
      dependencies: ["setup"],
      timeout: 45 * 60 * 1000,
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
    {
      name: "projects",
      testMatch: "**/projects-create.spec.ts",
      dependencies: ["setup"],
      timeout: 45 * 60 * 1000,
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
    {
      name: "certifications",
      testMatch: "**/certifications-create.spec.ts",
      dependencies: ["setup"],
      timeout: 60 * 60 * 1000,
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
    {
      name: "profile",
      testMatch: "**/profile-create.spec.ts",
      dependencies: ["setup"],
      timeout: 30 * 60 * 1000,
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
    {
      name: "timeline",
      testMatch: "**/timeline-create.spec.ts",
      dependencies: ["setup"],
      timeout: 45 * 60 * 1000,
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
    {
      name: "soft-skills",
      testMatch: "**/soft-skills-create.spec.ts",
      dependencies: ["setup"],
      timeout: 30 * 60 * 1000,
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
    {
      name: "cv",
      testMatch: "**/cv-create.spec.ts",
      dependencies: ["setup"],
      timeout: 60 * 60 * 1000,
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
    {
      name: "pagination",
      testMatch: "**/*-pagination.spec.ts",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
  ],
  ...(webServer ? { webServer } : {}),
});
