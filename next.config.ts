import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const playwrightServerAssets = [
  "./node_modules/playwright-core/browsers.json",
  "./node_modules/playwright-core/lib/**",
  "./node_modules/playwright-core/index.js",
  "./node_modules/playwright-core/index.mjs",
  "./node_modules/playwright-core/package.json",
  "./node_modules/@sparticuz/chromium-min/**",
];

const playwrightExcludeAssets = [
  "./node_modules/playwright-core/**",
  "./node_modules/@sparticuz/chromium-min/**",
];

/** Dev-only email template tooling; runtime uses compiled-templates.ts */
const emailTemplatesDevAssets = [
  "./email-templates/out/**",
  "./email-templates/node_modules/**",
  "./email-templates/publish-to-resend.ts",
  "./email-templates/render.tsx",
  "./email-templates/package.json",
  "./email-templates/package-lock.json",
  "./email-templates/tsconfig.json",
  "./email-templates/messages/**",
  "./email-templates/src/components/**",
  "./email-templates/src/contact-notification-email.tsx",
  "./email-templates/src/cv-delivery-email.tsx",
  "./email-templates/src/reset-password-email.tsx",
  "./email-templates/src/theme.ts",
  "./email-templates/src/load-messages.ts",
  "./email-templates/src/locale.ts",
];

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.localhost",
    "lvh.me",
    "*.lvh.me",
  ],
  serverExternalPackages: [
    "jszip",
    "docx-preview",
    "playwright-core",
    "@sparticuz/chromium-min",
  ],
  outputFileTracingIncludes: {
    "/api/internal/cv/generate-pdf": playwrightServerAssets,
  },
  outputFileTracingExcludes: {
    "/*": emailTemplatesDevAssets,
    "/api/trpc/*": [...playwrightExcludeAssets, ...emailTemplatesDevAssets],
    "/api/cv/pdf": [...playwrightExcludeAssets, ...emailTemplatesDevAssets],
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
