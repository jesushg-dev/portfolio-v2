import type { PublicContact } from "@/utils/contact-links";

export const SCHEDULE_PATH = "/schedule" as const;

export const SCHEDULE_PATHS = ["/schedule", "/agendar", "/plannen"] as const;

export function isSchedulePath(pathname: string): boolean {
  return (SCHEDULE_PATHS as readonly string[]).includes(pathname);
}

export const CALENDLY_PAGE_SETTINGS = {
  backgroundColor: "0b070e",
  hideEventTypeDetails: false,
  hideLandingPageDetails: true,
  primaryColor: "006bff",
  textColor: "f4f4f5",
} as const;

export function getCalendlyUrl(
  contacts: readonly PublicContact[],
): string | null {
  const calendly = contacts.find((contact) => contact.type === "CALENDLY");
  if (!calendly?.value?.trim()) return null;

  const value = calendly.value.trim();
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function hasCalendlyContact(
  contacts: readonly PublicContact[],
): boolean {
  return getCalendlyUrl(contacts) !== null;
}
