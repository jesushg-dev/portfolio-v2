import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { haveIBeenPwned, twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";

import { db } from "@/server/db";
import { env } from "@/env";
import {
  getSystemEmailClient,
  getSystemResetPasswordTemplateId,
  getSystemTwoFactorOtpTemplateId,
} from "@/lib/email/resend";
import {
  detectLocaleFromRequestHeaders,
  detectLocaleFromResetUrl,
  getResetPasswordEmailCopy,
  getTwoFactorOtpEmailCopy,
} from "@/lib/auth-email";
import { resolvePasskeyRelyingParty } from "@/lib/auth-passkey-rp";

const APP_NAME = "Jehg";

const PRIMARY_DOMAIN = env.PRIMARY_DOMAIN ?? "jesushg.com";

const IS_PRODUCTION = env.NODE_ENV === "production";

/** 5 minutes, matches the copy in the OTP email. */
const TWO_FACTOR_OTP_PERIOD_SECONDS = 5 * 60;

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

const passkeyRelyingParty = resolvePasskeyRelyingParty({
  nodeEnv: env.NODE_ENV,
  primaryDomain: PRIMARY_DOMAIN,
  devDomain: DEV_DOMAIN,
  betterAuthUrl: env.BETTER_AUTH_URL,
});

/**
 * Email OTP fallback for two-factor sign-in. Reuses the platform Resend client;
 * in development the code is also logged so the flow can be tested without Resend.
 */
async function sendTwoFactorOtpEmail(
  data: { user: { email: string }; otp: string },
  ctx?: { headers?: Headers },
): Promise<void> {
  const to = data.user.email;

  if (!IS_PRODUCTION) {
    console.log("[better-auth][two-factor] email:", to);
    console.log("[better-auth][two-factor] otp:", data.otp);
  }

  const emailClient = getSystemEmailClient();
  if (
    !emailClient.isConfigured ||
    !emailClient.resend ||
    !emailClient.fromEmail
  ) {
    console.warn(
      "[better-auth][two-factor] System email delivery is not configured, skipped OTP email.",
    );
    return;
  }

  const locale = detectLocaleFromRequestHeaders(ctx?.headers);
  const templateId = getSystemTwoFactorOtpTemplateId(locale);

  if (templateId) {
    await emailClient.resend.emails.send({
      from: emailClient.fromEmail,
      to,
      template: {
        id: templateId,
        variables: { OTP_CODE: data.otp },
      },
    });
    return;
  }

  const copy = getTwoFactorOtpEmailCopy(locale);
  await emailClient.resend.emails.send({
    from: emailClient.fromEmail,
    to,
    subject: copy.subject,
    html: `
      <p>${copy.greeting}</p>
      <p>${copy.body}</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:0.3em;font-family:monospace">${data.otp}</p>
      <p>${copy.expires}</p>
      <p>${copy.ignore}</p>
    `,
  });
}

export const auth = betterAuth({
  appName: APP_NAME,
  database: prismaAdapter(db, {
    provider: "mongodb",
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL,
  // Better Auth 1.7 keys accounts on (issuer, accountId). 1.7.2 always uses the
  // provider-scoped namespaces ("local:credential", "local:oauth:<provider>"),
  // which is what prisma/scripts/backfill-account-issuer.ts wrote for 1.6 rows.
  // If a later 1.7.x adds `account.identityStrategy`, set it to "provider-id".
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

      if (!IS_PRODUCTION) {
        console.log("[better-auth][reset-password] email:", to);
        console.log("[better-auth][reset-password] token:", data.token);
        console.log("[better-auth][reset-password] url:", data.url);
      }

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
  // Tenant subdomains in production; local dev hosts only outside production.
  trustedOrigins: [
    `https://${PRIMARY_DOMAIN}`,
    `https://*.${PRIMARY_DOMAIN}`,
    ...(IS_PRODUCTION
      ? []
      : [
          "http://lvh.me:3000",
          "http://*.lvh.me:3000",
          "http://localhost:3000",
          "http://127.0.0.1:3000",
        ]),
  ],
  rateLimit: {
    // Better Auth only rate limits in production by default; keep that so e2e
    // workers are not throttled, but persist counters in MongoDB because Vercel
    // functions do not share memory.
    enabled: IS_PRODUCTION,
    storage: "database",
    modelName: "rateLimit",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-in/passkey": { window: 60, max: 10 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 60, max: 3 },
      "/forget-password": { window: 60, max: 3 },
      "/two-factor/send-otp": { window: 60, max: 3 },
      "/two-factor/verify-totp": { window: 60, max: 5 },
      "/two-factor/verify-otp": { window: 60, max: 5 },
      "/two-factor/verify-backup-code": { window: 60, max: 5 },
    },
  },
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
  plugins: [
    twoFactor({
      issuer: APP_NAME,
      totpOptions: { digits: 6, period: 30 },
      backupCodeOptions: { amount: 10, length: 10 },
      otpOptions: {
        period: TWO_FACTOR_OTP_PERIOD_SECONDS,
        digits: 6,
        allowedAttempts: 5,
        sendOTP: sendTwoFactorOtpEmail,
      },
    }),
    passkey({
      rpID: passkeyRelyingParty.rpID,
      rpName: passkeyRelyingParty.rpName,
      // Always require biometrics/PIN: a passkey sign-in bypasses the 2FA step by design.
      authenticatorSelection: {
        userVerification: "required",
        residentKey: "preferred",
      },
    }),
    // Reject passwords that appear in known breaches on sign-up / reset.
    // Production only: it needs outbound network access and e2e fixtures use
    // throwaway passwords that are (by design) not unique.
    ...(IS_PRODUCTION ? [haveIBeenPwned()] : []),
    // Keep last so it can set cookies from server actions.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
