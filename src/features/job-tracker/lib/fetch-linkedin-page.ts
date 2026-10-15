import { ImportFromUrlError } from "@/features/job-tracker/lib/import-from-url-errors";
import { isSafeLinkedInHref } from "@/features/job-tracker/lib/linkedin-url";
import { isSafeBambooHrHref } from "@/features/job-tracker/lib/bamboohr-url";
import { isSafeGetOnBrdHref } from "@/features/job-tracker/lib/getonbrd-url";

const FETCH_TIMEOUT_MS = 8_000;
const MAX_BYTES = Math.floor(1.5 * 1024 * 1024);
const MAX_REDIRECTS = 3;
const BLOCKED_STATUS = new Set([401, 403, 999]);

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export type FetchLinkedInHtml = (href: string) => Promise<string>;
export type FetchPageText = (href: string) => Promise<string>;

function mapFetchFailure(error: unknown): never {
  if (error instanceof ImportFromUrlError) throw error;
  throw new ImportFromUrlError("IMPORT_FETCH_FAILED");
}

async function fetchWithSafeGuard(
  href: string,
  isSafeHref: (url: string) => boolean,
  acceptHeader = "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
): Promise<string> {
  let current = href;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (!isSafeHref(current)) {
      throw new ImportFromUrlError(
        hop === 0 ? "IMPORT_UNSUPPORTED_HOST" : "IMPORT_FETCH_FAILED",
      );
    }

    let response: Response;
    try {
      response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          "User-Agent": USER_AGENT,
          Accept: acceptHeader,
          "Accept-Language": "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });
    } catch (error) {
      mapFetchFailure(error);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new ImportFromUrlError("IMPORT_FETCH_FAILED");
      }
      try {
        current = new URL(location, current).href;
      } catch {
        throw new ImportFromUrlError("IMPORT_FETCH_FAILED");
      }
      continue;
    }

    if (BLOCKED_STATUS.has(response.status)) {
      throw new ImportFromUrlError("IMPORT_LOGIN_WALL");
    }

    if (!response.ok) {
      throw new ImportFromUrlError("IMPORT_FETCH_FAILED");
    }

    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_BYTES) {
      throw new ImportFromUrlError("IMPORT_FETCH_FAILED");
    }

    const text = await response.text();
    return text.length > MAX_BYTES ? text.slice(0, MAX_BYTES) : text;
  }

  throw new ImportFromUrlError("IMPORT_FETCH_FAILED");
}

export const fetchLinkedInHtml: FetchLinkedInHtml = async (href) => {
  return fetchWithSafeGuard(href, isSafeLinkedInHref);
};

export const fetchBambooHrText: FetchPageText = async (href) => {
  return fetchWithSafeGuard(
    href,
    isSafeBambooHrHref,
    "application/json,text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
  );
};

export const fetchGetOnBrdHtml: FetchPageText = async (href) => {
  return fetchWithSafeGuard(href, isSafeGetOnBrdHref);
};
