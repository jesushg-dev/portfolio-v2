import "server-only";

import { headers } from "next/headers";
import { cache } from "react";

import { db } from "@/server/db";
import { type Locale, locales } from "@/i18n/config";
import {
  getPrimaryDomain,
  parseTenantSlug,
  requestHostFromHeaders,
} from "@/lib/tenant/parse-host";

export const TENANT_HEADER = "x-tenant-id";
export const TENANT_USERNAME_HEADER = "x-tenant-username";
export const TENANT_DEFAULT_LOCALE_HEADER = "x-tenant-default-locale";

export { RESERVED_SUBDOMAINS, parseTenantSlug } from "@/lib/tenant/parse-host";

export interface ResolvedTenant {
  userId: string;
  username: string;
  defaultLocale: Locale;
  isPrimary: boolean;
  isPublished: boolean;
}

const isLocaleString = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

function profileToTenant(profile: {
  userId: string;
  username: string;
  defaultLocale: string;
  isPrimary: boolean;
  isPublished: boolean;
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
  };
}

/**
 * Resolves the tenant for the current request.
 *
 * Host is the source of truth (including `/api/trpc`, which does not run
 * through intl middleware). A tenant subdomain must never fall back to the
 * primary owner — that leaks Spotify, projects, and CV across portfolios.
 *
 * Cached per-request so multiple consumers share a single DB lookup.
 */
export const resolveTenant = cache(async (): Promise<ResolvedTenant | null> => {
  const requestHeaders = await headers();
  const hostSlug = parseTenantSlug(
    requestHostFromHeaders(requestHeaders),
    getPrimaryDomain(),
  );
  const headerSlug = requestHeaders.get(TENANT_USERNAME_HEADER)?.trim() ?? "";
  const slug = hostSlug ?? (headerSlug || null);

  if (slug) {
    const profile = await db.profile.findUnique({
      where: { username: slug },
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
