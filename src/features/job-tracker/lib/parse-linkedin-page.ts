import {
  decodeHtmlEntities,
  htmlToPlainText,
} from "@/features/job-tracker/lib/html-to-plain-text";
import type { LinkedInSourceType } from "@/features/job-tracker/lib/linkedin-url";

export interface ImportedJobListing {
  position: string;
  companyName: string;
  location: string;
  description: string;
  sourceType: LinkedInSourceType;
}

const DESCRIPTION_MAX_CHARS = 50_000;
const MIN_OG_DESCRIPTION = 80;

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "name" in value) {
    return asString(value.name);
  }
  return "";
}

function uniqueJoin(parts: string[]): string {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result.join(", ");
}

export function getMetaContent(html: string, property: string): string {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const propertyFirst = new RegExp(
    `<meta\\b[^>]*(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["'][^>]*>`,
    "i",
  );
  const contentFirst = new RegExp(
    `<meta\\b[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["'][^>]*>`,
    "i",
  );
  const match = html.match(propertyFirst) ?? html.match(contentFirst);
  return decodeHtmlEntities(match?.[1] ?? "").trim();
}

function extractJsonLdBlocks(html: string): unknown[] {
  const re =
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks: unknown[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const raw = match[1]
      .replace(/^\s*<!--/, "")
      .replace(/-->\s*$/, "")
      .trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      try {
        blocks.push(JSON.parse(decodeHtmlEntities(raw)));
      } catch {
        // skip malformed JSON-LD
      }
    }
  }
  return blocks;
}

function findJobPosting(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findJobPosting(item);
      if (found) return found;
    }
    return null;
  }
  const obj = data as Record<string, unknown>;
  const types = jsonLdTypeNames(obj["@type"]);
  if (types.some((entry) => entry.toLowerCase() === "jobposting")) {
    return obj;
  }
  if (obj["@graph"]) return findJobPosting(obj["@graph"]);
  return null;
}

function jsonLdTypeNames(type: unknown): string[] {
  if (Array.isArray(type)) {
    return (type as unknown[]).flatMap((entry) => jsonLdTypeNames(entry));
  }
  return typeof type === "string" && type.length > 0 ? [type] : [];
}

function formatJobLocation(jobLocation: unknown): string {
  const loc: unknown = Array.isArray(jobLocation)
    ? (jobLocation as unknown[])[0]
    : jobLocation;
  if (typeof loc === "string") return loc.trim();
  if (!loc || typeof loc !== "object") return "";

  const address = (loc as { address?: unknown }).address;
  if (typeof address === "string") return address.trim();
  if (address && typeof address === "object") {
    const record = address as Record<string, unknown>;
    return uniqueJoin([
      asString(record.addressLocality),
      asString(record.addressRegion),
      asString(record.addressCountry),
    ]);
  }
  return asString((loc as { name?: unknown }).name);
}

function parseOgHiringTitle(title: string): {
  companyName: string;
  position: string;
  location: string;
} {
  const cleaned = title.replace(/\s*\|\s*.*$/i, "").trim();
  const english = /^(.+?)\s+hiring\s+(.+?)\s+in\s+(.+)$/i.exec(cleaned);
  if (english) {
    return {
      companyName: english[1]?.trim() ?? "",
      position: english[2]?.trim() ?? "",
      location: english[3]?.trim() ?? "",
    };
  }
  const spanishLong =
    /^(.+?)\s+busca personal para el cargo de\s+(.+?)\s+en\s+(.+)$/i.exec(
      cleaned,
    );
  if (spanishLong) {
    return {
      companyName: spanishLong[1]?.trim() ?? "",
      position: spanishLong[2]?.trim() ?? "",
      location: spanishLong[3]?.trim() ?? "",
    };
  }
  const spanishCompact = /^(.+?)\s+en\s+(.+?)\s+[—–-]\s+(.+)$/i.exec(cleaned);
  if (spanishCompact) {
    return {
      position: spanishCompact[1]?.trim() ?? "",
      companyName: spanishCompact[2]?.trim() ?? "",
      location: spanishCompact[3]?.trim() ?? "",
    };
  }
  return { companyName: "", position: "", location: "" };
}

function contentByClass(html: string, classFragment: string): string {
  const escaped = classFragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}[^>]*>([\\s\\S]*?)</`, "i");
  const match = html.match(re);
  return match?.[1] ? htmlToPlainText(match[1]) : "";
}

function firstMatchContent(html: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const text = htmlToPlainText(match[1]);
      if (text) return text;
    }
  }
  return "";
}

function cleanDescription(text: string): string {
  const cleaned = text
    .split("\n")
    .filter(
      (line) => !/^\s*(show more|show less|ver más|ver menos)\s*$/i.test(line),
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return cleaned.slice(0, DESCRIPTION_MAX_CHARS);
}

function inferFromPostText(text: string): {
  position: string;
  companyName: string;
  location: string;
} {
  const companyMatch =
    /\bEn\s+([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ.&'’-]{1,40})\s+buscamos/i.exec(text) ??
    /\b(?:at|@)\s+([A-Z][\w.&'’-]{1,40})\b/.exec(text);
  const positionMatch =
    /buscamos\s+(?:un|una|a)\s+([^!?\n.]{5,80})/i.exec(text) ??
    /(?:hiring|looking for)\s+(?:an?\s+)?([^!?\n.]{5,80})/i.exec(text);
  const locationMatch =
    /((?:100%\s*)?remoto(?:\s+LATAM)?)/i.exec(text) ??
    /((?:100%\s*)?remote(?:\s+(?:LATAM|work))?)/i.exec(text) ??
    /\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+,\s*[A-ZÁÉÍÓÚÑ][A-Za-záéíóúñ ]{2,40})\b/.exec(
      text,
    );

  return {
    companyName: companyMatch?.[1]?.trim() ?? "",
    position: positionMatch?.[1]?.trim() ?? "",
    location: locationMatch?.[1]?.trim() ?? "",
  };
}

function extractPostBody(html: string): string {
  const commentary = firstMatchContent(html, [
    /data-test-id=["']main-feed-activity-card__commentary["'][^>]*>([\s\S]*?)<\/p>/i,
  ]);
  const og = getMetaContent(html, "og:description");
  const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => htmlToPlainText(match[1] ?? ""))
    .filter((text) => text.length >= MIN_OG_DESCRIPTION)
    .filter(
      (text) =>
        !/agree\s*&\s*join|sign in to|cookie policy|condiciones de uso/i.test(
          text,
        ),
    )
    .sort((a, b) => b.length - a.length);

  const longest = paragraphs[0] ?? "";
  return [commentary, longest, og].sort((a, b) => b.length - a.length)[0] ?? "";
}

function parseJobListing(html: string): Omit<ImportedJobListing, "sourceType"> {
  const blocks = extractJsonLdBlocks(html);
  let posting: Record<string, unknown> | null = null;
  for (const block of blocks) {
    posting = findJobPosting(block);
    if (posting) break;
  }

  const ogTitle = getMetaContent(html, "og:title");
  const ogHiring = parseOgHiringTitle(
    ogTitle ||
      htmlToPlainText(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? ""),
  );

  const titleFromCard =
    contentByClass(html, "top-card-layout__title") ||
    contentByClass(html, "topcard__title") ||
    firstMatchContent(html, [/<h1\b[^>]*>([\s\S]*?)<\/h1>/i]);
  const companyFromCard = contentByClass(html, "topcard__org-name-link");
  const locationFromCard = contentByClass(html, "topcard__flavor--bullet");
  const markupDescription = firstMatchContent(html, [
    /show-more-less-html__markup[\s\S]*?>([\s\S]*?)<\/div>/i,
  ]);

  const position =
    asString(posting?.title) || titleFromCard || ogHiring.position;
  const companyName =
    asString(posting?.hiringOrganization) ||
    companyFromCard ||
    ogHiring.companyName;
  const location =
    (posting ? formatJobLocation(posting.jobLocation) : "") ||
    locationFromCard ||
    ogHiring.location;
  const description = cleanDescription(
    (posting?.description
      ? htmlToPlainText(asString(posting.description))
      : "") ||
      markupDescription ||
      getMetaContent(html, "og:description"),
  );

  return { position, companyName, location, description };
}

function parsePostListing(
  html: string,
): Omit<ImportedJobListing, "sourceType"> {
  const description = cleanDescription(extractPostBody(html));
  const inferred = inferFromPostText(description);
  return {
    position: inferred.position,
    companyName: inferred.companyName,
    location: inferred.location,
    description,
  };
}

export function detectLinkedInLoginWall(html: string): boolean {
  if (/JobPosting/i.test(html) || /show-more-less-html__markup/i.test(html)) {
    return false;
  }
  const og = getMetaContent(html, "og:description");
  if (og.length >= MIN_OG_DESCRIPTION) return false;
  return (
    /\/authwall/i.test(html) ||
    /name=["']session_key["']/i.test(html) ||
    /sign in to (view|see|continue)/i.test(html) ||
    /join now[\s\S]{0,240}sign in/i.test(html)
  );
}

export function hasImportedContent(listing: ImportedJobListing): boolean {
  return listing.description.length >= 20 || listing.position.length >= 2;
}

export function mergeImportedListings(
  primary: ImportedJobListing,
  fallback: ImportedJobListing,
): ImportedJobListing {
  return {
    sourceType: primary.sourceType,
    position: primary.position || fallback.position,
    companyName: primary.companyName || fallback.companyName,
    location: primary.location || fallback.location,
    description:
      primary.description.length >= fallback.description.length
        ? primary.description
        : fallback.description,
  };
}

export function parseLinkedInPage(
  html: string,
  sourceType: LinkedInSourceType,
): ImportedJobListing {
  const fields =
    sourceType === "job" ? parseJobListing(html) : parsePostListing(html);
  return { ...fields, sourceType };
}
