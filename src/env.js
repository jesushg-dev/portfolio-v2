import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/** Vars required when NODE_ENV=production (Vercel build + runtime). */
const isProduction = process.env.NODE_ENV === "production";

function requiredInProduction<T extends z.ZodType>(schema: T) {
  return isProduction ? schema : schema.optional();
}

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    MONGODB_URI: z.string(),
    SPOTIFY_REDIRECT_URI: z.string().url().optional(),

    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Better Auth
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: requiredInProduction(z.string().url()),
    RESEND_API_KEY: z.string().optional(),
    RESEND_EMAIL_DOMAIN: z.string().optional(),

    // OAuth providers (optional - only needed if you want social login)
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    // Multi-tenant
    PRIMARY_DOMAIN: z.string().default("jesushg.com"),

    // UploadThing (CV PDF cache, resume imports, admin uploads)
    UPLOADTHING_TOKEN: requiredInProduction(z.string().min(1)),

    // AI providers (resume import / tailor)
    DEFAULT_AI_PROVIDER: z
      .enum(["claude", "openai", "deepseek", "gemini"])
      .optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    DEEPSEEK_API_KEY: z.string().optional(),

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
    SPOTIFY_REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_EMAIL_DOMAIN: process.env.RESEND_EMAIL_DOMAIN,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    PRIMARY_DOMAIN: process.env.PRIMARY_DOMAIN,
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    DEFAULT_AI_PROVIDER: process.env.DEFAULT_AI_PROVIDER,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    CV_PDF_GENERATOR_SECRET: process.env.CV_PDF_GENERATOR_SECRET,
    NEXT_PUBLIC_PRIMARY_DOMAIN: process.env.NEXT_PUBLIC_PRIMARY_DOMAIN,
    NEXT_PUBLIC_DEV_DOMAIN: process.env.NEXT_PUBLIC_DEV_DOMAIN,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
