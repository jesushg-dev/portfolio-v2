import type {
  AppLanguage,
  TimelineCategory,
  TimelineItem,
  TimelineItemTranslation,
} from "@prisma/client";

import { type Locale } from "@/i18n/config";
import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";

export interface TimelinePublicRole {
  title: string;
  startDate: string;
  endDate?: string | null;
}

export interface TimelinePublicSkill {
  id: string;
  title: string;
  image?: string | null;
}

export interface TimelinePublicItem {
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
  technologies: string[];
  skills: TimelinePublicSkill[];
  roles: TimelinePublicRole[];
  order: number;
}

export type TimelineItemWithTranslations = TimelineItem & {
  TimelineItemTranslation?: TimelineItemTranslation[];
  TimelineItemSkill?: {
    skill: {
      id: string;
      title: string;
      image?: string | null;
    };
  }[];
};

const DEFAULT_LANGUAGES: Pick<AppLanguage, "id" | "code">[] = [
  { id: "lang-en", code: "en" },
  { id: "lang-es", code: "es" },
  { id: "lang-nl", code: "nl" },
];

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
  item: TimelineItemWithTranslations,
  locale: Locale,
  languages: Pick<AppLanguage, "id" | "code">[] = DEFAULT_LANGUAGES,
): TimelinePublicItem {
  const translations = item.TimelineItemTranslation ?? [];
  const field = createLocalizedFieldResolver(languages, locale);
  const t = field.for(translations);
  const title = t("title");
  const description = t("description");

  return {
    id: item.id,
    title,
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
    technologies: item.technologies ?? [],
    skills:
      item.TimelineItemSkill && item.TimelineItemSkill.length > 0
        ? item.TimelineItemSkill.map(({ skill }) => ({
            id: skill.id,
            title: skill.title,
            image: skill.image,
          }))
        : (item.technologies ?? []).map((t) => ({
            id: t,
            title: t,
            image: null,
          })),
    roles: (item.roles ?? []).map((r) => ({
      title: r.title,
      startDate: r.startDate,
      endDate: r.endDate ?? null,
    })),
    order: item.order,
  };
}

export function mapTimelineItemsToPublic(
  items: TimelineItemWithTranslations[],
  locale: Locale,
  languages: Pick<AppLanguage, "id" | "code">[] = DEFAULT_LANGUAGES,
  limit?: number,
): TimelinePublicItem[] {
  const mapped = items.map((item) =>
    mapTimelineItemToPublic(item, locale, languages),
  );

  if (limit === undefined) {
    return mapped;
  }

  return mapped.slice(0, limit);
}

export interface TimelineYearGroup {
  year: number;
  items: TimelinePublicItem[];
}

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
