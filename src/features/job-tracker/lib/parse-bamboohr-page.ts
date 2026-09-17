import {
  decodeHtmlEntities,
  htmlToPlainText,
} from "@/features/job-tracker/lib/html-to-plain-text";
import {
  getMetaContent,
  type ImportedJobListing,
} from "@/features/job-tracker/lib/parse-linkedin-page";

interface BambooHrAtsLocation {
  city?: string | null;
  state?: string | null;
  province?: string | null;
  country?: string | null;
}

interface BambooHrLocation {
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  addressCountry?: string | null;
}

interface BambooHrJobOpening {
  jobOpeningName?: string | null;
  departmentLabel?: string | null;
  employmentStatusLabel?: string | null;
  employmentType?: string | null;
  location?: BambooHrLocation | null;
  atsLocation?: BambooHrAtsLocation | null;
  description?: string | null;
  compensation?: string | null;
  isRemote?: boolean | null;
  locationType?: string | null;
}

interface BambooHrDetailResponse {
  result?: {
    jobOpening?: BambooHrJobOpening | null;
  } | null;
}

function uniqueJoin(parts: (string | null | undefined)[]): string {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of parts) {
    const trimmed = part?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result.join(", ");
}

function formatBambooHrLocation(
  atsLocation?: BambooHrAtsLocation | null,
  location?: BambooHrLocation | null,
  isRemote?: boolean | null,
): string {
  const parts = [
    atsLocation?.city ?? location?.city,
    atsLocation?.state ?? atsLocation?.province ?? location?.state,
    atsLocation?.country ?? location?.addressCountry,
  ];

  const locStr = uniqueJoin(parts);
  if (isRemote) {
    return locStr ? `${locStr} (Remote)` : "Remote";
  }
  return locStr;
}

function extractCompanyFromHtml(html: string): string {
  if (!html) return "";

  const ogSiteName = getMetaContent(html, "og:site_name");
  if (ogSiteName && !/^bamboohr$/i.test(ogSiteName)) {
    return ogSiteName;
  }

  // Check embedded poData JSON: {"site":{"logo":{"alt":"Company Name"}}}
  const poDataMatch =
    /<script\b[^>]*id=["']poData["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
  if (poDataMatch?.[1]) {
    try {
      const parsed = JSON.parse(poDataMatch[1]) as {
        site?: { logo?: { alt?: string } };
        logo?: { alt?: string };
      };
      const logoAlt = parsed.site?.logo?.alt ?? parsed.logo?.alt;
      if (logoAlt?.trim() && !/^bamboohr$/i.test(logoAlt)) {
        return logoAlt.trim();
      }
    } catch {
      // ignore JSON parse error in script tag
    }
  }

  return "";
}

function formatFallbackSubdomain(subdomain: string): string {
  if (!subdomain) return "";
  return subdomain
    .split(/[-_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function parseBambooHrDetail(
  detailRaw: unknown,
  subdomain: string,
  pageHtml?: string,
): ImportedJobListing {
  let data: BambooHrDetailResponse | null = null;

  if (typeof detailRaw === "string") {
    try {
      data = JSON.parse(detailRaw) as BambooHrDetailResponse;
    } catch {
      data = null;
    }
  } else if (detailRaw && typeof detailRaw === "object") {
    data = detailRaw;
  }

  const job = data?.result?.jobOpening;

  const html = pageHtml ?? "";
  const ogTitle = html ? getMetaContent(html, "og:title") : "";
  const ogDescription = html ? getMetaContent(html, "og:description") : "";

  const jobTitle = job?.jobOpeningName?.trim();
  const position = (jobTitle && jobTitle.length > 0 ? jobTitle : ogTitle) || "";

  const companyName =
    extractCompanyFromHtml(html) || formatFallbackSubdomain(subdomain);

  const location = formatBambooHrLocation(
    job?.atsLocation,
    job?.location,
    job?.isRemote,
  );

  const rawDescription = job?.description?.trim() ?? "";
  let description = "";
  if (rawDescription) {
    description = htmlToPlainText(rawDescription);
  } else if (ogDescription) {
    description = decodeHtmlEntities(ogDescription).trim();
  }

  return {
    position,
    companyName,
    location,
    description,
    sourceType: "bamboohr",
  };
}
