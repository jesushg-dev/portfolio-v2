import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

/** @type {import("jest").Config} */
const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/test-utils/setup.ts"],
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  modulePathIgnorePatterns: ["<rootDir>/temp-aceternity/"],
  watchPathIgnorePatterns: ["<rootDir>/temp-aceternity/"],
  testTimeout: 15000,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default async function createCustomJestConfig() {
  const makeConfig = createJestConfig(config);
  const finalConfig = await makeConfig();
  finalConfig.transformIgnorePatterns = [
    "/node_modules/(?!(@tanstack/react-table|@tanstack/table-core|@tanstack/react-store|@tanstack/store)/)",
  ];
  return finalConfig;
}
