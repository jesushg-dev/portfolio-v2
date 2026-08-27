import { ImportFromUrlError } from "@/features/job-tracker/lib/import-from-url-errors";
import {
  fetchLinkedInHtml,
  type FetchLinkedInHtml,
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

const WEAK_DESCRIPTION_CHARS = 80;

export async function importJobFromUrl(
  rawUrl: string,
  fetchHtml: FetchLinkedInHtml = fetchLinkedInHtml,
): Promise<ImportedJobListing> {
  const parsed = parseLinkedInUrl(rawUrl);
  const html = await fetchHtml(parsed.href);
  let listing = parseLinkedInPage(html, parsed.sourceType);

  if (
    parsed.sourceType === "job" &&
    parsed.jobId &&
    listing.description.length < WEAK_DESCRIPTION_CHARS
  ) {
    try {
      const guestHtml = await fetchHtml(linkedInGuestJobUrl(parsed.jobId));
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
