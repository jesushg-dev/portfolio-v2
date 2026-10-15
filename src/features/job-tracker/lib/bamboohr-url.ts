import { ImportFromUrlError } from "@/features/job-tracker/lib/import-from-url-errors";

const TRACKING_PARAM = /^(utm_|source$|ref$|rcm$)/i;

export interface ParsedBambooHrUrl {
  subdomain: string;
  jobId: string;
  detailHref: string;
  publicHref: string;
}

function normalizeHost(hostname: string): string {
  return hostname.replace(/\.$/, "").toLowerCase();
}

/**
 * Validates whether a hostname belongs to a company's BambooHR domain (e.g., `gsdplus.bamboohr.com`).
 * Rejects root domains like `bamboohr.com` or system subdomains without a company context.
 */
export function isAllowedBambooHrHost(hostname: string): boolean {
  const host = normalizeHost(hostname);
  const parts = host.split(".");
  if (parts.length < 3) return false;

  const isBambooHr =
    (parts[parts.length - 2] === "bamboohr" &&
      parts[parts.length - 1] === "com") ||
    (parts.length >= 4 &&
      parts[parts.length - 3] === "bamboohr" &&
      parts[parts.length - 2] === "co" &&
      parts[parts.length - 1] === "uk");

  if (!isBambooHr) return false;

  const subdomain = parts[0];
  if (
    !subdomain ||
    subdomain === "www" ||
    subdomain === "api" ||
    subdomain === "staticfe"
  ) {
    return false;
  }

  return /^[a-z0-9-]+$/i.test(subdomain);
}

/** SSRF guard for BambooHR fetch hops. */
export function isSafeBambooHrHref(href: string): boolean {
  try {
    const url = new URL(href);
    if (url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    if (url.port && url.port !== "443") return false;
    return isAllowedBambooHrHost(url.hostname);
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

function extractJobId(url: URL): string | undefined {
  // Matches /careers/74 or /careers/74/detail
  const careersMatch = /\/careers\/(\d+)(?:\/detail)?\/?$/i.exec(url.pathname);
  if (careersMatch?.[1]) return careersMatch[1];

  // Matches /jobs/74
  const jobsPathMatch = /\/jobs\/(\d+)\/?$/i.exec(url.pathname);
  if (jobsPathMatch?.[1]) return jobsPathMatch[1];

  // Matches /jobs/view.php?id=74
  if (/\/jobs\/view\.php/i.test(url.pathname)) {
    const idParam = url.searchParams.get("id");
    if (idParam && /^\d+$/.test(idParam)) return idParam;
  }

  return undefined;
}

/**
 * Validate a user-pasted URL and extract BambooHR company subdomain & job ID.
 * Accepts missing protocol (`gsdplus.bamboohr.com/careers/74`).
 */
export function parseBambooHrUrl(input: string): ParsedBambooHrUrl {
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

  if (!isAllowedBambooHrHost(url.hostname)) {
    throw new ImportFromUrlError("IMPORT_UNSUPPORTED_HOST");
  }

  stripTrackingParams(url);

  const jobId = extractJobId(url);
  if (!jobId) {
    throw new ImportFromUrlError("IMPORT_UNSUPPORTED_HOST");
  }

  const host = normalizeHost(url.hostname);
  const parts = host.split(".");
  const subdomain = parts[0];

  return {
    subdomain,
    jobId,
    detailHref: `https://${host}/careers/${jobId}/detail`,
    publicHref: `https://${host}/careers/${jobId}`,
  };
}
