import {
  decodeHtmlEntities,
  htmlToPlainText,
} from "@/features/job-tracker/lib/html-to-plain-text";
import {
  getMetaContent,
  type ImportedJobListing,
} from "@/features/job-tracker/lib/parse-linkedin-page";

function cleanGetOnBrdDescription(html: string): string {
  // Extract body between #job-body and apply section or closing tags
  const bodyMatch =
    /<div[^>]*id=["']job-body["'][^>]*>([\s\S]*?)(?:<div[^>]*class=["'][^"']*js-hide-fixed-actions|<div[^>]*id=["'](?:js-apply-section|apply_section|apply)|<\/body>)/i.exec(
      html,
    ) ?? /<div[^>]*id=["']job-body["'][^>]*>([\s\S]*?)<\/div>/i.exec(html);

  const rawHtml = bodyMatch?.[1] ?? "";
  if (!rawHtml) return "";

  let text = htmlToPlainText(rawHtml);

  // Remove Get on Board boilerplate
  text = text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (
        /^Apply to this job without intermediaries on Get on Board/i.test(
          trimmed,
        )
      ) {
        return false;
      }
      if (/^GETONBRD Job ID:\s*\d+/i.test(trimmed)) {
        return false;
      }
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

function extractPosition(html: string): string {
  const itemPropMatch =
    /<span[^>]*itemprop=["']title["'][^>]*>([\s\S]*?)<\/span>/i.exec(html);
  if (itemPropMatch?.[1]) {
    const text = htmlToPlainText(itemPropMatch[1]);
    if (text) return text;
  }

  const h1Match =
    /<h1[^>]*class=["'][^"']*gb-landing-cover__title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i.exec(
      html,
    );
  if (h1Match?.[1]) {
    const text = htmlToPlainText(h1Match[1]);
    if (text) return text;
  }

  const ogTitle = getMetaContent(html, "og:title");
  if (ogTitle) {
    const cleaned = ogTitle.replace(/\s+at\s+.*$/i, "").trim();
    if (cleaned) return cleaned;
  }

  return "";
}

function extractCompany(html: string): string {
  const companyStrongMatch =
    /<strong[^>]*itemprop=["']name["'][^>]*>([\s\S]*?)<\/strong>/i.exec(html);
  if (companyStrongMatch?.[1]) {
    const text = htmlToPlainText(companyStrongMatch[1]);
    if (text) return text;
  }

  const hiringOrgMatch =
    /itemprop=["']hiringOrganization["'][\s\S]*?alt=["']([^"']+)["']/i.exec(
      html,
    );
  if (hiringOrgMatch?.[1]) {
    return decodeHtmlEntities(hiringOrgMatch[1]).trim();
  }

  const ogTitle = getMetaContent(html, "og:title");
  if (ogTitle) {
    const atMatch = /\bat\s+([^—–\-|]+)/i.exec(ogTitle);
    if (atMatch?.[1]) {
      return atMatch[1].trim().replace(/\s*\(via.*?\)$/i, "");
    }
  }

  return "";
}

function extractLocation(html: string): string {
  const locationMatch =
    /<(?:span|div)[^>]*class=["'][^"']*location[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div)>/i.exec(
      html,
    );
  if (locationMatch?.[1]) {
    const text = htmlToPlainText(locationMatch[1]);
    if (text) return text;
  }

  if (
    /icon-wifi/i.test(html) ||
    /Fully remote/i.test(html) ||
    /Trabajo remoto/i.test(html)
  ) {
    return "Remote";
  }

  return "";
}

export function parseGetOnBrdPage(html: string): ImportedJobListing {
  const position = extractPosition(html);
  const companyName = extractCompany(html);
  const location = extractLocation(html);
  const description =
    cleanGetOnBrdDescription(html) || getMetaContent(html, "og:description");

  return {
    position,
    companyName,
    location,
    description,
    sourceType: "getonbrd",
  };
}
