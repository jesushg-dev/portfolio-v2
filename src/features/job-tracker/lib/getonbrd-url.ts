import { ImportFromUrlError } from "@/features/job-tracker/lib/import-from-url-errors";

const TRACKING_PARAM = /^(utm_|source$|ref$|rcm$)/i;

export interface ParsedGetOnBrdUrl {
  href: string;
  category?: string;
  slug: string;
}

function normalizeHost(hostname: string): string {
  return hostname.replace(/\.$/, "").toLowerCase();
}

/**
 * Validates whether a hostname belongs to Get on Board (e.g., `getonbrd.com`, `www.getonbrd.com`, `getonbrd.cl`, `getonbrd.pe`).
 */
export function isAllowedGetOnBrdHost(hostname: string): boolean {
  const host = normalizeHost(hostname);
  return (
    host === "getonbrd.com" ||
    host.endsWith(".getonbrd.com") ||
    host === "getonbrd.cl" ||
    host.endsWith(".getonbrd.cl") ||
    host === "getonbrd.pe" ||
    host.endsWith(".getonbrd.pe")
  );
}

/** SSRF guard for Get on Board fetch hops. */
export function isSafeGetOnBrdHref(href: string): boolean {
  try {
    const url = new URL(href);
    if (url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    if (url.port && url.port !== "443") return false;
    return isAllowedGetOnBrdHost(url.hostname);
  } catch {
    return false;
  }
}

function stripTrackingParams(url: URL): void {
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAM.test(key)) {
      url.searchParams.delete(key);
    }
  }
}

function extractJobParts(
  pathname: string,
): { category?: string; slug: string } | undefined {
  // Matches /jobs/programming/fullstack-developer-... or /jobs/fullstack-developer-...
  const matchWithCategory = /^\/jobs\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/i.exec(
    pathname,
  );
  if (matchWithCategory?.[1] && matchWithCategory?.[2]) {
    return {
      category: matchWithCategory[1],
      slug: matchWithCategory[2],
    };
  }

  const matchDirect = /^\/jobs\/([a-z0-9-]+)\/?$/i.exec(pathname);
  if (matchDirect?.[1]) {
    return {
      slug: matchDirect[1],
    };
  }

  return undefined;
}

/**
 * Validate a user-pasted URL and extract Get on Board job details.
 * Accepts missing protocol (`getonbrd.com/jobs/programming/fullstack-developer-node-js...`).
 */
export function parseGetOnBrdUrl(input: string): ParsedGetOnBrdUrl {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new ImportFromUrlError("IMPORT_INVALID_URL");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new ImportFromUrlError("IMPORT_INVALID_URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ImportFromUrlError("IMPORT_INVALID_URL");
  }

  url.protocol = "https:";
  url.hash = "";

  if (url.username || url.password) {
    throw new ImportFromUrlError("IMPORT_INVALID_URL");
  }

  if (!isAllowedGetOnBrdHost(url.hostname)) {
    throw new ImportFromUrlError("IMPORT_UNSUPPORTED_HOST");
  }

  stripTrackingParams(url);

  const parts = extractJobParts(url.pathname);
  if (!parts) {
    throw new ImportFromUrlError("IMPORT_UNSUPPORTED_HOST");
  }

  return {
    href: url.toString().replace(/\/$/, "") || url.toString(),
    category: parts.category,
    slug: parts.slug,
  };
}
