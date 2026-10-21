/**
 * Host parsing for multi-tenant subdomains. Keep this file free of
 * `server-only` so middleware/proxy and unit tests can share it.
 */

export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "dashboard",
  "app",
  "admin",
  "api",
  "auth",
]);

export const DEFAULT_PRIMARY_DOMAIN = "jesushg.com";

export function getPrimaryDomain(): string {
  const fromEnv = process.env.PRIMARY_DOMAIN?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_PRIMARY_DOMAIN;
}

export function requestHostFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-host");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("host");
}

/**
 * Extracts a tenant slug from a host header.
 *
 * - `jesushg.com` / `www.jesushg.com` → null (apex / reserved)
 * - `jesus.jesushg.com` → "jesus"
 * - `jesus.lvh.me:3000` → "jesus"
 * - `lola.localhost:3000` → "lola"
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
