import type { ContactLink } from "@/utils/contact-links";

export function escapeVcard(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replace(/\r\n|\n|\r/g, "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

export interface BuildVCardOptions {
  name: string;
  title?: string;
  links: readonly ContactLink[];
}

export function buildVCard({
  name,
  title = "",
  links,
}: BuildVCardOptions): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVcard(name)}`,
    `N:;${escapeVcard(name)};;;`,
    `TITLE:${escapeVcard(title)}`,
  ];

  for (const link of links) {
    if (link.href.startsWith("mailto:")) {
      lines.push(`EMAIL:${escapeVcard(link.href.slice(7))}`);
    } else if (link.href.startsWith("tel:")) {
      lines.push(`TEL:${escapeVcard(link.href.slice(4))}`);
    } else if (link.icon === "linkedin") {
      lines.push(`URL:${escapeVcard(link.href)}`);
    }
  }

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

const PRIMARY_CHANNEL_ICONS = new Set([
  "email",
  "phone",
  "whatsapp",
  "linkedin",
]);

export function filterContactChannels(
  links: readonly ContactLink[],
  limit = 3,
): ContactLink[] {
  return links
    .filter((link) => PRIMARY_CHANNEL_ICONS.has(link.icon))
    .slice(0, limit);
}
