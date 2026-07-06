import "server-only";

import { headers } from "next/headers";
import { cache } from "react";

import { db } from "@/server/db";
import { type Locale, locales } from "@/i18n/config";

export const TENANT_HEADER = "x-tenant-id";
export const TENANT_USERNAME_HEADER = "x-tenant-username";
export const TENANT_DEFAULT_LOCALE_HEADER = "x-tenant-default-locale";

/**
 * Subdomains that are NOT tenants. Requests to these are handled by the
 * application itself (e.g. dashboard, marketing site, API).
 */
export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "dashboard",
  "app",
  "admin",
  "api",
  "auth",
]);

export interface ResolvedTenant {
  userId: string;
  username: string;
  defaultLocale: Locale;
  isPrimary: boolean;
}

const isLocaleString = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/**
 * Extracts a tenant slug from a host header.
 *
 * - `jesushg.com` / `www.jesushg.com` → null (apex / reserved)
 * - `jesus.jesushg.com` → "jesus"
 * - `jesus.lvh.me:3000` → "jesus"
 * - `localhost:3000` → null
 */
export const parseTenantSlug = (
  host: string | null | undefined,
  primaryDomain: string,
): string | null => {
  if (!host) return null;

  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  if (!hostname) return null;

  if (hostname === "localhost") return null;
  if (hostname === primaryDomain) return null;

  // Handle lvh.me (which resolves to 127.0.0.1 in dev)
  if (hostname === "lvh.me") return null;

  let suffix: string | null = null;
  if (hostname.endsWith(`.${primaryDomain}`)) {
    suffix = primaryDomain;
  } else if (hostname.endsWith(".lvh.me")) {
    suffix = "lvh.me";
  } else if (hostname.endsWith(".localhost")) {
    suffix = "localhost";
  }

  if (!suffix) return null;

  const slug = hostname.slice(0, -1 - suffix.length);
  if (!slug) return null;

  if (RESERVED_SUBDOMAINS.has(slug)) return null;

  return slug;
};

/**
 * Resolves the tenant for the current request. Looks up the user's profile
 * either by the parsed subdomain (`x-tenant-username` header set by middleware)
 * or, when the request hits the apex domain, returns the primary tenant
 * (the site owner).
 *
 * Cached per-request so multiple consumers (page + components + tRPC) share
 * a single DB lookup.
 */
export const resolveTenant = cache(async (): Promise<ResolvedTenant | null> => {
  const requestHeaders = await headers();
  const usernameHeader = requestHeaders.get(TENANT_USERNAME_HEADER);

  let profile;
  if (usernameHeader?.trim()) {
    profile = await db.profile.findUnique({
      where: { username: usernameHeader.trim() },
    });
  } else {
    // No subdomain → apex domain → return the primary tenant
    profile = await db.profile.findFirst({
      where: { isPrimary: true },
    });
  }

  if (!profile) return null;

  const defaultLocale: Locale = isLocaleString(profile.defaultLocale)
    ? profile.defaultLocale
    : "en";

  return {
    userId: profile.userId,
    username: profile.username,
    defaultLocale,
    isPrimary: profile.isPrimary,
  };
});
