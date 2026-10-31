import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

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
  "./email-templates/src/two-factor-otp-email.tsx",
  "./email-templates/src/theme.ts",
  "./email-templates/src/load-messages.ts",
  "./email-templates/src/locale.ts",
];

const isProduction = process.env.NODE_ENV === "production";

/**
 * Baseline hardening headers. `script-src`/`style-src` are intentionally not
 * restricted yet (Next inline runtime + third-party embeds need nonces first);
 * the CSP below only locks framing, plugins, base URI and form targets.
 */
const securityHeaders: { key: string; value: string }[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "publickey-credentials-get=(self)",
      "publickey-credentials-create=(self)",
    ].join(", "),
  },
  {
    key: "Content-Security-Policy",
    value: [
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      ...(isProduction ? ["upgrade-insecure-requests"] : []),
    ].join("; "),
  },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  poweredByHeader: false,
  headers() {
    return Promise.resolve([{ source: "/(.*)", headers: securityHeaders }]);
  },
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.localhost",
    "lvh.me",
    "*.lvh.me",
  ],
  serverExternalPackages: ["jszip"],
  outputFileTracingExcludes: {
    "/**/*": emailTemplatesDevAssets,
    "/api/trpc/*": emailTemplatesDevAssets,
  },
  experimental: {
    globalNotFound: true,
    inlineCss: true,
    optimizePackageImports: [
      "lucide-react",
      "motion/react",
      "@base-ui/react",
      "date-fns",
      "d3",
    ],
  },
  images: {
    deviceSizes: [480, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
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
