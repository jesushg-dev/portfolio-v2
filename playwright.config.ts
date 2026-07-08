import { defineConfig, devices } from "@playwright/test";

import { e2eEnv } from "./e2e/env";

const authFile = "e2e/.auth/user.json";

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
    trace: "on-first-retry",
    screenshot: "only-on-failure",
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
      name: "smoke",
      testMatch:
        /(dashboard|skills-smoke|projects-smoke|certifications-smoke)\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
    {
      name: "skills",
      testMatch: /skills-create\.spec\.ts/,
      dependencies: ["setup"],
      timeout: 45 * 60 * 1000,
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
    {
      name: "projects",
      testMatch: /projects-create\.spec\.ts/,
      dependencies: ["setup"],
      timeout: 45 * 60 * 1000,
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
    {
      name: "certifications",
      testMatch: /certifications-create\.spec\.ts/,
      dependencies: ["setup"],
      timeout: 60 * 60 * 1000,
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
