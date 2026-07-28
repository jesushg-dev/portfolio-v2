import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/server/db";
import { env } from "@/env";
import {
  getSystemEmailClient,
  getSystemResetPasswordTemplateId,
} from "@/lib/email/resend";
import {
  detectLocaleFromResetUrl,
  getResetPasswordEmailCopy,
} from "@/lib/auth-email";

const PRIMARY_DOMAIN = env.PRIMARY_DOMAIN ?? "jesushg.com";

const productionBaseURL = `https://${PRIMARY_DOMAIN}`;

const DEV_DOMAIN = env.NEXT_PUBLIC_DEV_DOMAIN ?? "lvh.me:3000";

const devDomainHost = DEV_DOMAIN.replace(/^https?:\/\//, "");

const betterAuthUrlHost = env.BETTER_AUTH_URL
  ? new URL(env.BETTER_AUTH_URL).host
  : null;

/** Canonical URL for emails and other server-generated links (not per-request cookies). */
const canonicalBaseURL =
  env.BETTER_AUTH_URL ??
  (env.NODE_ENV === "production"
    ? productionBaseURL
    : DEV_DOMAIN.startsWith("http")
      ? DEV_DOMAIN
      : `http://${DEV_DOMAIN}`);

/**
 * Resolve auth base URL per request so session cookies match the browser origin.
 * `BETTER_AUTH_URL` is only a fallback/canonical URL — never a static override,
 * otherwise cookies get `Domain=lvh.me` while the app runs on localhost.
 */
const baseURL = {
  allowedHosts: [
    PRIMARY_DOMAIN,
    `*.${PRIMARY_DOMAIN}`,
    "localhost:3000",
    "127.0.0.1:3000",
    devDomainHost,
    "*.lvh.me:3000",
    ...(betterAuthUrlHost ? [betterAuthUrlHost] : []),
  ].filter((host): host is string => Boolean(host)),
  fallback: env.BETTER_AUTH_URL ?? productionBaseURL,
};

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

      const emailClient = getSystemEmailClient();

      if (
        !emailClient.isConfigured ||
        !emailClient.resend ||
        !emailClient.fromEmail
      ) {
        console.warn(
          "[better-auth][reset-password] System email delivery is not configured, skipped email send.",
        );
        return;
      }

      const resetUrl =
        data.url ??
        `${canonicalBaseURL}/reset-password?token=${data.token ?? ""}`;

      const locale = detectLocaleFromResetUrl(resetUrl);
      const resetTemplateId = getSystemResetPasswordTemplateId(locale);

      if (resetTemplateId) {
        await emailClient.resend.emails.send({
          from: emailClient.fromEmail,
          to,
          template: {
            id: resetTemplateId,
            variables: {
              RESET_URL: resetUrl,
            },
          },
        });
      } else {
        const copy = getResetPasswordEmailCopy(locale);
        await emailClient.resend.emails.send({
          from: emailClient.fromEmail,
          to,
          subject: copy.subject,
          html: `
            <p>${copy.body}</p>
            <p>
              <a href="${resetUrl}" target="_blank" rel="noreferrer">
                ${copy.link}
              </a>
            </p>
            <p>${copy.ignore}</p>
          `,
        });
      }
    },
  },
  socialProviders,
  // The trustedOrigins covers tenant subdomains in production and lvh.me in dev.
  trustedOrigins: [
    `https://${PRIMARY_DOMAIN}`,
    `https://*.${PRIMARY_DOMAIN}`,
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
