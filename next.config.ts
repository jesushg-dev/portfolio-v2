import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const playwrightServerAssets = [
  "./node_modules/playwright-core/browsers.json",
  "./node_modules/playwright-core/lib/**",
  "./node_modules/playwright-core/index.js",
  "./node_modules/playwright-core/index.mjs",
  "./node_modules/playwright-core/package.json",
  "./node_modules/.pnpm/playwright-core@*/node_modules/playwright-core/browsers.json",
  "./node_modules/.pnpm/playwright-core@*/node_modules/playwright-core/lib/**",
  "./node_modules/.pnpm/playwright-core@*/node_modules/playwright-core/index.js",
  "./node_modules/.pnpm/playwright-core@*/node_modules/playwright-core/index.mjs",
  "./node_modules/.pnpm/playwright-core@*/node_modules/playwright-core/package.json",
  "./node_modules/@sparticuz/chromium-min/**",
  "./node_modules/.pnpm/@sparticuz+chromium-min@*/node_modules/@sparticuz/chromium-min/**",
];

const playwrightExcludeAssets = [
  "./node_modules/playwright-core/**",
  "./node_modules/.pnpm/playwright-core@*/**",
  "./node_modules/@sparticuz/chromium-min/**",
  "./node_modules/.pnpm/@sparticuz+chromium-min@*/**",
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["lvh.me", "*.lvh.me"],
  serverExternalPackages: [
    "jszip",
    "playwright-core",
    "@sparticuz/chromium-min",
  ],
  outputFileTracingIncludes: {
    "/api/internal/cv/generate-pdf": playwrightServerAssets,
  },
  outputFileTracingExcludes: {
    "/api/trpc/*": playwrightExcludeAssets,
    "/api/cv/pdf": playwrightExcludeAssets,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion/react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.simpleicons.org",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
