import type { Locale } from "@/i18n/config";

/** Keep `current` and `endDate` mutually exclusive when persisting employment dates. */
export function normalizeEmploymentDates(input: {
  current: boolean;
  endDate?: Date | null;
}): { current: boolean; endDate: Date | null } {
  if (input.current) {
    return { current: true, endDate: null };
  }
  return { current: false, endDate: input.endDate ?? null };
}

/**
 * Formats experience dates into a locale-aware string.
 * Example: "May 2022 - Present" or "May 2022 - Aug 2023"
 */
export function formatExperienceDates(
  startDate: Date | null | undefined,
  endDate: Date | null | undefined,
  current: boolean,
  locale: Locale,
  presentLabel: Record<string, string> = {
    es: "Presente",
    en: "Present",
    nl: "Heden",
  },
): string {
  if (!startDate) return "";

  const formatOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  };

  const formatter = new Intl.DateTimeFormat(locale, formatOptions);

  const startStr = formatter.format(startDate);

  // Capitalize the month (e.g., "agosto 2023" -> "Agosto 2023")
  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const startFormatted = capitalize(startStr);

  if (current) {
    const present = presentLabel[locale] ?? presentLabel.en;
    return `${startFormatted} – ${present}`;
  }

  if (!endDate) {
    return startFormatted;
  }

  const endStr = formatter.format(endDate);
  const endFormatted = capitalize(endStr);

  return `${startFormatted} – ${endFormatted}`;
}
