import { createEnv } from "@t3-oss/env-nextjs";
import { z, type ZodTypeAny } from "zod";

/** Vars required when NODE_ENV=production (Vercel build + runtime). */
const isProduction = process.env.NODE_ENV === "production";

function requiredInProduction<T extends ZodTypeAny>(schema: T) {
  return isProduction ? schema : schema.optional();
}

function envOrDefault(value: string | undefined, defaultValue: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : defaultValue;
}

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    MONGODB_URI: z.string(),

    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Better Auth
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: requiredInProduction(z.string().url()),
    RESEND_API_KEY: z.string().optional(),
    RESEND_EMAIL_DOMAIN: z.string().optional(),

    // Resend template IDs for system auth emails (run `cd email-templates && npm run publish:resend`)
    RESEND_TEMPLATE_RESET_EN: z.string().optional(),
    RESEND_TEMPLATE_RESET_ES: z.string().optional(),
    RESEND_TEMPLATE_RESET_NL: z.string().optional(),
    RESEND_TEMPLATE_TWO_FACTOR_EN: z.string().optional(),
    RESEND_TEMPLATE_TWO_FACTOR_ES: z.string().optional(),
    RESEND_TEMPLATE_TWO_FACTOR_NL: z.string().optional(),

    // OAuth providers (optional - only needed if you want social login)
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    // Multi-tenant
    PRIMARY_DOMAIN: z.string().default("jesushg.com"),

    // UploadThing is configured per tenant in Admin → Credentials
    UPLOADTHING_TOKEN: z.string().optional(),

    /// Shared secret for the isolated CV PDF generator function
    CV_PDF_GENERATOR_SECRET: requiredInProduction(z.string().min(16)),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_PRIMARY_DOMAIN: z.string().default("jesushg.com"),
    NEXT_PUBLIC_DEV_DOMAIN: z.string().default("lvh.me:3000"),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    MONGODB_URI: process.env.MONGODB_URI,
    NODE_ENV: process.env.NODE_ENV,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_EMAIL_DOMAIN: process.env.RESEND_EMAIL_DOMAIN,
    RESEND_TEMPLATE_RESET_EN: process.env.RESEND_TEMPLATE_RESET_EN,
    RESEND_TEMPLATE_RESET_ES: process.env.RESEND_TEMPLATE_RESET_ES,
    RESEND_TEMPLATE_RESET_NL: process.env.RESEND_TEMPLATE_RESET_NL,
    RESEND_TEMPLATE_TWO_FACTOR_EN: process.env.RESEND_TEMPLATE_TWO_FACTOR_EN,
    RESEND_TEMPLATE_TWO_FACTOR_ES: process.env.RESEND_TEMPLATE_TWO_FACTOR_ES,
    RESEND_TEMPLATE_TWO_FACTOR_NL: process.env.RESEND_TEMPLATE_TWO_FACTOR_NL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    PRIMARY_DOMAIN: envOrDefault(process.env.PRIMARY_DOMAIN, "jesushg.com"),
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    CV_PDF_GENERATOR_SECRET: process.env.CV_PDF_GENERATOR_SECRET,
    NEXT_PUBLIC_PRIMARY_DOMAIN: envOrDefault(
      process.env.NEXT_PUBLIC_PRIMARY_DOMAIN,
      "jesushg.com",
    ),
    NEXT_PUBLIC_DEV_DOMAIN: envOrDefault(
      process.env.NEXT_PUBLIC_DEV_DOMAIN,
      "lvh.me:3000",
    ),
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
