import type { CvContactType } from "@prisma/client";

export interface PublicContact {
  type: CvContactType;
  value: string;
  label: unknown;
}

export type ContactIconKey =
  | "email"
  | "phone"
  | "whatsapp"
  | "linkedin"
  | "github"
  | "website"
  | "location"
  | "calendly";

export interface ContactLink {
  key: string;
  href: string;
  label: string;
  icon: ContactIconKey;
  accent: string;
}

function normalizeUrl(value: string, prefix: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("mailto:") || trimmed.startsWith("tel:")) {
    return trimmed;
  }
  return `${prefix}${trimmed.replace(/^\/+/, "")}`;
}

function labelText(label: unknown): string {
  if (typeof label === "string") return label;
  if (label && typeof label === "object") {
    return Object.values(label as Record<string, unknown>)
      .filter((value): value is string => typeof value === "string")
      .join(" ");
  }
  return "";
}

export function buildContactLinks(
  contacts: readonly PublicContact[],
): ContactLink[] {
  const links: ContactLink[] = [];

  for (const [index, contact] of contacts.entries()) {
    const value = contact.value.trim();
    if (!value) continue;

    switch (contact.type) {
      case "EMAIL":
        links.push({
          key: `email-${index}`,
          href: value.startsWith("mailto:") ? value : `mailto:${value}`,
          label: "email",
          icon: "email",
          accent: "#EA4335",
        });
        break;
      case "PHONE": {
        const digits = value.replace(/[^\d+]/g, "");
        const isWhatsAppHint = /whatsapp/i.test(labelText(contact.label));
        links.push({
          key: `phone-${index}`,
          href: isWhatsAppHint
            ? `https://wa.me/${digits.replace(/^\+/, "")}`
            : `tel:${digits}`,
          label: isWhatsAppHint ? "whatsapp" : "phone",
          icon: isWhatsAppHint ? "whatsapp" : "phone",
          accent: isWhatsAppHint ? "#25D366" : "#34A853",
        });
        break;
      }
      case "LINKEDIN":
        links.push({
          key: `linkedin-${index}`,
          href: normalizeUrl(value, "https://linkedin.com/in/"),
          label: "linkedin",
          icon: "linkedin",
          accent: "#0077B5",
        });
        break;
      case "GITHUB":
        links.push({
          key: `github-${index}`,
          href: normalizeUrl(value, "https://github.com/"),
          label: "github",
          icon: "github",
          accent: "#333333",
        });
        break;
      case "WEBSITE":
        links.push({
          key: `website-${index}`,
          href: normalizeUrl(value, "https://"),
          label: "website",
          icon: "website",
          accent: "#6366F1",
        });
        break;
      case "LOCATION":
        links.push({
          key: `location-${index}`,
          href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`,
          label: "location",
          icon: "location",
          accent: "#F59E0B",
        });
        break;
      case "CALENDLY":
        links.push({
          key: `calendly-${index}`,
          href: normalizeUrl(value, "https://"),
          label: "calendly",
          icon: "calendly",
          accent: "#006BFF",
        });
        break;
      default:
        break;
    }
  }

  return links;
}
