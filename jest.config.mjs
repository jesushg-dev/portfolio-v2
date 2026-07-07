import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

/** @type {import("jest").Config} */
const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/test-utils/setup.ts"],
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  modulePathIgnorePatterns: ["<rootDir>/temp-aceternity/"],
  watchPathIgnorePatterns: ["<rootDir>/temp-aceternity/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default createJestConfig(config);
