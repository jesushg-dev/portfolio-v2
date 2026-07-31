import type { CvContactType } from "@prisma/client";

export const PORTFOLIO_WEBSITE_CONTACT_ID = "__portfolio-website__";

interface ContactLike {
  type: CvContactType;
  value: string;
  label?: unknown;
  order?: number;
  id?: string;
}

export function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
    return parsed.origin.toLowerCase();
  } catch {
    return trimmed.toLowerCase().replace(/\/$/, "");
  }
}

export function formatWebsiteDisplayValue(url: string): string {
  try {
    const parsed = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    const host = parsed.hostname.replace(/^www\./, "");
    if (parsed.pathname === "/" || !parsed.pathname) {
      return host;
    }
    return `${host}${parsed.pathname.replace(/\/$/, "")}`;
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
  }
}

export function appendPortfolioWebsiteContact<C extends ContactLike>(
  contacts: readonly C[],
  portfolioUrl: string,
): C[] {
  const normalizedPortfolioUrl = normalizeWebsiteUrl(portfolioUrl);
  if (!normalizedPortfolioUrl) return [...contacts];

  const alreadyPresent = contacts.some(
    (contact) =>
      contact.type === "WEBSITE" &&
      normalizeWebsiteUrl(contact.value) === normalizedPortfolioUrl,
  );

  if (alreadyPresent) return [...contacts];

  const nextOrder =
    contacts.reduce((max, contact) => Math.max(max, contact.order ?? 0), -1) +
    1;

  return [
    ...contacts,
    {
      id: PORTFOLIO_WEBSITE_CONTACT_ID,
      type: "WEBSITE",
      value: portfolioUrl.replace(/\/$/, ""),
      label: { default: formatWebsiteDisplayValue(portfolioUrl) },
      order: nextOrder,
    } as C,
  ];
}
