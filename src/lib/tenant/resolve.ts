import "server-only";

import { headers } from "next/headers";
import { cache } from "react";

import { env } from "@/env";
import { db } from "@/server/db";
import { type Locale, locales } from "@/i18n/config";
import {
  CV_PDF_TENANT_PROOF_HEADER,
  TENANT_DEFAULT_LOCALE_HEADER,
  TENANT_HEADER,
  TENANT_USERNAME_HEADER,
} from "@/lib/tenant/headers";
import {
  getPrimaryDomain,
  requestHostFromHeaders,
} from "@/lib/tenant/parse-host";
import { resolveTenantIdentity } from "@/lib/tenant/resolve-identity";

export { TENANT_DEFAULT_LOCALE_HEADER, TENANT_HEADER, TENANT_USERNAME_HEADER };

export { RESERVED_SUBDOMAINS, parseTenantSlug } from "@/lib/tenant/parse-host";

export interface ResolvedTenant {
  userId: string;
  username: string;
  defaultLocale: Locale;
  isPrimary: boolean;
  isPublished: boolean;
  displayName: string | null;
  logoInitials: string | null;
  logoImageUrl: string | null;
}

const isLocaleString = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

function profileToTenant(profile: {
  userId: string;
  username: string;
  defaultLocale: string;
  isPrimary: boolean;
  isPublished: boolean;
  displayName: string | null;
  logoInitials: string | null;
  logoImageUrl: string | null;
}): ResolvedTenant {
  const defaultLocale: Locale = isLocaleString(profile.defaultLocale)
    ? profile.defaultLocale
    : "en";

  return {
    userId: profile.userId,
    username: profile.username,
    defaultLocale,
    isPrimary: profile.isPrimary,
    isPublished: profile.isPublished,
    displayName: profile.displayName,
    logoInitials: profile.logoInitials,
    logoImageUrl: profile.logoImageUrl,
  };
}

/**
 * Resolves the tenant for the current request.
 *
 * Host is the source of truth (including `/api/trpc`, which does not run
 * through intl middleware). A tenant subdomain must never fall back to the
 * primary owner — that leaks Spotify, projects, and CV across portfolios.
 * Client `x-tenant-username` is ignored unless Playwright PDF generation
 * sends a HMAC (`x-cv-pdf-tenant-proof`) using `CV_PDF_GENERATOR_SECRET`.
 *
 * Cached per-request so multiple consumers share a single DB lookup.
 */
export const resolveTenant = cache(async (): Promise<ResolvedTenant | null> => {
  const requestHeaders = await headers();
  const identity = resolveTenantIdentity({
    host: requestHostFromHeaders(requestHeaders),
    primaryDomain: getPrimaryDomain(),
    headerUsername: requestHeaders.get(TENANT_USERNAME_HEADER) ?? "",
    pdfTenantProof: requestHeaders.get(CV_PDF_TENANT_PROOF_HEADER) ?? "",
    pdfGeneratorSecret: env.CV_PDF_GENERATOR_SECRET,
  });

  if (identity.type === "slug") {
    const profile = await db.profile.findUnique({
      where: { username: identity.slug },
    });
    if (!profile) return null;
    return profileToTenant(profile);
  }

  const primary = await db.profile.findFirst({
    where: { isPrimary: true },
  });
  if (!primary) return null;
  return profileToTenant(primary);
});
