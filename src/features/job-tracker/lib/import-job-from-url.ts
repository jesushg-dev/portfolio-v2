import { ImportFromUrlError } from "@/features/job-tracker/lib/import-from-url-errors";
import {
  fetchBambooHrText,
  fetchGetOnBrdHtml,
  fetchLinkedInHtml,
  type FetchLinkedInHtml,
  type FetchPageText,
} from "@/features/job-tracker/lib/fetch-linkedin-page";
import {
  linkedInGuestJobUrl,
  parseLinkedInUrl,
} from "@/features/job-tracker/lib/linkedin-url";
import {
  detectLinkedInLoginWall,
  hasImportedContent,
  mergeImportedListings,
  parseLinkedInPage,
  type ImportedJobListing,
} from "@/features/job-tracker/lib/parse-linkedin-page";
import {
  isAllowedBambooHrHost,
  parseBambooHrUrl,
} from "@/features/job-tracker/lib/bamboohr-url";
import { parseBambooHrDetail } from "@/features/job-tracker/lib/parse-bamboohr-page";
import {
  isAllowedGetOnBrdHost,
  parseGetOnBrdUrl,
} from "@/features/job-tracker/lib/getonbrd-url";
import { parseGetOnBrdPage } from "@/features/job-tracker/lib/parse-getonbrd-page";

const WEAK_DESCRIPTION_CHARS = 80;

function parseUrlHostname(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    return new URL(withProtocol).hostname.replace(/\.$/, "").toLowerCase();
  } catch {
    return null;
  }
}

export async function importJobFromUrl(
  rawUrl: string,
  fetchHtml?: FetchLinkedInHtml | FetchPageText,
): Promise<ImportedJobListing> {
  const hostname = parseUrlHostname(rawUrl);
  if (!hostname) {
    throw new ImportFromUrlError("IMPORT_INVALID_URL");
  }

  if (isAllowedBambooHrHost(hostname)) {
    const fetchText =
      (fetchHtml) ?? fetchBambooHrText;
    const parsed = parseBambooHrUrl(rawUrl);

    let detailRaw = "";
    try {
      detailRaw = await fetchText(parsed.detailHref);
    } catch {
      // If direct detail endpoint failed, try public page
    }

    let pageHtml = "";
    try {
      pageHtml = await fetchText(parsed.publicHref);
    } catch {
      // Fallback if public page cannot be fetched
    }

    const listing = parseBambooHrDetail(
      detailRaw || pageHtml,
      parsed.subdomain,
      pageHtml || detailRaw,
    );

    if (!hasImportedContent(listing)) {
      throw new ImportFromUrlError("IMPORT_EMPTY_CONTENT");
    }

    return listing;
  }

  if (isAllowedGetOnBrdHost(hostname)) {
    const fetchText =
      (fetchHtml) ?? fetchGetOnBrdHtml;
    const parsed = parseGetOnBrdUrl(rawUrl);
    const html = await fetchText(parsed.href);
    const listing = parseGetOnBrdPage(html);

    if (!hasImportedContent(listing)) {
      throw new ImportFromUrlError("IMPORT_EMPTY_CONTENT");
    }

    return listing;
  }

  const fetchLinkedin =
    (fetchHtml) ?? fetchLinkedInHtml;
  const parsed = parseLinkedInUrl(rawUrl);
  const html = await fetchLinkedin(parsed.href);
  let listing = parseLinkedInPage(html, parsed.sourceType);

  if (
    parsed.sourceType === "job" &&
    parsed.jobId &&
    listing.description.length < WEAK_DESCRIPTION_CHARS
  ) {
    try {
      const guestHtml = await fetchLinkedin(linkedInGuestJobUrl(parsed.jobId));
      listing = mergeImportedListings(
        listing,
        parseLinkedInPage(guestHtml, "job"),
      );
    } catch {
      // Keep whatever the public page already yielded.
    }
  }

  if (detectLinkedInLoginWall(html) && !hasImportedContent(listing)) {
    throw new ImportFromUrlError("IMPORT_LOGIN_WALL");
  }

  if (!hasImportedContent(listing)) {
    throw new ImportFromUrlError("IMPORT_EMPTY_CONTENT");
  }

  return listing;
}
