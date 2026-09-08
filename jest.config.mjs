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
  collectCoverageFrom: [
    "src/lib/**/*.{ts,tsx}",
    "src/hooks/**/*.{ts,tsx}",
    "src/utils/**/*.{ts,tsx}",
    "src/server/**/*.{ts,tsx}",
    "src/features/**/lib/**/*.{ts,tsx}",
    "src/features/**/server/**/*.{ts,tsx}",
    "src/proxy.ts",
    "src/app/sitemap.ts",
    "src/app/api/**/*.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!src/test-utils/**",
    "!src/lib/auth.ts",
    "!src/lib/google-calendar/connection.ts",
    "!src/lib/google-calendar/api.ts",
    "!src/lib/integrations/resend-tenant-publisher.ts",
    "!src/utils/services/spotify.ts",
    "!src/features/resume-engine/lib/ai/tailor-docx.ts",
    "!src/features/resume-engine/lib/docx/**",
    "!src/features/resume-engine/lib/generate-pdf-from-docx.ts",
    "!src/features/cv/lib/generate-cv-pdf-from-preview.ts",
    "!src/app/api/google-calendar/callback/route.ts",
    "!src/app/api/spotify/callback/route.ts",
    "!src/app/api/cv/docx/route.ts",
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/src/components/ui/",
  ],
};

export default async function createCustomJestConfig() {
  const makeConfig = createJestConfig(config);
  const finalConfig = await makeConfig();
  finalConfig.transformIgnorePatterns = [
    "/node_modules/(?!(@tanstack/react-table|@tanstack/table-core|@tanstack/react-store|@tanstack/store|superjson|copy-anything|is-what|@stepperize/react)/)",
  ];
  return finalConfig;
}
