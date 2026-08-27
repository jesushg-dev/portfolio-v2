import { ImportFromUrlError } from "@/features/job-tracker/lib/import-from-url-errors";

const TRACKING_PARAM = /^(utm_|rcm$)/i;

export type LinkedInSourceType = "job" | "post";

export interface ParsedLinkedInUrl {
  href: string;
  sourceType: LinkedInSourceType;
  jobId?: string;
  activityId?: string;
}

function normalizeHost(hostname: string): string {
  return hostname.replace(/\.$/, "").toLowerCase();
}

export function isAllowedLinkedInHost(hostname: string): boolean {
  const host = normalizeHost(hostname);
  return host === "linkedin.com" || host.endsWith(".linkedin.com");
}

/** SSRF guard for any LinkedIn fetch hop (guest API, redirects). */
export function isSafeLinkedInHref(href: string): boolean {
  try {
    const url = new URL(href);
    if (url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    if (url.port && url.port !== "443") return false;
    return isAllowedLinkedInHost(url.hostname);
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
  const viewMatch = /\/jobs\/view\/(?:[^/]*-)?(\d+)\/?$/i.exec(url.pathname);
  if (viewMatch?.[1]) return viewMatch[1];
  const currentJobId = url.searchParams.get("currentJobId");
  if (currentJobId && /^\d+$/.test(currentJobId)) return currentJobId;
  return undefined;
}

function extractActivityId(pathname: string): string | undefined {
  const activityMatch = /activity-(\d+)/i.exec(pathname);
  if (activityMatch?.[1]) return activityMatch[1];
  const urnMatch = /urn:li:activity:(\d+)/i.exec(pathname);
  if (urnMatch?.[1]) return urnMatch[1];
  const ugcMatch = /urn:li:ugcPost:(\d+)/i.exec(pathname);
  if (ugcMatch?.[1]) return ugcMatch[1];
  return undefined;
}

function isPostPath(pathname: string): boolean {
  return (
    /\/posts\//i.test(pathname) ||
    /\/feed\/update\//i.test(pathname) ||
    /\/pulse\//i.test(pathname)
  );
}

/**
 * Validate a user-pasted URL and classify it as a LinkedIn job or post.
 * Accepts missing protocol (`linkedin.com/jobs/view/123`).
 */
export function parseLinkedInUrl(input: string): ParsedLinkedInUrl {
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

  if (!isAllowedLinkedInHost(url.hostname)) {
    throw new ImportFromUrlError("IMPORT_UNSUPPORTED_HOST");
  }

  url.hostname = "www.linkedin.com";
  stripTrackingParams(url);

  const jobId = extractJobId(url);
  if (jobId) {
    return {
      href: `https://www.linkedin.com/jobs/view/${jobId}/`,
      sourceType: "job",
      jobId,
    };
  }

  if (isPostPath(url.pathname)) {
    const activityId = extractActivityId(url.pathname);
    url.search = "";
    const href = url.toString().replace(/\/$/, "") || url.toString();
    return {
      href,
      sourceType: "post",
      activityId,
    };
  }

  throw new ImportFromUrlError("IMPORT_UNSUPPORTED_HOST");
}

export function linkedInGuestJobUrl(jobId: string): string {
  return `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;
}
