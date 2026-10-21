const OFFICE_EMBED_ORIGIN = "https://view.officeapps.live.com/op/embed.aspx";

export function isPdfFileUrl(fileUrl: string): boolean {
  try {
    const parsed = new URL(fileUrl);
    return parsed.pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return fileUrl.toLowerCase().includes(".pdf");
  }
}

function parseHttpsUrl(fileUrl: string): URL | null {
  try {
    const parsed = new URL(fileUrl);
    if (parsed.protocol !== "https:") return null;
    if (parsed.port === "443") parsed.port = "";
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Microsoft Office Online embed. Word files only — PDFs are not supported.
 */
export function buildOfficeEmbedUrl(fileUrl: string): string | null {
  const parsed = parseHttpsUrl(fileUrl);
  if (!parsed) return null;
  if (parsed.pathname.toLowerCase().endsWith(".pdf")) return null;
  return `${OFFICE_EMBED_ORIGIN}?src=${encodeURIComponent(parsed.href)}`;
}
