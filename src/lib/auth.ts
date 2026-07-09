import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/server/db";
import { env } from "@/env";
import {
  isResendConfigured,
  resend,
  resendFromEmail,
} from "@/lib/email/resend";

const fallbackBaseURL =
  env.NODE_ENV === "production"
    ? `https://${env.PRIMARY_DOMAIN}`
    : env.NEXT_PUBLIC_DEV_DOMAIN.startsWith("http")
      ? env.NEXT_PUBLIC_DEV_DOMAIN
      : `http://${env.NEXT_PUBLIC_DEV_DOMAIN}`;

const baseURL = env.BETTER_AUTH_URL ?? fallbackBaseURL;

const socialProviders: Record<
  string,
  { clientId: string; clientSecret: string }
> = {};

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  };
}

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "mongodb",
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    sendResetPassword: async (data: {
      user?: { email?: string };
      token?: string;
      url?: string;
    }) => {
      const to = data.user?.email;
      if (!to) return;

      // Keep logs available for local debugging.
      console.log("[better-auth][reset-password] email:", to);
      console.log("[better-auth][reset-password] token:", data.token);
      console.log("[better-auth][reset-password] url:", data.url);

      if (!isResendConfigured() || !resend || !resendFromEmail) {
        console.warn(
          "[better-auth][reset-password] RESEND_API_KEY or RESEND_EMAIL_DOMAIN missing, skipped email send.",
        );
        return;
      }

      const resetUrl =
        data.url ?? `${baseURL}/reset-password?token=${data.token ?? ""}`;

      await resend.emails.send({
        from: resendFromEmail,
        to,
        subject: "Reset your password",
        html: `
          <p>You requested to reset your password.</p>
          <p>
            <a href="${resetUrl}" target="_blank" rel="noreferrer">
              Click here to reset your password
            </a>
          </p>
          <p>If you didn't request this, you can ignore this email.</p>
        `,
      });
    },
  },
  socialProviders,
  // The trustedOrigins covers tenant subdomains in production and lvh.me in dev.
  trustedOrigins: [
    `https://${env.PRIMARY_DOMAIN}`,
    `https://*.${env.PRIMARY_DOMAIN}`,
    "http://lvh.me:3000",
    "http://*.lvh.me:3000",
    "http://localhost:3000",
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: env.NODE_ENV === "production",
    },
    database: {
      // User/Account/Session use @db.ObjectId — let Prisma generate them.
      // Verification keeps Better Auth string ids (cuid-compatible).
      generateId: (options): string | false => {
        const model = options.model.toLowerCase();
        if (model === "user" || model === "account" || model === "session") {
          return false;
        }
        return crypto.randomUUID();
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
