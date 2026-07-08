import type { TimelineCategory, TimelineItem } from "@prisma/client";

import { type Locale } from "@/i18n/config";
import { getLocalizedText } from "@/lib/i18n/localized";

export type TimelinePublicItem = {
  id: string;
  title: string;
  description: string;
  organization: string;
  location: string | null;
  category: TimelineCategory;
  date: string;
  dateTime: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  images: string[];
  order: number;
};

export function formatTimelineDate(
  startDate: Date,
  endDate: Date | null,
  current: boolean,
): string {
  const startYear = startDate.getFullYear();

  if (current) {
    return `${startYear} - Present`;
  }

  if (endDate) {
    return `${startYear} - ${endDate.getFullYear()}`;
  }

  return `${startYear}`;
}

export function mapTimelineItemToPublic(
  item: TimelineItem,
  locale: Locale,
  defaultLocale?: Locale,
): TimelinePublicItem {
  const title = getLocalizedText(item.title, locale, defaultLocale);
  const description = getLocalizedText(item.description, locale, defaultLocale);

  return {
    id: item.id,
    title: item.organization ? `${title} - ${item.organization}` : title,
    description,
    organization: item.organization,
    location: item.location,
    category: item.category,
    date: formatTimelineDate(
      item.startDate,
      item.endDate ?? null,
      item.current,
    ),
    dateTime: item.startDate.toISOString().split("T")[0] ?? "",
    startDate: item.startDate.toISOString(),
    endDate: item.endDate?.toISOString() ?? null,
    current: item.current,
    images: item.images ?? [],
    order: item.order,
  };
}

export function mapTimelineItemsToPublic(
  items: TimelineItem[],
  locale: Locale,
  defaultLocale?: Locale,
  limit?: number,
): TimelinePublicItem[] {
  const mapped = items.map((item) =>
    mapTimelineItemToPublic(item, locale, defaultLocale),
  );

  if (limit === undefined) {
    return mapped;
  }

  return mapped.slice(0, limit);
}

export type TimelineYearGroup = {
  year: number;
  items: TimelinePublicItem[];
};

export function groupTimelineByYear(
  items: TimelinePublicItem[],
): TimelineYearGroup[] {
  const groups = new Map<number, TimelinePublicItem[]>();

  for (const item of items) {
    const year = new Date(item.startDate).getFullYear();
    const existing = groups.get(year) ?? [];
    existing.push(item);
    groups.set(year, existing);
  }

  return [...groups.entries()]
    .sort(([yearA], [yearB]) => yearB - yearA)
    .map(([year, yearItems]) => ({
      year,
      items: yearItems,
    }));
}
