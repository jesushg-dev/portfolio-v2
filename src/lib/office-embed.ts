const OFFICE_EMBED_ORIGIN = "https://view.officeapps.live.com/op/embed.aspx";

/** Build a Microsoft Office Online embed URL. The file must be public HTTPS. */
export function buildOfficeEmbedUrl(fileUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(fileUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;
  if (parsed.port === "443") parsed.port = "";

  return `${OFFICE_EMBED_ORIGIN}?src=${encodeURIComponent(parsed.href)}`;
}
